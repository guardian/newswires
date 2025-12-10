package controllers

import com.gu.pandomainauth.PanDomainAuthSettingsRefresher
import com.gu.pandomainauth.action.UserRequest
import com.gu.permissions.PermissionsProvider
import db.Collection
import play.api.{Configuration, Logging}
import play.api.libs.ws.WSClient
import play.api.mvc.{Action, AnyContent, BaseController, ControllerComponents}
import io.circe.syntax.EncoderOps

import service.FeatureSwitchProvider

class CollectionsController(
    val controllerComponents: ControllerComponents,
    val configuration: Configuration,
    val wsClient: WSClient,
    val permissionsProvider: PermissionsProvider,
    val panDomainSettings: PanDomainAuthSettingsRefresher,
    val featureSwitchProvider: FeatureSwitchProvider
) extends BaseController
    with Logging
    with AppAuthActions {
  def collections: Action[AnyContent] = apiAuthAction {
    request: UserRequest[AnyContent] => Ok(Collection.getAll().asJson.spaces2)
  }

  def collection(
      collectionId: Long
  ): Action[AnyContent] = apiAuthAction { request: UserRequest[AnyContent] =>
    Collection.getByIdWithWireEntries(collectionId) match {
      case Some(collectionWithWires) => Ok(collectionWithWires.asJson.spaces2)
      case None => NotFound(s"Collection with ID $collectionId not found")
    }
  }

  def createCollection(name: String): Action[AnyContent] = apiAuthAction {
    request: UserRequest[AnyContent] =>
      logger.warn(request.body.asText.toString)
      val maybeDescriptionFromBody = request.body.asJson.flatMap { json =>
        (json \ "description").asOpt[String]
      }
      val newId = Collection.insert(name, maybeDescriptionFromBody)
      Ok(s"Created collection with ID: $newId")
  }

  def addToCollection(
      collectionId: Long,
      wireEntryId: Long
  ): Action[AnyContent] = apiAuthAction { request: UserRequest[AnyContent] =>
    Collection.addWireEntryToCollection(
      collectionId,
      wireEntryId,
      Some(request.user.email)
    )
    Ok(s"Added wire entry $wireEntryId to collection $collectionId")
  }

  def removeFromCollection(
      collectionId: Long,
      wireEntryId: Long
  ): Action[AnyContent] = apiAuthAction { request: UserRequest[AnyContent] =>
    Collection.removeWireEntryFromCollection(
      collectionId,
      wireEntryId
    )
    Ok(s"Removed wire entry $wireEntryId from collection $collectionId")
  }

}
