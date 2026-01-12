package models

import conf.SearchTerm.English

sealed trait UpdateType {
  val sinceTimeStamp: String
}

case class NextPage(sinceTimeStamp: String) extends UpdateType
case class MostRecent(sinceTimeStamp: String) extends UpdateType

sealed trait UpdateTypeId {
  val sinceId: Int
}

case class NextPageId(sinceId: Int) extends UpdateTypeId
case class MostRecentId(sinceId: Int) extends UpdateTypeId

case class QueryParams(
    searchParams: SearchParams,
    savedSearchParamList: List[SearchParams],
    maybeSearchTerm: Option[English],
    maybeBeforeTimeStamp: Option[String],
    maybeAfterTimeStamp: Option[UpdateType],
    maybeBeforeId: Option[Int],
    maybeSinceId: Option[UpdateTypeId],
    pageSize: Int = 250
)
