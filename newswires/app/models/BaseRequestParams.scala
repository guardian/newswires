package models

import conf.SearchTerm

case class BaseRequestParams(
    maybeFreeTextQuery: Option[String] = None,
    keywords: List[String] = Nil,
    suppliers: List[String] = Nil,
    categoryCode: List[String] = Nil,
    categoryCodeExcl: List[String] = Nil,
    maybeStart: Option[String] = None,
    maybeEnd: Option[String] = None,
    maybeBeforeId: Option[Int] = None,
    maybeSinceId: Option[Int] = None,
    hasDataFormatting: Option[Boolean] = None
) {
  val maybeSearchTerm = maybeFreeTextQuery.map(SearchTerm.English(_))
}
