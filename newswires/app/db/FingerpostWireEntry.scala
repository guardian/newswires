package db

import conf.SearchTerm.English
import conf.{
  AND,
  ComboTerm,
  OR,
  SearchField,
  SearchTerm,
  SearchTerms,
  SingleTerm
}
import db.CustomMappers.textArray
import io.circe.{Decoder, Encoder}
import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import models.{
  FilterParams,
  FingerpostWire,
  NextPage,
  NextPageId,
  QueryCursor,
  QueryParams,
  QueryResponse,
  SearchParams,
  UpdateType,
  UpdateTypeId
}
import play.api.Logging
import scalikejdbc._
import io.circe.parser._

import java.time.Instant

case class WireMaybeToolLinkAndCollection(
    wireEntry: FingerpostWireEntry,
    toolLink: Option[ToolLink],
    collection: Option[WireEntryForCollection]
)

case class FingerpostWireEntry(
    id: Long,
    supplier: String,
    externalId: String,
    ingestedAt: Instant,
    content: FingerpostWire,
    @deprecated composerId: Option[String],
    @deprecated composerSentBy: Option[String],
    categoryCodes: List[String],
    highlight: Option[String] = None,
    toolLinks: List[ToolLink] = Nil,
    s3Key: Option[String],
    precomputedCategories: List[String],
    collections: List[WireEntryForCollection] = Nil,
    imageUrls: List[String] = Nil
)

