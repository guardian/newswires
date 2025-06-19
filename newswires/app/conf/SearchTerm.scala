package conf

sealed trait SearchConfig

/** PostgreSQL text search configuration name.
  *
  *   - "english": uses stemming and stop-word removal via dictionaries; not
  *     fully compatible with web-style query syntax.
  *   - "simple": no stemming or stop-word removal; fully compatible with
  *     web-style query syntax.
  */
object SearchConfig {
  case object English extends SearchConfig
  case object Simple extends SearchConfig
}

case class SearchTerm(
    query: String,
    searchConfig: SearchConfig = SearchConfig.English,
    field: String = "body_text"
)

/*
 * web-style query syntax:
 *     • Space-separated terms      → AND (e.g.  foo bar      ⇒ foo AND bar)
 *     • OR                         → OR  (e.g.  foo OR bar)
 *     • –term                      → NOT (e.g.  foo –bar     ⇒ foo AND NOT bar)
 *     • "exact phrase"             → exact phrase match
 *     • ( … )                      → grouping (e.g. foo AND (bar OR baz))
 */
object SimpleSearchQueries {
  // World preset
  val REUTERS_NEWS_SCHEDULE = "\"REUTERS NEWS SCHEDULE\""

  // Sport preset
  val SOCCER = "soccer"
  val CRICKET = "cricket"
  val RUGBY_UNION =
    "(\"rugby league\" \"rugby union\") OR (rugby -\"rugby league\")"
  val RUGBY_LEAGUE = "\"rugby league\""
  val TENNIS = "tennis"
  val CYCLING = "cycling"
  val F1 = "f1 OR \"formula one\" OR \"formula 1\""
  val GOLF = "golf"
  val BOXING = "boxing -\"boxing gym\""
  val RACING = "horse racing"
  val ATHLETICS = "athletics OR \"track and field\""
  val OLYMPICS = "olympics OR \"olympic games\""
}
