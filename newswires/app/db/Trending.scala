package db

import java.time.ZonedDateTime
import java.time.temporal.ChronoUnit
import scala.annotation.tailrec
import scala.concurrent.duration.FiniteDuration
import scala.math.Numeric.Implicits._

object Trending {

  def trendingScore(
      pop: List[ZonedDateTime],
      window: FiniteDuration,
      timePeriodStart: ZonedDateTime,
      timePeriodEnd: ZonedDateTime
  ): Double = {
    val mostRecent =
      bucketByTimePeriod(pop, window, timePeriodStart, timePeriodEnd)
    zScore(mostRecent, 5)
  }

  def zScore(pop: List[Int], observation: Int): Double = {
    val populationMean = mean(pop)
    val standardDeviation = stdDev(pop)

    // https://stackoverflow.com/questions/787496/what-is-the-best-way-to-compute-trending-topics-or-tags
    (observation - populationMean) / standardDeviation
  }

  def bucketByTimePeriod(
      pop: List[ZonedDateTime],
      window: FiniteDuration,
      timePeriodStart: ZonedDateTime,
      timePeriodEnd: ZonedDateTime
  ): List[Int] = {
    val sortedPop = pop.sorted

    @tailrec
    def buckets(
        bucketsSoFar: List[Int],
        bucketEndTime: ZonedDateTime,
        remainingPopulation: List[ZonedDateTime]
    ): List[Int] = {
      if (bucketEndTime isAfter timePeriodEnd) {
        bucketsSoFar
      } else {
        val (bucket, remaining) =
          remainingPopulation.span(_ isBefore bucketEndTime)
        buckets(
          bucket.size :: bucketsSoFar,
          bucketEndTime.plus(window.toMillis, ChronoUnit.MILLIS),
          remaining
        )
      }
    }

    buckets(
      List(),
      timePeriodStart.plus(window.toMillis, ChronoUnit.MILLIS),
      sortedPop
    )
  }

  private def mean[T: Numeric](xs: Iterable[T]): Double =
    xs.sum.toDouble / xs.size

  //  https://gist.github.com/navicore/7973711f300f00f9d878026eaf84bed2
  private def variance[T: Numeric](xs: Iterable[T]): Double = {
    val avg = mean(xs)

    xs.map(_.toDouble).map(a => math.pow(a - avg, 2)).sum / xs.size
  }

  private def stdDev[T: Numeric](xs: Iterable[T]): Double =
    math.sqrt(variance(xs))

}
