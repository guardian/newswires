package db

import conf.SearchTerm

case class QueryParams(
    searchParams: SearchParams,
    savedSearchParamList: List[SearchParams],
    maybeSearchTerm: Option[SearchTerm],
    maybeBeforeId: Option[Int],
    maybeSinceId: Option[Int],
    pageSize: Int = 250
)
