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

  val HideMediaDirectFeeds: FeatureSwitch =
    FeatureSwitch(
      name = "HideMediaDirectFeeds",
      safeState = Off,
      description =
        "Hide media direct source feeds (PA, PA PA RACING DATA, PA DATA FORMATTING, PA PA SPORT DATA)",
      exposeToClient = true,
      isOn = _.getQueryString("hideMediaDirectFeeds")
        .flatMap(_.toBooleanOption)
        .getOrElse(false)
    )

  private val switches = List(
    ShowGuSuppliers,
    HideMediaDirectFeeds
  )
  def clientSideSwitchStates(request: Request[_]): Map[String, Boolean] =
    switches.filter(_.exposeToClient).map(s => s.name -> s.isOn(request)).toMap
}
