import com.amazonaws.auth.{
  AWSCredentialsProviderChain,
  DefaultAWSCredentialsProviderChain
}
import com.amazonaws.auth.profile.ProfileCredentialsProvider
import com.amazonaws.regions.Regions
import com.amazonaws.services.s3.AmazonS3ClientBuilder
import com.gu.pandomainauth.PanDomainAuthSettingsRefresher
import com.gu.permissions.{PermissionsConfig, PermissionsProvider}
import conf.Database
import controllers._
import lib.RequestLoggingFilter
import play.api.ApplicationLoader.Context
import play.api.http.JsonHttpErrorHandler
import play.api.libs.ws.ahc.AhcWSComponents
import play.api.mvc.EssentialFilter
import play.api.routing.Router
import play.api.{BuiltInComponentsFromContext, Logging, Mode}
import play.filters.HttpFiltersComponents
import play.filters.gzip.GzipFilter
import router.Routes
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider
import software.amazon.awssdk.regions.Region
import software.amazon.awssdk.services.ssm.SsmClient

class AppComponents(context: Context)
    extends BuiltInComponentsFromContext(context)
    with HttpFiltersComponents
    with AssetsComponents
    with AhcWSComponents
    with Logging {

  override def httpFilters: Seq[EssentialFilter] =
    super.httpFilters ++ Seq(new GzipFilter, new RequestLoggingFilter)

  private val v1Region = Regions.EU_WEST_1
  private val v2Region = Region.EU_WEST_1

  private val awsV2Credentials =
    DefaultCredentialsProvider.builder().profileName("editorial-feeds").build()
  private val ssmClient = SsmClient
    .builder()
    .credentialsProvider(awsV2Credentials)
    .region(v2Region)
    .build()

  if (context.environment.mode == Mode.Dev) {
    if (sys.env.contains("USE_CODE_DB")) {
      Database.configureRemoteDevDb(ssmClient)
    } else {
      Database.configureLocalDevDB()
    }
  } else if (context.environment.mode == Mode.Prod) {
    Database.configureDeployedDb(configuration)
  }

  private val awsV1Credentials = new AWSCredentialsProviderChain(
    new ProfileCredentialsProvider("editorial-feeds"),
    DefaultAWSCredentialsProviderChain.getInstance()
  )

  private val s3v1Client = AmazonS3ClientBuilder
    .standard()
    .withRegion(v1Region.getName)
    .withCredentials(awsV1Credentials)
    .build()

  private val panDomainSettings = new PanDomainAuthSettingsRefresher(
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
      PermissionsConfig(
        stage = permissionsStage,
        region = v1Region.getName,
        awsCredentials = awsV1Credentials
      )
    )
  }

  private val authController = new AuthController(
    controllerComponents,
    configuration,
    wsClient,
    panDomainSettings,
    permissionsProvider
  )

  private val viteController = new ViteController(
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

  private val managementController = new ManagementController(
    controllerComponents
  )

  private val queryController = new QueryController(
    controllerComponents = controllerComponents,
    configuration = configuration,
    wsClient = wsClient,
    permissionsProvider = permissionsProvider,
    panDomainSettings = panDomainSettings
  )

  override lazy val httpErrorHandler = new JsonHttpErrorHandler(environment)

  def router: Router = new Routes(
    errorHandler = httpErrorHandler,
    viteController,
    queryController,
    authController,
    managementController
  )

}
