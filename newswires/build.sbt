import com.typesafe.sbt.packager.archetypes.systemloader.ServerLoader.Systemd
import sbt.Package.FixedTimestamp

import scala.sys.process._

name := """newswires"""
organization := "com.gu"

version := "1.0-SNAPSHOT"

scalaVersion := "2.13.18"

libraryDependencies += ws
libraryDependencies += "com.gu" %% "simple-configuration-ssm" % "8.2.1"
libraryDependencies += "com.gu" %% "pan-domain-auth-play_3-0" % "15.0.0"
libraryDependencies += "com.gu" %% "editorial-permissions-client" % "6.0.2"
libraryDependencies += "org.scalikejdbc" %% "scalikejdbc" % "4.3.5" exclude (
  "org.scala-lang.modules",
  "scala-parser-combinators_2.13"
)
libraryDependencies += "net.logstash.logback" % "logstash-logback-encoder" % "9.0"
libraryDependencies += "org.postgresql" % "postgresql" % "42.7.10"
libraryDependencies += "software.amazon.jdbc" % "aws-advanced-jdbc-wrapper" % "3.0.0"
libraryDependencies += "io.circe" %% "circe-generic" % "0.14.15"
libraryDependencies += "io.circe" %% "circe-parser" % "0.14.15"
libraryDependencies += "org.scala-lang.modules" %% "scala-parser-combinators" % "2.4.0"
libraryDependencies += "org.scalatest" %% "scalatest" % "3.2.19" % "test"
libraryDependencies += "org.scalatestplus.play" %% "scalatestplus-play" % "7.0.2" % Test

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

val jacksonVersion = "2.20.2"
val jacksonAnnotationVersion = "2.21"

dependencyOverrides ++= Seq(
  "com.fasterxml.jackson.core" % "jackson-core",
  "com.fasterxml.jackson.core" % "jackson-databind",
  "com.fasterxml.jackson.datatype" % "jackson-datatype-jdk8",
  "com.fasterxml.jackson.datatype" % "jackson-datatype-jsr310",
  "com.fasterxml.jackson.dataformat" % "jackson-dataformat-cbor",
  "com.fasterxml.jackson.module" % "jackson-module-parameter-names",
  "com.fasterxml.jackson.module" %% "jackson-module-scala"
).map(_ % jacksonVersion) ++ Seq(
  "com.fasterxml.jackson.core" % "jackson-annotations" % jacksonAnnotationVersion,
  "org.scala-lang.modules" %% "scala-parser-combinators" % "2.4.0"
)

dependencyOverrides ++= Seq("autoscaling", "ec2", "ssm", "rds").map(
  "software.amazon.awssdk" % _ % "2.41.14"
)

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
