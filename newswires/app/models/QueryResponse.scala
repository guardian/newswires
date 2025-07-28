package models

import db.FingerpostWireEntry
import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import io.circe.{Decoder, Encoder}

case class QueryResponse(
    results: List[FingerpostWireEntry],
    totalCount: Long = 10
    //      keywordCounts: Map[String, Int]
)

object QueryResponse {
  implicit val jsonEncoder: Encoder[QueryResponse] =
    deriveEncoder[QueryResponse].mapJson(_.dropNullValues)

  implicit val jsonDecoder: Decoder[QueryResponse] =
    deriveDecoder[QueryResponse]
}
