package controllers

import com.gu.pandomainauth.PanDomainAuthSettingsRefresher
import com.gu.permissions.PermissionsProvider
import db.{FingerpostWireEntry, KeywordCount, Trending}
import play.api.libs.json.Json
import play.api.libs.ws.WSClient
import play.api.mvc.{Action, AnyContent, BaseController, ControllerComponents}
import play.api.{Configuration, Logging}

import java.time.ZonedDateTime
import scala.concurrent.duration.DurationInt

class QueryController(
    val controllerComponents: ControllerComponents,
    val configuration: Configuration,
    val wsClient: WSClient,
    val permissionsProvider: PermissionsProvider,
    val panDomainSettings: PanDomainAuthSettingsRefresher
) extends BaseController
    with Logging
    with AppAuthActions {

  def query(q: Option[String]): Action[AnyContent] = AuthAction {
    val results = q match {
      case None        => FingerpostWireEntry.getAll()
      case Some(query) => FingerpostWireEntry.query(query)
    }

    Ok(Json.toJson(results))
  }

  def keywords(
      maybeInLastHours: Option[Int],
      maybeLimit: Option[Int]
  ): Action[AnyContent] = AuthAction {
    val results = FingerpostWireEntry.getKeywords(maybeInLastHours, maybeLimit)
    Ok(Json.toJson(results))
  }

  def trendingKeywords(
      inLastHours: Int = 150
  ): Action[AnyContent] = AuthAction {
    val now = ZonedDateTime.now()
    val keywordUsages =
      FingerpostWireEntry.getKeywordsWithTimestamps(inLastHours)
    val zScoreByKeyword = keywordUsages
      .groupMap(_.keyword)(_.timestamp)
      .filter(_._2.size > 10)
      .map { case (keyword, timestamps) =>
        keyword -> Trending.trendingScore(
          timestamps,
          1.hour,
          now.minusHours(inLastHours),
          now
        )
      }
      .toList
    val topKeywords = zScoreByKeyword.sortBy(-_._2).take(10).map(_._1)
    val topKeywordUsageCounts = keywordUsages
      .filter(ku => topKeywords.contains(ku.keyword))
      .groupBy(_.keyword)
      .view
      .mapValues(_.size)
    Ok(Json.toJson(topKeywordUsageCounts.map { case (k, v) =>
      KeywordCount(k, v)
    }))
  }

}
