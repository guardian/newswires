addSbtPlugin("org.playframework" % "sbt-plugin" % "3.0.5")
addSbtPlugin("org.scalameta" % "sbt-scalafmt" % "2.5.2")
addSbtPlugin("com.eed3si9n" % "sbt-buildinfo" % "0.12.0")
libraryDependencies += "org.vafer" % "jdeb" % "1.10" artifacts (Artifact(
  "jdeb",
  "jar",
  "jar"
))
