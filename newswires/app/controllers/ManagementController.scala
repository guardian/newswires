package controllers
import play.api.Logging
import play.api.mvc.{BaseController, ControllerComponents}

import scala.concurrent.ExecutionContext

class ManagementController(
    val controllerComponents: ControllerComponents
)(implicit executionContext: ExecutionContext)
    extends BaseController
    with Logging {

  def healthcheck() = Action {
    Ok("ok")
  }

  def gitHash() = Action {
    Ok(buildinfo.BuildInfo.gitCommitId)
  }
}
