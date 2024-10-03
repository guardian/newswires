package lib

import net.logstash.logback.marker.Markers.appendEntries
import org.apache.pekko.stream.Materializer
import play.api.mvc.{AnyContent, Filter, Request, RequestHeader, Result}
import play.api.{Logger, Logging, MarkerContext}

import java.util.UUID
import scala.concurrent.{ExecutionContext, Future}
import scala.jdk.CollectionConverters._
import scala.util.{Failure, Success}

object RequestLoggingFilter {
  private val requestIdHeader = "x-newswires-request-id"
  def getRequestId[T](req: Request[T]): String =
    req.headers.get(requestIdHeader).getOrElse(UUID.randomUUID().toString)
}
class RequestLoggingFilter(implicit
    val mat: Materializer,
    ec: ExecutionContext
) extends Filter {

  private val logger = Logger("request")

  override def apply(
      next: RequestHeader => Future[Result]
  )(request: RequestHeader): Future[Result] = {
    val start = System.currentTimeMillis()
    val withID = request.withHeaders(
      request.headers.replace(
        RequestLoggingFilter.requestIdHeader -> UUID.randomUUID().toString
      )
    )

    val resultFuture = next(withID)

    resultFuture onComplete {
      case Success(response) =>
        val duration = System.currentTimeMillis() - start
        log(withID, Right(response), duration)

      case Failure(err) =>
        val duration = System.currentTimeMillis() - start
        log(withID, Left(err), duration)
    }

    resultFuture
  }

  private def log(
      request: RequestHeader,
      outcome: Either[Throwable, Result],
      duration: Long
  ): Unit = {
    val originIp =
      request.headers.get("X-Forwarded-For").getOrElse(request.remoteAddress)
    val referer = request.headers.get("Referer").getOrElse("-")

    val queryStringMap = request.queryString.map { case (k, v) =>
      s"query_string.$k" -> v.mkString(", ")
    }

    val mandatoryMarkers = Map(
      "origin" -> originIp,
      "method" -> request.method,
      "duration" -> duration,
      "path" -> request.path
    ) ++ queryStringMap

    val optionalMarkers = Map(
      "status" -> outcome.map(_.header.status).toOption,
      "requestId" -> request.headers.get(RequestLoggingFilter.requestIdHeader),
      "referrer" -> referer
    ).collect { case (key, Some(value)) =>
      key -> value
    }

    val markers = MarkerContext(
      appendEntries((mandatoryMarkers ++ optionalMarkers).asJava)
    )

    outcome.fold(
      throwable => {
        logger.info(
          s"""$originIp - "${request.method} ${request.uri} ${request.version}" ERROR "$referer" ${duration}ms"""
        )(markers)
        logger.error(s"Error for ${request.method} ${request.uri}", throwable)
      },
      response => {
        val length = response.header.headers.getOrElse("Content-Length", 0)
        logger.info(
          s"""$originIp - "${request.method} ${request.uri} ${request.version}" ${response.header.status} $length "$referer" ${duration}ms"""
        )(markers)
      }
    )
  }
}

trait RequestLogging extends Logging {
  protected def buildLogMarker[T](
      methodName: String
  )(implicit r: Request[T]): LogMarker = {
    LogMarker(
      "requestId" -> RequestLoggingFilter.getRequestId(r),
      "requestType" -> methodName
    )
  }
}

trait RequestHelpers {
  val apiKey: String
  protected def hasApiKey(request: Request[AnyContent]): Boolean =
    request
      .getQueryString("api-key")
      .contains(apiKey)
}
