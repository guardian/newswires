package models

import play.api.libs.json.{Format, JsArray, JsObject, JsString, Json}

case class FingerpostWireSubjects(
    code: List[String]
)
object FingerpostWireSubjects {
  // some wires arrive with no code, but represent that by an empty string
  // instead of an empty array :( preprocess them into an empty array
  private val reads =
    Json.reads[FingerpostWireSubjects].preprocess { case JsObject(obj) =>
      JsObject(obj.map {
        case ("code", JsString("")) => ("code", JsArray.empty)
        case other                  => other
      })
    }
  private val writes = Json.writes[FingerpostWireSubjects]
  implicit val format: Format[FingerpostWireSubjects] =
    Format(reads, writes)
}
