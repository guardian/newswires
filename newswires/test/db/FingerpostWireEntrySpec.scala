package db

import conf.{AND, ComboTerm, OR, SearchField, SearchTerm, SingleTerm}
import io.circe.parser.decode
import helpers.SqlSnippetMatcher.matchSqlSnippet
import helpers.models
import org.scalatest.flatspec.AnyFlatSpec
import org.scalatest.matchers.should.Matchers
import io.circe.syntax.EncoderOps
import _root_.models.{
  DateRange,
  FilterParams,
  MostRecent,
  NextPage,
  NextPageId,
  QueryCursor,
  QueryParams,
  SearchParams
}
import conf.SearchTerm.{English, Simple}
import scalikejdbc.{scalikejdbcSQLInterpolationImplicitDef, sqls}

class FingerpostWireEntrySpec extends AnyFlatSpec with Matchers with models {

  val emptyFilterParams = FilterParams(
    searchTerms = None,
    keywordIncl = Nil,
    keywordExcl = Nil,
    suppliersIncl = Nil,
    suppliersExcl = Nil,
    categoryCodesIncl = Nil,
    categoryCodesExcl = Nil,
    hasDataFormatting = None
  )

  val emptyDateParams = DateRange(
    start = None,
    end = None
  )

  val emptySearchParams = SearchParams(emptyFilterParams, emptyDateParams)

  val emptyQueryCursor = QueryCursor(
    maybeBeforeTimeStamp = None,
    maybeAfterTimeStamp = None,
    maybeBeforeId = None,
    maybeSinceId = None
  )

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
          |   fm.s3_key as sk_on_fm,
          |   fm.precomputed_categories as pc_on_fm
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
    val whereClause =
      FingerpostWireEntry.buildWhereClause(
        emptySearchParams,
        emptyQueryCursor
      )

