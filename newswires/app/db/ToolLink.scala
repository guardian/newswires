package db

import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import io.circe.{Decoder, Encoder}
import play.api.Logging
import scalikejdbc._

import java.time.Instant

case class WireMaybeToolLink(
    wireEntry: FingerpostWireEntry,
    toolLink: Option[ToolLink]
)
case class WireToolLinks(wireId: Long, toolLinks: List[ToolLink])

object WireToolLinks {
  implicit val jsonEncoder: Encoder[WireToolLinks] =
    deriveEncoder[WireToolLinks].mapJson(_.dropNullValues)

  implicit val jsonDecoder: Decoder[WireToolLinks] =
    deriveDecoder[WireToolLinks]
}

case class ToolLink(
    id: Long,
    wireId: Long,
    tool: String,
    sentBy: String,
    sentAt: Instant,
    ref: Option[String]
)

object ToolLink extends SQLSyntaxSupport[ToolLink] with Logging {
  val syn = this.syntax("tl")

  override val tableName = "tool_link"

  lazy val selectAllStatement: SQLSyntax = sqls"""
    |${syn.result.id},
    |${syn.result.wireId},
    |${syn.result.tool},
    |${syn.result.sentBy},
    |${syn.result.sentAt},
    |${syn.result.ref}""".stripMargin

  def apply(tl: ResultName[ToolLink])(rs: WrappedResultSet): ToolLink = {
    new ToolLink(
      id = rs.get(tl.id),
      wireId = rs.long(tl.wireId),
      tool = rs.get(tl.tool),
      sentBy = rs.get(tl.sentBy),
      sentAt = rs.get(tl.sentAt),
      ref = rs.get(tl.ref)
    )
  }

  def opt(tl: ResultName[ToolLink])(rs: WrappedResultSet): Option[ToolLink] = {
    rs.longOpt(tl.wireId).map(_ => ToolLink(tl)(rs))
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
          | """.stripMargin.update().apply()
  }

  def insertIncopyLink(newswiresId: Int, sentBy: String, sentAt: Instant): Int =
    DB localTx { implicit session =>
      val tl = ToolLink.column
      sql"""| INSERT INTO $table
          |  (${tl.wireId}, ${tl.tool}, ${tl.sentBy}, ${tl.sentAt})
          | VALUES ($newswiresId, 'incopy', $sentBy, $sentAt)
          | """.stripMargin.update().apply()
    }

  def get(wireIds: List[Long]) = DB readOnly { implicit session =>
    sql"""
         SELECT $selectAllStatement
         FROM ${ToolLink as syn}
         WHERE ${sqls.in(syn.wireId, wireIds)}
       """
      .map(rs => ToolLink(syn.resultName)(rs))
      .list()
      .apply()
  }

  def getByWireId(wireId: Long) = DB readOnly { implicit session =>
    sql"""
       SELECT $selectAllStatement
       FROM ${ToolLink as syn}
       WHERE ${syn.wireId} = ${wireId}
      """
      .map(rs => opt(ToolLink.syn.resultName)(rs))
      .list()
      .apply()
      .flatten
  }

  def display(
      toolLinks: List[ToolLink],
      requestingUser: Option[String]
  ) = {
    toolLinks
      .map(t => t.copy(sentBy = toolLinkUserName(requestingUser, t.sentBy)))
      .sortWith((t1, t2) => t1.sentAt isAfter t2.sentAt)
  }

  private def toolLinkUserName(
      requestingUser: Option[String],
      storedUserName: String
  ): String = {
    if (requestingUser.contains(storedUserName)) "you" else storedUserName
  }
}
