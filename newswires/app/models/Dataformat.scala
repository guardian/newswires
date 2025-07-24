package models

import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import io.circe.{Decoder, Encoder}

case class Dataformat(
    noOfColumns: Option[String],
    notFipTopusCategory: Option[String],
    indesignTags: Option[String]
)

object Dataformat {
  implicit val jsonDecoder: Decoder[Dataformat] = deriveDecoder[Dataformat]
  implicit val jsonEncoder: Encoder[Dataformat] = deriveEncoder[Dataformat]
}