    whereClause should matchSqlSnippet(
      expectedClause = "true",
      expectedParams = Nil
    )
  }

  it should "apply beforeTimeStamp or afterTimeStamp even if no other custom search params are set" in {

    val whereClauseBeforeId =
      FingerpostWireEntry.buildWhereClause(
        emptySearchParams,
        emptyQueryCursor.copy(maybeBeforeTimeStamp =
          Some("2025-01-01T00:00:00Z")
        )
      )

    whereClauseBeforeId should matchSqlSnippet(
      expectedClause = "fm.ingested_at <= CAST(? AS timestamptz)",
      expectedParams = List("2025-01-01T00:00:00Z")
    )

    val whereClauseSinceId =
      FingerpostWireEntry.buildWhereClause(
        emptySearchParams,
        emptyQueryCursor.copy(maybeAfterTimeStamp =
          Some(NextPage("2025-01-01T00:00:00Z"))
        )
      )

    whereClauseSinceId should matchSqlSnippet(
      expectedClause = "fm.ingested_at >= CAST(? AS timestamptz)",
      expectedParams = List("2025-01-01T00:00:00Z")
    )
  }

  it should "apply beforeId or afterId even if no other custom search params are set" in {

    val whereClauseBeforeId =
      FingerpostWireEntry.buildWhereClause(
        emptySearchParams,
        emptyQueryCursor.copy(maybeBeforeId = Some(100))
      )

    whereClauseBeforeId should matchSqlSnippet(
      expectedClause = "fm.id < ?",
      expectedParams = List(100)
    )

    val whereClauseSinceId =
      FingerpostWireEntry.buildWhereClause(
        emptySearchParams,
        emptyQueryCursor.copy(maybeSinceId = Some(NextPageId(200)))
      )

    whereClauseSinceId should matchSqlSnippet(
      expectedClause = "fm.id > ?",
      expectedParams = List(200)
    )
  }

  it should "generate a where clause for a single field" in {
    val filterParams =
      FilterParams(searchTerms = Some(SingleTerm(SearchTerm.English("text1"))))
    val searchParams = emptySearchParams.copy(filters = filterParams)

    val whereClause =
      FingerpostWireEntry.buildWhereClause(
        searchParams,
        emptyQueryCursor
      )

    whereClause should matchSqlSnippet(
      "websearch_to_tsquery('english', ?) @@ fm.combined_textsearch",
      expectedParams = List("text1")
    )
  }

  it should "concatenate keywords and category codes with 'and'" in {
    val filterParams =
      FilterParams(
        searchTerms = None,
        keywordIncl = List("keyword1", "keyword2"),
        categoryCodesIncl = List("category1", "category2")
      )

    val searchParams = emptySearchParams.copy(filters = filterParams)

    val whereClause =
      FingerpostWireEntry.buildWhereClause(
        searchParams,
        emptyQueryCursor
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
    val dateRange = DateRange(
      start = Some("2025-03-10T00:00:00.000Z"),
      end = Some("2025-03-10T23:59:59.999Z")
    )
    val filters = FilterParams(
      searchTerms = Some(SingleTerm(SearchTerm.English("text1"))),
      suppliersExcl = List("supplier1", "supplier2"),
      keywordExcl = List("keyword1"),
      categoryCodesExcl = List("category1", "category2")
    )
    val searchParams =
      emptySearchParams.copy(dateRange = dateRange, filters = filters)
    val whereClause = FingerpostWireEntry.buildWhereClause(
      searchParams,
      emptyQueryCursor.copy(maybeBeforeTimeStamp = Some("2025-01-01T00:00:00Z"))
    )

    val rendered = sqls"${whereClause}".value
    rendered should include(
      "fm.ingested_at BETWEEN CAST(? AS timestamptz) AND CAST(? AS timestamptz)"
    )

    rendered should include(
      """and NOT EXISTS (
  SELECT FROM fingerpost_wire_entry keywordsExcl
  WHERE fm.id = keywordsExcl.id
    AND (keywordsExcl.content -> 'keywords') ??| ?
) """
    )

    rendered should include(
      """and websearch_to_tsquery('english', ?) @@ fm.combined_textsearch"""
    )

    rendered should include(
      """and NOT EXISTS (
  SELECT FROM fingerpost_wire_entry sourceFeedsExcl
  WHERE fm.id = sourceFeedsExcl.id
    AND  upper(sourceFeedsExcl.supplier) in (upper(?), upper(?))
)"""
    )
    rendered should include(
      """and NOT EXISTS (
  SELECT FROM fingerpost_wire_entry categoryCodesExcl
  WHERE fm.id = categoryCodesExcl.id
    AND categoryCodesExcl.category_codes && ?
)"""
    )

  }

  it should "Should cast a lower bound date only" in {
    val searchParams = emptySearchParams.copy(dateRange =
      emptyDateParams.copy(start = Some("2025-03-10T00:00:00.000Z"))
    )

    val whereClause =
      FingerpostWireEntry.buildWhereClause(
        searchParams,
        emptyQueryCursor
      )

    whereClause should matchSqlSnippet(
      "fm.ingested_at >= CAST(? AS timestamptz)",
      List("2025-03-10T00:00:00.000Z")
    )
  }

  it should "Should cast an upper bound date only" in {
    val searchParams = emptySearchParams.copy(dateRange =
      emptyDateParams.copy(end = Some("2025-03-10T23:59:59.999Z"))
    )
    val whereClause =
      FingerpostWireEntry.buildWhereClause(
        searchParams,
        emptyQueryCursor
      )

    whereClause should matchSqlSnippet(
      "fm.ingested_at <= CAST(? AS timestamptz)",
      List("2025-03-10T23:59:59.999Z")
    )
  }

  it should "should join complex search presets using 'or'" in {

    val filters = emptyFilterParams.copy(suppliersIncl = List("supplier1"))
    val searchParams =
      emptySearchParams.copy(filters = filters)

    val presetSearchParams1 = emptyFilterParams.copy(
      searchTerms = Some(
        SingleTerm(SearchTerm.Simple("News Summary", SearchField.Headline))
      ),
      suppliersIncl = List("REUTERS"),
      categoryCodesIncl = List("N2:GB")
    )

    val presetSearchParams2 = emptyFilterParams.copy(
      searchTerms = Some(SingleTerm(SearchTerm.Simple("soccer"))),
      suppliersIncl = List("AFP"),
      categoryCodesIncl = List("afpCat:SPO")
    )

    val customParamsClause = FingerpostWireEntry.buildWhereClause(
      searchParams,
      emptyQueryCursor
    )
    val preset1Clause = FingerpostWireEntry.buildWhereClause(
      emptySearchParams.copy(filters = presetSearchParams1),
      emptyQueryCursor
    )
    val preset2Clause = FingerpostWireEntry.buildWhereClause(
      emptySearchParams.copy(filters = presetSearchParams2),
      emptyQueryCursor
    )
    val whereClause = FingerpostWireEntry.buildWhereClause(
      searchParams,
      emptyQueryCursor,
      savedSearchParamList = List(presetSearchParams1, presetSearchParams2)
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

  it should "join negation presets using 'or'" in {

    val presetSearchParams1 = emptyFilterParams.copy(
      searchTerms = Some(
        SingleTerm(SearchTerm.Simple("News Summary", SearchField.Headline))
      ),
      suppliersIncl = List("REUTERS"),
      categoryCodesIncl = List("N2:GB")
    )

    val presetSearchParams2 = emptyFilterParams.copy(
      searchTerms = Some(SingleTerm(SearchTerm.Simple("soccer"))),
      suppliersIncl = List("AFP"),
      categoryCodesIncl = List("afpCat:SPO")
    )

    val preset1Clause = FingerpostWireEntry
      .buildWhereClause(
        emptySearchParams.copy(filters = presetSearchParams1),
        emptyQueryCursor
      )

    val preset2Clause = FingerpostWireEntry
      .buildWhereClause(
        emptySearchParams.copy(filters = presetSearchParams2),
        emptyQueryCursor
      )

    val whereClause =
      FingerpostWireEntry.buildWhereClause(
        emptySearchParams,
        emptyQueryCursor,
        savedSearchParamList = Nil,
        negatedSearchParamList = List(presetSearchParams1, presetSearchParams2)
      )

    whereClause should matchSqlSnippet(
      sqls"(NOT ($preset1Clause or $preset2Clause))",
      List(
        List("N2:GB"),
        "News Summary",
        "REUTERS",
        List("afpCat:SPO"),
        "soccer",
        "AFP"
      )
    )
  }

  it should "join complex search negation presets using 'and not'" in {

    val filters = emptyFilterParams.copy(suppliersIncl = List("supplier1"))
    val searchParams =
      emptySearchParams.copy(filters = filters)

    val presetSearchParams1 = emptyFilterParams.copy(
      searchTerms = Some(
        SingleTerm(
          SearchTerm.Simple("News Summary", SearchField.Headline)
        )
      ),
      suppliersIncl = List("REUTERS"),
      categoryCodesIncl = List(
        "N2:GB"
      )
    )
    val presetSearchParams2 = emptyFilterParams.copy(
      searchTerms = Some(SingleTerm(SearchTerm.Simple("soccer"))),
      suppliersIncl = List("AFP"),
      categoryCodesIncl = List("afpCat:SPO")
    )

    val customParamsClause = FingerpostWireEntry
      .buildWhereClause(
        searchParams,
        emptyQueryCursor
      )

    val preset1Clause = FingerpostWireEntry
      .buildWhereClause(
        emptySearchParams.copy(filters = presetSearchParams1),
        emptyQueryCursor
      )

    val preset2Clause = FingerpostWireEntry
      .buildWhereClause(
        emptySearchParams.copy(filters = presetSearchParams2),
        emptyQueryCursor
      )

    val whereClause =
      FingerpostWireEntry.buildWhereClause(
        searchParams,
        emptyQueryCursor,
        List(presetSearchParams1),
        List(presetSearchParams2)
      )

    whereClause should matchSqlSnippet(
      sqls"$customParamsClause and (($preset1Clause)) and  (NOT ($preset2Clause))",
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

    val dateRange = DateRange(
      start = Some("2025-03-10T00:00:00.000Z"),
      end = Some("2025-03-10T23:59:59.999Z")
    )
    val filters = emptyFilterParams.copy(searchTerms =
      Some(SingleTerm(SearchTerm.English("text1")))
    )
    val customParams = SearchParams(filters = filters, dateRange = dateRange)

    val textSearchWhereClause = FingerpostWireEntry
      .buildWhereClause(
        emptySearchParams.copy(filters = filters),
        emptyQueryCursor
      )

    val dateRangeWhereClause = FingerpostWireEntry
      .buildWhereClause(
        emptySearchParams.copy(dateRange = dateRange),
        emptyQueryCursor
      )

    val whereClause =
      FingerpostWireEntry.buildWhereClause(
        customParams,
        emptyQueryCursor
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

  val emptyQueryParams = QueryParams(
    searchParams = emptySearchParams,
    searchPreset = None,
    maybeSearchTerm = None,
    queryCursor = emptyQueryCursor
  )

  it should "order results by descending ingestion_at by default" in {

    val whereClause = sqls""
    val query =
      FingerpostWireEntry.buildSearchQuery(emptyQueryParams, whereClause)

    query.statement should include("ORDER BY fm.ingested_at DESC")
  }

  it should "order results by descending ingestion_at when using MostRecent update type with maybeafterTimeStamp" in {
    val queryParams = emptyQueryParams.copy(queryCursor =
      emptyQueryCursor.copy(maybeAfterTimeStamp =
        Some(MostRecent("2025-01-01T00:00:00Z"))
      )
    )
    val whereClause = sqls""
    val query = FingerpostWireEntry.buildSearchQuery(queryParams, whereClause)

    query.statement should include("ORDER BY fm.ingested_at DESC")
  }

  it should "order results by *ascending* ingestion_at when using NextPage update type with maybeafterTimeStamp" in {
    val queryParams = emptyQueryParams.copy(queryCursor =
      emptyQueryCursor.copy(maybeAfterTimeStamp =
        Some(NextPage("2025-01-01T00:00:00Z"))
      )
    )
    val whereClause = sqls""
    val query = FingerpostWireEntry.buildSearchQuery(queryParams, whereClause)

    query.statement should include("ORDER BY fm.ingested_at ASC")
  }

  it should "order results by *ascending* ingestion_at when using NextPageId update type with maybeSinceId" in {
    val queryParams =
      emptyQueryParams.copy(queryCursor =
        emptyQueryCursor.copy(maybeSinceId = Some(NextPageId(100)))
      )
    val whereClause = sqls""
    val query = FingerpostWireEntry.buildSearchQuery(queryParams, whereClause)

    query.statement should include("ORDER BY fm.ingested_at ASC")
  }

  behavior of "FingerpostWireEntry.filtersBuilder"

  it should "return an empty list when no filters are set" in {
    val snippets = FingerpostWireEntry.filtersBuilder(emptyFilterParams)
    snippets shouldEqual None
  }

  it should "create the correct sql snippet with one parameter defined" in {
    val supplierClause = " upper(fm.supplier) in (upper(?))"
    val suppliersInc = emptyFilterParams.copy(suppliersIncl = List("supplier"))
    val snippets = FingerpostWireEntry.filtersBuilder(suppliersInc)
    snippets.get should matchSqlSnippet(
      expectedClause = supplierClause,
      expectedParams = List("supplier")
    )
  }

  it should "create the correct sql snippet with multiple parameters defined" in {
    val categoryCodesIncl =
      emptyFilterParams
        .copy(suppliersIncl = List("supplier"))
        .copy(categoryCodesIncl = List("code"))
    val snippets = FingerpostWireEntry.filtersBuilder(categoryCodesIncl)

    val rendered = sqls"${snippets.get}".value
    rendered should include("fm.category_codes && ?")
    rendered should include("upper(fm.supplier)")
  }

  it should "combine all SQL clauses when all filters are set" in {
    val fullParams = FilterParams(
      searchTerms = Some(
        ComboTerm(
          List(
            SearchTerm.English("query"),
            SearchTerm.Simple("simple text", SearchField.BodyText)
          ),
          AND
        )
      ),
      keywordIncl = List("kw1"),
      keywordExcl = List("kw2"),
      suppliersIncl = List("s1"),
      suppliersExcl = List("s2"),
      categoryCodesIncl = List("c1"),
      categoryCodesExcl = List("c2"),
      hasDataFormatting = Some(true),
      preComputedCategories = List("p1"),
      preComputedCategoriesExcl = List("p2")
    )

    val snippets = FingerpostWireEntry.filtersBuilder(fullParams)
    val rendered = sqls"${snippets.get}".value

    rendered should include("(fm.content -> 'keywords')")
    rendered should include("fm.category_codes &&")
    rendered should include("(keywordsExcl.content -> 'keywords')")
    rendered should include(
      "websearch_to_tsquery('english', ?) @@ fm.combined_textsearch and websearch_to_tsquery('simple', lower(?)) @@ body_text_tsv_simple)"
    )
    rendered should include("upper(fm.supplier) in")
    rendered should include("upper(sourceFeedsExcl.supplier) in")
    rendered should include("categoryCodesExcl.category_codes &&")
    rendered should include("(fm.content->'dataformat') IS NOT NULL")
    rendered should include("fm.precomputed_categories &&")
    rendered should include(
      "preComputedCategoriesExcl.precomputed_categories &&"
    )
  }

  behavior of "Filters"

  behavior of "time stamp filters"
  it should "create the correct sql for beforeTimeStamp" in {
    val beforeIdSQL =
      FingerpostWireEntry.Filters.beforeTimeStampSQL("2025-01-01T00:00:00Z")
    beforeIdSQL should matchSqlSnippet(
      expectedClause =
        sqls"${FingerpostWireEntry.syn.ingestedAt} <= CAST(? AS timestamptz)",
      expectedParams = List("2025-01-01T00:00:00Z")
    )
  }

  it should "create the correct sql for sinceTimeStamp" in {
    val maybeafterTimeStamp =
      FingerpostWireEntry.Filters.afterTimeStampSQL("2025-01-01T00:00:00Z")
    maybeafterTimeStamp should matchSqlSnippet(
      expectedClause =
        sqls"${FingerpostWireEntry.syn.ingestedAt} >= CAST(? AS timestamptz)",
      expectedParams = List("2025-01-01T00:00:00Z")
    )
  }

  behavior of "id filters"
  it should "create the correct sql for beforeId" in {
    val beforeIdSQL = FingerpostWireEntry.Filters.beforeIdSQL(1)
    beforeIdSQL should matchSqlSnippet(
      expectedClause = sqls"${FingerpostWireEntry.syn.id} < ?",
      expectedParams = List(1)
    )
  }

  it should "create the correct sql for sinceId" in {
    val sinceIdSQL = FingerpostWireEntry.Filters.sinceIdSQL(1)
    sinceIdSQL should matchSqlSnippet(
      expectedClause = sqls"${FingerpostWireEntry.syn.id} > ?",
      expectedParams = List(1)
    )
  }

  behavior of "date range filters"
  it should "create the correct sql filters for start date set" in {
    val startSQL = FingerpostWireEntry.Filters
      .dateRangeSQL(Some("2025-10-16T09:25:32Z"), None)
      .get
    startSQL should matchSqlSnippet(
      expectedClause =
        sqls"${FingerpostWireEntry.syn.ingestedAt} >= CAST(? AS timestamptz)",
      expectedParams = List("2025-10-16T09:25:32Z")
    )
  }

  it should "create the correct sql filters for end date set" in {
    val endSQL = FingerpostWireEntry.Filters
      .dateRangeSQL(None, Some("2025-10-16T09:25:32Z"))
      .get
    endSQL should matchSqlSnippet(
      expectedClause =
        sqls"${FingerpostWireEntry.syn.ingestedAt} <= CAST(? AS timestamptz)",
      expectedParams = List("2025-10-16T09:25:32Z")
    )
  }

  it should "create the correct sql filters for start and end date set" in {
    val rangeSQL = FingerpostWireEntry.Filters
      .dateRangeSQL(Some("2025-10-15T09:25:32Z"), Some("2025-10-16T09:25:32Z"))
      .get
    rangeSQL should matchSqlSnippet(
      expectedClause =
        sqls"${FingerpostWireEntry.syn.ingestedAt} BETWEEN CAST(? AS timestamptz) AND CAST(? AS timestamptz)",
      expectedParams = List("2025-10-15T09:25:32Z", "2025-10-16T09:25:32Z")
    )
  }

  it should "be none when both start and end are none" in {
    FingerpostWireEntry.Filters.dateRangeSQL(None, None) shouldBe None
  }

  behavior of "supplier SQL helpers"
  it should "create the correct sql for suppliers" in {
    val supplierSQL = FingerpostWireEntry.Filters.supplierSQL(List("supplier"))
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
    val suppliersExclSQL =
      FingerpostWireEntry.Filters.supplierExclSQL(List("supplier"))
    suppliersExclSQL should matchSqlSnippet(
      expectedClause = supplierExclClause,
      expectedParams = List("supplier")
    )
  }

  behavior of "category code SQL helpers"
  it should "create the correct sql snippet for categoryCodesIncl" in {
    val categoryCodesSQL =
      FingerpostWireEntry.Filters.categoryCodeInclSQL(List("code"))
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
      FingerpostWireEntry.Filters.categoryCodeExclSQL(List("code"))

    categoryCodesExcl should matchSqlSnippet(
      expectedClause = categoryExclClause,
      expectedParams = List(List("code"))
    )
  }

  behavior of "precomputed category codes SQL"
  it should "create the correct sql snippets for precomputedCategories" in {
    val preComputedCategoriesSQL =
      FingerpostWireEntry.Filters.preComputedCategoriesSQL(List("category"))
    preComputedCategoriesSQL should matchSqlSnippet(
      expectedClause = "fm.precomputed_categories && ?",
      expectedParams = List(List("category"))
    )
  }
  it should "create the correct sql snippet for precomputedCategoriesExcl" in {
    val precomputedCategoriesExclClause =
      """NOT EXISTS ( SELECT FROM fingerpost_wire_entry preComputedCategoriesExcl
        |WHERE fm.id = preComputedCategoriesExcl.id
        |AND preComputedCategoriesExcl.precomputed_categories && ? )""".stripMargin

    val precomputedCategoriesExcl =
      FingerpostWireEntry.Filters.preComputedCategoriesExclSQL(List("category"))

    precomputedCategoriesExcl should matchSqlSnippet(
      expectedClause = precomputedCategoriesExclClause,
      expectedParams = List(List("category"))
    )
  }
  behavior of "search term SQL helpers"
  it should "create the correct sql snippet for search term query when field is headline" in {
    val searchSQL = FingerpostWireEntry.Filters.simpleSearchSQL(
      SearchTerm.Simple("query", SearchField.Headline)
    )
    searchSQL should matchSqlSnippet(
      expectedClause =
        "websearch_to_tsquery('simple', lower(?)) @@ headline_tsv_simple",
      expectedParams = List("query")
    )
  }

  it should "create the correct sql snippet for search term query when field is body" in {
    val searchSQL = FingerpostWireEntry.Filters.simpleSearchSQL(
      SearchTerm.Simple("query", SearchField.BodyText)
    )
    searchSQL should matchSqlSnippet(
      expectedClause =
        "websearch_to_tsquery('simple', lower(?)) @@ body_text_tsv_simple",
      expectedParams = List("query")
    )
  }

  it should "create the correct sql snippet for search term query when field is slug" in {
    val searchSQL = FingerpostWireEntry.Filters.simpleSearchSQL(
      SearchTerm.Simple("query", SearchField.Slug)
    )
    searchSQL should matchSqlSnippet(
      expectedClause =
        "websearch_to_tsquery('simple', lower(?)) @@ slug_text_tsv_simple",
      expectedParams = List("query")
    )
  }

  it should "create the correct sql snippet for english term query" in {
    val searchSQL =
      FingerpostWireEntry.Filters.englishSearchSQL(English("query"))
    searchSQL should matchSqlSnippet(
      expectedClause =
        "websearch_to_tsquery('english', ?) @@ fm.combined_textsearch",
      expectedParams = List("query")
    )
  }

  behavior of "search terms combined SQL helpers"
  it should "create the correct SQL for a singular search term" in {
    val searchSQL = FingerpostWireEntry.Filters.searchQuerySqlCombined(
      SingleTerm(English("query"))
    )
    searchSQL should matchSqlSnippet(
      expectedClause =
        "websearch_to_tsquery('english', ?) @@ fm.combined_textsearch",
      expectedParams = List("query")
    )
  }
  it should "create the correct SQL for a combo or term" in {
    val searchSQL = FingerpostWireEntry.Filters.searchQuerySqlCombined(
      ComboTerm(List(English("english"), Simple("simple")), OR)
    )

    searchSQL should matchSqlSnippet(
      expectedClause =
        "websearch_to_tsquery('english', ?) @@ fm.combined_textsearch or " +
          "websearch_to_tsquery('simple', lower(?)) @@ body_text_tsv_simple",
      expectedParams = List("english", "simple")
    )
  }
  it should "create the correct SQL for a combo and term" in {
    val searchSQL = FingerpostWireEntry.Filters.searchQuerySqlCombined(
      ComboTerm(List(English("english"), Simple("simple")), AND)
    )

    searchSQL should matchSqlSnippet(
      expectedClause =
        "websearch_to_tsquery('english', ?) @@ fm.combined_textsearch and " +
          "websearch_to_tsquery('simple', lower(?)) @@ body_text_tsv_simple",
      expectedParams = List("english", "simple")
    )
  }
  behavior of "keywords SQL helpers"
  it should "create the correct sql snippet for keywordsIncl" in {
    val keywordSQL = FingerpostWireEntry.Filters.keywordsSQL(List("keyword"))
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
    val keywordExclSQL =
      FingerpostWireEntry.Filters.keywordsExclSQL(List("keyword"))
    keywordExclSQL should matchSqlSnippet(
      expectedClause = keywordExclClause,
      expectedParams = List(List("keyword"))
    )
  }

  behavior of "dataformatting SQL helpers"
  it should "create the correct sql snippet for hasDataFormatting set to true" in {
    val hasDataFormattingSQL =
      FingerpostWireEntry.Filters.dataFormattingSQL(true)
    hasDataFormattingSQL should matchSqlSnippet(
      expectedClause = "(fm.content->'dataformat') IS NOT NULL",
      expectedParams = List()
    )
  }

  it should "create the correct sql snippet for hasDataFormatting set to false" in {
    val hasDataFormattingSQL =
      FingerpostWireEntry.Filters.dataFormattingSQL(false)
    hasDataFormattingSQL should matchSqlSnippet(
      expectedClause = "(fm.content->'dataformat') IS NULL",
      expectedParams = List()
    )
  }
}
