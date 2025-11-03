package db

import conf.{SearchField, SearchTerm}
import db.CustomMappers.textArray
import io.circe.{Decoder, Encoder}
import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import models.{
  FingerpostWire,
  NextPage,
  QueryParams,
  QueryResponse,
  SearchParams
}
import play.api.Logging
import scalikejdbc._
import io.circe.parser._

import java.time.Instant

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
    precomputedCategories: List[String]
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

  private def replaceToolLinkUserWithYou(
      requestingUser: Option[String]
  )(toolLink: ToolLink): ToolLink = {
    requestingUser match {
      case Some(username) if username == toolLink.sentBy =>
        toolLink.copy(sentBy = "you")
      case _ => toolLink
    }
  }

  private[db] def buildHighlightsClause(
      maybeFreeTextQuery: Option[SearchTerm],
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
      maybeFreeTextQuery: Option[SearchTerm]
  ): SQLSyntax = {
    val highlightsClause =
      buildHighlightsClause(maybeFreeTextQuery, highlightAll = true)

    sqls"""| SELECT $selectAllStatement, $highlightsClause, ${ToolLink.selectAllStatement}
           | FROM ${FingerpostWireEntry as syn}
           | LEFT JOIN ${ToolLink as ToolLink.syn}
           |   ON ${syn.id} = ${ToolLink.syn.wireId}
           | WHERE ${FingerpostWireEntry.syn.id} = $id
           |""".stripMargin
  }

  def get(
      id: Int,
      maybeFreeTextQuery: Option[SearchTerm],
      requestingUser: Option[String] = None
  ): Option[FingerpostWireEntry] = DB readOnly { implicit session =>
    sql"${buildSingleGetQuery(id, maybeFreeTextQuery)}"
      .one(FingerpostWireEntry.fromDb(syn.resultName))
      .toMany(ToolLink.opt(ToolLink.syn.resultName))
      // add in the toollinks, but replace the username with "you" if it's the same as the person requesting this wire
      .map { (wire, toolLinks) =>
        wire.map(
          _.copy(toolLinks =
            toolLinks.toList.map(replaceToolLinkUserWithYou(requestingUser))
          )
        )
      }
      .single()
      .apply()
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

    private def preComputedCategoriesConditions(alias: QuerySQLSyntaxProvider[SQLSyntaxSupport[
      FingerpostWireEntry
    ], FingerpostWireEntry], preComputedCategories: List[String]) = {
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

    lazy val dateRangeSQL =
      (start: Option[String], end: Option[String]) => {
        (start, end) match {
          case (Some(startDate), Some(endDate)) =>
            Some(
              sqls"${FingerpostWireEntry.syn.ingestedAt} BETWEEN CAST($startDate AS timestamptz) AND CAST($endDate AS timestamptz)"
            )
          case (Some(startDate), None) =>
            Some(
              sqls"${FingerpostWireEntry.syn.ingestedAt} >= CAST($startDate AS timestamptz)"
            )
          case (None, Some(endDate)) =>
            Some(
              sqls"${FingerpostWireEntry.syn.ingestedAt} <= CAST($endDate AS timestamptz)"
            )
          case _ => None
        }
      }

    lazy val preComputedCategoriesSQL = (preComputedCategories: List[String]) => {
      preComputedCategoriesConditions(syn, preComputedCategories)
    }

    lazy val preComputedCategoriesExclSQL = (preComputedCategories: List[String]) => {
      val pce = syntax("preComputedCategoriesExcl")
      exclusionCondition(pce)(preComputedCategoriesConditions(pce, preComputedCategories))
    }
  }

  def processSearchParams(
      search: SearchParams
  ): List[SQLSyntax] = {
    val sourceFeedsQuery: Option[SQLSyntax] = search.suppliersIncl match {
      case Nil         => None
      case sourceFeeds => Some(Filters.supplierSQL(sourceFeeds))
    }

    val sourceFeedsExclQuery: Option[SQLSyntax] = search.suppliersExcl match {
      case Nil             => None
      case sourceFeedsExcl => Some(Filters.supplierExclSQL(sourceFeedsExcl))
    }

    val searchQuery = search.text match {
      case Some(SearchTerm.Simple(query, field)) =>
        Some(Filters.simpleSearchSQL(SearchTerm.Simple(query, field)))
      case Some(SearchTerm.English(query)) =>
        Some(Filters.englishSearchSQL(SearchTerm.English(query)))
      case _ => None
    }

    val keywordsQuery = search.keywordIncl match {
      case Nil      => None
      case keywords => Some(Filters.keywordsSQL(keywords))
    }

    val keywordsExclQuery = search.keywordExcl match {
      case Nil      => None
      case keywords => Some(Filters.keywordsExclSQL(keywords))
    }

    val categoryCodesInclQuery = search.categoryCodesIncl match {
      case Nil           => None
      case categoryCodes => Some(Filters.categoryCodeInclSQL(categoryCodes))
    }

    val categoryCodesExclQuery = search.categoryCodesExcl match {
      case Nil => None
      case categoryCodesExcl =>
        Some(Filters.categoryCodeExclSQL(categoryCodesExcl))
    }

    val hasDataFormattingQuery = search.hasDataFormatting match {
      case Some(dataFormatting) =>
        Some(Filters.dataFormattingSQL(dataFormatting))
      case None => None
    }

    val preComputedCategoriesQuery = search.preComputedCategories match {
      case Nil              => None
      case presetCategories => Some(Filters.preComputedCategoriesSQL(presetCategories))
    }

    val preComputedCategoriesExclQuery =
      search.preComputedCategoriesExcl match {
        case Nil => None
        case presetCategoriesExcl =>
          Some(Filters.preComputedCategoriesExclSQL(presetCategoriesExcl))
      }

    List(
      keywordsQuery,
      categoryCodesInclQuery,
      keywordsExclQuery,
      searchQuery,
      sourceFeedsQuery,
      sourceFeedsExclQuery,
      categoryCodesExclQuery,
      hasDataFormattingQuery,
      preComputedCategoriesQuery,
      preComputedCategoriesExclQuery
    ).flatten
  }

  private[db] def buildWhereClause(
      searchParams: SearchParams,
      savedSearchParamList: List[SearchParams],
      maybeBeforeId: Option[Int],
      maybeSinceId: Option[Int]
  ): SQLSyntax = {

    val dataOnlyWhereClauses = List(
      maybeBeforeId.map(Filters.beforeIdSQL(_)),
      maybeSinceId.map(Filters.sinceIdSQL(_))
    )

    val dateRangeQuery =
      Filters.dateRangeSQL(searchParams.start, searchParams.end)

    val customSearchClauses = processSearchParams(searchParams) match {
      case Nil => None
      case clauses =>
        Some(sqls.joinWithAnd(clauses: _*))
    }

    val presetSearchClauses =
      savedSearchParamList.map(params =>
        sqls.joinWithAnd(processSearchParams(params): _*)
      ) match {
        case Nil => None
        case nonEmpty =>
          Some(sqls"(${sqls.joinWithOr(nonEmpty: _*)})")
      }

    val allClauses =
      (dataOnlyWhereClauses :+ dateRangeQuery :+ customSearchClauses :+ presetSearchClauses).flatten

    allClauses match {
      case Nil => sqls"true"
      case clauses =>
        sqls.joinWithAnd(clauses: _*)
    }
  }

  private[db] def buildSearchQuery(
      queryParams: QueryParams,
      whereClause: SQLSyntax
  ): SQL[Nothing, NoExtractor] = {
    val effectivePageSize = clamp(0, queryParams.pageSize, 250)

    val maybeSinceId = queryParams.maybeSinceId

    val highlightsClause = buildHighlightsClause(queryParams.maybeSearchTerm)

    val orderByClause = maybeSinceId match {
      case Some(NextPage(_)) =>
        sqls"ORDER BY ${FingerpostWireEntry.syn.ingestedAt} ASC"
      case _ =>
        sqls"ORDER BY ${FingerpostWireEntry.syn.ingestedAt} DESC"
    }

    sql"""| SELECT $selectAllStatement, $highlightsClause
           | FROM ${FingerpostWireEntry as syn}
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
      queryParams.savedSearchParamList,
      maybeBeforeId = queryParams.maybeBeforeId,
      maybeSinceId = queryParams.maybeSinceId.map(_.sinceId)
    )
    val start = System.currentTimeMillis()
    val query = buildSearchQuery(queryParams, whereClause)

    logger.info(s"QUERY: ${query.statement}; PARAMS: ${query.parameters}")

    val results = query
      .map(FingerpostWireEntry.fromDb(syn.resultName))
      .list()
      .apply()
      .flatten

    val countQuery =
      sql"""| SELECT COUNT(*)
            | FROM ${FingerpostWireEntry as syn}
            | WHERE $whereClause
            | """.stripMargin

    logger.info(
      s"COUNT QUERY: ${countQuery.statement}; PARAMS: ${countQuery.parameters}"
    )

    val totalCount: Long = {
      countQuery.map(_.long(1)).single().apply().getOrElse(0)
    }
    val finish = System.currentTimeMillis()
    logger.info(s"QUERY TIME: ${finish - start}")

    //    val keywordCounts = getKeywords(additionalWhereClauses =
//      commonWhereClauses
//    ) // TODO do this in parallel

    QueryResponse(
      results.sortWith((a, b) => a.ingestedAt.isAfter(b.ingestedAt)),
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
        .apply()
        .toMap // TODO would a list be better?
    }
  }
}
