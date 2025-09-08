package db

import conf.{SearchField, SearchTerm}
import io.circe.parser.decode
import helpers.SqlSnippetMatcher.matchSqlSnippet
import helpers.models
import org.scalatest.flatspec.AnyFlatSpec
import org.scalatest.matchers.should.Matchers
import io.circe.syntax.EncoderOps
import models.{MostRecent, NextPage, QueryParams, SearchParams}
import scalikejdbc.scalikejdbcSQLInterpolationImplicitDef

class FingerpostWireEntrySpec extends AnyFlatSpec with Matchers with models {

  behavior of "FingerpostWireEntry Json encoders / decoders"

  it should "serialise json" in {
    fingerpostWireEntry.asJson.spaces2 shouldEqual fingerpostWireEntryJson
  }

  it should "deserialise json" in {
    decode[FingerpostWireEntry](fingerpostWireEntryJson) shouldEqual Right(
      fingerpostWireEntry
    )
  }

  behavior of "FingerpostWireEntry.buildSingleGetQuery"

  it should "generates the expected query for a lookup" in {
    val id = 153
    val getQuery =
      FingerpostWireEntry.buildSingleGetQuery(id, maybeFreeTextQuery = None)

    getQuery should matchSqlSnippet(
      expectedClause = """ SELECT
          |   fm.id as i_on_fm,
          |   fm.external_id as ei_on_fm,
          |   fm.ingested_at as ia_on_fm,
          |   fm.supplier as s_on_fm,
          |   fm.composer_id as ci_on_fm,
          |   fm.composer_sent_by as csb_on_fm,
          |   fm.category_codes as cc_on_fm,
          |   fm.content as c_on_fm,
          |   fm.s3_key as sk_on_fm
          |, '' AS h_on_fm,
          |tl.id as i_on_tl,
          |tl.wire_id as wi_on_tl,
          |tl.tool as t_on_tl,
          |tl.sent_by as sb_on_tl,
          |tl.sent_at as sa_on_tl,
          |tl.ref as r_on_tl
          | FROM fingerpost_wire_entry fm
          | LEFT JOIN tool_link tl
          |   ON fm.id = tl.wire_id
          | WHERE fm.id = ?
          |""".stripMargin,
      expectedParams = List(153)
    )
  }

  behavior of "FingerpostWireEntry.buildWhereClause"

  it should "generate an empty where clause for a empty set of search params" in {
    val searchParams = SearchParams(
      text = None,
      start = None,
      end = None,
      keywordIncl = Nil,
      keywordExcl = Nil,
      suppliersIncl = Nil,
      suppliersExcl = Nil
    )

    val whereClause =
      FingerpostWireEntry.buildWhereClause(
        baseWhereClause = None,
        searchParams,
        List(),
        None,
        None
      )

    whereClause should matchSqlSnippet(
      expectedClause = "true",
      expectedParams = Nil
    )
  }

  it should "apply beforeId or sinceId even if no other custom search params are set" in {

    val searchParams = SearchParams(
      text = None,
      start = None,
      end = None,
      keywordIncl = Nil,
      keywordExcl = Nil,
      suppliersIncl = Nil,
      suppliersExcl = Nil
    )

    val whereClauseBeforeId =
      FingerpostWireEntry.buildWhereClause(
        baseWhereClause = None,
        searchParams,
        List(),
        maybeBeforeId = Some(10),
        None
      )

    whereClauseBeforeId should matchSqlSnippet(
      expectedClause = "fm.id < ?",
      expectedParams = List(10)
    )

    val whereClauseSinceId =
      FingerpostWireEntry.buildWhereClause(
        baseWhereClause = None,
        searchParams,
        List(),
        None,
        maybeSinceId = Some(20)
      )

    whereClauseSinceId should matchSqlSnippet(
      expectedClause = "fm.id > ?",
      expectedParams = List(20)
    )
  }

  it should "generate a where clause for a single field" in {
    val searchParams =
      SearchParams(
        text = Some(SearchTerm.English("text1"))
      )

    val whereClause =
      FingerpostWireEntry.buildWhereClause(
        baseWhereClause = None,
        searchParams,
        List(),
        None,
        None
      )

    whereClause should matchSqlSnippet(
      "websearch_to_tsquery('english', ?) @@ fm.combined_textsearch",
      expectedParams = List("text1")
    )
  }

