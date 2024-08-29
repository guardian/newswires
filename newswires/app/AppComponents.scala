import controllers.AssetsComponents
import controllers.HomeController
import controllers.ViteController
import play.api.ApplicationLoader.Context
import play.api.mvc.EssentialFilter
import play.api.routing.Router
import play.api.{BuiltInComponentsFromContext, Logging, Mode}
import play.filters.HttpFiltersComponents
import play.filters.gzip.GzipFilter
import router.Routes
import play.api.libs.ws.ahc.AhcWSComponents
import com.amazonaws.auth.AWSCredentialsProviderChain
import com.amazonaws.auth.profile.ProfileCredentialsProvider
import com.amazonaws.auth.DefaultAWSCredentialsProviderChain
import com.amazonaws.services.s3.AmazonS3ClientBuilder
import com.gu.pandomainauth.PanDomainAuthSettingsRefresher
import com.gu.permissions.PermissionsProvider
import com.gu.permissions.PermissionsConfig
import com.amazonaws.regions.Regions
import controllers.AuthController

class AppComponents(context: Context)
    extends BuiltInComponentsFromContext(context)
    with HttpFiltersComponents
    with AssetsComponents
    with AhcWSComponents
    with Logging {

  val region = Regions.EU_WEST_1

  val awsV1Credentials = new AWSCredentialsProviderChain(
    new ProfileCredentialsProvider("editorial-feeds"),
    DefaultAWSCredentialsProviderChain.getInstance()
  )
  val s3v1Client = AmazonS3ClientBuilder
    .standard()
    .withRegion(region.getName())
    .withCredentials(awsV1Credentials)
    .build()


  val panDomainSettings = new PanDomainAuthSettingsRefresher(
    domain = configuration.get[String]("pandomain.domain"),
    settingsFileKey = configuration.get[String]("pandomain.settingsFileKey"),
    system = "newswires",
    bucketName = configuration.get[String]("pan-domain-settings-bucket"),
    s3Client = s3v1Client
  )


  private val permissionsProvider = {
    val stage = configuration.get[String]("stage")
    val permissionsStage = stage match {
      case "dev" =>
        "CODE" // Local dev uses CODE permissions. Stage is set to lowercase 'dev' my our AppLoader.
      case _ => stage
    }
    PermissionsProvider(
      PermissionsConfig(stage = permissionsStage, region.getName(), awsV1Credentials)
    )
  }


  val homeController = new HomeController(controllerComponents)

  private val authController = new AuthController(
    controllerComponents,
    configuration,
    wsClient,
    panDomainSettings,
    permissionsProvider
  )

  val viteController = new ViteController(
    controllerComponents = controllerComponents,
    configuration = configuration,
    wsClient = wsClient,
    panDomainSettings = panDomainSettings,
    assets = assets,
    assetsFinder = assetsFinder,
    mode = context.environment.mode,
    addToken = csrfAddToken,
    permissionsProvider = permissionsProvider
  )

  def router: Router = new Routes(
    errorHandler = httpErrorHandler,
    viteController,
    homeController,
    authController,
  )

}
