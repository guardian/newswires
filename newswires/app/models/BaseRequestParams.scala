package models

import conf.SearchField.Slug
import conf.SearchTerm.English
import conf.{OR, SearchTerm, ComboTerm, SingleTerm, SearchTerms}

case class BaseRequestParams(
    maybeFreeTextQuery: Option[String] = None,
    keywords: List[String] = Nil,
    suppliers: List[String] = Nil,
    categoryCode: List[String] = Nil,
    categoryCodeExcl: List[String] = Nil,
    maybeStart: Option[String] = None,
    maybeEnd: Option[String] = None,
    maybeBeforeTimeStamp: Option[String] = None,
    maybeAfterTimeStamp: Option[String] = None,
    maybeBeforeId: Option[Int] = None,
    maybeSinceId: Option[Int] = None,
    hasDataFormatting: Option[Boolean] = None
) {
  // When we do a text search from the U.I we make an english query
  // which queries the `combined_textsearch` column which includes several
  // text fields, and we also search on slug field as well
  val textSearchTerms: Option[SearchTerms] =
    maybeFreeTextQuery.map(query =>
      ComboTerm(
        List(SearchTerm.English(query), SearchTerm.Simple(query, Slug)),
        OR
      )
    )

  // This is used to highlight the text matches in the body of the document
  val textForHighlighting: Option[English] =
    maybeFreeTextQuery.map(query => SearchTerm.English(query))
}
