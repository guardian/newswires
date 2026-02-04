package models

import db.{FingerpostWireEntry, TimeStampColumn, ToolLink}
import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import io.circe.{Decoder, Encoder}
import play.api.libs.ws.WSClient

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future

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

  def displayWire(wire: FingerpostWireEntry, requestingUser: String, images: List[String]): FingerpostWireEntry = {
     val updatedWire = wire
        .copy(toolLinks =
          ToolLink.display(
            wire.toolLinks,
            requestingUser = requestingUser
          )
        )
        .copy(content = wire.content.copy(imageIds = wire.content.imageIds.map(transformImageId)))
        .copy(imageUrls = images)
     updatedWire
  }

  def getImagesFromGrid(wsClient: WSClient, imageIds: List[String]): Future[List[String]] = {
    Future.sequence(imageIds.map(i => wsClient.url("https://www.google.com/?zx=1770224532797&no_sw_cr=1").get().map(_ => "hello")))
  }
  def display(
      queryResponse: QueryResponse,
      requestingUser: String,
      timeStampColumn: TimeStampColumn,
      wsClient: WSClient
  ): Future[QueryResponse] = {
     val imagesFt = Future.sequence(queryResponse.results.map(wire => for {
      imagesFromGrid <- getImagesFromGrid(wsClient, wire.content.imageIds)
      id = wire.id
    } yield id -> imagesFromGrid)).map(_.toMap)
    for {
      imagesMap <- imagesFt
      qr =  queryResponse.copy(
      results = queryResponse.results
      .map(wire => displayWire(wire, requestingUser, imagesMap.getOrElse(wire.id, Nil)))
      .sortWith(timeStampColumn.sortDesc)
      )
    } yield qr

  }
}
