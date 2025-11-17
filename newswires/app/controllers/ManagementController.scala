package controllers
import conf.Database
import db.ToolLink
import play.api.Logging
import play.api.mvc.{BaseController, ControllerComponents}

import java.time.Instant
import scala.concurrent.ExecutionContext

class ManagementController(
    val controllerComponents: ControllerComponents
)(implicit executionContext: ExecutionContext)
    extends BaseController
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
}
