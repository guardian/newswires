package models

import conf.SearchPreset
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
    searchPreset: Option[SearchPreset],
    maybeSearchTerm: Option[English],
    queryCursor: QueryCursor,
    pageSize: Int = 250
)
