package db

import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import io.circe.{Decoder, Encoder}
import scalikejdbc.{
  ResultName,
  SQLSyntax,
  SQLSyntaxSupport,
  WrappedResultSet,
  scalikejdbcSQLInterpolationImplicitDef
}

import java.time.Instant

case class WireEntryForCollection(
    wireEntryId: Long,
    collectionId: Long,
    addedAt: Instant
)

object WireEntryForCollection extends SQLSyntaxSupport[WireEntryForCollection] {
  val syn = this.syntax("wec")

  override val tableName = "wire_entry_collection"

  lazy val selectAllStatement: SQLSyntax = sqls"""
    |${syn.result.wireEntryId},
    |${syn.result.collectionId},
    |${syn.result.addedAt}""".stripMargin

  def apply(wec: ResultName[WireEntryForCollection])(
      rs: WrappedResultSet
  ): WireEntryForCollection = {
    new WireEntryForCollection(
      wireEntryId = rs.get(wec.wireEntryId),
      collectionId = rs.get(wec.collectionId),
      addedAt = rs.zonedDateTime(wec.addedAt).toInstant
    )
  }

  def opt(
      wec: ResultName[WireEntryForCollection]
  )(rs: WrappedResultSet): Option[WireEntryForCollection] = {
    rs.longOpt(wec.collectionId).map(_ => WireEntryForCollection(wec)(rs))
  }

  override val columns =
    Seq(
      "wire_entry_id",
      "collection_id",
      "added_at"
    )

  implicit val jsonEncoder: Encoder[WireEntryForCollection] =
    deriveEncoder[WireEntryForCollection].mapJson(_.dropNullValues)

  implicit val jsonDecoder: Decoder[WireEntryForCollection] =
    deriveDecoder[WireEntryForCollection]

}
