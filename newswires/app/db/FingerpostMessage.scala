package db

import play.api.libs.json.{Json, OFormat}
import scalikejdbc._

import java.time.ZonedDateTime

case class TheWire(
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
object TheWire {
  implicit val format: OFormat[TheWire] = Json.format[TheWire]
}

case class FingerpostMessage(
    id: Long,
    sqsMessageId: String,
    wire: TheWire
)

object FingerpostMessage extends SQLSyntaxSupport[FingerpostMessage] {
  implicit val format: OFormat[FingerpostMessage] =
    Json.format[FingerpostMessage]

  override val columns = Seq("id", "sqs_message_id", "message_content")
  val syn = this.syntax("fm")

  def apply(
      fm: ResultName[FingerpostMessage]
  )(rs: WrappedResultSet): FingerpostMessage =
    FingerpostMessage(
      rs.long(fm.id),
      rs.string(fm.sqsMessageId),
      Json.parse(rs.string(fm.column("message_content"))).as[TheWire]
    )

  private def clamp(low: Int, x: Int, high: Int): Int =
    math.min(math.max(x, low), high)

  def getAll(page: Int = 0, pageSize: Int = 250): List[FingerpostMessage] =
    DB readOnly { implicit session =>
      val effectivePage = clamp(0, page, 10)
      val effectivePageSize = clamp(0, pageSize, 250)
      val position = effectivePage * effectivePageSize
      sql"""| SELECT ${FingerpostMessage.syn.result.*}
            | FROM ${FingerpostMessage as syn}
            | LIMIT $effectivePageSize
            | OFFSET $position """.stripMargin
        .map(FingerpostMessage(syn.resultName))
        .list()
        .apply()
    }

  def query(query: String): List[FingerpostMessage] = DB readOnly {
    implicit session =>
      def filterElement(fieldName: String) =
        sqls"$query <% (${FingerpostMessage.syn.column("message_content")}->>$fieldName)"

      val headline = filterElement("headline")
      val subhead = filterElement("subhead")
      val byline = filterElement("byline")
      val keywords = filterElement("keywords")
      val bodyText = filterElement("body_text")

      val filters =
        sqls"$headline OR $subhead OR $byline OR $keywords OR $bodyText"

      sql"""| SELECT ${FingerpostMessage.syn.result.*}
            | FROM ${FingerpostMessage as syn}
            | WHERE $filters""".stripMargin
        .map(FingerpostMessage(syn.resultName))
        .list()
        .apply()

  }
}
