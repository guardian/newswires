package models

import org.scalatest.flatspec.AnyFlatSpec
import org.scalatest.matchers.should.Matchers.convertToAnyShouldWrapper
import play.api.libs.json.{JsSuccess, Json}

class FingerpostWireTest extends AnyFlatSpec {

  val exampleWire = FingerpostWire(
    uri = Some("https://example.com/news/12345"),
    sourceFeed = Some("newswire-feed"),
    usn = Some("USN123456"),
    version = Some("1.0"),
    status = Some("published"),
    firstVersion = Some("2025-07-01T12:00:00Z"),
    versionCreated = Some("2025-07-22T09:15:00Z"),
    dateTimeSent = Some("2025-07-22T09:20:00Z"),
    slug = Some("breaking-news-event"),
    headline = Some("Major Event Unfolds in Capital"),
    subhead = Some("Authorities respond to unfolding situation"),
    byline = Some("Jane Doe"),
    priority = Some("high"),
    subjects = Some(
      FingerpostWireSubjects(
        code = List("POL", "INT", "UK")
      )
    ),
    keywords = Some(List("breaking", "government", "security")),
    usage = Some("editorial"),
    ednote = Some("Sensitive content – embargo until 10 AM"),
    mediaCatCodes = Some("MC123"),
    `abstract` =
      Some("A major incident is currently being managed by local authorities."),
    bodyText = Some(
      """Local authorities have confirmed that a major security incident
        |has occurred in the city centre. Citizens are advised to avoid the area.""".stripMargin
    ),
    composerCompatible = Some(true),
    dataformat = Some(
      Dataformat(
        noOfColumns = Some("3"),
        notFipTopusCategory = Some("general-news"),
        indesignTags = Some("<p><b>BREAKING:</b></p>")
      )
    )
  )
  val emptyWire = FingerpostWire(
    uri = None,
    sourceFeed = None,
    usn = None,
    version = None,
    status = None,
    firstVersion = None,
    versionCreated = None,
    dateTimeSent = None,
    slug = None,
    headline = None,
    subhead = None,
    byline = None,
    priority = None,
    subjects = None,
    keywords = None,
    usage = None,
    ednote = None,
    mediaCatCodes = None,
    `abstract` = None,
    bodyText = None,
    composerCompatible = None,
    dataformat = None
  )
  val exampleWireJson = """{
                          |  "uri" : "https://example.com/news/12345",
                          |  "sourceFeed" : "newswire-feed",
                          |  "usn" : "USN123456",
                          |  "version" : "1.0",
                          |  "status" : "published",
                          |  "firstVersion" : "2025-07-01T12:00:00Z",
                          |  "versionCreated" : "2025-07-22T09:15:00Z",
                          |  "dateTimeSent" : "2025-07-22T09:20:00Z",
                          |  "slug" : "breaking-news-event",
                          |  "headline" : "Major Event Unfolds in Capital",
                          |  "subhead" : "Authorities respond to unfolding situation",
                          |  "byline" : "Jane Doe",
                          |  "priority" : "high",
                          |  "subjects" : {
                          |    "code" : [ "POL", "INT", "UK" ]
                          |  },
                          |  "keywords" : [ "breaking", "government", "security" ],
                          |  "usage" : "editorial",
                          |  "ednote" : "Sensitive content – embargo until 10 AM",
                          |  "mediaCatCodes" : "MC123",
                          |  "abstract" : "A major incident is currently being managed by local authorities.",
                          |  "bodyText" : "Local authorities have confirmed that a major security incident\nhas occurred in the city centre. Citizens are advised to avoid the area.",
                          |  "composerCompatible" : true,
                          |  "dataformat" : {
                          |    "noOfColumns" : "3",
                          |    "notFipTopusCategory" : "general-news",
                          |    "indesignTags" : "<p><b>BREAKING:</b></p>"
                          |  }
                          |}""".stripMargin
  it should "serialise json" in {
    Json.prettyPrint(Json.toJson(exampleWire)) shouldEqual exampleWireJson
  }

  it should "deserialise json" in {
    Json.fromJson[FingerpostWire](
      Json.parse(exampleWireJson)
    ) shouldEqual JsSuccess(exampleWire)
  }

  it should "transform source-feed to sourceFeed" in {
    Json.fromJson[FingerpostWire](
      Json.parse(
        """{
        |"source-feed": "newswire-feed"
        |}""".stripMargin
      )
    ) shouldEqual JsSuccess(emptyWire.copy(sourceFeed = Some("newswire-feed")))
  }

  it should "transform body_text to bodyText" in {
    Json.fromJson[FingerpostWire](
      Json.parse(
        """{
        |"body_text": "body text"
        |}""".stripMargin
      )
    ) shouldEqual JsSuccess(emptyWire.copy(bodyText = Some("body text")))
  }
}
