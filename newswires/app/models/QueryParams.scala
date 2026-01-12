package models

import conf.SearchTerm.English

sealed trait UpdateType {
  val sinceTimeStamp: String
}

case class NextPage(sinceTimeStamp: String) extends UpdateType
case class MostRecent(sinceTimeStamp: String) extends UpdateType

sealed trait UpdateTypeInt {
  val sinceId: Int
}

case class NextPageInt(sinceId: Int) extends UpdateTypeInt
case class MostRecentInt(sinceId: Int) extends UpdateTypeInt

case class QueryParams(
    searchParams: SearchParams,
    savedSearchParamList: List[SearchParams],
    maybeSearchTerm: Option[English],
    maybeBeforeTimeStamp: Option[String],
    maybeAfterTimeStamp: Option[UpdateType],
    maybeBeforeId: Option[Int],
    maybeSinceId: Option[UpdateTypeInt],
    pageSize: Int = 250
)
