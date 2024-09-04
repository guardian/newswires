package controllers

import com.gu.pandomainauth.PanDomainAuthSettingsRefresher
import com.gu.permissions.PermissionsProvider
import db.FingerpostMessage
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

  def query(q: Option[String]): Action[AnyContent] = AuthAction {
    val results = q match {
      case None        => FingerpostMessage.getAll()
      case Some(query) => FingerpostMessage.query(query)
    }

    if (results.nonEmpty) {
      Ok(Json.toJson(results))
    } else NotFound
  }

}
