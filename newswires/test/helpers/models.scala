package helpers

import db.{
  FingerpostWireEntry,
  IngestedAtTime,
  ToolLink,
  WireEntryForCollection
}
import models.{
  Dataformat,
  DateRange,
  FilterParams,
  FingerpostWire,
  FingerpostWireSubjects,
  QueryCursor,
  SearchParams
}

import java.time.Instant

trait models {

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
    ),
    embargo = Some("2026-02-18T00:01:00Z"),
    profile = Some("alert"),
    `type` = Some("text")
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
    dataformat = None,
    embargo = None,
    profile = None,
    `type` = None
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
                          |    "code" : [
                          |      "POL",
                          |      "INT",
                          |      "UK"
                          |    ]
                          |  },
                          |  "keywords" : [
                          |    "breaking",
                          |    "government",
                          |    "security"
                          |  ],
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
                          |  },
                          |  "embargo" : "2026-02-18T00:01:00Z",
                          |  "profile": "alert",
                          |  "type": "text"
                          |}""".stripMargin

  val toolLink = ToolLink(
    id = 1L,
    wireId = 1L,
    tool = "composer",
    sentBy = "jane.doe",
    // 2010-01-01T00:00:00.000Z
    sentAt = Instant.ofEpochMilli(1262304000000L),
    ref = Some("https://composer.example/abcdef")
  )

  val collectionData = WireEntryForCollection(
    wireEntryId = 1L,
    collectionId = 1L,
    // 2010-01-01T00:00:00.000Z
    addedAt = Instant.ofEpochMilli(1262304000000L)
  )

  val fingerpostWireEntry = FingerpostWireEntry(
    id = 1L,
    supplier = "Supplier",
    externalId = "ExternalId",
    ingestedAt = Instant.ofEpochMilli(1753370061967L),
    content = exampleWire,
    composerId = Some("composerId"),
    composerSentBy = Some("composerSentBy"),
    categoryCodes = List("code"),
    highlight = Some("highlight"),
    toolLinks = List(
      toolLink,
      toolLink.copy(
        id = 2L,
        tool = "incopy",
        // 2010-01-01T00:00:01.000Z
        sentAt = Instant.ofEpochMilli(1262304001000L),
        ref = None
      )
    ),
    collections = List(collectionData),
    s3Key = Some("key.json"),
    precomputedCategories = List("all-sport")
  )

  val fingerpostWireEntryJson =
    """{
      |  "id" : 1,
      |  "supplier" : "Supplier",
      |  "externalId" : "ExternalId",
      |  "ingestedAt" : "2025-07-24T15:14:21.967Z",
      |  "content" : {
      |    "uri" : "https://example.com/news/12345",
      |    "sourceFeed" : "newswire-feed",
      |    "usn" : "USN123456",
      |    "version" : "1.0",
      |    "status" : "published",
      |    "firstVersion" : "2025-07-01T12:00:00Z",
      |    "versionCreated" : "2025-07-22T09:15:00Z",
      |    "dateTimeSent" : "2025-07-22T09:20:00Z",
      |    "slug" : "breaking-news-event",
      |    "headline" : "Major Event Unfolds in Capital",
      |    "subhead" : "Authorities respond to unfolding situation",
      |    "byline" : "Jane Doe",
      |    "priority" : "high",
      |    "subjects" : {
      |      "code" : [
      |        "POL",
      |        "INT",
      |        "UK"
      |      ]
      |    },
      |    "keywords" : [
      |      "breaking",
      |      "government",
      |      "security"
      |    ],
      |    "usage" : "editorial",
      |    "ednote" : "Sensitive content – embargo until 10 AM",
      |    "mediaCatCodes" : "MC123",
      |    "abstract" : "A major incident is currently being managed by local authorities.",
      |    "bodyText" : "Local authorities have confirmed that a major security incident\nhas occurred in the city centre. Citizens are advised to avoid the area.",
      |    "composerCompatible" : true,
      |    "dataformat" : {
      |      "noOfColumns" : "3",
      |      "notFipTopusCategory" : "general-news",
      |      "indesignTags" : "<p><b>BREAKING:</b></p>"
      |    },
      |    "embargo" : "2026-02-18T00:01:00Z",
      |    "profile" : "alert",
      |    "type" : "text"
      |  },
      |  "composerId" : "composerId",
      |  "composerSentBy" : "composerSentBy",
      |  "categoryCodes" : [
      |    "code"
      |  ],
      |  "highlight" : "highlight",
      |  "toolLinks" : [
      |    {
      |      "id" : 1,
      |      "wireId" : 1,
      |      "tool" : "composer",
      |      "sentBy" : "jane.doe",
      |      "sentAt" : "2010-01-01T00:00:00Z",
      |      "ref" : "https://composer.example/abcdef"
      |    },
      |    {
      |      "id" : 2,
      |      "wireId" : 1,
      |      "tool" : "incopy",
      |      "sentBy" : "jane.doe",
      |      "sentAt" : "2010-01-01T00:00:01Z"
      |    }
      |  ],
      |  "s3Key" : "key.json",
      |  "precomputedCategories" : [
      |    "all-sport"
      |  ],
      |  "collections" : [
      |    {
      |      "wireEntryId" : 1,
      |      "collectionId" : 1,
      |      "addedAt" : "2010-01-01T00:00:00Z"
      |    }
      |  ]
      |}""".stripMargin

  val emptyFilterParams = FilterParams(
    searchTerms = None,
    keywordIncl = Nil,
    keywordExcl = Nil,
    suppliersIncl = Nil,
    suppliersExcl = Nil,
    categoryCodesIncl = Nil,
    categoryCodesExcl = Nil,
    hasDataFormatting = None,
    preComputedCategories = Nil,
    preComputedCategoriesExcl = Nil,
    collectionId = None
  )

  val emptyDateParams = DateRange(
    start = None,
    end = None
  )

  val emptySearchParams = SearchParams(emptyFilterParams, emptyDateParams)

  val emptyQueryCursor = QueryCursor(
    maybeBeforeTimeStamp = None,
    maybeAfterTimeStamp = None,
    maybeBeforeId = None,
    maybeSinceId = None
  )

  val defaultOrdering = IngestedAtTime

}
