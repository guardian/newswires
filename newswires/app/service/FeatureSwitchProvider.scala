package service

import play.api.libs.json.{Json, OFormat}

sealed trait SwitchState
case object On extends SwitchState
case object Off extends SwitchState
case class FeatureSwitch(
    name: String,
    description: String,
    exposeToClient: Boolean = false,
    private val safeState: SwitchState,
    isOn: () => Boolean
)
class FeatureSwitchProvider(stage: String) {

  val ShowGuSuppliers: FeatureSwitch =
    FeatureSwitch(
      name = "ShowGuSuppliers",
      safeState = Off,
      description = "Show suppliers from the Guardian",
      exposeToClient = true,
      isOn = () => stage.toUpperCase() != "PROD"
    )

  val ShowPAAPI: FeatureSwitch =
    FeatureSwitch(
      name = "ShowPAAPI",
      safeState = Off,
      description = "Show new PA API in the feed",
      exposeToClient = true,
      isOn = () => stage.toUpperCase() != "PROD"
    )
  val switches = List(
    ShowGuSuppliers,
    ShowPAAPI
  )

  def clientSideSwitchStates: Map[String, Boolean] =
    switches.filter(_.exposeToClient).map(s => s.name -> s.isOn()).toMap

}
