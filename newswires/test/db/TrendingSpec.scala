package db

import org.scalatest.flatspec.AnyFlatSpec
import org.scalatest.matchers.should.Matchers

import java.time.ZonedDateTime
import scala.concurrent.duration.DurationInt

class TrendingSpec extends AnyFlatSpec with Matchers {

  /** nb. the +- 0.0000000000001 is a tolerance for floating point error
    */
  "Trending" should "calculate the z-score" in {
    assert(Trending.zScore(List(1, 2, 3, 4, 5), 3) == 0.0)
    assert(
      Trending.zScore(
        List(21, 22, 19, 18, 17, 22, 20, 20),
        20
      ) === 0.0739221270955 +- 0.0000000000001
    )
    assert(
      Trending.zScore(
        List(21, 22, 19, 18, 17, 22, 20, 20, 1, 2, 3, 1, 2, 1, 0, 1),
        2
      ) === -0.922793112954 +- 0.000000000001
    )
  }

  "bucketByTimePeriod" should "return a list of the numbers of entries in each bucket" in {
    val times = List(
      ZonedDateTime.parse("2021-01-01T00:00:00Z"),
      ZonedDateTime.parse("2021-01-01T00:00:00Z"),
      ZonedDateTime.parse("2021-01-01T00:00:01Z"),
      ZonedDateTime.parse("2021-01-01T00:00:03Z")
    )
    assert(
      Trending.bucketByTimePeriod(
        times,
        window = 1.second,
        timePeriodStart = ZonedDateTime.parse("2021-01-01T00:00:00Z"),
        timePeriodEnd = ZonedDateTime.parse("2021-01-01T00:00:04Z")
      ) == List(1, 0, 1, 2)
    )
  }

  "bucketByTimePeriod" should "be able to handle unsorted input" in {
    val times = List(
      ZonedDateTime.parse("2021-01-01T00:00:01Z"),
      ZonedDateTime.parse("2021-01-01T00:00:00Z"),
      ZonedDateTime.parse("2021-01-01T00:00:03Z"),
      ZonedDateTime.parse("2021-01-01T00:00:00Z")
    )
    assert(
      Trending.bucketByTimePeriod(
        times,
        window = 1.second,
        timePeriodStart = ZonedDateTime.parse("2021-01-01T00:00:00Z"),
        timePeriodEnd = ZonedDateTime.parse("2021-01-01T00:00:04Z")
      ) == List(1, 0, 1, 2)
    )
  }

  "bucketByTimePeriod" should "allow for empty buckets at either end as well as in the middle" in {
    val times = List(
      ZonedDateTime.parse("2021-01-01T00:00:01Z"),
      ZonedDateTime.parse("2021-01-01T00:00:00Z"),
      ZonedDateTime.parse("2021-01-01T00:00:03Z"),
      ZonedDateTime.parse("2021-01-01T00:00:00Z")
    )
    assert(
      Trending.bucketByTimePeriod(
        times,
        window = 1.second,
        timePeriodStart = ZonedDateTime.parse("2020-12-31T23:59:59Z"),
        timePeriodEnd = ZonedDateTime.parse("2021-01-01T00:00:05Z")
      ) == List(0, 1, 0, 1, 2, 0)
    )
  }

}
