package controllers

import com.gu.pandomainauth.PanDomainAuthSettingsRefresher
import com.gu.pandomainauth.action.UserRequest
import com.gu.permissions.PermissionsProvider
import conf.SearchBuckets
import db.{FingerpostWireEntry, SearchParams}
import play.api.libs.json.Json
import play.api.libs.ws.WSClient
import play.api.mvc.{
  Action,
  AnyContent,
  BaseController,
  ControllerComponents,
  Request
}
import play.api.{Configuration, Logging}

class QueryController(
    val controllerComponents: ControllerComponents,
    val configuration: Configuration,
    val wsClient: WSClient,
    val permissionsProvider: PermissionsProvider,
    val panDomainSettings: PanDomainAuthSettingsRefresher
) extends BaseController
    with Logging
    with AppAuthActions {
  private def paramToList[T](
      request: Request[T],
      paramName: String
  ): List[String] =
    request.getQueryString(paramName).map(_.split(",").toList).getOrElse(Nil)

  def query(
      maybeFreeTextQuery: Option[String],
      maybeKeywords: Option[String],
      suppliers: List[String],
      subjects: List[String],
      subjectsExcl: List[String],
      maybeBeforeId: Option[Int],
      maybeSinceId: Option[Int]
  ): Action[AnyContent] = apiAuthAction { request: UserRequest[AnyContent] =>
    val bucket = request.getQueryString("bucket").flatMap(SearchBuckets.get)

    val queryParams = SearchParams(
      text = maybeFreeTextQuery,
      keywordIncl = maybeKeywords.map(_.split(",").toList).getOrElse(Nil),
      keywordExcl = paramToList(request, "keywordsExcl"),
      suppliersIncl = suppliers,
      suppliersExcl =
        request.queryString.get("supplierExcl").map(_.toList).getOrElse(Nil),
      subjectsIncl = subjects,
      subjectsExcl = subjectsExcl
    )

    val mergedParams = bucket.map(_ merge queryParams).getOrElse(queryParams)

    Ok(
      Json.toJson(
        FingerpostWireEntry.query(
          mergedParams,
          maybeBeforeId,
          maybeSinceId,
          pageSize = 30
        )
      )
    )
  }

  def keywords(
      maybeInLastHours: Option[Int],
      maybeLimit: Option[Int]
  ): Action[AnyContent] = apiAuthAction {
    val results = FingerpostWireEntry.getKeywords(maybeInLastHours, maybeLimit)
    Ok(Json.toJson(results))
  }

  def item(id: Int, maybeFreeTextQuery: Option[String]): Action[AnyContent] =
    AuthAction {
      FingerpostWireEntry.get(id, maybeFreeTextQuery) match {
        case Some(entry) => Ok(Json.toJson(entry))
        case None        => NotFound
      }
    }

}
