package models

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
}
