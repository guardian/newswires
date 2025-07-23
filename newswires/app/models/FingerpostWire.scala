package models

import io.circe._
import io.circe.generic.semiauto._
import io.circe.generic.extras._
import play.api.libs.json.{Format, JsObject, Json, Reads}

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
    dataformat: Option[Dataformat]
)
object FingerpostWire {
  // rename a couple of fields
  private val reads: Reads[FingerpostWire] =
    Json.reads[FingerpostWire].preprocess { case JsObject(obj) =>
      JsObject(obj.map {
        case ("source-feed", value) => ("sourceFeed", value)
        case ("body_text", value)   => ("bodyText", value)
        case other                  => other
      })
    }
  private val writes = Json.writes[FingerpostWire]
  implicit val format: Format[FingerpostWire] = Format(reads, writes)
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
    deriveEncoder[FingerpostWire]
}
