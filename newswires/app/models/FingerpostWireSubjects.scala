package models

import io.circe.{Decoder, Encoder, Json}
import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}

case class FingerpostWireSubjects(
    code: List[String]
)
object FingerpostWireSubjects {

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
