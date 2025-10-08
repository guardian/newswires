package models

import conf.SearchTerm

case class SearchParams(
    text: Option[SearchTerm],
    start: Option[String] = None,
    end: Option[String] = None,
    keywordIncl: List[String] = Nil,
    keywordExcl: List[String] = Nil,
    suppliersIncl: List[String] = Nil,
    suppliersExcl: List[String] = Nil,
    categoryCodesIncl: List[String] = Nil,
    categoryCodesExcl: List[String] = Nil,
    hasDataFormatting: Option[Boolean] = None,
    // Additional text clauses to be ANDed with the main text query
    andText: List[SearchTerm] = Nil
)
