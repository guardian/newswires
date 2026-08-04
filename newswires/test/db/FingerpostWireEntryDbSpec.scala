package db

import _root_.models._
import db.CustomMappers.textArray
import helpers.models
import org.scalatest.BeforeAndAfterAll
import org.scalatest.flatspec.AnyFlatSpec
import org.scalatest.matchers.should.Matchers
import scalikejdbc._

import scala.util.Try

/** Integration tests that run the exclusion / negation SQL against a real
  * Postgres instance (the test DB started by `./scripts/setup-test-env.sh`,
  * listening on localhost:55432).
  *
  * They document the NULL-handling semantics of exclusion filters and negated
  * presets, and assert that the `NotExists` and `PlainNot` query variants are
  * logically equivalent on real data - the behaviour the unit-level SQL-snippet
  * tests can only assert indirectly.
  *
  * If the test DB is unreachable the tests are cancelled rather than failed, so
  * `sbt test` still works for contributors who have not started it.
  */
class FingerpostWireEntryDbSpec
    extends AnyFlatSpec
    with Matchers
    with BeforeAndAfterAll
    with models {

  private val dbUrl = "jdbc:postgresql://localhost:55432/newswires"
  private val dbUser = "postgres"
  private val dbPassword = "testpassword"
  private val dbUnavailableMessage =
    s"test DB not reachable on $dbUrl - run ./scripts/setup-test-env.sh"

  private var dbAvailable = false

  // Row ids, populated once the fixture data is inserted.
  private var idReutersSport = 0L
  private var idAfpPolitics = 0L
  private var idNullSupplierSport = 0L
  private var idNoKeywords = 0L
  private var idNullCategory = 0L

  private val variants = List(PlainNot, NotExists)

  override def beforeAll(): Unit = {
    super.beforeAll()
    dbAvailable = Try {
      ConnectionPool.singleton(dbUrl, dbUser, dbPassword)
      DB.readOnly { implicit session =>
        sql"SELECT 1".map(_.int(1)).single()
      }
    }.isSuccess

    if (dbAvailable) insertTestData()
  }

  // Postgres can't infer the SQL type of a bare Scala List, so bind text[]
  // columns via the shared `textArray` binder (None becomes SQL NULL).
  private def insertRow(
      externalId: String,
      supplier: Option[String],
      keywords: Option[List[String]],
      categoryCodes: Option[List[String]]
  ): Long = {
    val contentJson = keywords match {
      case Some(kws) =>
        val arr = kws.map(k => s""""$k"""").mkString("[", ",", "]")
        s"""{"keywords": $arr}"""
      case None => "{}"
    }
    DB.localTx { implicit session =>
      sql"""INSERT INTO fingerpost_wire_entry (external_id, content, supplier, category_codes)
            VALUES ($externalId, $contentJson::jsonb, $supplier, ${categoryCodes.map(cs => textArray(cs))})
            RETURNING id"""
        .map(_.long("id"))
        .single()
        .get
    }
  }

  private def insertTestData(): Unit = {
    DB.localTx { implicit session =>
      sql"DELETE FROM fingerpost_wire_entry".update()
    }
    idReutersSport =
      insertRow("ext-reuters", Some("REUTERS"), Some(List("sport")), Some(List("A")))
    idAfpPolitics =
      insertRow("ext-afp", Some("AFP"), Some(List("politics")), Some(List("B")))
    idNullSupplierSport =
      insertRow("ext-null-supplier", None, Some(List("sport")), Some(List("A")))
    idNoKeywords =
      insertRow("ext-no-keywords", Some("PA"), None, Some(List("B")))
    idNullCategory =
      insertRow("ext-null-category", Some("DPA"), Some(List("weather")), None)
  }

  private def allIds: Set[Long] =
    Set(
      idReutersSport,
      idAfpPolitics,
      idNullSupplierSport,
      idNoKeywords,
      idNullCategory
    )

  private def sp(f: FilterParams => FilterParams): SearchParams =
    emptySearchParams.copy(filters = f(emptyFilterParams))

  private def idsMatching(
      searchParams: SearchParams = emptySearchParams,
      negatedSearchPresets: List[FilterParams] = Nil,
      queryVariant: QueryVariant
  ): Set[Long] = {
    val whereClause = FingerpostWireEntry.buildWhereClause(
      searchParams,
      emptyQueryCursor,
      defaultOrdering,
      negatedSearchPresets = negatedSearchPresets,
      queryVariant = queryVariant
    )
    DB.readOnly { implicit session =>
      sql"SELECT ${FingerpostWireEntry.syn.id} FROM ${FingerpostWireEntry as FingerpostWireEntry.syn} WHERE $whereClause"
        .map(_.long(1))
        .list()
    }.toSet
  }

  behavior of "exclusion filters against a real Postgres database"

  it should "retain rows with a NULL supplier when excluding a supplier" in {
    assume(dbAvailable, dbUnavailableMessage)
    val params = sp(_.copy(suppliersExcl = List("REUTERS")))
    variants.foreach { variant =>
      withClue(s"variant '${variant.name}': ") {
        val ids = idsMatching(params, queryVariant = variant)
        ids should contain(idNullSupplierSport)
        ids should not contain idReutersSport
        ids shouldBe (allIds - idReutersSport)
      }
    }
  }

  it should "retain rows with no 'keywords' key when excluding a keyword" in {
    assume(dbAvailable, dbUnavailableMessage)
    val params = sp(_.copy(keywordExcl = List("sport")))
    variants.foreach { variant =>
      withClue(s"variant '${variant.name}': ") {
        val ids = idsMatching(params, queryVariant = variant)
        ids should contain(idNoKeywords)
        ids shouldBe Set(idAfpPolitics, idNoKeywords, idNullCategory)
      }
    }
  }

  it should "retain rows with NULL category_codes when excluding a category" in {
    assume(dbAvailable, dbUnavailableMessage)
    val params = sp(_.copy(categoryCodesExcl = List("A")))
    variants.foreach { variant =>
      withClue(s"variant '${variant.name}': ") {
        val ids = idsMatching(params, queryVariant = variant)
        ids should contain(idNullCategory)
        ids shouldBe Set(idAfpPolitics, idNoKeywords, idNullCategory)
      }
    }
  }

  behavior of "negated presets against a real Postgres database"

  it should "retain NULL-supplier rows for a negated preset with an inclusion supplier filter" in {
    assume(dbAvailable, dbUnavailableMessage)
    val negated = List(emptyFilterParams.copy(suppliersIncl = List("REUTERS")))
    variants.foreach { variant =>
      withClue(s"variant '${variant.name}': ") {
        val ids =
          idsMatching(negatedSearchPresets = negated, queryVariant = variant)
        ids should contain(idNullSupplierSport)
        ids shouldBe (allIds - idReutersSport)
      }
    }
  }

  it should "retain rows with no 'keywords' key for a negated preset with an inclusion keyword filter" in {
    assume(dbAvailable, dbUnavailableMessage)
    val negated = List(emptyFilterParams.copy(keywordIncl = List("sport")))
    variants.foreach { variant =>
      withClue(s"variant '${variant.name}': ") {
        val ids =
          idsMatching(negatedSearchPresets = negated, queryVariant = variant)
        ids should contain(idNoKeywords)
        ids shouldBe Set(idAfpPolitics, idNoKeywords, idNullCategory)
      }
    }
  }

  behavior of "NotExists and PlainNot equivalence against a real Postgres database"

  it should "produce identical result sets for both variants across exclusion and negation scenarios" in {
    assume(dbAvailable, dbUnavailableMessage)
    val scenarios: List[(String, SearchParams, List[FilterParams])] = List(
      ("supplier exclusion", sp(_.copy(suppliersExcl = List("REUTERS"))), Nil),
      ("keyword exclusion", sp(_.copy(keywordExcl = List("sport"))), Nil),
      ("category exclusion", sp(_.copy(categoryCodesExcl = List("A"))), Nil),
      (
        "negated preset - supplier exclusion",
        emptySearchParams,
        List(emptyFilterParams.copy(suppliersExcl = List("REUTERS")))
      ),
      (
        "negated preset - keyword exclusion",
        emptySearchParams,
        List(emptyFilterParams.copy(keywordExcl = List("sport")))
      )
    )

    scenarios.foreach { case (label, params, negated) =>
      withClue(s"scenario '$label': ") {
        val plain = idsMatching(params, negated, PlainNot)
        val notExists = idsMatching(params, negated, NotExists)
        notExists shouldBe plain
      }
    }
  }
}
