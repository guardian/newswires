package db

import org.postgresql.util.PSQLException
import play.api.libs.json.{Json, OFormat}
import scalikejdbc._

import java.time.ZonedDateTime

case class FingerpostWire(
    uri: Option[String],
    usn: Option[String],
    version: Option[String],
    firstVersion: Option[ZonedDateTime],
    versionCreated: Option[ZonedDateTime],
    dateTimeSent: Option[ZonedDateTime],
    headline: Option[String],
    subhead: Option[String],
    byline: Option[String],
    keywords: Option[String],
    usage: Option[String],
    location: Option[String],
    body_text: Option[String]
)
object FingerpostWire {
  implicit val format: OFormat[FingerpostWire] = Json.format[FingerpostWire]
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

  override val columns = Seq("id", "external_id", "ingested_at", "content")
  val syn = this.syntax("fm")

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

  def getAll(page: Int = 0, pageSize: Int = 250): List[FingerpostWireEntry] =
    DB readOnly { implicit session =>
      val effectivePage = clamp(0, page, 10)
      val effectivePageSize = clamp(0, pageSize, 250)
      val position = effectivePage * effectivePageSize
      sql"""| SELECT ${FingerpostWireEntry.syn.result.*}
            | FROM ${FingerpostWireEntry as syn}
            | ORDER BY ${FingerpostWireEntry.syn.ingestedAt} DESC
            | LIMIT $effectivePageSize
            | OFFSET $position
            |""".stripMargin
        .map(FingerpostWireEntry(syn.resultName))
        .list()
        .apply()
    }

  def query(query: String): List[FingerpostWireEntry] = DB readOnly {
    implicit session =>
      def filterElement(fieldName: String) =
        sqls"$query <% (${FingerpostWireEntry.syn.column("content")}->>$fieldName)"

      val headline = filterElement("headline")
      val subhead = filterElement("subhead")
      val byline = filterElement("byline")
      val keywords = filterElement("keywords")
      val bodyText = filterElement("body_text")

      val filters =
        sqls"$headline OR $subhead OR $byline OR $keywords OR $bodyText"

      sql"""| SELECT ${FingerpostWireEntry.syn.result.*}
            | FROM ${FingerpostWireEntry as syn}
            | WHERE $filters
            | ORDER BY ${FingerpostWireEntry.syn.ingestedAt} DESC
            | LIMIT 250
            | """.stripMargin
        .map(FingerpostWireEntry(syn.resultName))
        .list()
        .apply()

  }

  def getKeywords(maybeInLastHours: Option[Int], maybeLimit: Option[Int]) =
    DB readOnly { implicit session =>
      val innerWhereClause = maybeInLastHours
        .fold(sqls"")(inLastHours =>
          sqls"WHERE ingested_at > now() - ($inLastHours::text || ' hours')::interval"
        )
      println(innerWhereClause)
      val limitClause = maybeLimit
        .map(limit => sqls"LIMIT $limit")
        .orElse(maybeInLastHours.map(_ => sqls"LIMIT 10"))
        .getOrElse(sqls"")
      sql"""| SELECT distinct keyword, count(*)
            | FROM (
            |     SELECT unnest(string_to_array(content ->> 'keywords', '+')) as keyword
            |     FROM fingerpost_wire_entry
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
