import com.gu.conf.{ConfigurationLoader, SSMConfigurationLocation}
import com.gu.{AppIdentity, AwsIdentity, DevIdentity}
import play.api.ApplicationLoader.Context
import play.api._
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider

import scala.annotation.unused
import scala.util.{Success, Try}
import java.util.TimeZone

// Accessed via reflection from configuration: see application.conf
@unused
class AppLoader extends ApplicationLoader with Logging {
  def load(context: Context): Application = {
    LoggerConfigurator(context.environment.classLoader).foreach {
      _.configure(context.environment, context.initialConfiguration, Map.empty)
    }

    // Ensure JVM uses UTC to prevent unexpected timezone conversions in database queries
    System.setProperty("user.timezone", "UTC")
    TimeZone.setDefault(TimeZone.getTimeZone("UTC"))

    val discoveredIdentity = Identity.discover(context)

    val loadedConfig = for {
      identity <- discoveredIdentity
      config <- Try(ConfigurationLoader.load(identity) {
        case identity: AwsIdentity =>
          SSMConfigurationLocation.default(identity)
      })
      stage <- discoveredIdentity.map({
        case id: AwsIdentity => id.stage
        case _               => "dev"
      })
      configWithStage = Configuration
        .from(Map("stage" -> stage))
        .withFallback(Configuration(config))
    } yield configWithStage

    loadedConfig.fold(
      err => {
        logger.error(s"Failed to start application due to $err", err)
        throw err
      },
      config => {
        val configuration = config
          .withFallback(context.initialConfiguration)

        val newContext = context.copy(initialConfiguration = configuration)

        new AppComponents(newContext).application
      }
    )
  }

}

object Identity {
  def discover(context: Context): Try[AppIdentity] = {
    if (context.environment.mode == Mode.Dev)
      Success(DevIdentity("newswires"))
    else
      AppIdentity.whoAmI(
        defaultAppName = "newswires",
        DefaultCredentialsProvider.builder().build()
      )
  }
}
