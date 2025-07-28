package db

import conf.{SearchField, SearchTerm}
import db.CustomMappers.textArray
import io.circe.{Decoder, Encoder}
import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import models.FingerpostWire
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
    composerId: Option[String],
    composerSentBy: Option[String],
    categoryCodes: List[String],
    highlight: Option[String] = None
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
      "highlight"
    )
  val syn = this.syntax("fm")

  private val selectAllStatement = sqls"""
    |   ${FingerpostWireEntry.syn.result.id},
    |   ${FingerpostWireEntry.syn.result.externalId},
    |   ${FingerpostWireEntry.syn.result.ingestedAt},
    |   ${FingerpostWireEntry.syn.result.supplier},
    |   ${FingerpostWireEntry.syn.result.composerId},
    |   ${FingerpostWireEntry.syn.result.composerSentBy},
    |   ${FingerpostWireEntry.syn.result.categoryCodes},
    |   ${FingerpostWireEntry.syn.result.content}
    |""".stripMargin

  def apply(
      fm: ResultName[FingerpostWireEntry]
  )(rs: WrappedResultSet): FingerpostWireEntry = {
    val fingerpostContent = decode[FingerpostWire](rs.string(fm.content)).toOption.get
    val maybeCategoryCodes = rs.arrayOpt(fm.categoryCodes)
    val categoryCodes = maybeCategoryCodes match {
      case Some(array) =>
        array.getArray
          .asInstanceOf[Array[String]]
          .toList
      case None => Nil
    }

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
        ) // sometimes PG will return some unmarked text, and sometimes will return NULL - I can't figure out which and when
    )
  }

  private def clamp(low: Int, x: Int, high: Int): Int =
    math.min(math.max(x, low), high)

  def get(
      id: Int,
      maybeFreeTextQuery: Option[String]
  ): Option[FingerpostWireEntry] = DB readOnly { implicit session =>
    val highlightsClause = maybeFreeTextQuery match {
      case Some(query) =>
        sqls", ts_headline('english', ${syn.content}->>'body_text', websearch_to_tsquery('english', $query), 'HighlightAll=true, StartSel=<mark>, StopSel=</mark>') AS ${syn.resultName.highlight}"
      case None => sqls", '' AS ${syn.resultName.highlight}"
    }
    sql"""| SELECT $selectAllStatement $highlightsClause
          | FROM ${FingerpostWireEntry as syn}
          | WHERE ${FingerpostWireEntry.syn.id} = $id
          |""".stripMargin
      .map(FingerpostWireEntry(syn.resultName))
      .single()
      .apply()
  }

  case class QueryResponse(
      results: List[FingerpostWireEntry],
      totalCount: Long
//      keywordCounts: Map[String, Int]
  )

  private object QueryResponse {
    implicit val jsonEncoder: Encoder[QueryResponse] =
      deriveEncoder[QueryResponse]

    implicit val jsonDecoder: Decoder[QueryResponse] =
      deriveDecoder[QueryResponse]
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

    val dateRangeQuery = (search.start, search.end) match {
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
      dateRangeQuery,
      categoryCodesExclQuery,
      hasDataFormattingQuery
    ).flatten
  }

  private def buildWhereClauseParts(
      searchParamList: List[SearchParams],
      maybeBeforeId: Option[Int],
      maybeSinceId: Option[Int]
  ) = {
    val dataOnlyWhereClauses = List(
      maybeBeforeId.map(beforeId =>
        sqls"${FingerpostWireEntry.syn.id} < $beforeId"
      ),
      maybeSinceId.map(sinceId =>
        sqls"${FingerpostWireEntry.syn.id} > $sinceId"
      )
    ).flatten

    val commonWhereClauses = searchParamList.flatMap(searchParams => {
      val whereClause = processSearchParams(searchParams)

      if (whereClause.nonEmpty) {
        Some(
          sqls.joinWithAnd(
            dataOnlyWhereClauses ++ whereClause: _*
          )
        )
      } else {
        None
      }
    })

    commonWhereClauses match {
      case Nil => None
      case wherePart :: Nil =>
        Some(wherePart)
      case whereParts =>
        Some(sqls.joinWithOr(whereParts.map(clause => sqls"($clause)"): _*))
    }
  }

  private[db] def buildWhereClause(
      searchParams: SearchParams,
      savedSearchParamList: List[SearchParams],
      maybeBeforeId: Option[Int],
      maybeSinceId: Option[Int]
  ): SQLSyntax = {

    val maybeSearch =
      buildWhereClauseParts(List(searchParams), maybeBeforeId, maybeSinceId)

    val maybeSavedSearch =
      buildWhereClauseParts(savedSearchParamList, maybeBeforeId, maybeSinceId)

    (maybeSearch, maybeSavedSearch) match {
      case (None, None)               => sqls""
      case (None, Some(presetSearch)) => sqls"WHERE $presetSearch"
      case (Some(userSearch), None)   => sqls"WHERE $userSearch"
      case (Some(userSearch), Some(presetSearch)) =>
        sqls"WHERE ($userSearch) and ($presetSearch)"
    }
  }

  def query(
      searchParams: SearchParams,
      savedSearchParamList: List[SearchParams],
      maybeSearchTerm: Option[SearchTerm],
      maybeBeforeId: Option[Int],
      maybeSinceId: Option[Int],
      pageSize: Int = 250
  ): QueryResponse = DB readOnly { implicit session =>
    val effectivePageSize = clamp(0, pageSize, 250)

    val whereClause = buildWhereClause(
      searchParams,
      savedSearchParamList,
      maybeBeforeId = maybeBeforeId,
      maybeSinceId = maybeSinceId
    )

    val highlightsClause = maybeSearchTerm match {
      case Some(SearchTerm.English(query)) =>
        sqls", ts_headline('english', ${syn.content}->>'body_text', websearch_to_tsquery('english', $query), 'StartSel=<mark>, StopSel=</mark>') AS ${syn.resultName.highlight}"
      case None => sqls", '' AS ${syn.resultName.highlight}"
    }

    val query = sql"""| SELECT $selectAllStatement $highlightsClause
                      | FROM ${FingerpostWireEntry as syn}
                      | $whereClause
                      | ORDER BY ${FingerpostWireEntry.syn.ingestedAt} DESC
                      | LIMIT $effectivePageSize
                      | """.stripMargin

    logger.info(s"QUERY: ${query.statement}; PARAMS: ${query.parameters}")

    val results = query
      .map(FingerpostWireEntry(syn.resultName))
      .list()
      .apply()

    val countQuery =
      sql"""| SELECT COUNT(*)
            | FROM ${FingerpostWireEntry as syn}
            | $whereClause
            | """.stripMargin

    logger.info(
      s"COUNT QUERY: ${countQuery.statement}; PARAMS: ${countQuery.parameters}"
    )

    val totalCount: Long =
      countQuery.map(_.long(1)).single().apply().getOrElse(0)

//    val keywordCounts = getKeywords(additionalWhereClauses =
//      commonWhereClauses
//    ) // TODO do this in parallel

    QueryResponse(results, totalCount /*, keywordCounts*/ )
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

  def insertComposerId(
      newswiresId: Int,
      composerId: String,
      sentBy: String
  ): Int = DB localTx { implicit session =>
    sql"""| UPDATE ${FingerpostWireEntry as syn}
          | SET composer_id = $composerId, composer_sent_by = $sentBy
          | WHERE id = $newswiresId
          |   AND composer_id IS NULL
          |   AND composer_sent_by IS NULL
          | """.stripMargin
      .update()
      .apply()
  }
}
