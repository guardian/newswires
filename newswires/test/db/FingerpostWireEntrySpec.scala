package db

import conf.{SearchField, SearchTerm}
import io.circe.parser.decode
import helpers.SqlSnippetMatcher.matchSqlSnippet
import helpers.models
import org.scalatest.flatspec.AnyFlatSpec
import org.scalatest.matchers.should.Matchers
import io.circe.syntax.EncoderOps
import models.{MostRecent, NextPage, QueryParams, SearchParams}
import conf.SearchTerm.English
import scalikejdbc.{scalikejdbcSQLInterpolationImplicitDef, sqls}

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
        searchParams,
        List(),
        Some(1),
        None
      )

    val textSearchWhereClause = FingerpostWireEntry
      .buildWhereClause(
        SearchParams(Some(SearchTerm.English("text1"))),
        List(),
        None,
        None
      )

    val dateRangeWhereClause = FingerpostWireEntry
      .buildWhereClause(
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
        customParams,
        List(),
        None,
        None
      )

    val preset1Clause = FingerpostWireEntry
      .buildWhereClause(
        presetSearchParams1,
        List(),
        None,
        None
      )

    val preset2Clause = FingerpostWireEntry
      .buildWhereClause(
        presetSearchParams2,
        List(),
        None,
        None
      )

    val whereClause =
      FingerpostWireEntry.buildWhereClause(
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

    val customParams = SearchParams(
      text = Some(SearchTerm.English("text1")),
      start = Some("2025-03-10T00:00:00.000Z"),
      end = Some("2025-03-10T23:59:59.999Z")
    )

    val textSearchWhereClause = FingerpostWireEntry
      .buildWhereClause(
        customParams.copy(start = None, end = None),
        List(),
        None,
        None
      )

    val dateRangeWhereClause = FingerpostWireEntry
      .buildWhereClause(
        customParams.copy(text = None),
        List(),
        None,
        None
      )

    val whereClause =
      FingerpostWireEntry.buildWhereClause(
        customParams,
        List.empty,
        None,
        None
      )

    whereClause should matchSqlSnippet(
      sqls"$dateRangeWhereClause and $textSearchWhereClause",
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

  behavior of "FingerpostWireEntry.processSearchParams"

  val emptySearchParams = SearchParams(
    text = None,
    start = None,
    end = None,
    keywordIncl = Nil,
    keywordExcl = Nil,
    suppliersIncl = Nil,
    suppliersExcl = Nil,
    categoryCodesIncl = Nil,
    categoryCodesExcl = Nil,
    hasDataFormatting = None
  )
  it should "return an empty list when no filters are set" in {
    val snippets = FingerpostWireEntry.processSearchParams(emptySearchParams)
    snippets shouldEqual Nil
  }

  it should "create the correct sql snippet with one parameter defined" in {
    val supplierClause = " upper(fm.supplier) in (upper(?))"
    val suppliersInc = emptySearchParams.copy(suppliersIncl = List("supplier"))
    val snippets = FingerpostWireEntry.processSearchParams(suppliersInc)
    sqls"${sqls.joinWithAnd(snippets: _*)}" should matchSqlSnippet(
      expectedClause = supplierClause,
      expectedParams = List("supplier")
    )
  }

  it should "create the correct sql snippet with multiple parameters defined" in {
    val categoryCodesIncl =
      emptySearchParams
        .copy(suppliersIncl = List("supplier"))
        .copy(categoryCodesIncl = List("code"))
    val snippets = FingerpostWireEntry.processSearchParams(categoryCodesIncl)

    val rendered = sqls"${sqls.joinWithAnd(snippets: _*)}".value
    rendered should include("fm.category_codes && ?")
    rendered should include("upper(fm.supplier)")
  }

  it should "combine all SQL clauses when all filters are set" in {
    val fullParams = SearchParams(
      text = Some(SearchTerm.English("query")),
      keywordIncl = List("kw1"),
      keywordExcl = List("kw2"),
      suppliersIncl = List("s1"),
      suppliersExcl = List("s2"),
      categoryCodesIncl = List("c1"),
      categoryCodesExcl = List("c2"),
      hasDataFormatting = Some(true)
    )

    val snippets = FingerpostWireEntry.processSearchParams(fullParams)
    val rendered = sqls"${sqls.joinWithAnd(snippets: _*)}".value

    rendered should include("(fm.content -> 'keywords')")
    rendered should include("fm.category_codes &&")
    rendered should include("(keywordsExcl.content->'keywords')")
    rendered should include(
      "websearch_to_tsquery('english', ?) @@ fm.combined_textsearch"
    )
    rendered should include("upper(fm.supplier) in")
    rendered should include("upper(sourceFeedsExcl.supplier) in")
    rendered should include("categoryCodesExcl.category_codes &&")
    rendered should include("(fm.content->'dataformat') IS NOT NULL")
  }

  behavior of "sql statements"

  behavior of "supplier SQL helpers"
  it should "create the correct sql for suppliers" in {
    val supplierSQL = FingerpostWireEntry.supplierSQL(List("supplier"))
    supplierSQL should matchSqlSnippet(
      expectedClause = " upper(fm.supplier) in (upper(?))",
      expectedParams = List("supplier")
    )
  }

  it should "create the correct sql snippet for suppliersExcl" in {
    val supplierExclClause =
      """NOT EXISTS ( SELECT FROM fingerpost_wire_entry sourceFeedsExcl
            |WHERE fm.id = sourceFeedsExcl.id
            |AND upper(sourceFeedsExcl.supplier) in (upper(?)) )""".stripMargin
    val suppliersExclSQL = FingerpostWireEntry.supplierExclSQL(List("supplier"))
    suppliersExclSQL should matchSqlSnippet(
      expectedClause = supplierExclClause,
      expectedParams = List("supplier")
    )
  }

  behavior of "category code SQL helpers"
  it should "create the correct sql snippet for categoryCodesIncl" in {
    val categoryCodesSQL = FingerpostWireEntry.categoryCodeInclSQL(List("code"))
    categoryCodesSQL should matchSqlSnippet(
      expectedClause = "fm.category_codes && ?",
      expectedParams = List(List("code"))
    )
  }

  it should "create the correct sql snippet for categoryCodesExcl" in {
    val categoryExclClause =
      """NOT EXISTS ( SELECT FROM fingerpost_wire_entry categoryCodesExcl
            |WHERE fm.id = categoryCodesExcl.id
            |AND categoryCodesExcl.category_codes && ? )""".stripMargin

    val categoryCodesExcl =
      FingerpostWireEntry.categoryCodeExclSQL(List("code"))

    categoryCodesExcl should matchSqlSnippet(
      expectedClause = categoryExclClause,
      expectedParams = List(List("code"))
    )
  }

  behavior of "search term SQL helpers"
  it should "create the correct sql snippet for search term query when field is headline" in {
    val searchSQL = FingerpostWireEntry.simpleSearchSQL(
      SearchTerm.Simple("query", SearchField.Headline)
    )
    searchSQL should matchSqlSnippet(
      expectedClause =
        "websearch_to_tsquery('simple', lower(?)) @@ headline_tsv_simple",
      expectedParams = List("query")
    )
  }

  it should "create the correct sql snippet for search term query when field is body" in {
    val searchSQL = FingerpostWireEntry.simpleSearchSQL(
      SearchTerm.Simple("query", SearchField.BodyText)
    )
    searchSQL should matchSqlSnippet(
      expectedClause =
        "websearch_to_tsquery('simple', lower(?)) @@ body_text_tsv_simple",
      expectedParams = List("query")
    )
  }

  it should "create the correct sql snippet for search term query when field is slug" in {
    val searchSQL = FingerpostWireEntry.simpleSearchSQL(
      SearchTerm.Simple("query", SearchField.Slug)
    )
    searchSQL should matchSqlSnippet(
      expectedClause =
        "websearch_to_tsquery('simple', lower(?)) @@ slug_text_tsv_simple",
      expectedParams = List("query")
    )
  }

  it should "create the correct sql snippet for english term query" in {
    val searchSQL = FingerpostWireEntry.englishSearchSQL(English("query"))
    searchSQL should matchSqlSnippet(
      expectedClause =
        "websearch_to_tsquery('english', ?) @@ fm.combined_textsearch",
      expectedParams = List("query")
    )
  }

  behavior of "keywords SQL helpers"
  it should "create the correct sql snippet for keywordsIncl" in {
    val keywordSQL = FingerpostWireEntry.keywordsSQL(List("keyword"))
    keywordSQL should matchSqlSnippet(
      expectedClause = "(fm.content -> 'keywords') ??| ?",
      expectedParams = List(List("keyword"))
    )
  }

  it should "create the correct sql snippet for keywordExcl" in {
    val keywordExclClause =
      """NOT EXISTS ( SELECT FROM fingerpost_wire_entry keywordsExcl
          |WHERE fm.id = keywordsExcl.id
          |AND (keywordsExcl.content -> 'keywords') ??| ? )""".stripMargin
    val keywordExclSQL = FingerpostWireEntry.keywordsExclSQL(List("keyword"))
    keywordExclSQL should matchSqlSnippet(
      expectedClause = keywordExclClause,
      expectedParams = List(List("keyword"))
    )
  }

  behavior of "dataformatting SQL helpers"
  it should "create the correct sql snippet for hasDataFormatting set to true" in {
    val hasDataFormattingSQL = FingerpostWireEntry.dataFormattingSQL(true)
    hasDataFormattingSQL should matchSqlSnippet(
      expectedClause = "(fm.content->'dataformat') IS NOT NULL",
      expectedParams = List()
    )
  }

  it should "create the correct sql snippet for hasDataFormatting set to false" in {
    val hasDataFormattingSQL = FingerpostWireEntry.dataFormattingSQL(false)
    hasDataFormattingSQL should matchSqlSnippet(
      expectedClause = "(fm.content->'dataformat') IS NULL",
      expectedParams = List()
    )
  }
}
