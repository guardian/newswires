package db

import db.FingerpostWireEntry.syn
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

object Collection extends SQLSyntaxSupport[Collection] with Logging {
  val syn = this.syntax("c")

  override val tableName = "collection"

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

  override val columns =
    Seq(
      "id",
      "name",
      "description",
      "created_at"
    )

  implicit val jsonEncoder: Encoder[Collection] =
    deriveEncoder[Collection].mapJson(_.dropNullValues)

  implicit val jsonDecoder: Decoder[Collection] = deriveDecoder[Collection]

  def insert(name: String, description: Option[String]): Long = DB localTx {
    implicit session =>
      val c = Collection.column
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

  def upsert(
      name: String,
      id: Option[Long],
      description: Option[String]
  ): Long = {
    id match {
      case Some(existingId) =>
        update(existingId, name, description)
        existingId
      case None =>
        insert(name, description)
    }
  }

  def getById(id: Long): Option[Collection] = DB readOnly { implicit session =>
    sql"""
       SELECT ${selectAllStatement}
       FROM ${Collection as syn}
       WHERE ${syn.id} = $id
      """
      .map(rs => {
        Collection(syn.resultName)(rs)
      })
      .single()
  }

  def getByIdWithWireEntries(id: Long): Option[CollectionWithWireEntries] =
    DB readOnly { implicit session =>
      val highlightsClause = FingerpostWireEntry.buildHighlightsClause(None)
      sql"""
       SELECT ${Collection.selectAllStatement}, ${FingerpostWireEntry.selectAllStatement}, ${highlightsClause}
       FROM ${Collection as syn}
       LEFT JOIN ${WireEntryForCollection as WireEntryForCollection.syn}
        ON ${syn.id} = ${WireEntryForCollection.syn.collectionId}
       LEFT JOIN ${FingerpostWireEntry as FingerpostWireEntry.syn}
        ON ${FingerpostWireEntry.syn.id} = ${WireEntryForCollection.syn.wireEntryId}
       WHERE ${syn.id} = $id
      """
        .map(rs => {
          val collection = Collection.opt(syn.resultName)(rs)
          val wireEntry =
            FingerpostWireEntry.fromDb(FingerpostWireEntry.syn.resultName)(rs)
          (collection, wireEntry)
        })
        .list()
        .collect({ case (Some(collection), maybeWireEntry) =>
          (collection, maybeWireEntry)
        })
        .groupBy(_._1)
        .map({ case (collection, entries) =>
          val wireEntries = entries.flatMap(_._2)
          CollectionWithWireEntries(collection, wireEntries)
        })
        .headOption

    }

  def getByName(name: String): Option[Collection] = DB readOnly {
    implicit session =>
      sql"""
       SELECT $selectAllStatement
       FROM ${Collection as syn}
       WHERE ${syn.name} = $name
      """
        .map(rs => Collection(syn.resultName)(rs))
        .single()
  }

  def getAll(): List[Collection] = DB readOnly { implicit session =>
    sql"""
       SELECT $selectAllStatement
       FROM ${Collection as syn}
       ORDER BY ${syn.createdAt} DESC
      """
      .map(rs => Collection(syn.resultName)(rs))
      .list()
  }

  def get(ids: List[Long]): List[Collection] = DB readOnly { implicit session =>
    sql"""
       SELECT $selectAllStatement
       FROM ${Collection as syn}
       WHERE ${sqls.in(syn.id, ids)}
       ORDER BY ${syn.name}
      """
      .map(rs => Collection(syn.resultName)(rs))
      .list()
  }

  def delete(id: Long): Int = DB localTx { implicit session =>
    sql"""
       DELETE FROM $table
       WHERE ${column.id} = $id
      """
      .update()
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
