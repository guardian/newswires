package models

import db.{AddedToCollectionAtTime, IngestedAtTime}
import helpers.models
import org.scalatest.flatspec.AnyFlatSpec
import org.scalatest.matchers.should.Matchers

import java.time.Instant

class QueryResponseSpec extends AnyFlatSpec with Matchers with models {
  behavior of "QueryResponse.display"
  it should "sort results by ingested_at in descending order when given IngestedAtTimestamp" in {

    val entry1 = fingerpostWireEntry.copy(
      collections = Nil,
      toolLinks = Nil
    )
    val entry2 = entry1.copy(
      id = entry1.id + 1,
      collections = Nil,
      ingestedAt = entry1.ingestedAt.plusSeconds(10)
    )

    val queryResponse = QueryResponse(
      results = List(entry2, entry1)
    )

    val ingestedAtDisplay = QueryResponse.display(
      queryResponse,
      requestingUser = "testUser",
      timeStampColumn = IngestedAtTime
    )

    ingestedAtDisplay.results shouldEqual List(entry2, entry1)
  }

  it should "sort results by time added to the specified collection in descending order when given AddedToCollectionAt(collectionId)" in {
    val baseInstant = Instant.ofEpochMilli(1753370061967L)

    val entry1 = fingerpostWireEntry.copy(
      collections = List(
        collectionData.copy(
          collectionId = 123,
          addedAt = baseInstant.plusSeconds(100)
        )
      ),
      toolLinks = Nil,
      ingestedAt = baseInstant.plusSeconds(10)
    )
    val entry2 = entry1.copy(
      id = entry1.id + 1,
      collections = List(
        collectionData.copy(
          collectionId = 123,
          addedAt = baseInstant.plusSeconds(200)
        ),
        collectionData.copy(
          collectionId = 456,
          addedAt = baseInstant
        )
      ),
      ingestedAt = baseInstant
    )

    val queryResponse = QueryResponse(
      results = List(entry2, entry1)
    )

    val addedToCollectionAtDisplay = QueryResponse.display(
      queryResponse,
      requestingUser = "testUser",
      timeStampColumn = AddedToCollectionAtTime(123)
    )

    addedToCollectionAtDisplay.results shouldEqual List(entry2, entry1)
  }

  it should "sort toolLinks by sentAt in descending order" in {
    val toolLink1 = toolLink
    val toolLink2 = toolLink.copy(
      id = toolLink.id + 1,
      sentAt = toolLink.sentAt.plusSeconds(10)
    )
    val entry = fingerpostWireEntry.copy(
      toolLinks = List(toolLink1, toolLink2),
      collections = Nil
    )
    val queryResponse = QueryResponse(
      results = List(entry)
    )
    val displayed = QueryResponse.display(
      queryResponse,
      requestingUser = "testUser",
      timeStampColumn = IngestedAtTime
    )
    displayed.results.head.toolLinks shouldEqual List(toolLink2, toolLink1)
  }

  it should "rename the sender to 'you' in toolLinks when the sender matches the requesting user" in {
    val toolLink1 = toolLink.copy(
      sentBy = "testUser"
    )
    val toolLink2 = toolLink.copy(
      id = toolLink.id + 1,
      sentBy = "anotherUser"
    )
    val entry = fingerpostWireEntry.copy(
      toolLinks = List(toolLink1, toolLink2),
      collections = Nil
    )
    val queryResponse = QueryResponse(
      results = List(entry)
    )
    val displayed = QueryResponse.display(
      queryResponse,
      requestingUser = "testUser",
      timeStampColumn = IngestedAtTime
    )
    displayed.results.head.toolLinks.head.sentBy shouldEqual "you"
    displayed.results.head.toolLinks(1).sentBy shouldEqual "anotherUser"
  }
}
