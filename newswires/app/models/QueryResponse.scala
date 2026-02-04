package models

import db.{FingerpostWireEntry, TimeStampColumn, ToolLink}
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

  private def transformImageId(id: String) = {
    id.toCharArray.toList.zip(id.toCharArray.toList.indices).map({case (c, i) => {
      if(i == 7 || i == 11 || i == 15 || i == 19) s"${c}-" else s"${c}"
    }}).mkString

  }

  def displayWire(wire: FingerpostWireEntry, requestingUser: String): FingerpostWireEntry = {
    val updatedWire = wire
      .copy(toolLinks =
        ToolLink.display(
          wire.toolLinks,
          requestingUser = requestingUser
        )
      )
      .copy(content = wire.content.copy(imageIds = wire.content.imageIds.map(transformImageId)))
    updatedWire
  }

  def display(
      queryResponse: QueryResponse,
      requestingUser: String,
      timeStampColumn: TimeStampColumn
  ): QueryResponse = {
    queryResponse.copy(
      results = queryResponse.results
        .map(wire => displayWire(wire, requestingUser))
        .sortWith(timeStampColumn.sortDesc)
    )
  }
}
