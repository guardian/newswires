package models

import io.circe.Json.JString
import io.circe.{Decoder, Encoder, Json, JsonObject}
import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import play.api.libs.json.{
  Format,
  JsArray,
  JsObject,
  JsString,
  Json => PlayJson
}

case class FingerpostWireSubjects(
    code: List[String]
)
object FingerpostWireSubjects {
  // some wires arrive with no code, but represent that by an empty string
  // instead of an empty array :( preprocess them into an empty array
  private val reads =
    PlayJson.reads[FingerpostWireSubjects].preprocess { case JsObject(obj) =>
      JsObject(obj.map {
        case ("code", JsString("")) => ("code", JsArray.empty)
        case other                  => other
      })
    }
  private val writes = PlayJson.writes[FingerpostWireSubjects]
  implicit val format: Format[FingerpostWireSubjects] =
    Format(reads, writes)

  implicit val jsonDecoder: Decoder[FingerpostWireSubjects] =
    deriveDecoder[FingerpostWireSubjects].prepare(
      _.withFocus {
        _.mapObject(obj => {
          obj.mapValues(json =>
            json.asString match {
              case Some("") => Json.arr()
              case _        => json
            }
          )
        })
      }
    )

  implicit val jsonEncoder: Encoder[FingerpostWireSubjects] =
    deriveEncoder[FingerpostWireSubjects]
}
