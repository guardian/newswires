package models

import db.{FingerpostWireEntry, TimeStampColumn, ToolLink}
import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import io.circe.{Decoder, Encoder, Json}
import play.api.libs.json.Format.GenericFormat
import play.api.libs.json.JsValue
import play.api.libs.ws.WSClient

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future

case class QueryResponse(
    results: List[FingerpostWireEntry],
    totalCount: Long = 10
    //      keywordCounts: Map[String, Int]
)

case class Grid(gridId: String, thumbnailUrl: String)
case object Grid {
  implicit val jsonEncoder: Encoder[Grid] =
    deriveEncoder[Grid].mapJson(_.dropNullValues)
  implicit val jsonDecoder: Decoder[Grid] = deriveDecoder[Grid]
}

object QueryResponse {
  implicit val jsonEncoder: Encoder[QueryResponse] =
    deriveEncoder[QueryResponse].mapJson(_.dropNullValues)

  implicit val jsonDecoder: Decoder[QueryResponse] =
    deriveDecoder[QueryResponse]

  private def transformImageId(id: String) = {
    id.toCharArray.toList
      .zip(id.toCharArray.toList.indices)
      .map({
        case (c, i) => {
          if (i == 7 || i == 11 || i == 15 || i == 19) s"${c}-" else s"${c}"
        }
      })
      .mkString

  }

  def displayWire(
      wire: FingerpostWireEntry,
      requestingUser: String,
      images: List[Grid]
  ): FingerpostWireEntry = {
    val updatedWire = wire
      .copy(toolLinks =
        ToolLink.display(
          wire.toolLinks,
          requestingUser = requestingUser
        )
      )
      .copy(content =
        wire.content
          .copy(imageIds = wire.content.imageIds.map(transformImageId))
      )
      .copy(imageUrls = images)
    updatedWire
  }

  def getImagesFromGrid(
      wsClient: WSClient,
      imageIds: List[String]
  ): Future[List[Grid]] = {
    Future
      .sequence(imageIds.map(i => {
        val url =
          s"https://api.media.gutools.co.uk/images?query=suppliersReference%3A0${transformImageId(i)}&length=1&orderBy=-uploadTime&countAll=true"
        wsClient
          .url(url)
          .addHttpHeaders(
            "X-Gu-Media-Key" -> "berger-hackday-2026-2U1iI1iPy3TpnaS3yOB82D68fve5MnLCKR5U1pY0rBr55oux"
          )
          .get()
          .map(response => {
            val data = (response.json \ "data").as[List[JsValue]]
            data.map(jsValue => {
              Grid(
                (jsValue \ "data" \ "id").as[String],
                (jsValue \ "data" \ "thumbnail" \ "secureUrl").as[String]
              )
            })
          })
      }))
      .map(_.flatten)
  }
  def display(
      queryResponse: QueryResponse,
      requestingUser: String,
      timeStampColumn: TimeStampColumn
  ): QueryResponse = {
    queryResponse.copy(
      results = queryResponse.results
        .map(wire => displayWire(wire, requestingUser, Nil))
        .sortWith(timeStampColumn.sortDesc)
    )
  }
}
