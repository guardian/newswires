package controllers

import com.gu.pandomainauth.PanDomainAuthSettingsRefresher
import com.gu.pandomainauth.action.UserRequest
import com.gu.permissions.PermissionsProvider
import conf.{SearchPresets, SearchTerm}
import io.circe.syntax.EncoderOps
import db.FingerpostWireEntry._
import models.{NextPage, QueryParams, SearchParams}
import db._
import lib.Base64Encoder
import play.api.libs.json.{Json, OFormat}
import play.api.libs.ws.WSClient
import play.api.mvc._
import play.api.{Configuration, Logging}
import service.FeatureSwitchProvider

import java.time.Instant

class QueryController(
    val controllerComponents: ControllerComponents,
    val configuration: Configuration,
    val wsClient: WSClient,
    val permissionsProvider: PermissionsProvider,
    val panDomainSettings: PanDomainAuthSettingsRefresher,
    val featureSwitchProvider: FeatureSwitchProvider
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
      keywords: List[String],
      suppliers: List[String],
      categoryCode: List[String],
      categoryCodeExcl: List[String],
      maybeStart: Option[String],
      maybeEnd: Option[String],
      maybeBeforeId: Option[Int],
      maybeSinceId: Option[Int],
      hasDataFormatting: Option[Boolean]
  ): Action[AnyContent] = apiAuthAction { request: UserRequest[AnyContent] =>
    val maybePreset =
      request.getQueryString("preset").flatMap(SearchPresets.get)

    val maybeSearchTerm = maybeFreeTextQuery.map(SearchTerm.English(_))

    val dotCopyIsSelected =
      request.getQueryString("preset").contains("dot-copy")
    val dotCopyExclusion =
      Option.when(!dotCopyIsSelected)("UNAUTHED_EMAIL_FEED").toList
    val suppliersToExcludeByDefault =
      if (featureSwitchProvider.ShowGuSuppliers.isOn())
        List("GuReuters", "GuAP").filterNot(
          suppliers.contains
        ) ++ dotCopyExclusion
      else dotCopyExclusion

    val suppliersExcl = request.queryString
      .get("supplierExcl")
      .map(_.toList)
      .getOrElse(Nil) ++ suppliersToExcludeByDefault

    val keywordsExcl =
      request.queryString.get("keywordExcl").map(_.toList).getOrElse(Nil)

    val searchParams = SearchParams(
      text = maybeSearchTerm,
      start = maybeStart,
      end = maybeEnd,
      keywordIncl = keywords,
      keywordExcl = keywordsExcl,
      suppliersIncl = suppliers,
      suppliersExcl = suppliersExcl,
      categoryCodesIncl = categoryCode,
      categoryCodesExcl = categoryCodeExcl,
      hasDataFormatting = hasDataFormatting
    )

    val queryParams = QueryParams(
      searchParams = searchParams,
      savedSearchParamList = maybePreset.getOrElse(Nil),
      maybeSearchTerm = maybeSearchTerm,
      maybeBeforeId = maybeBeforeId,
      maybeSinceId = maybeSinceId.map(NextPage(_)),
      pageSize = 30
    )

    Ok(
      FingerpostWireEntry
        .query(
          queryParams
        )
        .asJson
        .spaces2
    )
  }

  def keywords(
      maybeInLastHours: Option[Int],
      maybeLimit: Option[Int]
  ): Action[AnyContent] = apiAuthAction {
    val results = FingerpostWireEntry.getKeywords(maybeInLastHours, maybeLimit)
    Ok(results.asJson.spaces2)
  }

  def item(id: Int, maybeFreeTextQuery: Option[String]): Action[AnyContent] =
    apiAuthAction { request: UserRequest[AnyContent] =>
      FingerpostWireEntry.get(
        id,
        maybeFreeTextQuery.map(SearchTerm.English(_)),
        requestingUser = Some(request.user.username)
      ) match {
        case Some(entry) => Ok(entry.asJson.spaces2)
        case None        => NotFound
      }
    }

  private val newswiresHost = configuration.get[String]("host")
  private val composerHost = newswiresHost.replace("newswires", "composer")

  def getIncopyImportUrl(id: Int): Action[AnyContent] = apiAuthAction {
    request: UserRequest[AnyContent] =>
      FingerpostWireEntry.get(id, None) match {
        case Some(entry) =>
          ToolLink.insertIncopyLink(
            id,
            request.user.username,
            sentAt = Instant.now()
          )
          val serialised = entry.asJson.spaces2
          val compressedEncodedEntry =
            Base64Encoder.compressAndEncode(serialised)
          Ok(s"newswires://$newswiresHost?data=$compressedEncodedEntry")
        case None => NotFound
      }
  }

  def linkToComposer(id: Int): Action[AnyContent] = apiAuthAction {
    request: UserRequest[AnyContent] =>
      request.body.asJson
        .flatMap(_.asOpt[ComposerLinkRequest])
        .map(params =>
          ToolLink.insertComposerLink(
            newswiresId = id,
            composerId = params.composerId,
            composerHost = composerHost,
            sentBy = request.user.username,
            sentAt = Instant.now()
          )
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

case class ComposerLinkRequest(composerId: String)
object ComposerLinkRequest {
  implicit val format: OFormat[ComposerLinkRequest] =
    Json.format[ComposerLinkRequest]
}