  it should "concatenate keywords and category codes with 'and'" in {
    val searchParams =
      SearchParams(
        text = None,
        keywordIncl = List("keyword1", "keyword2"),
        categoryCodesIncl = List("category1", "category2")
      )

    val whereClause =
      FingerpostWireEntry.buildWhereClause(
        baseWhereClause = None,
        searchParams,
        List(),
        None,
        None
      )

    whereClause should matchSqlSnippet(
      "((fm.content -> 'keywords') ??| ? and fm.category_codes && ?)",
      List(
        List("keyword1", "keyword2"),
        List("category1", "category2")
      )
    )
  }

  it should "join other clauses using 'and'" in {
    val searchParams =
      SearchParams(
        text = Some(SearchTerm.English("text1")),
        start = Some("2025-03-10T00:00:00.000Z"),
        end = Some("2025-03-10T23:59:59.999Z"),
        suppliersExcl = List("supplier1", "supplier2"),
        keywordExcl = List("keyword1"),
        categoryCodesExcl = List("category1", "category2")
      )

    val whereClause =
      FingerpostWireEntry.buildWhereClause(
        baseWhereClause = None,
        searchParams,
        List(),
        Some(1),
        None
      )

    val textSearchWhereClause = FingerpostWireEntry
      .buildWhereClause(
        baseWhereClause = None,
        SearchParams(Some(SearchTerm.English("text1"))),
        List(),
        None,
        None
      )

    val dateRangeWhereClause = FingerpostWireEntry
      .buildWhereClause(
        baseWhereClause = None,
        SearchParams(
          text = None,
          start = Some("2025-03-10T00:00:00.000Z"),
          end = Some("2025-03-10T23:59:59.999Z")
        ),
        List(),
        None,
        None
      )

    val keywordsExclWhereClause = FingerpostWireEntry
      .buildWhereClause(
        baseWhereClause = None,
        SearchParams(
          text = None,
          keywordExcl = List("keyword1")
        ),
        List(),
        None,
        None
      )

    val suppliersExclWhereClause = FingerpostWireEntry
      .buildWhereClause(
        baseWhereClause = None,
        SearchParams(
          text = None,
          suppliersExcl = List("supplier1", "supplier2")
        ),
        List(),
        None,
        None
      )

    val categoryCodesExclWhereClause = FingerpostWireEntry
      .buildWhereClause(
        baseWhereClause = None,
        SearchParams(
          text = None,
          categoryCodesExcl = List("category1", "category2")
        ),
        List(),
        None,
        None
      )

    whereClause should matchSqlSnippet(
      sqls"""fm.id < ? and $dateRangeWhereClause
         | and $keywordsExclWhereClause
         | and $textSearchWhereClause
         | and $suppliersExclWhereClause
         | and $categoryCodesExclWhereClause""".stripMargin,
      List(
        1,
        "2025-03-10T00:00:00.000Z",
        "2025-03-10T23:59:59.999Z",
        List("keyword1"),
        "text1",
        "supplier1",
        "supplier2",
        List("category1", "category2")
      )
    )
  }

  it should "Should cast a lower bound date only" in {
    val searchParams = SearchParams(
      text = None,
      start = Some("2025-03-10T00:00:00.000Z")
    )

    val whereClause =
      FingerpostWireEntry.buildWhereClause(
        baseWhereClause = None,
        searchParams,
        List(),
        None,
        None
      )

    whereClause should matchSqlSnippet(
      "fm.ingested_at >= CAST(? AS timestamptz)",
      List("2025-03-10T00:00:00.000Z")
    )
  }

  it should "Should cast an upper bound date only" in {
    val searchParams = SearchParams(
      text = None,
      end = Some("2025-03-10T23:59:59.999Z")
    )

    val whereClause =
      FingerpostWireEntry.buildWhereClause(
        baseWhereClause = None,
        searchParams,
        List(),
        None,
        None
      )

    whereClause should matchSqlSnippet(
      "fm.ingested_at <= CAST(? AS timestamptz)",
      List("2025-03-10T23:59:59.999Z")
    )
  }

