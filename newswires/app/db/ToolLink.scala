package db

import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import io.circe.{Decoder, Encoder}
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

  implicit val jsonEncoder: Encoder[ToolLink] =
    deriveEncoder[ToolLink].mapJson(_.dropNullValues)

  implicit val jsonDecoder: Decoder[ToolLink] = deriveDecoder[ToolLink]

  def insertComposerLink(
      newswiresId: Int,
      composerId: String,
      composerHost: String,
      sentBy: String,
      sentAt: Instant
  ): Int = DB localTx { implicit session =>
    val composerUrl =
      s"https://$composerHost/content/$composerId"
    val tl = ToolLink.column
    sql"""| INSERT INTO $table
          |  (${tl.wireId}, ${tl.tool}, ${tl.sentBy}, ${tl.sentAt}, ${tl.ref})
          | VALUES ($newswiresId, 'composer', $sentBy, $sentAt, $composerUrl)
          | """.stripMargin.update()
  }

  def insertIncopyLink(newswiresId: Int, sentBy: String, sentAt: Instant): Int =
    DB localTx { implicit session =>
      val tl = ToolLink.column
      sql"""| INSERT INTO $table
          |  (${tl.wireId}, ${tl.tool}, ${tl.sentBy}, ${tl.sentAt})
          | VALUES ($newswiresId, 'incopy', $sentBy, $sentAt)
          | """.stripMargin.update()
    }
}
