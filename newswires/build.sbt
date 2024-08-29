name := """newswires"""
organization := "com.gu"

version := "1.0-SNAPSHOT"

lazy val root = (project in file(".")).enablePlugins(PlayScala, PlayVite)

scalaVersion := "2.13.14"

libraryDependencies += ws
libraryDependencies += "com.gu" %% "simple-configuration-ssm" % "1.6.4"
libraryDependencies += "com.gu" %% "pan-domain-auth-play_3-0" % "4.0.0"
libraryDependencies += "com.gu" %% "editorial-permissions-client" % "2.15"



libraryDependencies += "org.scalatestplus.play" %% "scalatestplus-play" % "7.0.1" % Test

// Adds additional packages into Twirl
//TwirlKeys.templateImports += "com.gu.controllers._"

// Adds additional packages into conf/routes
// play.sbt.routes.RoutesKeys.routesImport += "com.gu.binders._"
