package controllers

import com.gu.pandomainauth.PanDomainAuthSettingsRefresher
import com.gu.permissions.PermissionsProvider
import play.api.libs.ws.WSClient
import play.api.mvc._
import play.api.{Configuration, Mode}
import play.filters.csrf.CSRFAddToken
import views.html.helper.CSRF

import java.net.URL
import scala.concurrent.{ExecutionContext, Future}
import scala.io.Source

class ViteController(
    val controllerComponents: ControllerComponents,
    val configuration: Configuration,
    val wsClient: WSClient,
    val panDomainSettings: PanDomainAuthSettingsRefresher,
    assets: Assets,
    assetsFinder: AssetsFinder,
    mode: Mode,
    addToken: CSRFAddToken,
    val permissionsProvider: PermissionsProvider
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

  private def injectCsrf[A](
      body: String
  )(implicit request: Request[A]): String = {
    val csrf = CSRF.getToken

    body
      .replaceAll("@csrf\\.name", csrf.name)
      .replaceAll("@csrf\\.value", csrf.value)
  }

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
          val withInjectedCsrf = injectCsrf(indexHtml)

          Ok(withInjectedCsrf).as(HTML)
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
      request: Request[AnyContent]
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
            injectCsrf(res.bodyAsBytes.utf8String)(request)
          else res.bodyAsBytes.utf8String

        Ok(body)
          .as(contentType.getOrElse(TEXT))
          .withHeaders(headers: _*)
      })
  }
}
