addSbtPlugin("org.playframework" % "sbt-plugin" % "3.0.9")
addSbtPlugin("org.scalameta" % "sbt-scalafmt" % "2.5.5")
addSbtPlugin("com.eed3si9n" % "sbt-buildinfo" % "0.13.1")
addSbtPlugin("net.virtual-void" % "sbt-dependency-graph" % "0.10.0-RC1")
libraryDependencies += "org.vafer" % "jdeb" % "1.14" artifacts (Artifact(
  "jdeb",
  "jar",
  "jar"
))
