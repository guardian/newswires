package db

import db.FingerpostWireEntry.Filters
import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import io.circe.{Decoder, Encoder}
import models.QueryResponse
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
    maybeBeforeId: Option[Int] = None,
    maybeSinceId: Option[Int] = None,
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

  def getById(
      id: Long
  ): Option[Collection] = DB readOnly { implicit session =>
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

  def listCollections(): List[Collection] = DB readOnly { implicit session =>
    sql"""
       SELECT $selectAllStatement
       FROM ${Collection as syn}
       ORDER BY ${syn.createdAt} DESC
      """
      .map(rs => Collection(syn.resultName)(rs))
      .list()
  }

  def fetchCollectionById(
      id: Long,
      searchParams: CollectionItemsSearchParams,
      pageSize: Int = 100
  ): Option[QueryResponse] =
    getById(id).map { collection =>
      getWireEntriesForCollection(
        collection,
        searchParams,
        pageSize
      )
    }

  private def getWireEntriesForCollection(
      collection: Collection,
      searchParams: CollectionItemsSearchParams,
      pageSize: Int
  ): QueryResponse =
    DB readOnly { implicit session =>
      val dataOnlyWhereClauses = List(
        searchParams.maybeBeforeId.map(Filters.beforeIdSQL(_)),
        searchParams.maybeSinceId.map(Filters.sinceIdSQL(_))
      )

      val dateRangeQuery =
        Filters.dateRangeSQL(searchParams.start, searchParams.end)

      val collectionIdQuery = sqls"${syn.id} = ${collection.id}"

      val addedToCollectionSinceClause =
        searchParams.maybeAddedToCollectionSinceTimestamp.map { timestampStr =>
          sqls"${WireEntryForCollection.syn.addedAt} >= CAST($timestampStr AS timestamptz)"
        }
      val addedToCollectionBeforeClause =
        searchParams.maybeAddedToCollectionBeforeTimestamp.map { timestampStr =>
          sqls"${WireEntryForCollection.syn.addedAt} <= CAST($timestampStr AS timestamptz)"
        }

      val whereClause = sqls.joinWithAnd(
        collectionIdQuery :: (dateRangeQuery :: addedToCollectionSinceClause :: addedToCollectionBeforeClause :: dataOnlyWhereClauses).flatten: _*
      )

      val highlightsClause = FingerpostWireEntry.buildHighlightsClause(
        None
      ) // We aren't doing free-text search here but the 'FingerpostWireEntry.fromDb' method needs there to be a column in the result

      val query =
        sql"""
           SELECT ${FingerpostWireEntry.selectAllStatement}, ${highlightsClause}
           FROM ${Collection as syn}
           LEFT JOIN ${WireEntryForCollection as WireEntryForCollection.syn}
            ON ${syn.id} = ${WireEntryForCollection.syn.collectionId}
           LEFT JOIN ${FingerpostWireEntry as FingerpostWireEntry.syn}
            ON ${FingerpostWireEntry.syn.id} = ${WireEntryForCollection.syn.wireEntryId}
           WHERE ${whereClause}
           ORDER BY ${WireEntryForCollection.syn.addedAt} DESC
           LIMIT $pageSize
          """
      val wireEntries = query
        .map(rs => {
          FingerpostWireEntry.fromDb(FingerpostWireEntry.syn.resultName)(rs)
        })
        .list()
        .flatten

      val countQuery =
        sql"""
             |SELECT COUNT(*)
             |FROM ${Collection as syn}
             |LEFT JOIN ${WireEntryForCollection as WireEntryForCollection.syn}
             |  ON ${syn.id} = ${WireEntryForCollection.syn.collectionId}
             |LEFT JOIN ${FingerpostWireEntry as FingerpostWireEntry.syn}
             |  ON ${FingerpostWireEntry.syn.id} = ${WireEntryForCollection.syn.wireEntryId}
             | WHERE ${whereClause}
             | """.stripMargin

      logger.info(
        s"COUNT QUERY: ${countQuery.statement}; PARAMS: ${countQuery.parameters}"
      )

      val totalCount: Long = {
        countQuery.map(_.long(1)).single().getOrElse(0)
      }

      QueryResponse(wireEntries, totalCount)
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
