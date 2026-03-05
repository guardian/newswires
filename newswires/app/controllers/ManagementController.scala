package controllers
import com.gu.pandomainauth.PanDomainAuthSettingsRefresher
import com.gu.permissions.PermissionsProvider
import conf.Database
import play.api.libs.ws.WSClient
import play.api.{Configuration, Logging}
import play.api.mvc.{BaseController, ControllerComponents}
import service.FeatureSwitchProvider

import scala.concurrent.ExecutionContext

class ManagementController(
    val controllerComponents: ControllerComponents,
    val configuration: Configuration,
    val wsClient: WSClient,
    val permissionsProvider: PermissionsProvider,
    val panDomainSettings: PanDomainAuthSettingsRefresher,
    val featureSwitchProvider: FeatureSwitchProvider
)(implicit executionContext: ExecutionContext)
    extends BaseController
    with Logging
    with AppAuthActions {

  def healthcheck() = Action {
    if (Database.healthcheck == 1) {
      Ok("ok")
    } else {
      InternalServerError("database returned non-1 from healthcheck")
    }
  }

  def gitHash() = Action {
    Ok(buildinfo.BuildInfo.gitCommitId)
  }

  def switchboard() = authAction {
    Ok(
      views.html.switchboard.render(
        featureSwitchProvider.switches,
        configuration.get[String]("stage")
      )
    )
  }
}
