package db

import play.api.libs.json.{Json, OWrites}

case class QueryResponse(
    results: List[FingerpostWireEntry],
    totalCount: Long = 10
    //      keywordCounts: Map[String, Int]
)

object QueryResponse {
  implicit val writes: OWrites[QueryResponse] = Json.writes[QueryResponse]
}
