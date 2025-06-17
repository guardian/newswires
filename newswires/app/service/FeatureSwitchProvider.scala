package service

import play.api.libs.json.{Json, OFormat}

sealed trait SwitchState
case object On extends SwitchState
case object Off extends SwitchState

class FeatureSwitchProvider(stage: String) {

  case class FeatureSwitch(
      name: String,
      description: String,
      exposeToClient: Boolean = false,
      private val safeState: SwitchState,
      isOn: () => Boolean
  )

  val ShowGuSuppliers: FeatureSwitch =
    FeatureSwitch(
      name = "ShowGuSuppliers",
      safeState = Off,
      description = "Show suppliers from the Guardian",
      exposeToClient = true,
      isOn = () => stage.toUpperCase() != "PROD"
    )

  private val switches = List(
    ShowGuSuppliers
  )
  def clientSideSwitchStates: Map[String, Boolean] =
    switches.filter(_.exposeToClient).map(s => s.name -> s.isOn()).toMap
}
