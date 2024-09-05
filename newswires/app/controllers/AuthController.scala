package controllers

import com.gu.pandomainauth.PanDomainAuthSettingsRefresher
import com.gu.permissions.PermissionsProvider
import play.api.Configuration
import play.api.libs.ws.WSClient
import play.api.mvc.{BaseController, ControllerComponents}

import scala.concurrent.ExecutionContext

class AuthController(
    val controllerComponents: ControllerComponents,
    val configuration: Configuration,
    val wsClient: WSClient,
    val panDomainSettings: PanDomainAuthSettingsRefresher,
    val permissionsProvider: PermissionsProvider
)(implicit executionContext: ExecutionContext)
    extends BaseController
    with AppAuthActions {

  // Required to allow the provider to redirect back to us so we can issue the new cookie
  // This route must be added to the provider allowlist
  def oauthCallback = Action.async { implicit request =>
    processOAuthCallback()
  }

  // Note: this is potentially confusing depending on your use-case as currently only the
  // panda cookie is removed and the user is not logged out of the OAuth provider
  def logout = Action { implicit request =>
    processLogout(request)
  }
}
