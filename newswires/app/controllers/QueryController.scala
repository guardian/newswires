package controllers

import com.gu.pandomainauth.PanDomainAuthSettingsRefresher
import com.gu.pandomainauth.action.UserRequest
import com.gu.permissions.PermissionsProvider
import conf.SearchBuckets
import db.{FingerpostWireEntry, SearchParams}
import play.api.libs.json.{Json, OFormat}
import play.api.libs.ws.WSClient
import play.api.mvc.{
  Action,
  AnyContent,
  BaseController,
  ControllerComponents,
  Request
}
import play.api.{Configuration, Logging}
import service.FeatureSwitchProvider

class QueryController(
    val controllerComponents: ControllerComponents,
    val configuration: Configuration,
    val wsClient: WSClient,
    val permissionsProvider: PermissionsProvider,
    val panDomainSettings: PanDomainAuthSettingsRefresher
) extends BaseController
    with Logging
    with AppAuthActions {
  private def paramToList[T](
      request: Request[T],
      paramName: String
  ): List[String] =
    request.getQueryString(paramName).map(_.split(",").toList).getOrElse(Nil)

  def query(
      maybeFreeTextQuery: Option[String],
      maybeKeywords: Option[String],
      suppliers: List[String],
      subjects: List[String],
      subjectsExcl: List[String],
      categoryCode: List[String],
      categoryCodeExcl: List[String],
      maybeBeforeId: Option[Int],
      maybeSinceId: Option[Int]
  ): Action[AnyContent] = apiAuthAction { request: UserRequest[AnyContent] =>
    val bucket = request.getQueryString("bucket").flatMap(SearchBuckets.get)

    val suppliersToExcludeByDefault =
      if (FeatureSwitchProvider.ShowGuSuppliers.isOn) List("GuReuters", "GuAP")
      else Nil

    val queryParams = SearchParams(
      text = maybeFreeTextQuery,
      keywordIncl = maybeKeywords.map(_.split(",").toList).getOrElse(Nil),
      keywordExcl = paramToList(request, "keywordsExcl"),
      suppliersIncl = suppliers,
      suppliersExcl = request.queryString
        .get("supplierExcl")
        .map(_.toList)
        .getOrElse(Nil) ++ suppliersToExcludeByDefault,
      subjectsIncl = subjects,
      subjectsExcl = subjectsExcl,
      categoryCodesIncl = categoryCode,
      categoryCodesExcl = categoryCodeExcl
    )

    val mergedParams = bucket.map(_ merge queryParams).getOrElse(queryParams)

    Ok(
      Json.toJson(
        FingerpostWireEntry.query(
          mergedParams,
          maybeBeforeId,
          maybeSinceId,
          pageSize = 30
        )
      )
    )
  }

  def keywords(
      maybeInLastHours: Option[Int],
      maybeLimit: Option[Int]
  ): Action[AnyContent] = apiAuthAction {
    val results = FingerpostWireEntry.getKeywords(maybeInLastHours, maybeLimit)
    Ok(Json.toJson(results))
  }

  def item(id: Int, maybeFreeTextQuery: Option[String]): Action[AnyContent] =
    apiAuthAction {
      FingerpostWireEntry.get(id, maybeFreeTextQuery) match {
        case Some(entry) => Ok(Json.toJson(entry))
        case None        => NotFound
      }
    }

  def linkToComposer(id: Int): Action[AnyContent] = apiAuthAction {
    request: UserRequest[AnyContent] =>
      request.body.asJson
        .flatMap(_.asOpt[ComposerLinkRequest])
        .map(params =>
          FingerpostWireEntry
            .insertComposerId(id, params.composerId, params.sentBy)
        ) match {
        case Some(1) => Accepted
        case Some(0) =>
          logger.error(
            s"Composer link request for $id returned 0 updates - this probably means one was already set!"
          )
          Conflict("Composer ID already set")
        case Some(_) =>
          logger.error(
            s"Composer link request for $id returned multiple updates. How did that happen?"
          )
          InternalServerError
        case None =>
          logger.error(
            s"Composer link request for $id was not JSON or missed required parameter"
          )
          BadRequest(
            "Composer link request was not JSON or missed required parameter"
          )
      }
  }

}

case class ComposerLinkRequest(composerId: String, sentBy: String)
object ComposerLinkRequest {
  implicit val format: OFormat[ComposerLinkRequest] =
    Json.format[ComposerLinkRequest]
}
