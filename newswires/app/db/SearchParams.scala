package db

sealed trait SearchConfig

object SearchConfig {
  case object English extends SearchConfig
  case object Simple extends SearchConfig
}

case class SearchTerm(
    value: String,
    searchConfig: SearchConfig = SearchConfig.English
)

case class SearchParams(
    text: Option[SearchTerm],
    start: Option[String] = None,
    end: Option[String] = None,
    keywordIncl: List[String] = Nil,
    keywordExcl: List[String] = Nil,
    suppliersIncl: List[String] = Nil,
    suppliersExcl: List[String] = Nil,
    categoryCodesIncl: List[String] = Nil,
    categoryCodesExcl: List[String] = Nil
) {
  def merge(o: SearchParams): SearchParams = {
    val mergedText = (text, o.text) match {
      case (Some(SearchTerm(l, _)), Some(SearchTerm(r, _))) =>
        Some(SearchTerm(s"$l $r"))
      case _ => text orElse o.text
    }
    SearchParams(
      text = mergedText,
      keywordIncl = keywordIncl ++ o.keywordIncl,
      keywordExcl = keywordExcl ++ o.keywordExcl,
      suppliersIncl = suppliersIncl ++ o.suppliersIncl,
      suppliersExcl = suppliersExcl ++ o.suppliersExcl,
      categoryCodesIncl = categoryCodesIncl ++ o.categoryCodesIncl,
      categoryCodesExcl = categoryCodesExcl ++ o.categoryCodesExcl
    )
  }
}
