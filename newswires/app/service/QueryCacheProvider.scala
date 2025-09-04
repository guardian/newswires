package service

import models.{MostRecent, QueryParams, QueryResponse}
import db.DatabaseProvider
import play.api.Logging

class QueryCacheProvider(
    cache: QueryCache,
    databaseProvider: DatabaseProvider
) extends Logging {
  def get(params: QueryParams): QueryResponse = {
    val cachedResponse =
      Option
        .when(params.isCacheable)(cache.getIfPresent(params))
        .flatten

    val response = (cachedResponse map {
      case QueryResponse(cachedResults, cachedTotalQuery) =>
        logger.info(
          s"Cache hit for query: ${params.searchParams}, results: ${cachedResults.length}, totalCount: $cachedTotalQuery"
        )
        val mostRecentId =
          cachedResults.sortBy(-_.id).headOption.map(_.id.toInt)
        val updatesQuery =
          params.copy(maybeSinceId = mostRecentId.map(MostRecent(_)))
        val mostRecentFromDb = databaseProvider.query(updatesQuery)

        logger.error(
          s"mostRecentFromDb: ${mostRecentFromDb.results.length} results, totalCount: ${mostRecentFromDb.totalCount}"
        )

        QueryResponse(
          (mostRecentFromDb.results.sortBy(-_.id) ++ cachedResults.sortBy(
            -_.id
          ))
            .take(params.pageSize),
          mostRecentFromDb.totalCount + cachedTotalQuery
        )
    }).getOrElse {
      databaseProvider.query(params)
    }
    if (params.isCacheable) {
      cache.put(params, response)
    }
    response

  }

}
