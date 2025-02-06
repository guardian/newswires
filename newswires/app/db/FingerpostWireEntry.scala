package db

import db.CustomMappers.textArray
import play.api.Logging
import play.api.libs.json._
import scalikejdbc._

import java.time.ZonedDateTime

case class FingerpostWireSubjects(
    code: List[String]
)
object FingerpostWireSubjects {
  // some wires arrive with no code, but represent that by an empty string
  // instead of an empty array :( preprocess them into an empty array
  private val reads =
    Json.reads[FingerpostWireSubjects].preprocess { case JsObject(obj) =>
      JsObject(obj.map {
        case ("code", JsString("")) => ("code", JsArray.empty)
        case other                  => other
      })
    }
  private val writes = Json.writes[FingerpostWireSubjects]
  implicit val format: Format[FingerpostWireSubjects] =
    Format(reads, writes)
}

case class FingerpostWire(
    uri: Option[String],
    sourceFeed: Option[String],
    usn: Option[String],
    version: Option[String],
    status: Option[String],
    firstVersion: Option[String],
    versionCreated: Option[String],
    dateTimeSent: Option[String],
    slug: Option[String],
    headline: Option[String],
    subhead: Option[String],
    byline: Option[String],
    priority: Option[String],
    subjects: Option[FingerpostWireSubjects],
    keywords: Option[List[String]],
    language: Option[String],
    usage: Option[String],
    location: Option[String],
    ednote: Option[String],
    mediaCatCodes: Option[String],
    `abstract`: Option[String],
    bodyText: Option[String]
)
object FingerpostWire {
  // rename a couple of fields
  private val reads: Reads[FingerpostWire] =
    Json.reads[FingerpostWire].preprocess { case JsObject(obj) =>
      JsObject(obj.map {
        case ("source-feed", value) => ("sourceFeed", value)
        case ("body_text", value)   => ("bodyText", value)
        case other                  => other
      })
    }
  private val writes = Json.writes[FingerpostWire]
  implicit val format: Format[FingerpostWire] = Format(reads, writes)
}

case class FingerpostWireEntry(
    id: Long,
    supplier: String,
    externalId: String,
    ingestedAt: ZonedDateTime,
    content: FingerpostWire,
    highlight: Option[String] = None
)

