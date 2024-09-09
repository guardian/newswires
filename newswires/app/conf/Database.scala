package conf

import play.api._
import scalikejdbc._
import software.amazon.awssdk.services.ssm.SsmClient
import software.amazon.awssdk.services.ssm.model.GetParameterRequest
import software.amazon.jdbc.ds.AwsWrapperDataSource

import java.util.Properties

object Database extends Logging {

  def healthcheck = {
    DB localTx { implicit session =>
      sql""" SELECT 1 as successes """
        .map(_.int("successes"))
        .single()
        .apply()
        .get
    }
  }

  // def getDevDbConfig(initialConfiguration: Configuration): Configuration = {
  //   logger.info("building DB config for DEV")
  //   val username = initialConfiguration
  //     .get[String]("database.username")
  //   val port =
  //     initialConfiguration.get[Int]("database.port")
  //   val hostname = initialConfiguration.get[String]("database.endpoint-address")
  //   val password = initialConfiguration
  //     .get[String]("database.password")
  //
  //   val configuration =
  //     Map(
  //       "user" -> username,
  //       "portNumber" -> port,
  //       "serverName" -> hostname,
  //       "databaseName" -> "birthdays",
  //       "password" -> password
  //     )
  //
  //   Configuration.from(
  //     Map(
  //       "slick.dbs.default.db.properties" -> configuration
  //     )
  //   )
  // }

  def configureDeployedDb(
      configuration: Configuration
  ): Unit = {
    logger.info(
      "building DB config to connect to a production DB (CODE or PROD)"
    )

    val username = configuration.get[String]("database.username")
    val port = configuration.get[String]("database.port")
    val address = configuration.get[String]("database.endpoint-address")
    val databaseName = configuration.get[String]("database.database-name")

    val ds = new AwsWrapperDataSource
    ds.setJdbcProtocol("jdbc:postgresql:")
    ds.setServerName(address)
    ds.setDatabase(databaseName)
    ds.setServerPort(port)
    ds.setTargetDataSourceClassName("org.postgresql.ds.PGSimpleDataSource")
    ds.setTargetDataSourceProperties(new Properties() {
      setProperty("wrapperPlugins", "iam")
      setProperty("iamRegion", "eu-west-1")
      setProperty("user", username)
    })

    ConnectionPool.singleton(new DataSourceConnectionPool(ds))
  }

  def configureRemoteDevDb(
      ssm: SsmClient
  ): Unit = {
    logger.info("building DB config for connecting to CODE DB from local")

    val stack = "editorial-feeds"
    val stage = "CODE"
    val app = "newswires"
    val ssa = s"/$stage/$stack/$app"

    def getParamDirectly(name: String): String = {
      val request = GetParameterRequest.builder().name(s"$ssa/$name").build()
      val respo = ssm.getParameter(request)
      respo.parameter().value()
    }

    val username = getParamDirectly("database/username")
    val port = getParamDirectly("database/port")
    val address = getParamDirectly("database/endpoint-address")
    val databaseName = getParamDirectly("database/database-name")

    val ds = new AwsWrapperDataSource()
    ds.setJdbcProtocol("jdbc:postgresql:")
    ds.setServerName("localhost")
    ds.setDatabase(databaseName)
    ds.setServerPort(port)
    ds.setTargetDataSourceClassName("org.postgresql.ds.PGSimpleDataSource")
    ds.setTargetDataSourceProperties(new Properties() {
      setProperty("wrapperPlugins", "iam")
      setProperty("iamRegion", "eu-west-1")
      setProperty("iamHost", address)
      setProperty("user", username)
      setProperty("awsProfile", "editorial-feeds")
    })

    ConnectionPool.singleton(new DataSourceConnectionPool(ds))
  }
}
