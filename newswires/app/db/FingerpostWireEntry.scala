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
    s3Key: Option[String]
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
      "s3_key"
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
    |   ${FingerpostWireEntry.syn.result.s3Key}
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
        s3Key = rs.stringOpt(fm.s3Key)
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

  private[db] def buildSingleGetQuery(
      id: Int,
      maybeFreeTextQuery: Option[String]
  ): SQLSyntax = {
    val highlightsClause = maybeFreeTextQuery match {
      case Some(query) =>
        sqls"ts_headline('english', ${syn.content}->>'body_text', websearch_to_tsquery('english', $query), 'HighlightAll=true, StartSel=<mark>, StopSel=</mark>') AS ${syn.resultName.highlight}"
      case None => sqls"'' AS ${syn.resultName.highlight}"
    }
    sqls"""| SELECT $selectAllStatement, $highlightsClause, ${ToolLink.selectAllStatement}
           | FROM ${FingerpostWireEntry as syn}
           | LEFT JOIN ${ToolLink as ToolLink.syn}
           |   ON ${syn.id} = ${ToolLink.syn.wireId}
           | WHERE ${FingerpostWireEntry.syn.id} = $id
           |""".stripMargin
  }

  def get(
      id: Int,
      maybeFreeTextQuery: Option[String],
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

  private def processSearchParams(
      search: SearchParams
  ): List[SQLSyntax] = {
    val sourceFeedsQuery = search.suppliersIncl match {
      case Nil => None
      case sourceFeeds =>
        Some(
          sqls.in(
            sqls"upper(${syn.supplier})",
            sourceFeeds.map(feed => sqls"upper($feed)")
          )
        )
    }

    val sourceFeedsExclQuery = search.suppliersExcl match {
      case Nil => None
      case sourceFeedsExcl =>
        val se = this.syntax("sourceFeedsExcl")
        val doesContainFeeds = sqls.in(
          sqls"upper(${se.supplier})",
          sourceFeedsExcl.map(feed => sqls"upper($feed)")
        )
        // unpleasant, but the sort of trick you need to pull
        // because "NOT IN (...)" doesn't hit an index.
        // https://stackoverflow.com/a/19364694
        Some(
          sqls"""|NOT EXISTS (
                 |  SELECT FROM ${FingerpostWireEntry as se}
                 |  WHERE ${syn.id} = ${se.id}
                 |    AND $doesContainFeeds
                 |)""".stripMargin
        )
    }

    val keywordsQuery = search.keywordIncl match {
      case Nil      => None
      case keywords =>
        // "??|" is actually the "?|" operator - doubled to prevent the
        // SQL driver from treating it as a placeholder for a parameter
        // https://jdbc.postgresql.org/documentation/query/#using-the-statement-or-preparedstatement-interface
        Some(
          sqls"""(${syn.content} -> 'keywords') ??| ${textArray(keywords)}"""
        )
    }

    val keywordsExclQuery = search.keywordExcl match {
      case Nil => None
      case keywords =>
        val ke = this.syntax("keywordsExcl")
        // "??|" is actually the "?|" operator - doubled to prevent the
        // SQL driver from treating it as a placeholder for a parameter
        // https://jdbc.postgresql.org/documentation/query/#using-the-statement-or-preparedstatement-interface
        val doesContainKeywords =
          sqls"(${ke.content}->'keywords') ??| ${textArray(keywords)}"
        // unpleasant, but the kind of trick you need to pull because
        // NOT [row] ?| [list] won't use the index.
        // https://stackoverflow.com/a/19364694
        Some(
          sqls"""|NOT EXISTS (
                 |  SELECT FROM ${FingerpostWireEntry as ke}
                 |  WHERE ${syn.id} = ${ke.id}
                 |    AND $doesContainKeywords
                 |)""".stripMargin
        )
    }

    val categoryCodesInclQuery = search.categoryCodesIncl match {
      case Nil => None
      case categoryCodes =>
        Some(
          sqls"${syn.categoryCodes} && ${textArray(categoryCodes)}"
        )
    }

    val categoryCodesExclQuery = search.categoryCodesExcl match {
      case Nil => None
      case categoryCodesExcl =>
        val cce = this.syntax("categoryCodesExcl")
        val doesContainCategoryCodes =
          sqls"${cce.categoryCodes} && ${textArray(categoryCodesExcl)}"

        Some(
          sqls"""|NOT EXISTS (
                 |  SELECT FROM ${FingerpostWireEntry as cce}
                 |  WHERE ${syn.id} = ${cce.id}
                 |    AND $doesContainCategoryCodes
                 |)""".stripMargin
        )
    }

    val hasDataFormattingQuery = search.hasDataFormatting match {
      case Some(true) =>
        Some(
          sqls"(${syn.content}->'dataformat') IS NOT NULL"
        )
      case Some(false) =>
        Some(
          sqls"(${syn.content}->'dataformat') IS NULL"
        )
      case None => None
    }

    List(
      keywordsQuery,
      categoryCodesInclQuery,
      keywordsExclQuery,
      search.text match {
        case Some(SearchTerm.Simple(query, field)) =>
          val tsvectorColumn = field match {
            case SearchField.Headline => "headline_tsv_simple"
            case SearchField.BodyText => "body_text_tsv_simple"

          }
          Some(
            sqls"$tsvectorColumn @@ websearch_to_tsquery('simple', lower($query))"
          )
        case Some(SearchTerm.English(query)) =>
          Some(
            sqls"websearch_to_tsquery('english', $query) @@ ${FingerpostWireEntry.syn.column("combined_textsearch")}"
          )
        case _ => None
      },
      sourceFeedsQuery,
      sourceFeedsExclQuery,
      categoryCodesExclQuery,
      hasDataFormattingQuery
    ).flatten
  }

  private[db] def buildWhereClause(
      baseWhereClause: Option[SQLSyntax],
      searchParams: SearchParams,
      savedSearchParamList: List[SearchParams],
      maybeBeforeId: Option[Int],
      maybeSinceId: Option[Int]
  ): SQLSyntax = {

    val dataOnlyWhereClauses = List(
      maybeBeforeId.map(beforeId =>
        sqls"${FingerpostWireEntry.syn.id} < $beforeId"
      ),
      maybeSinceId.map(sinceId =>
        sqls"${FingerpostWireEntry.syn.id} > $sinceId"
      )
    )

    val dateRangeQuery = (searchParams.start, searchParams.end) match {
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
      (dataOnlyWhereClauses :+ baseWhereClause :+ dateRangeQuery :+ customSearchClauses :+ presetSearchClauses).flatten

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

    val highlightsClause = queryParams.maybeSearchTerm match {
      case Some(SearchTerm.English(query)) =>
        sqls", ts_headline('english', ${syn.content}->>'body_text', websearch_to_tsquery('english', $query), 'StartSel=<mark>, StopSel=</mark>') AS ${syn.resultName.highlight}"
      case None => sqls", '' AS ${syn.resultName.highlight}"
    }

    val orderByClause = maybeSinceId match {
      case Some(NextPage(_)) =>
        sqls"ORDER BY ${FingerpostWireEntry.syn.ingestedAt} ASC"
      case _ =>
        sqls"ORDER BY ${FingerpostWireEntry.syn.ingestedAt} DESC"
    }

    sql"""| SELECT $selectAllStatement $highlightsClause
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
      baseWhereClause = Some(sqls"${syn.supplier} <> 'UNAUTHED_EMAIL_FEED'"),
      queryParams.searchParams,
      queryParams.savedSearchParamList,
      maybeBeforeId = queryParams.maybeBeforeId,
      maybeSinceId = queryParams.maybeSinceId.map(_.sinceId)
    )

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

    val totalCount: Long =
      countQuery.map(_.long(1)).single().apply().getOrElse(0)

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
