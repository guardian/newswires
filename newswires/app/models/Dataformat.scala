package models

import play.api.libs.json.{Json, OFormat}

case class Dataformat(
    noOfColumns: Option[String],
    notFipTopusCategory: Option[String],
    indesignTags: Option[String]
)

object Dataformat {
  implicit val format: OFormat[Dataformat] = Json.format[Dataformat]
}
