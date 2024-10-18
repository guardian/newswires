package db

import conf.SourceFeedSupplierMapping.sourceFeedsFromSupplier
import db.CustomMappers.textArray
import play.api.Logging
import play.api.libs.json._
import scalikejdbc._

import java.time.ZonedDateTime

case class FingerpostWireSubjects(
    code: List[String]
)
object FingerpostWireSubjects {
  implicit val format: OFormat[FingerpostWireSubjects] =
    Json.format[FingerpostWireSubjects]
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
    externalId: String,
    ingestedAt: ZonedDateTime,
    content: FingerpostWire
)

object FingerpostWireEntry
    extends SQLSyntaxSupport[FingerpostWireEntry]
    with Logging {

  implicit val format: OFormat[FingerpostWireEntry] =
    Json.format[FingerpostWireEntry]

  override val columns =
    Seq("id", "external_id", "ingested_at", "content", "combined_textsearch")
  val syn = this.syntax("fm")

  private val selectAllStatement = sqls"""
    |   ${FingerpostWireEntry.syn.result.id},
    |   ${FingerpostWireEntry.syn.result.externalId},
    |   ${FingerpostWireEntry.syn.result.ingestedAt},
    |   ${FingerpostWireEntry.syn.result.content}
    |""".stripMargin

  def apply(
      fm: ResultName[FingerpostWireEntry]
  )(rs: WrappedResultSet): FingerpostWireEntry =
    FingerpostWireEntry(
      rs.long(fm.id),
      rs.string(fm.externalId),
      rs.zonedDateTime(fm.ingestedAt),
      Json.parse(rs.string(fm.content)).as[FingerpostWire]
    )

  private def clamp(low: Int, x: Int, high: Int): Int =
    math.min(math.max(x, low), high)

  def get(id: Int): Option[FingerpostWireEntry] = DB readOnly {
    implicit session =>
      sql"""| SELECT ${FingerpostWireEntry.syn.result.*}
            | FROM ${FingerpostWireEntry as syn}
            | WHERE ${FingerpostWireEntry.syn.id} = $id
            |""".stripMargin
        .map(FingerpostWireEntry(syn.resultName))
        .single()
        .apply()
  }

  case class QueryResponse(
      results: List[FingerpostWireEntry]
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

    val sourceFeeds =
      search.suppliersIncl.flatMap(sourceFeedsFromSupplier(_).getOrElse(Nil))

    val sourceFeedsExcl =
      search.suppliersExcl.flatMap(sourceFeedsFromSupplier(_).getOrElse(Nil))

    val sourceFeedsQuery = sourceFeeds match {
      case Nil => None
      case _ =>
        Some(
          sqls.in(
            sqls"upper(${syn.content}->>'source-feed')",
            sourceFeeds.map(feed => sqls"upper($feed)")
          )
        )
    }

    val sourceFeedsExclQuery = sourceFeedsExcl match {
      case Nil => None
      case _ =>
        val se = this.syntax("sourceFeedsExcl")
        val doesContainFeeds = sqls.in(
          sqls"upper(${se.content}->>'source-feed')",
          sourceFeedsExcl.map(feed => sqls"upper($feed)")
        )
        // unpleasant, but the sort of trick you need to pull
        // because "NOT IN (...)" doesn't hit an index.
        // https://stackoverflow.com/a/19364694
        Some(
          sqls"""|NOT EXISTS (
                 |  SELECT FROM ${FingerpostWireEntry as se}
                 |  WHERE ${syn.id} = ${se.id}
                 |    AND $doesContainFeeds
                 |)""".stripMargin
        )
    }

    val keywordsQuery = search.keywordIncl match {
      case Nil => None
      case keywords =>
        val keywordsJsonb = Json.toJson(keywords).toString()
        Some(
          sqls"""(${syn.content} -> 'keywords') @> $keywordsJsonb::jsonb"""
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
          sqls"(${ke.content}->'keywords') ??| ${textArray(keywords)}"
        // unpleasant, but the kind of trick you need to pull because
        // NOT [row] ?| [list] won't use the index.
        // https://stackoverflow.com/a/19364694
        Some(
          sqls"""|NOT EXISTS (
                 |  SELECT FROM ${FingerpostWireEntry as ke}
                 |  WHERE ${syn.id} = ${ke.id}
                 |    AND $doesContainKeywords
                 |)""".stripMargin
        )
    }

    val subjectsQuery = search.subjectsIncl match {
      case Nil => None
      case subjects =>
        Some(
          sqls"(${syn.content} -> 'subjects' -> 'code') ??& ${textArray(subjects)}"
        )
    }

    val subjectsExclQuery = search.subjectsExcl match {
      case Nil => None
      case subjects =>
        val se = this.syntax("subjectsExcl")
        val doesContainSubjects =
          sqls"(${se.content}->'subjects'->'code') ??| ${textArray(subjects)}"
        Some(
          sqls"""|NOT EXISTS (
                 |  SELECT FROM ${FingerpostWireEntry as se}
                 |  WHERE ${syn.id} = ${se.id}
                 |    AND $doesContainSubjects
                 |)""".stripMargin
        )
    }

    val commonWhereClauses = List(
      keywordsQuery,
      keywordsExclQuery,
      search.text.map(query =>
        sqls"websearch_to_tsquery('english', $query) @@ ${FingerpostWireEntry.syn.column("combined_textsearch")}"
      ),
      sourceFeedsQuery,
      sourceFeedsExclQuery,
      subjectsQuery,
      subjectsExclQuery
    ).flatten

    val dataOnlyWhereClauses = List(
      maybeBeforeId.map(beforeId =>
        sqls"${FingerpostWireEntry.syn.id} < $beforeId"
      ),
      maybeSinceId.map(sinceId =>
        sqls"${FingerpostWireEntry.syn.id} > $sinceId"
      )
    ).flatten

    val whereClause = (dataOnlyWhereClauses ++ commonWhereClauses) match {
      case Nil        => sqls""
      case whereParts => sqls"WHERE ${sqls.joinWithAnd(whereParts: _*)}"
    }

    val query = sql"""| SELECT $selectAllStatement
                      | FROM ${FingerpostWireEntry as syn}
                      | $whereClause
                      | ORDER BY ${FingerpostWireEntry.syn.ingestedAt} DESC
                      | LIMIT $effectivePageSize
                      | """.stripMargin

//    logger.info(s"QUERY: ${query.statement}; PARAMS: ${query.parameters}")

    val results = query
      .map(FingerpostWireEntry(syn.resultName))
      .list()
      .apply()

//    val keywordCounts = getKeywords(additionalWhereClauses =
//      commonWhereClauses
//    ) // TODO do this in parallel

    QueryResponse(results /*, keywordCounts*/ )
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
