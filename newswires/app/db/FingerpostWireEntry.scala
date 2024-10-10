package db

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

  override val columns: Seq[String] =
    Seq("id", "external_id", "ingested_at", "content", "combined_textsearch")
  private val syn = this.syntax("wire_entry")

  private val selectAllStatement = sqls"""
    |   ${syn.result.id},
    |   ${syn.result.externalId},
    |   ${syn.result.ingestedAt},
    |   ${syn.result.content}
    |""".stripMargin

  def apply(
      wireEntry: ResultName[FingerpostWireEntry]
  )(rs: WrappedResultSet): FingerpostWireEntry =
    FingerpostWireEntry(
      rs.long(wireEntry.id),
      rs.string(wireEntry.externalId),
      rs.zonedDateTime(wireEntry.ingestedAt),
      Json.parse(rs.string(wireEntry.column("content"))).as[FingerpostWire]
    )

  private def clamp(low: Int, x: Int, high: Int): Int =
    math.min(math.max(x, low), high)

  def get(id: Int): Option[FingerpostWireEntry] = DB readOnly {
    implicit session =>
      sql"""| SELECT ${syn.result.*}
            | FROM ${FingerpostWireEntry as syn}
            | WHERE ${syn.id} = $id
            |""".stripMargin
        .map(FingerpostWireEntry(syn.resultName))
        .single()
        .apply()
  }

  case class QueryResponse(
      results: List[FingerpostWireEntry],
      keywordCounts: Map[String, Int]
  )
  private object QueryResponse {
    implicit val writes: OWrites[QueryResponse] = Json.writes[QueryResponse]
  }

  def query(
      maybeFreeTextQuery: Option[String],
      maybeKeywords: Option[List[String]],
      maybeSupplier: Option[String],
      maybeBeforeId: Option[Int],
      maybeSinceId: Option[Int],
      pageSize: Int = 250
  ): QueryResponse = DB readOnly { implicit session =>
    val effectivePageSize = clamp(0, pageSize, 250)

    val commonWhereClauses = List(
      maybeKeywords.map(keywords =>
        sqls"""(${syn.column(
            "content"
          )} -> 'keywords') @> ${Json.toJson(keywords).toString()}::jsonb"""
      ),
      maybeFreeTextQuery.map(query =>
        sqls"phraseto_tsquery($query) @@ ${syn.column("combined_textsearch")}"
      ),
      maybeSupplier.map(supplierName =>
        sqls"${SourceFeedToSupplier.syn.supplier} = $supplierName"
      )
    ).flatten

    val dataOnlyWhereClauses = List(
      maybeBeforeId.map(beforeId => sqls"${syn.id} < $beforeId"),
      maybeSinceId.map(sinceId => sqls"${syn.id} > $sinceId")
    ).flatten

    val whereClause = dataOnlyWhereClauses ++ commonWhereClauses match {
      case Nil        => sqls""
      case whereParts => sqls"WHERE ${sqls.joinWithAnd(whereParts: _*)}"
    }

    val joinClause = if (maybeSupplier.isDefined) {
      sqls"LEFT OUTER JOIN ${SourceFeedToSupplier as SourceFeedToSupplier.syn} ON ${syn.column("content")}->>'source-feed' = ${SourceFeedToSupplier.syn.sourceFeed}"
    } else {
      sqls""
    }

    val results = sql"""| SELECT $selectAllStatement
                        | FROM ${FingerpostWireEntry as syn}
                        | $joinClause
                        | $whereClause
                        | ORDER BY ${syn.ingestedAt} DESC
                        | LIMIT $effectivePageSize
                        | """.stripMargin
      .map(FingerpostWireEntry(syn.resultName))
      .list()
      .apply()

    val keywordCounts = getKeywords(
      additionalWhereClauses = commonWhereClauses,
      joinClause = joinClause
    ) // TODO do this in parallel

    QueryResponse(results, keywordCounts)
  }

  def getKeywords(
      maybeInLastHours: Option[Int] = None,
      maybeLimit: Option[Int] = None,
      additionalWhereClauses: List[SQLSyntax] = Nil,
      joinClause: SQLSyntax = sqls""
  ) =
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
            |     $joinClause
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
