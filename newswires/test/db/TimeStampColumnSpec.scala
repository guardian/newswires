package db

import models.{Dataformat, FingerpostWire, FingerpostWireSubjects}
import org.scalatest.flatspec.AnyFlatSpec
import org.scalatest.matchers.should.Matchers

import java.time.Instant

class TimeStampColumnSpec extends AnyFlatSpec with Matchers {

  val earlierInstant: Instant = Instant.ofEpochSecond(1622000000L)
  val laterInstant: Instant = Instant.ofEpochSecond(1722000000L)
  val exampleFingerpostWireSubjects =
    FingerpostWireSubjects(code = List("a", "b"))

  val content: FingerpostWire = FingerpostWire(
    uri = Some("test"),
    sourceFeed = Some("test"),
    usn = Some("test"),
    version = Some("test"),
    status = Some("test"),
    firstVersion = Some("test"),
    versionCreated = Some("test"),
    dateTimeSent = Some("test"),
    slug = Some("test"),
    headline = Some("test"),
    subhead = Some("test"),
    byline = Some("test"),
    priority = Some("test"),
    subjects = Some(exampleFingerpostWireSubjects),
    keywords = Some(Nil),
    usage = Some("test"),
    ednote = Some("test"),
    mediaCatCodes = Some("test"),
    `abstract` = Some("test"),
    bodyText = Some("test"),
    composerCompatible = Some(true),
    dataformat = Some(
      Dataformat(
        noOfColumns = Some("1"),
        notFipTopusCategory = Some("a"),
        indesignTags = Some("test")
      )
    ),
    embargo = None
  )

  def makeWireEntry(
      id: Long,
      ingestedAt: Instant,
      collections: List[WireEntryForCollection] = Nil
  ): FingerpostWireEntry =
    FingerpostWireEntry(
      id = id,
      externalId = s"ext-$id",
      ingestedAt = ingestedAt,
      content = content,
      supplier = "test",
      collections = collections,
      composerSentBy = Some("tester"),
      categoryCodes = Nil,
      highlight = None,
      toolLinks = Nil,
      s3Key = None,
      precomputedCategories = Nil,
      composerId = None
    )

  behavior of "IngestedAtTime"

  it should "sort ascending by ingestedAt time" in {
    val entryA = makeWireEntry(1L, laterInstant)
    val entryB = makeWireEntry(2L, earlierInstant)

    val sorted = List(entryA, entryB).sortWith(IngestedAtTime.sortAsc)

    sorted.map(_.id) shouldEqual List(2L, 1L)
  }

  it should "sort descending by ingestedAt time" in {
    val entryA = makeWireEntry(1L, earlierInstant)
    val entryB = makeWireEntry(2L, laterInstant)

    val sorted = List(entryA, entryB).sortWith(IngestedAtTime.sortDesc)

    sorted.map(_.id) shouldEqual List(2L, 1L)
  }

  behavior of "AddedToCollectionAtTime"

  val collectionId = 4

  it should "sort correctly by addedAt time for the specified collection" in {
    val entryA = makeWireEntry(
      1L,
      earlierInstant,
      List(
        WireEntryForCollection(
          wireEntryId = 1L,
          collectionId = collectionId,
          addedAt = laterInstant
        )
      )
    )
    val entryB = makeWireEntry(
      2L,
      laterInstant,
      List(
        WireEntryForCollection(
          wireEntryId = 2L,
          collectionId = collectionId,
          addedAt = earlierInstant
        )
      )
    )

    val sortedAsc = List(entryA, entryB).sortWith(
      AddedToCollectionAtTime(collectionId).sortAsc
    )
    val sortedDesc = List(entryA, entryB).sortWith(
      AddedToCollectionAtTime(collectionId).sortDesc
    )

    sortedAsc.map(_.id) shouldEqual List(2L, 1L)
    sortedDesc.map(_.id) shouldEqual List(1L, 2L)
  }

  it should "handle entries that aren't actually in the specified collection" in {
    val entryInCollection = makeWireEntry(
      1L,
      earlierInstant,
      List(
        WireEntryForCollection(
          wireEntryId = 1L,
          collectionId = collectionId,
          addedAt = earlierInstant
        )
      )
    )
    val entryNotInCollection = makeWireEntry(2L, laterInstant, Nil)

    val sortedAsc = List(entryNotInCollection, entryInCollection).sortWith(
      AddedToCollectionAtTime(collectionId).sortAsc
    )
    val sortedDesc = List(entryNotInCollection, entryInCollection).sortWith(
      AddedToCollectionAtTime(collectionId).sortDesc
    )

    sortedAsc.map(_.id) shouldEqual List(2L, 1L)
    sortedDesc.map(_.id) shouldEqual List(1L, 2L)
  }

  it should "maintain order when neither entry is in the collection" in {
    val entryA = makeWireEntry(1L, earlierInstant, Nil)
    val entryB = makeWireEntry(2L, laterInstant, Nil)

    val sorted = List(entryA, entryB).sortWith(
      AddedToCollectionAtTime(collectionId).sortAsc
    )

    sorted.map(_.id) shouldEqual List(1L, 2L)
  }

  it should "only consider the matching collection id when sorting" in {
    val entryA = makeWireEntry(
      1L,
      earlierInstant,
      List(
        WireEntryForCollection(
          wireEntryId = 1L,
          collectionId = 999,
          addedAt = earlierInstant
        ),
        WireEntryForCollection(
          wireEntryId = 1L,
          collectionId = collectionId,
          addedAt = laterInstant.plusSeconds(1)
        )
      )
    )
    val entryB = makeWireEntry(
      2L,
      laterInstant,
      List(
        WireEntryForCollection(
          wireEntryId = 2L,
          collectionId = collectionId,
          addedAt = laterInstant
        )
      )
    )

    val sorted = List(entryA, entryB).sortWith(
      AddedToCollectionAtTime(collectionId).sortAsc
    )

    sorted.map(_.id) shouldEqual List(2L, 1L)
  }
}
