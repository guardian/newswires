package models

import conf.SearchTerm.English

sealed trait UpdateType {
  val sinceTimeStamp: String
}

case class NextPage(sinceTimeStamp: String) extends UpdateType
case class MostRecent(sinceTimeStamp: String) extends UpdateType

case class QueryParams(
    searchParams: SearchParams,
    savedSearchParamList: List[SearchParams],
    maybeSearchTerm: Option[English],
    maybeBeforeTimeStamp: Option[String],
    maybeAfterTimeStamp: Option[UpdateType],
    pageSize: Int = 250
)
