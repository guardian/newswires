package controllers

import com.gu.pandomainauth.PanDomainAuthSettingsRefresher
import com.gu.pandomainauth.action.UserRequest
import com.gu.pandomainauth.model.User
import com.gu.permissions.PermissionsProvider
import play.api.libs.json.{Json, OFormat}
import play.api.libs.ws.WSClient
import play.api.mvc._
import play.api.{Configuration, Mode}
import play.filters.csrf.CSRFAddToken
import service.FeatureSwitchProvider
import views.html.helper.CSRF

import java.net.URL
import scala.concurrent.{ExecutionContext, Future}
import scala.io.Source

case class ClientConfig(
    switches: Map[String, Boolean],
    stage: String,
    sendTelemetryAsDev: Boolean
)

object ClientConfig {

  implicit val clientConfigFormat: OFormat[ClientConfig] =
    Json.format[ClientConfig]
}

class ViteController(
    val controllerComponents: ControllerComponents,
    val configuration: Configuration,
    val wsClient: WSClient,
    val panDomainSettings: PanDomainAuthSettingsRefresher,
    assets: Assets,
    assetsFinder: AssetsFinder,
    mode: Mode,
    addToken: CSRFAddToken,
    val permissionsProvider: PermissionsProvider,
    val featureSwitchProvider: FeatureSwitchProvider
)(implicit executionContext: ExecutionContext)
    extends BaseController
    with AppAuthActions {
  private def select(
      map: Map[String, scala.collection.Seq[String]],
      list: Seq[String]
  ) = {
    list.flatMap { key => map.get(key).map(key -> _.head) }
  }
  private val headersToKeep =
    Seq(CACHE_CONTROL, ETAG, DATE, ACCESS_CONTROL_ALLOW_ORIGIN)
  private val devEmails = configuration.get[String]("devEmails").split(",")

  private def injectClientCodeIntoPageBody(
      html: String
  )(implicit request: UserRequest[AnyContent]): String = {
    def injectCsrf[A](
        body: String
    )(implicit request: Request[A]): String = {
      val csrf = CSRF.getToken

      body
        .replaceAll("@csrf\\.name", csrf.name)
        .replaceAll("@csrf\\.value", csrf.value)
    }

    def injectClientConfig[A](
        body: String
    )(implicit request: UserRequest[A]): String = {
      val config =
        views.html.fragments.clientConfig(
          ClientConfig(
            featureSwitchProvider.clientSideSwitchStates,
            stage = configuration.get[String]("stage"),
            sendTelemetryAsDev = devEmails.exists(request.user.email.startsWith)
          )
        )

      body.replace(
        "</head>",
        s"""
           | <!-- Client config added at runtime by ViteController. -->
           |$config
           |</head>""".stripMargin
      )
    }

    val withInjectedCsrf = injectCsrf(html)(request)
    injectClientConfig(withInjectedCsrf)(request)

  }

  def item(id: String): Action[AnyContent] = index
  def index: Action[AnyContent] = addToken(
    authAction.async { implicit request =>
      if (mode == Mode.Dev) {
        proxyAsset("index.html", request)
      } else {
        Future {
          val assetPath =
            assetsFinder.assetsBasePath.stripPrefix(
              "/"
            ) + assetsFinder.unprefixed.path(
              "index.html"
            )
          val indexHtml = Source.fromResource(assetPath).mkString
          val withClientConfig = injectClientCodeIntoPageBody(indexHtml)

          Ok(withClientConfig).as(HTML)
        }
      }
    }
  )
  def preview: Action[AnyContent] = addToken(asset("preview.html"))

  def asset(resource: String): Action[AnyContent] = authAction.async {
    request =>
      if (mode == Mode.Dev) {
        proxyAsset(resource, request)
      } else {
        assets.at(resource)(request)
      }
  }

  private def proxyAsset(
      resource: String,
      request: UserRequest[AnyContent]
  ): Future[Result] = {
    val query =
      if (request.rawQueryString.nonEmpty) "?" + request.rawQueryString
      else ""
    val location =
      new URL(
        "http",
        "localhost",
        5173,
        "/assets/" + resource + query
      ).toString

    wsClient
      .url(location)
      .withMethod(request.method)
      .withFollowRedirects(false)
      .execute()
      .map(res => {
        val headers = select(res.headers, headersToKeep)
        val contentType =
          res.headers.get(CONTENT_TYPE).flatMap(_.headOption)
        val body =
          if (resource == "index.html")
            injectClientCodeIntoPageBody(res.bodyAsBytes.utf8String)(
              request
            )
          else res.bodyAsBytes.utf8String

        Ok(body)
          .as(contentType.getOrElse(TEXT))
          .withHeaders(headers: _*)
      })
  }
}
