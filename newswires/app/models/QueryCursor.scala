package models

case class QueryCursor(
    maybeBeforeTimeStamp: Option[String],
    maybeAfterTimeStamp: Option[UpdateType]
)
