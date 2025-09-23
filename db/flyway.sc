#!/usr/bin/env -S scala-cli shebang -S 3.3

//> using jvm "corretto:17"

//> using dep com.lihaoyi::ujson:4.2.1
//> using dep org.flywaydb:flyway-core:11.9.1
//> using dep org.flywaydb:flyway-database-postgresql:11.9.1
//> using dep org.postgresql:postgresql:42.7.5
//> using dep software.amazon.awssdk:rds:2.31.61
//> using dep software.amazon.awssdk:secretsmanager:2.31.61
import java.nio.file.Path
import software.amazon.awssdk.services.rds.model.GenerateAuthenticationTokenRequest
import software.amazon.awssdk.services.rds.RdsClient

import org.flywaydb.core.Flyway
import scala.io.StdIn.readLine
import scala.jdk.CollectionConverters._
import scala.util.Try
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider
import software.amazon.awssdk.regions.Region
import software.amazon.awssdk.services.secretsmanager.SecretsManagerClient
import software.amazon.awssdk.services.secretsmanager.model.GetSecretValueRequest
import software.amazon.awssdk.services.secretsmanager.model.PutSecretValueRequest

type Row = List[String]
type Table = List[Row]


def infoCmd(env: String, flyway: Flyway): Unit = {

  val table: Table = (flyway
    .info()
    .all()
    .toList
    .map(info =>
      List(
        info.getVersion().getVersion(),
        info.getDescription(),
        Try(info.getInstalledOn().toString()).getOrElse(""),
        Try(info.getState().toString()).getOrElse("")
      )
    ))

  tabulate(List("version", "description", "installed on", "state"), table)

  def tabulate(headers: Row, t: Table) = {
    val widths = (headers +: t).transpose.map(_.map(_.length).max)
    val totalWidth = widths.sum + widths.size * 3 - 1

    def pad(cols: List[String]) =
      cols.zipWithIndex.map(pair => pair._1.padTo(widths(pair._2), ' '))

    println("+" + "-" * totalWidth + "+")

    println(pad(headers).mkString("| ", " | ", " |"))

    println("+" + "-" * totalWidth + "+")

    for (row <- t) {
      println(pad(row).mkString("| ", " | ", " |"))
    }

    println("+" + "-" * totalWidth + "+")
  }
}

val credentials =
  DefaultCredentialsProvider.builder().profileName("editorial-feeds").build()
val secretsManager =
  SecretsManagerClient
    .builder()
    .credentialsProvider(credentials)
    .region(Region.EU_WEST_1)
    .build()
def migrateCmd(env: String, flyway: Flyway): Unit = {

  println()
  println("Validating migration schema...")
  println()

  println("Current migration info:" )

  flyway.info().all().toList.sortBy(s => Try(s.getInstalledOn().getTime()).getOrElse(0l)).headOption.foreach(info =>
    secretsManager.putSecretValue(
      PutSecretValueRequest
        .builder()
        .secretId("SECRET_ID")
        .secretString(s"${info.getVersion().getVersion()}")
        .build()
    )
  )
  val pendingMigrations = flyway.info().pending()
  println()

  if (pendingMigrations.isEmpty) {
    println("No migrations needed, exiting...")
  } else {
    println("Validation succeeded")
    println(
      s"Ready to run ${pendingMigrations.length} migrations on the $env environment database!"
    )
    print(s"Are you sure these migrations are ready to run? (y/N) ")

    val decision = readLine()

    if (decision.trim().toLowerCase().startsWith("y")) {
      flyway.migrate()
      println("All migrations run, exiting successfully")
    } else {
      println("No migrations run, exiting as requested")
      sys.exit(2)
    }
  }
}

def localFlyway(password: String, port: Int): Flyway = buildFlyway(password, port)

val location = Path.of(scriptPath).getParent().resolve("migrations").toString()

def buildFlyway(password: String, port: Int) =
  Flyway
    .configure()
    .dataSource(
      s"jdbc:postgresql://localhost:$port/newswires",
      "postgres",
      password
    )
    .locations(s"filesystem:$location")
    .load()

def remoteFlyway(stage: String): Flyway = {


  val matchingSecret = secretsManager
    .listSecrets()
    .secretList()
    .asScala
    .find(secret => {
      val tags = secret.tags().asScala
      secret.name().contains("NewswiresDBNewswiresSecret") && tags.exists(tag =>
        tag.key == "App" && tag.value == "newswires"
      ) && tags.exists(tag => tag.key == "Stage" && tag.value == stage)
    })
    .getOrElse {
      println("No secret matching the expected name or tags!")
      sys.exit(1)
    }

  val getSecretRequest = GetSecretValueRequest
    .builder()
    .secretId(matchingSecret.arn())
    .build()

  val response = secretsManager.getSecretValue(getSecretRequest)

  val secretData = ujson.read(response.secretString())

  val rds = RdsClient
    .builder()
    .credentialsProvider(credentials)
    .region(Region.EU_WEST_1)
    .build()

  val generateTokenRequest = GenerateAuthenticationTokenRequest
    .builder()
    .credentialsProvider(credentials)
    .username("postgres")
    .port(5432)
    .hostname(secretData("host").str)
    .build()

  val token = rds.utilities().generateAuthenticationToken(generateTokenRequest)

  buildFlyway(token, 5432)
}

val command = args.lift(0) match {
  case Some("info")    => infoCmd
  case Some("migrate") => migrateCmd
  case o =>
    val msg = o.fold("No command specified!")(cmd => s"Unknown command $cmd!")
    println(s"$msg Try again with one of `info`, `migrate`")
    sys.exit(1)
}

val (env, flyway) = args.lift(1).map(_.toLowerCase()) match {
  case Some("local") => ("local", localFlyway("postgres", 5432))
  case Some("test")  => ("test", localFlyway("testpassword", 55432)) 
  case Some("code")  => ("code", remoteFlyway("CODE"))
  case Some("prod")  => ("prod", remoteFlyway("PROD"))
  case o =>
    val msg = o.fold("No environment specified!")(env => s"Unknown env $env!")
    println(s"$msg Try again with one of `local`, `code` or `prod`")
    sys.exit(1)
}

command(env, flyway)
