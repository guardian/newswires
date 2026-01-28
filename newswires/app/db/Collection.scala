package db

import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import io.circe.{Decoder, Encoder}
import play.api.Logging
import scalikejdbc._

import java.time.Instant

case class Collection(
    id: Long,
    name: String,
    description: Option[String],
    createdAt: Instant
)

case class CollectionWithWireEntries(
    collection: Collection,
    wireEntries: List[FingerpostWireEntry]
)
object CollectionWithWireEntries {
  implicit val collectionWithWireEntriesEncoder
      : Encoder[CollectionWithWireEntries] =
    deriveEncoder[CollectionWithWireEntries]

  implicit val collectionWithWireEntriesDecoder
      : Decoder[CollectionWithWireEntries] =
    deriveDecoder[CollectionWithWireEntries]
}

case class CollectionItemsSearchParams(
    start: Option[String] = None,
    end: Option[String] = None,
    maybeAddedToCollectionSinceTimestamp: Option[String] = None,
    maybeAddedToCollectionBeforeTimestamp: Option[String] = None
)

object Collection extends SQLSyntaxSupport[Collection] with Logging {
  val syn = this.syntax("c")

  override val tableName = "collection"

  override val columns =
    Seq(
      "id",
      "name",
      "description",
      "created_at"
    )

  lazy val selectAllStatement: SQLSyntax = sqls"""
    |${syn.result.id},
    |${syn.result.name},
    |${syn.result.description},
    |${syn.result.createdAt}""".stripMargin

  def apply(c: ResultName[Collection])(rs: WrappedResultSet): Collection = {
    new Collection(
      id = rs.get(c.id),
      name = rs.get(c.name),
      description = rs.get(c.description),
      createdAt = rs.get(c.createdAt)
    )
  }

  def opt(
      c: ResultName[Collection]
  )(rs: WrappedResultSet): Option[Collection] = {
    rs.longOpt(c.id).map(_ => Collection(c)(rs))
  }

  implicit val jsonEncoder: Encoder[Collection] =
    deriveEncoder[Collection].mapJson(_.dropNullValues)

  implicit val jsonDecoder: Decoder[Collection] = deriveDecoder[Collection]

  def insert(name: String, description: Option[String]): Long = DB localTx {
    implicit session =>
      val c = Collection.column

      /** todo handle the case where the unique name constraint is violated --
        * the current query will error in this case and we want to handle it
        * with good feedback to the user
        */
      sql"""| INSERT INTO $table
          |  (${c.name}, ${c.description})
          | VALUES ($name, $description)
          | RETURNING ${c.id}
          | """.stripMargin.map(rs => rs.long(1)).single().get
  }

  def update(id: Long, name: String, description: Option[String]): Int =
    DB localTx { implicit session =>
      val c = Collection.column
      sql"""| UPDATE $table
          | SET ${c.name} = $name, ${c.description} = $description
          | WHERE ${c.id} = $id
          | """.stripMargin.update()
    }

  def listCollections(): List[Collection] = DB readOnly { implicit session =>
    sql"""
       SELECT $selectAllStatement
       FROM ${Collection as syn}
       ORDER BY ${syn.createdAt} DESC
      """
      .map(rs => Collection(syn.resultName)(rs))
      .list()
  }

  def addWireEntryToCollection(
      collectionId: Long,
      wireEntryId: Long,
      addedBy: Option[String] = None
  ): Int = DB localTx { implicit session =>
    sql"""
       INSERT INTO wire_entry_collection
         (collection_id, wire_entry_id, added_by)
       VALUES ($collectionId, $wireEntryId, $addedBy)
       ON CONFLICT (collection_id, wire_entry_id) DO NOTHING
      """
      .update()
  }

  def removeWireEntryFromCollection(
      collectionId: Long,
      wireEntryId: Long
  ): Int = DB localTx { implicit session =>
    sql"""
       DELETE FROM wire_entry_collection
       WHERE collection_id = $collectionId
         AND wire_entry_id = $wireEntryId
      """
      .update()
  }
}
