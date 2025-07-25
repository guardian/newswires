package db

import play.api.libs.json.{Json, OFormat}
import scalikejdbc._

import java.time.Instant

case class ToolLink(
    id: Long,
    wireId: Long,
    tool: String,
    sentBy: String,
    sentAt: Instant,
    ref: Option[String]
)

object ToolLink extends SQLSyntaxSupport[ToolLink] {
  val syn = this.syntax("tl")

  override val tableName = "tool_link"

  lazy val selectAllStatement: SQLSyntax = sqls"""
    |${syn.result.id},
    |${syn.result.wireId},
    |${syn.result.tool},
    |${syn.result.sentBy},
    |${syn.result.sentAt},
    |${syn.result.ref}""".stripMargin

  def opt(tl: ResultName[ToolLink])(rs: WrappedResultSet): Option[ToolLink] = {
    rs.longOpt(tl.wireId)
      .map(wireId =>
        new ToolLink(
          id = rs.get(tl.id),
          wireId = wireId,
          tool = rs.get(tl.tool),
          sentBy = rs.get(tl.sentBy),
          sentAt = rs.get(tl.sentAt),
          ref = rs.get(tl.ref)
        )
      )
  }

  override val columns =
    Seq(
      "id",
      "wire_id",
      "tool",
      "sent_by",
      "sent_at",
      "ref"
    )

  implicit val format: OFormat[ToolLink] = Json.format[ToolLink]
}