object FingerpostWireEntry
    extends SQLSyntaxSupport[FingerpostWireEntry]
    with Logging {

  implicit val format: OFormat[FingerpostWireEntry] =
    Json.format[FingerpostWireEntry]

  override val columns =
    Seq(
      "id",
      "external_id",
      "ingested_at",
      "content",
      "supplier",
      "combined_textsearch",
      "highlight"
    )
  val syn = this.syntax("fm")

  private val selectAllStatement = sqls"""
    |   ${FingerpostWireEntry.syn.result.id},
    |   ${FingerpostWireEntry.syn.result.externalId},
    |   ${FingerpostWireEntry.syn.result.ingestedAt},
    |   ${FingerpostWireEntry.syn.result.supplier},
    |   ${FingerpostWireEntry.syn.result.content}
    |""".stripMargin

  def apply(
      fm: ResultName[FingerpostWireEntry]
  )(rs: WrappedResultSet): FingerpostWireEntry = {
    val fingerpostContent = Json.parse(rs.string(fm.content)).as[FingerpostWire]

    FingerpostWireEntry(
      id = rs.long(fm.id),
      supplier = rs.string(fm.supplier),
      externalId = rs.string(fm.externalId),
      ingestedAt = rs.zonedDateTime(fm.ingestedAt),
      content = fingerpostContent,
      highlight = rs.stringOpt(fm.column("highlight"))
    )
  }

  private def clamp(low: Int, x: Int, high: Int): Int =
    math.min(math.max(x, low), high)

  def get(
      id: Int,
      maybeFreeTextQuery: Option[String] = Some("alpaca")
  ): Option[FingerpostWireEntry] = DB readOnly {
    val highlightsClause = maybeFreeTextQuery match {
      case Some(query) =>
        sqls", ts_headline('english', ${syn.content}->>'body_text', websearch_to_tsquery('english', $query), 'HighlightAll=true, StartSel=<mark>, StopSel=</mark>') AS ${syn.resultName.highlight}"
      case None => sqls", '' AS ${syn.resultName.highlight}"
    }
    implicit session =>
      sql"""| SELECT $selectAllStatement $highlightsClause
            | FROM ${FingerpostWireEntry as syn}
            | WHERE ${FingerpostWireEntry.syn.id} = $id
            |""".stripMargin
        .map(FingerpostWireEntry(syn.resultName))
        .single()
        .apply()
  }

  case class QueryResponse(
      results: List[FingerpostWireEntry],
      totalCount: Long
//      keywordCounts: Map[String, Int]
  )
  private object QueryResponse {
    implicit val writes: OWrites[QueryResponse] = Json.writes[QueryResponse]
  }

  def query(
      search: SearchParams,
      maybeBeforeId: Option[Int],
      maybeSinceId: Option[Int],
      pageSize: Int = 250
  ): QueryResponse = DB readOnly { implicit session =>
    val effectivePageSize = clamp(0, pageSize, 250)

    val sourceFeedsQuery = search.suppliersIncl match {
      case Nil => None
      case sourceFeeds =>
        Some(
          sqls.in(
            sqls"upper(${syn.supplier})",
            sourceFeeds.map(feed => sqls"upper($feed)")
          )
        )
    }

    val sourceFeedsExclQuery = search.suppliersExcl match {
      case Nil => None
      case sourceFeedsExcl =>
        val se = this.syntax("sourceFeedsExcl")
        val doesContainFeeds = sqls.in(
          sqls"upper(${syn.supplier})",
          sourceFeedsExcl.map(feed => sqls"upper($feed)")
        )
        // unpleasant, but the sort of trick you need to pull
        // because "NOT IN (...)" doesn't hit an index.
        // https://stackoverflow.com/a/19364694
        Some(
          sqls"""|NOT (
                 |  $doesContainFeeds
                 |)""".stripMargin
        )
    }

    val keywordsQuery = search.keywordIncl match {
      case Nil      => None
      case keywords =>
        // "??|" is actually the "?|" operator - doubled to prevent the
        // SQL driver from treating it as a placeholder for a parameter
        // https://jdbc.postgresql.org/documentation/query/#using-the-statement-or-preparedstatement-interface
        Some(
          sqls"""(${syn.content} -> 'keywords') ??| ${textArray(keywords)}"""
        )
    }

    val keywordsExclQuery = search.keywordExcl match {
      case Nil => None
      case keywords =>
        val ke = this.syntax("keywordsExcl")
        // "??|" is actually the "?|" operator - doubled to prevent the
        // SQL driver from treating it as a placeholder for a parameter
        // https://jdbc.postgresql.org/documentation/query/#using-the-statement-or-preparedstatement-interface
        val doesContainKeywords =
          sqls"(${syn.content}->'keywords') ??| ${textArray(keywords)}"
        // unpleasant, but the kind of trick you need to pull because
        // NOT [row] ?| [list] won't use the index.
        // https://stackoverflow.com/a/19364694
        Some(
          sqls"""|NOT (
                 |  $doesContainKeywords
                 |)""".stripMargin
        )
    }

    val subjectsQuery = search.subjectsIncl match {
      case Nil => None
      case subjects =>
        Some(
          sqls"(${syn.content} -> 'subjects' -> 'code') ??| ${textArray(subjects)}"
        )
    }

    val subjectsExclQuery = search.subjectsExcl match {
      case Nil => None
      case subjects =>
        val se = this.syntax("subjectsExcl")
        val doesContainSubjects =
          sqls"(${syn.content}->'subjects'->'code') ??| ${textArray(subjects)}"
        Some(
          sqls"""|NOT (
                 |  $doesContainSubjects
                 |)""".stripMargin
        )
    }

    // grr annoying but broadly I think subjects and keywords are the same "axis" to search on
    val keywordsOrSubjectsQuery = (keywordsQuery, subjectsQuery) match {
      case (Some(kwq), Some(subq)) => Some(sqls"$kwq OR $subq")
      case _                       => keywordsQuery orElse subjectsQuery
    }
    val commonWhereClauses = List(
      keywordsOrSubjectsQuery,
      keywordsExclQuery,
      subjectsExclQuery,
      search.text.map(query =>
        sqls"websearch_to_tsquery('english', $query) @@ ${FingerpostWireEntry.syn.column("combined_textsearch")}"
      ),
      sourceFeedsQuery,
      sourceFeedsExclQuery
    ).flatten

    val dataOnlyWhereClauses = List(
      maybeBeforeId.map(beforeId =>
        sqls"${FingerpostWireEntry.syn.id} < $beforeId"
      ),
      maybeSinceId.map(sinceId =>
        sqls"${FingerpostWireEntry.syn.id} > $sinceId"
      )
    ).flatten

    val whereClause = dataOnlyWhereClauses ++ commonWhereClauses match {
      case Nil        => sqls""
      case whereParts => sqls"WHERE ${sqls.joinWithAnd(whereParts: _*)}"
    }
    val query = search.text match {
      case Some(query) =>
        sql"""WITH search_results AS (
          SELECT
            ${syn.id},
            ${syn.externalId},
            ${syn.ingestedAt},
            ${syn.supplier},
            ${syn.content}
          FROM ${FingerpostWireEntry as syn}
          $whereClause
          ORDER BY ${syn.ingestedAt} DESC
          LIMIT $effectivePageSize
        )
        SELECT
          id AS ${syn.resultName.id},
          external_id AS ${syn.resultName.externalId},
          ingested_at AS ${syn.resultName.ingestedAt},
          supplier AS ${syn.resultName.supplier},
          content AS ${syn.resultName.content},
          ts_headline('english', content->>'body_text', websearch_to_tsquery('english', $query))
            AS ${syn.resultName.highlight}
        FROM search_results"""
      case None =>
        sql"""| SELECT $selectAllStatement, '' AS ${syn.resultName.highlight}
                         | FROM ${FingerpostWireEntry as syn}
                         | $whereClause
                         | ORDER BY ${FingerpostWireEntry.syn.ingestedAt} DESC
                         | LIMIT $effectivePageSize
                         | """.stripMargin
    }

    logger.info(s"QUERY: ${query.statement}; PARAMS: ${query.parameters}")

    val results = query
      .map(FingerpostWireEntry(syn.resultName))
      .list()
      .apply()

    val countQuery =
      sql"""| SELECT COUNT(*)
            | FROM ${FingerpostWireEntry as syn}
            | $whereClause
            | """.stripMargin

    logger.info(
      s"COUNT QUERY: ${countQuery.statement}; PARAMS: ${countQuery.parameters}"
    )

    val totalCount: Long =
      countQuery.map(_.long(1)).single().apply().getOrElse(0)

//    val keywordCounts = getKeywords(additionalWhereClauses =
//      commonWhereClauses
//    ) // TODO do this in parallel

    QueryResponse(results, totalCount /*, keywordCounts*/ )
  }

  def getKeywords(
      maybeInLastHours: Option[Int] = None,
      maybeLimit: Option[Int] = None,
      additionalWhereClauses: List[SQLSyntax] = Nil
  ): Map[String, Int] =
    DB readOnly { implicit session =>
      val innerWhereClause = additionalWhereClauses ++ maybeInLastHours
        .map(inLastHours =>
          sqls"ingested_at > now() - ($inLastHours::text || ' hours')::interval"
        ) match {
        case Nil        => sqls""
        case whereParts => sqls"WHERE ${sqls.joinWithAnd(whereParts: _*)}"
      }

      val limitClause = maybeLimit
        .map(limit => sqls"LIMIT $limit")
        .orElse(maybeInLastHours.map(_ => sqls"LIMIT 10"))
        .getOrElse(sqls"")
      sql"""| SELECT distinct keyword, count(*)
            | FROM (
            |     SELECT jsonb_array_elements_text(${FingerpostWireEntry.syn
             .column(
               "content"
             )} -> 'keywords') as keyword
            |     FROM ${FingerpostWireEntry as syn}
            |     $innerWhereClause
            | ) as all_keywords
            | GROUP BY keyword
            | ORDER BY "count" DESC
            | $limitClause
            | """.stripMargin
        .map(rs => rs.string("keyword") -> rs.int("count"))
        .list()
        .apply()
        .toMap // TODO would a list be better?
    }

}
