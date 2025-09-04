package service

import db.{FakeDatabaseProvider, FingerpostWireEntry}
import models.{FingerpostWire, QueryParams, QueryResponse, SearchParams}
import org.scalatest.flatspec.AnyFlatSpec
import org.scalatest.matchers.should.Matchers

object Helpers {
  def generateWireEntry(id: Int) = {
    // This function would generate a mock wire entry for testing purposes.
    // The actual implementation is not provided in the original code.
    FingerpostWireEntry(
      id = id.toLong,
      supplier = "testSupplier",
      externalId = s"ext-$id",
      ingestedAt = java.time.Instant.now(),
      content = FingerpostWire(
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
      ),
      composerId = Some(s"composer-$id"),
      composerSentBy = Some(s"sentBy-$id"),
      categoryCodes = Nil,
      highlight = None,
      toolLinks = Nil
    )
  }

  def generateQueryResponse(
      results: List[FingerpostWireEntry]
  ): QueryResponse = {
    QueryResponse(results, results.length)
  }
}

class QueryCacheProviderSpec extends AnyFlatSpec with Matchers {

  behavior of "QueryCacheProvider.get"

  it should "concatenate fresh results with cached results, if page size spans the two" in {
    val db = new FakeDatabaseProvider(_ =>
      Helpers.generateQueryResponse(
        List(
          Helpers.generateWireEntry(5),
          Helpers.generateWireEntry(6)
        )
      )
    )

    val searchParams = QueryParams(
      searchParams = SearchParams(
        text = None
      ),
      savedSearchParamList = Nil,
      maybeSearchTerm = None,
      maybeBeforeId = None,
      maybeSinceId = None,
      pageSize = 3
    )

    val cache = new FakeCache(
      Map(
        searchParams -> Helpers.generateQueryResponse(
          List(
            Helpers.generateWireEntry(1),
            Helpers.generateWireEntry(2)
          )
        )
      )
    )
    val queryCacheProvider = new QueryCacheProvider(cache, db)

    val response = queryCacheProvider.get(searchParams)

    response.totalCount should be(4)
    response.results.map(_.id) should contain theSameElementsAs List(
      2,
      5,
      6
    )
  }

  it should "prioritise fresh results, if page size is smaller than the number of fresh results" in {
    val db = new FakeDatabaseProvider(_ =>
      Helpers.generateQueryResponse(
        List(
          Helpers.generateWireEntry(4),
          Helpers.generateWireEntry(5),
          Helpers.generateWireEntry(6)
        )
      )
    )

    val searchParams = QueryParams(
      searchParams = SearchParams(
        text = None
      ),
      savedSearchParamList = Nil,
      maybeSearchTerm = None,
      maybeBeforeId = None,
      maybeSinceId = None,
      pageSize = 3
    )

    val cache = new FakeCache(
      Map(
        searchParams -> Helpers.generateQueryResponse(
          List(
            Helpers.generateWireEntry(1),
            Helpers.generateWireEntry(2)
          )
        )
      )
    )
    val queryCacheProvider = new QueryCacheProvider(cache, db)

    val response = queryCacheProvider.get(searchParams)

    response.totalCount should be(5)
    response.results.map(_.id) should contain theSameElementsAs List(
      4,
      5,
      6
    )
  }
}
