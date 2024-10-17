package db

import conf.SourceFeedSupplierMapping.sourceFeedsFromSupplier
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

object FingerpostWireEntry extends SQLSyntaxSupport[FingerpostWireEntry] {
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
      Json.parse(rs.string(fm.column("content"))).as[FingerpostWire]
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
      maybeFreeTextQuery: Option[String],
      maybeKeywords: Option[List[String]],
      suppliers: List[String],
      maybeBeforeId: Option[Int],
      maybeSinceId: Option[Int],
      pageSize: Int = 250
  ): QueryResponse = DB readOnly { implicit session =>
    val effectivePageSize = clamp(0, pageSize, 250)

    val contentCol = FingerpostWireEntry.syn.column("content")

    val sourceFeeds =
      suppliers.flatMap(sourceFeedsFromSupplier(_).getOrElse(Nil))

    val sourceFeedsQuery = sourceFeeds match {
      case Nil => None
      case sourceFeeds =>
        Some(
          sqls.joinWithOr(
            sourceFeeds.map(sourceFeed =>
              sqls"upper($contentCol->>'source-feed') = upper($sourceFeed)"
            ): _*
          )
        )
    }

    val commonWhereClauses = List(
      maybeKeywords.map(keywords =>
        sqls"""($contentCol -> 'keywords') @> ${Json
            .toJson(keywords)
            .toString()}::jsonb"""
      ),
      maybeFreeTextQuery.map(query =>
        sqls"phraseto_tsquery($query) @@ ${FingerpostWireEntry.syn.column("combined_textsearch")}"
      ),
      sourceFeedsQuery
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

    val results = sql"""| SELECT $selectAllStatement
                        | FROM ${FingerpostWireEntry as syn}
                        | $whereClause
                        | ORDER BY ${FingerpostWireEntry.syn.ingestedAt} DESC
                        | LIMIT $effectivePageSize
                        | """.stripMargin
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
