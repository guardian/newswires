package controllers
import conf.Database
import play.api.Logging
import play.api.mvc.{BaseController, ControllerComponents}

import scala.concurrent.ExecutionContext

class ManagementController(
    val controllerComponents: ControllerComponents
)(implicit executionContext: ExecutionContext)
    extends BaseController
    with Logging {

  def healthcheck() = Action {
    if (Database.healthcheck == 1)
      Ok("ok")
    else InternalServerError("database fell over :(")
  }

  def gitHash() = Action {
    Ok(buildinfo.BuildInfo.gitCommitId)
  }
}
