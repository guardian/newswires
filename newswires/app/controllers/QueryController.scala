package controllers

import com.gu.pandomainauth.PanDomainAuthSettingsRefresher
import com.gu.pandomainauth.action.UserRequest
import com.gu.permissions.PermissionsProvider
import db.{FingerpostWireEntry, SearchParams}
import play.api.libs.json.Json
import play.api.libs.ws.WSClient
import play.api.mvc.{Action, AnyContent, BaseController, ControllerComponents}
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

  def query(
      maybeFreeTextQuery: Option[String],
      maybeKeywords: Option[String],
      suppliers: List[String],
      maybeBeforeId: Option[Int],
      maybeSinceId: Option[Int]
  ): Action[AnyContent] = apiAuthAction { request: UserRequest[AnyContent] =>
    val queryParams = SearchParams(
      text = maybeFreeTextQuery,
      keywordIncl = maybeKeywords.map(_.split(",").toList).getOrElse(Nil),
      keywordExcl = request
        .getQueryString("keywordsExcl")
        .map(_.split(",").toList)
        .getOrElse(Nil),
      suppliersIncl = suppliers,
      suppliersExcl =
        request.queryString.get("supplierExcl").map(_.toList).getOrElse(Nil)
    )

    Ok(
      Json.toJson(
        FingerpostWireEntry.query(
          queryParams,
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

  def item(id: Int): Action[AnyContent] = AuthAction {
    FingerpostWireEntry.get(id) match {
      case Some(entry) => Ok(Json.toJson(entry))
      case None        => NotFound
    }
  }

}
