import controllers.AssetsComponents
import controllers.HomeController
import play.api.ApplicationLoader.Context
import play.api.mvc.EssentialFilter
import play.api.routing.Router
import play.api.{BuiltInComponentsFromContext, Logging, Mode}
import play.filters.HttpFiltersComponents
import play.filters.gzip.GzipFilter
import router.Routes

class AppComponents(context: Context)
    extends BuiltInComponentsFromContext(context)
    with HttpFiltersComponents
    with AssetsComponents
    with Logging {

  def router: Router = new Routes(
    httpErrorHandler,
    new HomeController(controllerComponents),
    assets
  )

}
