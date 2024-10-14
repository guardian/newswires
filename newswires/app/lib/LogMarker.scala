package lib

import net.logstash.logback.marker.Markers.appendEntries
import org.slf4j.Marker
import play.api.MarkerContext

import scala.collection.concurrent.TrieMap
import scala.jdk.CollectionConverters._

class LogMarker(private val entries: Map[String, String] = Map.empty)
    extends MarkerContext {

  // Set initial state
  private val markerState = TrieMap.from(entries)
  entries.foreach { case (k, v) => markerState.update(k, v) }

  // Update triemap (should be safe for concurrent updates)
  def update(k: String, v: String): LogMarker = {
    markerState.update(k, v)
    this
  }

  override def marker: Option[Marker] =
    if (markerState.isEmpty) None
    else
      Some(
        appendEntries(markerState.readOnlySnapshot().asJava)
      )
}

object LogMarker {
  def empty: LogMarker = new LogMarker
  def apply(): LogMarker = empty
  def apply(initialMarkers: (String, String)*): LogMarker = new LogMarker(
    initialMarkers.toMap
  )
}
