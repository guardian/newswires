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

case class WireEntryForCollection(
    wireEntryId: Long,
    collectionId: Long,
    addedAt: Option[String] = None
)

object WireEntryForCollection extends SQLSyntaxSupport[WireEntryForCollection] {
  val syn = this.syntax("wec")

  override val tableName = "wire_entry_collection"

  override val columns =
    Seq(
      "id",
      "wire_entry_id",
      "collection_id",
      "added_at"
    )

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
      addedAt = rs.get(wec.addedAt)
    )
  }

  def opt(
      wec: ResultName[WireEntryForCollection]
  )(rs: WrappedResultSet): Option[WireEntryForCollection] = {
    rs.longOpt(wec.wireEntryId).map(_ => WireEntryForCollection(wec)(rs))
  }

  implicit val jsonEncoder: Encoder[WireEntryForCollection] =
    deriveEncoder[WireEntryForCollection].mapJson(_.dropNullValues)

  implicit val jsonDecoder: Decoder[WireEntryForCollection] =
    deriveDecoder[WireEntryForCollection]

}
