package controllers
import com.gu.pandomainauth.PanDomainAuthSettingsRefresher
import com.gu.permissions.PermissionsProvider
import conf.Database
import play.api.{Configuration, Logging}
import play.api.libs.json.Json
import play.api.libs.ws.WSClient
import play.api.mvc.{BaseController, ControllerComponents}

import java.time.LocalDateTime
import java.time.format.DateTimeFormatter._
import scala.concurrent.ExecutionContext

class ManagementController(
    val controllerComponents: ControllerComponents,
    val configuration: Configuration,
    val wsClient: WSClient,
    val permissionsProvider: PermissionsProvider,
    val panDomainSettings: PanDomainAuthSettingsRefresher
)(implicit executionContext: ExecutionContext)
    extends BaseController
    with AppAuthActions
    with Logging {

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

  private def isValidISODateTimeString(s: String): Boolean = {
    try {
      LocalDateTime.parse(s, ISO_DATE_TIME)
      true
    } catch {
      case _: Exception => false
    }
  }

  def clientRefreshMessage() = apiAuthAction {
    configuration.getOptional[String]("breakingUiChangeActiveFromTime") match {
      // validate that we've got an ISO date-time string, and that it's not empty or just whitespace
      case Some(activeFromTime)
          if isValidISODateTimeString(activeFromTime.trim()) =>
        Ok(
          Json.toJson(
            Map(
              "message" -> "The app has been updated. Please refresh your browser as soon as possible.",
              "from" -> activeFromTime.trim()
            )
          )
        )
      case Some(activeFromTime) if activeFromTime.trim().nonEmpty =>
        logger.error(
          s"Invalid breakingUiChangeActiveFromTime config value: '$activeFromTime'. Expected an ISO date-time string. Ignoring the value and returning no message."
        )
        Ok(Json.toJson(Map("hasMessage" -> false)))

      case _ =>
        Ok(Json.toJson(Map("hasMessage" -> false)))
    }
  }
}
