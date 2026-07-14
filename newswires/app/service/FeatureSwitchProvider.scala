package service

import play.api.mvc.Request

sealed trait SwitchState
case object On extends SwitchState
case object Off extends SwitchState
case class FeatureSwitch(
    name: String,
    description: String,
    exposeToClient: Boolean = false,
    private val safeState: SwitchState,
    isOn: Request[_] => Boolean
)
class FeatureSwitchProvider(stage: String) {

  val ShowGuSuppliers: FeatureSwitch =
    FeatureSwitch(
      name = "ShowGuSuppliers",
      safeState = Off,
      description = "Show suppliers from the Guardian",
      exposeToClient = true,
      isOn = _ => stage.toUpperCase() != "PROD"
    )

  private val switches = List(
    ShowGuSuppliers
  )
  def clientSideSwitchStates(request: Request[_]): Map[String, Boolean] =
    switches.filter(_.exposeToClient).map(s => s.name -> s.isOn(request)).toMap
}