object FingerpostWireEntry
    extends SQLSyntaxSupport[FingerpostWireEntry]
    with Logging {

  implicit val jsonEncoder: Encoder[FingerpostWireEntry] =
    deriveEncoder[FingerpostWireEntry].mapJson(_.dropNullValues)

  implicit val jsonDecoder: Decoder[FingerpostWireEntry] =
    deriveDecoder[FingerpostWireEntry]

  override val columns =
    Seq(
      "id",
      "external_id",
      "ingested_at",
      "content",
      "supplier",
      "composer_id",
      "composer_sent_by",
      "category_codes",
      "combined_textsearch",
      "highlight",
      "s3_key",
      "precomputed_categories"
    )
  val syn = this.syntax("fm")

  private lazy val selectAllStatement = sqls"""
    |   ${FingerpostWireEntry.syn.result.id},
    |   ${FingerpostWireEntry.syn.result.externalId},
    |   ${FingerpostWireEntry.syn.result.ingestedAt},
    |   ${FingerpostWireEntry.syn.result.supplier},
    |   ${FingerpostWireEntry.syn.result.composerId},
    |   ${FingerpostWireEntry.syn.result.composerSentBy},
    |   ${FingerpostWireEntry.syn.result.categoryCodes},
    |   ${FingerpostWireEntry.syn.result.content},
    |   ${FingerpostWireEntry.syn.result.s3Key},
    |   ${FingerpostWireEntry.syn.result.precomputedCategories}
    |""".stripMargin

  def fromDb(
      fm: ResultName[FingerpostWireEntry]
  )(rs: WrappedResultSet): Option[FingerpostWireEntry] = {
    (for {
      fingerpostContent <- decode[FingerpostWire](
        rs.string(fm.content)
      )
      maybeCategoryCodes = rs.arrayOpt(fm.categoryCodes)
      categoryCodes = maybeCategoryCodes match {
        case Some(array) =>
          array.getArray
            .asInstanceOf[Array[String]]
            .toList
        case None => Nil
      }
      preComputedCategories = rs.arrayOpt(fm.precomputedCategories) match {
        case Some(array) =>
          array.getArray.asInstanceOf[Array[String]].toList
        case None => Nil
      }
    } yield {
      FingerpostWireEntry(
        id = rs.long(fm.id),
        supplier = rs.string(fm.supplier),
        externalId = rs.string(fm.externalId),
        ingestedAt = rs.zonedDateTime(fm.ingestedAt).toInstant,
        content = fingerpostContent,
        composerId = rs.stringOpt(fm.composerId),
        composerSentBy = rs.stringOpt(fm.composerSentBy),
        categoryCodes = categoryCodes,
        highlight = rs
          .stringOpt(fm.column("highlight"))
          .filter(
            _.contains("<mark>")
          ), // sometimes PG will return some unmarked text, and sometimes will return NULL - I can't figure out which and when
        s3Key = rs.stringOpt(fm.s3Key),
        precomputedCategories = preComputedCategories
      )
    }).left
      .map(error => {
        logger.error(
          s"Error parsing record ${rs.long(fm.id)}: ${error.getMessage}",
          error.getCause
        )
      })
      .toOption
  }

  private def clamp(low: Int, x: Int, high: Int): Int =
    math.min(math.max(x, low), high)

  private[db] def buildHighlightsClause(
      maybeFreeTextQuery: Option[English],
      highlightAll: Boolean = false
  ): SQLSyntax = {
    maybeFreeTextQuery match {
      case Some(SearchTerm.English(queryString)) =>
        val highlightSettings =
          if (highlightAll)
            "HighlightAll=true, StartSel=<mark>, StopSel=</mark>"
          else "StartSel=<mark>, StopSel=</mark>"
        sqls"ts_headline('english', ${syn.content}->>'body_text', websearch_to_tsquery('english', $queryString), $highlightSettings) AS ${syn.resultName.highlight}"
      case _ => sqls"'' AS ${syn.resultName.highlight}"
    }
  }

  private[db] def buildSingleGetQuery(
      id: Int,
      maybeFreeTextQuery: Option[English]
  ): SQLSyntax = {
    val highlightsClause =
      buildHighlightsClause(maybeFreeTextQuery, highlightAll = true)

    sqls"""| SELECT $selectAllStatement, $highlightsClause, ${ToolLink.selectAllStatement}, ${Collection.selectAllStatement}, ${WireEntryForCollection.selectAllStatement}
           | FROM ${FingerpostWireEntry as syn}
           | LEFT JOIN ${ToolLink as ToolLink.syn}
           |   ON ${syn.id} = ${ToolLink.syn.wireId}
           | LEFT JOIN ${WireEntryForCollection as WireEntryForCollection.syn}
           |   ON ${WireEntryForCollection.syn.wireEntryId} = ${syn.id}
           | LEFT JOIN ${Collection as Collection.syn}
           |   ON ${Collection.syn.id} = ${WireEntryForCollection.syn.collectionId}
           | WHERE ${FingerpostWireEntry.syn.id} = $id
           |""".stripMargin
  }

  def get(
      id: Int,
      maybeFreeTextQuery: Option[English]
  ): Option[FingerpostWireEntry] = DB readOnly { implicit session =>
    sql"${buildSingleGetQuery(id, maybeFreeTextQuery)}"
      .one(FingerpostWireEntry.fromDb(syn.resultName))
      .toManies(
        ToolLink.opt(ToolLink.syn.resultName),
        WireEntryForCollection.opt(
          WireEntryForCollection.syn.resultName
        )
      )
      .map { (wire, toolLinks, collections) =>
        wire.map(
          _.copy(toolLinks = toolLinks.toList, collections = collections.toList)
        )
      }
      .single()
      .flatten
  }

  object Filters {
    private def exclusionCondition(
        alias: QuerySQLSyntaxProvider[SQLSyntaxSupport[
          FingerpostWireEntry
        ], FingerpostWireEntry]
    )(innerClause: SQLSyntax) = {
      // unpleasant, but the sort of trick you need to pull
      // because "NOT IN (...)" doesn't hit an index.
      // https://stackoverflow.com/a/19364694

      sqls"""|NOT EXISTS (
             |  SELECT FROM ${FingerpostWireEntry as alias}
             |  WHERE ${syn.id} = ${alias.id}
             |    AND $innerClause
             |)""".stripMargin
    }

    private def supplierCondition(
        alias: QuerySQLSyntaxProvider[SQLSyntaxSupport[
          FingerpostWireEntry
        ], FingerpostWireEntry],
        suppliers: List[String]
    ) = {
      sqls.in(
        sqls"upper(${alias.supplier})",
        suppliers.map(feed => sqls"upper($feed)")
      )
    }

    private def keywordCondition(
        alias: QuerySQLSyntaxProvider[SQLSyntaxSupport[
          FingerpostWireEntry
        ], FingerpostWireEntry],
        keywords: List[String]
    ): SQLSyntax =
      // "??|" is actually the "?|" operator - doubled to prevent the
      // SQL driver from treating it as a placeholder for a parameter
      // https://jdbc.postgresql.org/documentation/query/#using-the-statement-or-preparedstatement-interface
      sqls"(${alias.content} -> 'keywords') ??| ${textArray(keywords)}"

    private def categoryCodeConditions(
        alias: QuerySQLSyntaxProvider[SQLSyntaxSupport[
          FingerpostWireEntry
        ], FingerpostWireEntry],
        categoryCodes: List[String]
    ) = {
      sqls"${alias.categoryCodes} && ${textArray(categoryCodes)}"
    }

    private def preComputedCategoriesConditions(
        alias: QuerySQLSyntaxProvider[SQLSyntaxSupport[
          FingerpostWireEntry
        ], FingerpostWireEntry],
        preComputedCategories: List[String]
    ) = {
      sqls"${alias.precomputedCategories} && ${textArray(preComputedCategories)}"
    }

    lazy val supplierSQL: List[String] => SQLSyntax =
      (sourceFeeds: List[String]) => supplierCondition(syn, sourceFeeds)

    lazy val supplierExclSQL =
      (sourceFeedsExcl: List[String]) => {
        val se = syntax("sourceFeedsExcl")
        exclusionCondition(se)(supplierCondition(se, sourceFeedsExcl))
      }

    lazy val simpleSearchSQL =
      (searchTerm: SearchTerm.Simple) => {
        val tsvectorColumn = searchTerm.field match {
          case SearchField.Headline => "headline_tsv_simple"
          case SearchField.BodyText => "body_text_tsv_simple"
          case SearchField.Slug     => "slug_text_tsv_simple"
        }
        sqls"websearch_to_tsquery('simple', lower(${searchTerm.query})) @@ ${SQLSyntax.createUnsafely(tsvectorColumn)}" // This is so we use headline_tsv_simple instead of 'headline_tsv_simple' in the query
      }

    lazy val englishSearchSQL =
      (searchTerm: SearchTerm.English) => {
        sqls"websearch_to_tsquery('english', ${searchTerm.query}) @@ ${FingerpostWireEntry.syn.column("combined_textsearch")}"
      }

    lazy val searchTermSql = (searchTerm: SearchTerm) =>
      searchTerm match {
        case SearchTerm.Simple(query, field) =>
          simpleSearchSQL(SearchTerm.Simple(query, field))
        case SearchTerm.English(query) =>
          englishSearchSQL(SearchTerm.English(query))
      }

    lazy val searchTermsSql = (searchTerms: List[SearchTerm]) =>
      searchTerms.map(searchTermSql)

    val searchQuerySqlCombined = (searchTerms: SearchTerms) => {
      searchTerms match {
        case ComboTerm(terms, AND) =>
          sqls.joinWithAnd(Filters.searchTermsSql(terms): _*)
        case ComboTerm(terms, OR) =>
          sqls.joinWithOr(Filters.searchTermsSql(terms): _*)
        case SingleTerm(term) => Filters.searchTermSql(term)
      }
    }

    lazy val keywordsSQL =
      (keywords: List[String]) => keywordCondition(syn, keywords)

    lazy val keywordsExclSQL =
      (keywords: List[String]) => {
        val ke = syntax("keywordsExcl")
        exclusionCondition(ke)(keywordCondition(ke, keywords))
      }

    lazy val categoryCodeInclSQL =
      (categoryCodes: List[String]) =>
        categoryCodeConditions(syn, categoryCodes)

    lazy val categoryCodeExclSQL =
      (categoryCodesExcl: List[String]) => {
        val cce = syntax("categoryCodesExcl")
        exclusionCondition(cce)(categoryCodeConditions(cce, categoryCodesExcl))
      }

    lazy val dataFormattingSQL =
      (hasDataFormatting: Boolean) => {
        if (hasDataFormatting) sqls"(${syn.content}->'dataformat') IS NOT NULL"
        else sqls"(${syn.content}->'dataformat') IS NULL"
      }

    lazy val beforeIdSQL =
      (beforeId: Int) => sqls"${FingerpostWireEntry.syn.id} < $beforeId"

    lazy val sinceIdSQL =
      (sinceId: Int) => sqls"${FingerpostWireEntry.syn.id} > $sinceId"

    lazy val beforeTimeStampSQL =
      (endDate: String, column: TimeStampColumn) =>
        sqls"${column.columnName} <= CAST($endDate AS timestamptz)"

    lazy val afterTimeStampSQL =
      (startDate: String, column: TimeStampColumn) =>
        sqls"${column.columnName} >= CAST($startDate AS timestamptz)"

    lazy val dateRangeSQL =
      (start: Option[String], end: Option[String]) => {
        (start, end) match {
          case (Some(startDate), Some(endDate)) =>
            Some(
              sqls"${FingerpostWireEntry.syn.ingestedAt} BETWEEN CAST($startDate AS timestamptz) AND CAST($endDate AS timestamptz)"
            )
          case (Some(startDate), None) =>
            Some(
              afterTimeStampSQL(startDate, IngestedAtTime)
            )
          case (None, Some(endDate)) =>
            Some(
              beforeTimeStampSQL(endDate, IngestedAtTime)
            )
          case _ => None
        }
      }

    lazy val preComputedCategoriesSQL = (preComputedCategories: List[String]) =>
      {
        preComputedCategoriesConditions(syn, preComputedCategories)
      }

    lazy val preComputedCategoriesExclSQL =
      (preComputedCategories: List[String]) => {
        val pce = syntax("preComputedCategoriesExcl")
        exclusionCondition(pce)(
          preComputedCategoriesConditions(pce, preComputedCategories)
        )
      }

    lazy val collectionIdSQL = (collectionId: Int) =>
      sqls"${Collection.syn.id} = ${collectionId}"
  }

  private def andAll(clauses: List[SQLSyntax]): Option[SQLSyntax] =
    clauses match {
      case Nil => None
      case xs  => Some(sqls.joinWithAnd(xs: _*))
    }

  private def orAll(clauses: List[SQLSyntax]): Option[SQLSyntax] =
    clauses match {
      case Nil => None
      case xs  => Some(sqls"(${sqls.joinWithOr(xs: _*)})")
    }

  private[db] def filtersBuilder(
      filters: FilterParams
  ): Option[SQLSyntax] = {
    val sourceFeedsQuery: Option[SQLSyntax] = filters.suppliersIncl match {
      case Nil         => None
      case sourceFeeds => Some(Filters.supplierSQL(sourceFeeds))
    }

    val sourceFeedsExclQuery: Option[SQLSyntax] = filters.suppliersExcl match {
      case Nil             => None
      case sourceFeedsExcl => Some(Filters.supplierExclSQL(sourceFeedsExcl))
    }

    val searchQuery: Option[SQLSyntax] =
      filters.searchTerms.map(Filters.searchQuerySqlCombined)

    val keywordsQuery = filters.keywordIncl match {
      case Nil      => None
      case keywords => Some(Filters.keywordsSQL(keywords))
    }

    val keywordsExclQuery = filters.keywordExcl match {
      case Nil      => None
      case keywords => Some(Filters.keywordsExclSQL(keywords))
    }

    val categoryCodesInclQuery = filters.categoryCodesIncl match {
      case Nil           => None
      case categoryCodes => Some(Filters.categoryCodeInclSQL(categoryCodes))
    }

    val categoryCodesExclQuery = filters.categoryCodesExcl match {
      case Nil               => None
      case categoryCodesExcl =>
        Some(Filters.categoryCodeExclSQL(categoryCodesExcl))
    }

    val hasDataFormattingQuery = filters.hasDataFormatting match {
      case Some(dataFormatting) =>
        Some(Filters.dataFormattingSQL(dataFormatting))
      case None => None
    }

    val preComputedCategoriesQuery = filters.preComputedCategories match {
      case Nil              => None
      case presetCategories =>
        Some(Filters.preComputedCategoriesSQL(presetCategories))
    }

    val preComputedCategoriesExclQuery =
      filters.preComputedCategoriesExcl match {
        case Nil                  => None
        case presetCategoriesExcl =>
          Some(Filters.preComputedCategoriesExclSQL(presetCategoriesExcl))
      }

    val collectionIdQuery = filters.collectionId match {
      case Some(collectionId) => Some(Filters.collectionIdSQL(collectionId))
      case None               => None
    }

    val clauses = List(
      keywordsQuery,
      categoryCodesInclQuery,
      keywordsExclQuery,
      searchQuery,
      sourceFeedsQuery,
      sourceFeedsExclQuery,
      categoryCodesExclQuery,
      hasDataFormattingQuery,
      preComputedCategoriesQuery,
      preComputedCategoriesExclQuery,
      collectionIdQuery
    ).flatten
    andAll(clauses)
  }

  private[db] def presetsBuilder(
      presets: List[FilterParams]
  ): Option[SQLSyntax] = {
    val andClauses = presets.flatMap(filtersBuilder)
    orAll(andClauses)
  }

  private[db] def queryCursorQuery(
      queryCursor: QueryCursor,
      timeStampColumn: TimeStampColumn
  ): Option[SQLSyntax] = {
    andAll(
      List(
        queryCursor.maybeBeforeTimeStamp.map(
          Filters.beforeTimeStampSQL(_, timeStampColumn)
        ),
        queryCursor.maybeAfterTimeStamp.map(u =>
          Filters.afterTimeStampSQL(u.sinceTimeStamp, timeStampColumn)
        ),
        queryCursor.maybeBeforeId.map(Filters.beforeIdSQL(_)),
        queryCursor.maybeSinceId.map(u => Filters.sinceIdSQL(u.sinceId))
      ).flatten
    )
  }
  private[db] def buildWhereClause(
      searchParams: SearchParams,
      queryCursor: QueryCursor,
      queryOrdering: TimeStampColumn,
      searchPresets: List[FilterParams] = Nil,
      negatedSearchPresets: List[FilterParams] = Nil
  ): SQLSyntax = {

    val dataOnlyWhereClauses = queryCursorQuery(queryCursor, queryOrdering)
    val dateRangeQuery = Filters.dateRangeSQL(
      searchParams.dateRange.start,
      searchParams.dateRange.end
    )
    val customSearchClauses = filtersBuilder(searchParams.filters)
    val presetSearchClauses = presetsBuilder(searchPresets)
    val negatedPresetSearchClauses =
      presetsBuilder(negatedSearchPresets).map(clause => sqls"NOT $clause")

    val allClauses = List(
      dateRangeQuery,
      customSearchClauses,
      presetSearchClauses,
      negatedPresetSearchClauses,
      dataOnlyWhereClauses
    ).flatten

    allClauses match {
      case Nil     => sqls"true"
      case clauses => sqls.joinWithAnd(clauses: _*)
    }
  }

  private[db] def decideSortDirection(
      maybeAfterTimeStamp: Option[UpdateType],
      maybeSinceId: Option[UpdateTypeId]
  ): SQLSyntax = {
    (maybeAfterTimeStamp, maybeSinceId) match {
      case (Some(NextPage(_)), _)   => sqls"ASC"
      case (_, Some(NextPageId(_))) => sqls"ASC"
      case _                        => sqls"DESC"
    }
  }

  private[db] def marshallJoinedRowsToWireEntries(
      rows: List[
        (
            Option[FingerpostWireEntry],
            Option[ToolLink],
            Option[WireEntryForCollection]
        )
      ]
  ): List[FingerpostWireEntry] = {
    rows
      .collect({ case (Some(wire), toolLinkOpt, collectionOpt) =>
        WireMaybeToolLinkAndCollection(wire, toolLinkOpt, collectionOpt)
      })
      .groupBy(t => t.wireEntry)
      .map({ case (wire, wireRelations) =>
        wire.copy(
          toolLinks = wireRelations.flatMap(_.toolLink).distinct,
          collections = wireRelations.flatMap(_.collection).distinct
        )
      })
      .toList
  }

  private[db] def buildSearchQuery(
      queryParams: QueryParams,
      whereClause: SQLSyntax,
      pageSize: Int = 30
  ): SQL[Nothing, NoExtractor] = {
    val effectivePageSize = clamp(0, pageSize, 250)

    val maybeAfterTimeStamp = queryParams.queryCursor.maybeAfterTimeStamp
    val maybeSinceId = queryParams.queryCursor.maybeSinceId

    val highlightsClause = buildHighlightsClause(queryParams.maybeSearchTerm)

    val orderByClause =
      sqls"ORDER BY ${queryParams.timeStampColumn.columnName} ${decideSortDirection(maybeAfterTimeStamp, maybeSinceId)}"

    sql"""| SELECT ${FingerpostWireEntry.selectAllStatement}, ${ToolLink.syn.result.*}, ${Collection.selectAllStatement}, ${WireEntryForCollection.selectAllStatement}, $highlightsClause
          | FROM ${FingerpostWireEntry as FingerpostWireEntry.syn}
          | LEFT JOIN ${ToolLink as ToolLink.syn}
          |  ON ${syn.id} = ${ToolLink.syn.wireId}
          | LEFT JOIN ${WireEntryForCollection as WireEntryForCollection.syn}
          |   ON ${WireEntryForCollection.syn.wireEntryId} = ${syn.id}
          | LEFT JOIN ${Collection as Collection.syn}
          |   ON ${Collection.syn.id} = ${WireEntryForCollection.syn.collectionId}
          | WHERE $whereClause
          | $orderByClause
          | LIMIT $effectivePageSize
          | """.stripMargin
  }

  def query(
      queryParams: QueryParams
  ): QueryResponse = DB readOnly { implicit session =>
    val whereClause = buildWhereClause(
      queryParams.searchParams,
      queryParams.queryCursor,
      queryOrdering = queryParams.timeStampColumn,
      searchPresets =
        queryParams.searchPreset.map(_.searchParams).getOrElse(Nil),
      negatedSearchPresets =
        queryParams.searchPreset.map(_.negatedSearchParams).getOrElse(Nil)
    )

    val start = System.currentTimeMillis()

    val query = buildSearchQuery(
      queryParams = queryParams,
      whereClause = whereClause,
      pageSize = queryParams.pageSize
    )

    logger.info(s"QUERY: ${query.statement}; PARAMS: ${query.parameters}")
    val rows = query
      .map(rs => {
        val wireEntry = FingerpostWireEntry.fromDb(syn.resultName)(rs)
        val toolLinkOpt = ToolLink.opt(ToolLink.syn.resultName)(rs)
        val collectionOpt = WireEntryForCollection.opt(
          WireEntryForCollection.syn.resultName
        )(rs)
        (wireEntry, toolLinkOpt, collectionOpt)
      })
      .list()

    val results: List[FingerpostWireEntry] =
      marshallJoinedRowsToWireEntries(rows)

    val countQuery =
      sql"""| SELECT COUNT(*)
            | FROM ${FingerpostWireEntry as FingerpostWireEntry.syn}
            | LEFT JOIN ${ToolLink as ToolLink.syn}
            |  ON ${syn.id} = ${ToolLink.syn.wireId}
            | LEFT JOIN ${WireEntryForCollection as WireEntryForCollection.syn}
            |   ON ${WireEntryForCollection.syn.wireEntryId} = ${syn.id}
            | LEFT JOIN ${Collection as Collection.syn}
            |   ON ${Collection.syn.id} = ${WireEntryForCollection.syn.collectionId}
            | WHERE $whereClause
            | """.stripMargin

    logger.info(
      s"COUNT QUERY: ${countQuery.statement}; PARAMS: ${countQuery.parameters}"
    )

    val totalCount: Long = {
      countQuery.map(_.long(1)).single().getOrElse(0)
    }
    val finish = System.currentTimeMillis()
    logger.info(s"QUERY TIME: ${finish - start}")

    //    val keywordCounts = getKeywords(additionalWhereClauses =
//      commonWhereClauses
//    ) // TODO do this in parallel

    QueryResponse(
      results,
      totalCount /*, keywordCounts*/
    )
  }

  def getKeywords(
      maybeInLastHours: Option[Int] = None,
      maybeLimit: Option[Int] = None,
      additionalWhereClauses: List[SQLSyntax] = Nil
  ): Map[String, Int] = {
    DB readOnly { implicit session =>
      val innerWhereClause = additionalWhereClauses ++ maybeInLastHours
        .map(inLastHours =>
          sqls"ingested_at > now() - ($inLastHours::text || ' hours')::interval"
        ) match {
        case Nil        => sqls""
        case whereParts => sqls"WHERE ${sqls.joinWithAnd(whereParts: _*)}"
      }

      val limitClause = maybeLimit
        .map(limit => sqls"LIMIT $limit")
        .orElse(maybeInLastHours.map(_ => sqls"LIMIT 10"))
        .getOrElse(sqls"")
      sql"""| SELECT distinct keyword, count(*)
            | FROM (
            |     SELECT jsonb_array_elements_text(${FingerpostWireEntry.syn
             .column(
               "content"
             )} -> 'keywords') as keyword
            |     FROM ${FingerpostWireEntry as syn}
            |     $innerWhereClause
            | ) as all_keywords
            | GROUP BY keyword
            | ORDER BY "count" DESC
            | $limitClause
            | """.stripMargin
        .map(rs => rs.string("keyword") -> rs.int("count"))
        .list()
        .toMap // TODO would a list be better?
    }
  }
}
