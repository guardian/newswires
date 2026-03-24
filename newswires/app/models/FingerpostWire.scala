package models

import io.circe._
import io.circe.generic.semiauto._

case class PaEvent(
    rel: String,
    code: String,
    name: String,
    scheme: String,
    profile: String
)

object PaEvent {
  implicit val jsonDecoder: Decoder[PaEvent] = deriveDecoder[PaEvent]
  implicit val jsonEncoder: Encoder[PaEvent] =
    deriveEncoder[PaEvent].mapJson(_.dropNullValues)
}

case class AgencyMetadata(event: List[PaEvent])

object AgencyMetadata {
  implicit val jsonDecoder: Decoder[AgencyMetadata] =
    deriveDecoder[AgencyMetadata]
  implicit val jsonEncoder: Encoder[AgencyMetadata] =
    deriveEncoder[AgencyMetadata].mapJson(_.dropNullValues)
}

case class FingerpostWire(
    uri: Option[String],
    sourceFeed: Option[String],
    usn: Option[String],
    version: Option[String],
    status: Option[String],
    firstVersion: Option[String],
    versionCreated: Option[String],
    dateTimeSent: Option[String],
    slug: Option[String],
    headline: Option[String],
    subhead: Option[String],
    byline: Option[String],
    priority: Option[String],
    subjects: Option[FingerpostWireSubjects],
    keywords: Option[List[String]],
    usage: Option[String],
    ednote: Option[String],
    mediaCatCodes: Option[String],
    `abstract`: Option[String],
    bodyText: Option[String],
    composerCompatible: Option[Boolean],
    dataformat: Option[Dataformat],
    embargo: Option[String], // expected to be a UTC ISO datetime string
    profile: Option[String],
    `type`: Option[String],
    agencyMetadata: Option[AgencyMetadata]
)
object FingerpostWire {
  implicit val jsonDecoder: Decoder[FingerpostWire] =
    deriveDecoder[FingerpostWire].prepare(
      _.withFocus {
        _.mapObject(obj => {
          obj
            .add(
              "sourceFeed",
              obj("source-feed").getOrElse(
                obj("sourceFeed").getOrElse(io.circe.Json.Null)
              )
            )
            .add(
              "bodyText",
              obj("body_text").getOrElse(
                obj("bodyText").getOrElse(io.circe.Json.Null)
              )
            )
            .remove("source-feed")
            .remove("body_text")
        })
      }
    )
  implicit val jsonEncoder: Encoder[FingerpostWire] =
    deriveEncoder[FingerpostWire].mapJson(_.dropNullValues)
}
