package models

import conf.SearchField.Slug
import conf.{OR, SearchTerm, SearchTermCombo, SearchTermSingular, SearchTerms}

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
  val maybeSearchTerms: Option[SearchTerms] =
    maybeFreeTextQuery.map(query =>
      SearchTermCombo(List(SearchTerm.English(query), SearchTerm.Simple(query, Slug)), OR)
    )

  val maybeSearchTerm: Option[SearchTerm] = maybeFreeTextQuery.map(query => SearchTerm.English(query))
}
