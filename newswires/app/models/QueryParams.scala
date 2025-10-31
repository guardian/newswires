package models

import conf.SearchTerm

sealed trait UpdateType {
  val sinceId: Int
}

case class NextPage(sinceId: Int) extends UpdateType
case class MostRecent(sinceId: Int) extends UpdateType

case class QueryParams(
    searchParams: SearchParams,
    savedSearchParamList: List[SearchParams],
    maybeSearchTerm: List[SearchTerm],
    maybeBeforeId: Option[Int],
    maybeSinceId: Option[UpdateType],
    pageSize: Int = 250
)
