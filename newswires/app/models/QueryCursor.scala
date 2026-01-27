package models

case class QueryCursor(
    maybeBeforeTimeStamp: Option[String],
    maybeAfterTimeStamp: Option[UpdateType],
    maybeBeforeId: Option[Int],
    maybeSinceId: Option[UpdateTypeId]
)
