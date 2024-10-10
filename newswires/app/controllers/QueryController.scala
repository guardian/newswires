package controllers

import com.gu.pandomainauth.PanDomainAuthSettingsRefresher
import com.gu.permissions.PermissionsProvider
import db.FingerpostWireEntry
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
      maybeSupplier: Option[String],
      maybeBeforeId: Option[Int],
      maybeSinceId: Option[Int]
  ): Action[AnyContent] = AuthAction {
    Ok(
      Json.toJson(
        FingerpostWireEntry.query(
          maybeFreeTextQuery,
          maybeKeywords.map(_.split(',').toList),
          maybeSupplier,
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
  ): Action[AnyContent] = AuthAction {
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
