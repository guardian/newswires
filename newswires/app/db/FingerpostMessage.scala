package db

import play.api.libs.json.{Json, OFormat}
import scalikejdbc._

import java.time.ZonedDateTime

case class TheWire(
    uri: Option[String],
    usn: Option[String],
    version: Option[String],
//  firstVersion: Option[ZonedDateTime],
//  versionCreated: Option[ZonedDateTime],
//  dateTimeSent: Option[ZonedDateTime],
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

  def getAll(implicit
      DBSession: DBSession = AutoSession
  ): Seq[FingerpostMessage] =
    sql"SELECT ${FingerpostMessage.syn.result.*} from ${FingerpostMessage as syn} limit 250 "
      .map(FingerpostMessage(syn.resultName))
      .list()
      .apply()
}
