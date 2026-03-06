package models

import conf.SearchPreset
import conf.SearchTerm.English
import db.TimeStampColumn

sealed trait UpdateType {
  val sinceTimeStamp: String
}

case class NextPage(sinceTimeStamp: String) extends UpdateType
case class MostRecent(sinceTimeStamp: String) extends UpdateType

case class QueryParams(
    searchParams: SearchParams,
    searchPreset: Option[SearchPreset],
    maybeSearchTerm: Option[English],
    queryCursor: QueryCursor,
    pageSize: Int = 250,
    timeStampColumn: TimeStampColumn
)
