package db

import scalikejdbc.{
  SQLSyntax,
  SQLSyntaxSupport,
  scalikejdbcSQLInterpolationImplicitDef
}

case class WireEntryForCollection(
    id: Long,
    wireEntryId: Long,
    collectionId: Long,
    collectionName: Option[String] = None
)

object WireEntryForCollection extends SQLSyntaxSupport[WireEntryForCollection] {
  val syn = this.syntax("wec")

  override val tableName = "wire_entry_collection"

  override val columns =
    Seq(
      "id",
      "wire_entry_id",
      "collection_id"
    )

  lazy val selectAllStatement: SQLSyntax = sqls"""
    |${syn.result.id},
    |${syn.result.wireEntryId},
    |${syn.result.collectionId}""".stripMargin

}
