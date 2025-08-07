package service

import com.github.blemale.scaffeine.Scaffeine
import models.{QueryParams, QueryResponse}

import scala.concurrent.duration.DurationInt

trait QueryCache {
  def getIfPresent(key: QueryParams): Option[QueryResponse]
  def put(key: QueryParams, value: QueryResponse): Unit
}

class ScaffeineCache extends QueryCache {
  private val cache = Scaffeine()
    .recordStats()
    .expireAfterWrite(1.minute)
    .maximumSize(500)
    .build[QueryParams, QueryResponse]()

  override def getIfPresent(key: QueryParams): Option[QueryResponse] = {
    cache.getIfPresent(key)
  }

  override def put(key: QueryParams, value: QueryResponse): Unit = {
    cache.put(key, value)
  }
}

class FakeCache(initialCache: Map[QueryParams, QueryResponse] = Map.empty)
    extends QueryCache {
  private var cache: Map[QueryParams, QueryResponse] = initialCache

  override def getIfPresent(key: QueryParams): Option[QueryResponse] = {
    cache.get(key)
  }

  override def put(key: QueryParams, value: QueryResponse): Unit = {
    cache += (key -> value)
  }
}
