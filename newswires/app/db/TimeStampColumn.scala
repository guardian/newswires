package db

import scalikejdbc.SQLSyntax

sealed trait TimeStampColumn {
  val columnName: SQLSyntax
  def sortAsc(a: FingerpostWireEntry, b: FingerpostWireEntry): Boolean
  def sortDesc(a: FingerpostWireEntry, b: FingerpostWireEntry): Boolean = {
    !sortAsc(a, b)
  }
}

case object IngestedAtTime extends TimeStampColumn {
  override val columnName = FingerpostWireEntry.syn.ingestedAt
  override def sortAsc(
      a: FingerpostWireEntry,
      b: FingerpostWireEntry
  ): Boolean = a.ingestedAt.isBefore(b.ingestedAt)
}
case class AddedToCollectionAtTime(collectionId: Int) extends TimeStampColumn {
  override val columnName = WireEntryForCollection.syn.addedAt

  override def sortAsc(
      a: FingerpostWireEntry,
      b: FingerpostWireEntry
  ): Boolean = {
    val aCollectionOpt = a.collections.find(_.collectionId == collectionId)
    val bCollectionOpt = b.collections.find(_.collectionId == collectionId)

    (aCollectionOpt, bCollectionOpt) match {
      case (Some(aCollection), Some(bCollection)) =>
        aCollection.addedAt
          .isBefore(
            bCollection.addedAt
          )
      // We aren't really expecting these cases to be hit, but these seem like sensible ways to handle them
      case (Some(_), None) =>
        false
      case (None, Some(_)) =>
        true
      case (None, None) =>
        false
    }
  }
}