  it should "should join complex search presets using 'or'" in {

    val customParams = SearchParams(
      text = None,
      suppliersExcl = List("supplier1")
    )

    val presetSearchParams1 =
      SearchParams(
        text = Some(SearchTerm.Simple("News Summary", SearchField.Headline)),
        suppliersIncl = List("REUTERS"),
        categoryCodesIncl = List(
          "N2:GB"
        )
      )
    val presetSearchParams2 =
      SearchParams(
        text = Some(SearchTerm.Simple("soccer")),
        suppliersIncl = List("AFP"),
        categoryCodesIncl = List("afpCat:SPO")
      )

    val customParamsClause = FingerpostWireEntry
      .buildWhereClause(
        baseWhereClause = None,
        customParams,
        List(),
        None,
        None
      )

    val preset1Clause = FingerpostWireEntry
      .buildWhereClause(
        baseWhereClause = None,
        presetSearchParams1,
        List(),
        None,
        None
      )

    val preset2Clause = FingerpostWireEntry
      .buildWhereClause(
        baseWhereClause = None,
        presetSearchParams2,
        List(),
        None,
        None
      )

    val whereClause =
      FingerpostWireEntry.buildWhereClause(
        baseWhereClause = None,
        customParams,
        List(presetSearchParams1, presetSearchParams2),
        None,
        None
      )

    whereClause should matchSqlSnippet(
      sqls"$customParamsClause and (($preset1Clause or $preset2Clause))",
      List(
        "supplier1",
        List("N2:GB"),
        "News Summary",
        "REUTERS",
        List("afpCat:SPO"),
        "soccer",
        "AFP"
      )
    )
  }

  it should "apply date ranges using 'AND' at the top level of the query" in {
    val baseWhereClause = sqls"1 = 1"

    val customParams = SearchParams(
      text = Some(SearchTerm.English("text1")),
      start = Some("2025-03-10T00:00:00.000Z"),
      end = Some("2025-03-10T23:59:59.999Z")
    )

    val textSearchWhereClause = FingerpostWireEntry
      .buildWhereClause(
        baseWhereClause = None,
        customParams.copy(start = None, end = None),
        List(),
        None,
        None
      )

    val dateRangeWhereClause = FingerpostWireEntry
      .buildWhereClause(
        baseWhereClause = None,
        customParams.copy(text = None),
        List(),
        None,
        None
      )

    val whereClause =
      FingerpostWireEntry.buildWhereClause(
        baseWhereClause = Some(baseWhereClause),
        customParams,
        List.empty,
        None,
        None
      )

    whereClause should matchSqlSnippet(
      sqls"$baseWhereClause and $dateRangeWhereClause and $textSearchWhereClause",
      List(
        "2025-03-10T00:00:00.000Z",
        "2025-03-10T23:59:59.999Z",
        "text1"
      )
    )
  }

  behavior of "FingerpostWireEntry.buildSearchQuery"

  it should "order results by descending ingestion_at by default" in {
    val queryParams = QueryParams(
      searchParams = SearchParams(None),
      savedSearchParamList = Nil,
      maybeSearchTerm = None,
      maybeBeforeId = None,
      maybeSinceId = None
    )
    val whereClause = sqls""
    val query = FingerpostWireEntry.buildSearchQuery(queryParams, whereClause)

    query.statement should include("ORDER BY fm.ingested_at DESC")
  }

  it should "order results by descending ingestion_at when using MostRecent update type with maybeSinceId" in {
    val queryParams = QueryParams(
      searchParams = SearchParams(None),
      savedSearchParamList = Nil,
      maybeSearchTerm = None,
      maybeBeforeId = None,
      maybeSinceId = Some(MostRecent(123))
    )
    val whereClause = sqls""
    val query = FingerpostWireEntry.buildSearchQuery(queryParams, whereClause)

    query.statement should include("ORDER BY fm.ingested_at DESC")
  }

  it should "order results by *ascending* ingestion_at when using NextPage update type with maybeSinceId" in {
    val queryParams = QueryParams(
      searchParams = SearchParams(None),
      savedSearchParamList = Nil,
      maybeSearchTerm = None,
      maybeBeforeId = None,
      maybeSinceId = Some(NextPage(123))
    )
    val whereClause = sqls""
    val query = FingerpostWireEntry.buildSearchQuery(queryParams, whereClause)

    query.statement should include("ORDER BY fm.ingested_at ASC")
  }
}
