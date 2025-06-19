import com.typesafe.sbt.packager.archetypes.systemloader.ServerLoader.Systemd
import sbt.Package.FixedTimestamp

import scala.sys.process._

name := """newswires"""
organization := "com.gu"

version := "1.0-SNAPSHOT"

scalaVersion := "2.13.16"

libraryDependencies += ws
libraryDependencies += "com.gu" %% "simple-configuration-ssm" % "5.0.0"
libraryDependencies += "com.gu" %% "pan-domain-auth-play_3-0" % "7.0.0"
libraryDependencies += "com.gu" %% "editorial-permissions-client" % "4.0.0"
libraryDependencies += "net.logstash.logback" % "logstash-logback-encoder" % "8.1"
libraryDependencies += "org.scalikejdbc" %% "scalikejdbc" % "3.5.0"
libraryDependencies += "org.postgresql" % "postgresql" % "42.7.7"
libraryDependencies += "software.amazon.jdbc" % "aws-advanced-jdbc-wrapper" % "2.3.7"

libraryDependencies += "org.scalatest" %% "scalatest" % "3.0.9" % "test"
libraryDependencies += "org.scalatestplus.play" %% "scalatestplus-play" % "7.0.1" % Test

lazy val root = (project in file(".")).enablePlugins(
  PlayScala,
  PlayVite,
  DebianPlugin,
  SbtWeb,
  SystemdPlugin,
  JDebPackaging,
  BuildInfoPlugin
)

buildInfoKeys := Seq[BuildInfoKey](
  name,
  "gitCommitId" -> (Option(System.getenv("GITHUB_SHA")) getOrElse (try {
    "git rev-parse HEAD".!!.trim
  } catch {
    case e: Exception => "unknown"
  }))
)

/* Start of fix for CVE-2020-36518 in Jackson See:https://github.com/orgs/playframework/discussions/11222 */
val jacksonVersion = "2.13.5" // or 2.12.7
val jacksonDatabindVersion = "2.13.5" // or 2.12.7.1

val jacksonOverrides = Seq(
  "com.fasterxml.jackson.core" % "jackson-core",
  "com.fasterxml.jackson.core" % "jackson-annotations",
  "com.fasterxml.jackson.datatype" % "jackson-datatype-jdk8",
  "com.fasterxml.jackson.datatype" % "jackson-datatype-jsr310"
).map(_ % jacksonVersion)

val jacksonDatabindOverrides = Seq(
  "com.fasterxml.jackson.core" % "jackson-databind" % jacksonDatabindVersion
)

val akkaSerializationJacksonOverrides = Seq(
  "com.fasterxml.jackson.dataformat" % "jackson-dataformat-cbor",
  "com.fasterxml.jackson.module" % "jackson-module-parameter-names",
  "com.fasterxml.jackson.module" %% "jackson-module-scala"
).map(_ % jacksonVersion)

dependencyOverrides ++= jacksonDatabindOverrides ++ jacksonOverrides ++ akkaSerializationJacksonOverrides
/* End of fix for CVE-2020-36518 in Jackson */

// needed to parse conditional statements in `logback.xml`
// i.e. to only log to disk in DEV
// see: https://logback.qos.ch/setup.html#janino
libraryDependencies += "org.codehaus.janino" % "janino" % "3.1.12"

// Quietly remove logback from the classpath and replace with a no-op logger for nice, quiet tests :)
// based on https://stackoverflow.com/q/41429625
libraryDependencies += "org.slf4j" % "slf4j-nop" % "2.0.17" % Test
(Test / dependencyClasspath) ~= {
  _.filterNot(_.data.name.contains("logback-classic"))
}

Compile / doc / sources := Seq.empty
Compile / packageDoc / publishArtifact := false

// Adds additional packages into Twirl
//TwirlKeys.templateImports += "com.gu.controllers._"

// Adds additional packages into conf/routes
// play.sbt.routes.RoutesKeys.routesImport += "com.gu.binders._"

// ------ Packaging settings ------

/* use package name without version and `_all` */
Debian / packageName := normalizedName.value

/* We need to keep the timestamps to allow caching headers to work as expected on assets */
ThisBuild / packageOptions += FixedTimestamp(Package.keepTimestamps)

/* normalise Debian package name */
val normalisePackageName =
  taskKey[Unit]("Rename debian package name to be normalised")

normalisePackageName := {
  val targetDirectory = baseDirectory.value / "target"
  val debFile = (targetDirectory ** "*.deb").get().head
  val newFile =
    file(debFile.getParent) / ((Debian / packageName).value + ".deb")

  IO.move(debFile, newFile)
}

/* A debian package needs some mandatory settings to be valid */
maintainer := "The Guardian ed tools team"
Debian / packageSummary := "New wires"
Debian / packageDescription := "New wires"

Debian / packageBin := (Debian / packageBin)
  .dependsOn(Assets / packageBin)
  .value

/* While not mandatory it is still highly recommended to add relevant JRE package as a dependency */
Debian / debianPackageDependencies := Seq("java17-runtime-headless")

/* Use systemd to load this service */
Debian / serverLoading := Some(Systemd)
Debian / serviceAutostart := true

/* Configure the Java options with which the executable will be launched */
Universal / javaOptions ++= Seq(
  // -J params will be added as jvm parameters
  "-J-XX:MaxRAMPercentage=75",
  "-J-XshowSettings:vm",
  // Remove the PID file
  "-Dpidfile.path=/dev/null"
)
