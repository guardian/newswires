package db

import scalikejdbc.SQLSyntaxSupport

case class SourceFeedToSupplier(
    sourceFeed: String,
    supplier: String
)

object SourceFeedToSupplier extends SQLSyntaxSupport[SourceFeedToSupplier] {
  val syn = this.syntax("supplier")
}
