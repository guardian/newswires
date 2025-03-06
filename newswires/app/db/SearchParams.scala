package db

case class SearchParams(
    text: Option[String],
    start: Option[String] = None,
    end: Option[String] = None,
    keywordIncl: List[String] = Nil,
    keywordExcl: List[String] = Nil,
    suppliersIncl: List[String] = Nil,
    suppliersExcl: List[String] = Nil,
    subjectsIncl: List[String] = Nil,
    subjectsExcl: List[String] = Nil,
    categoryCodesIncl: List[String] = Nil,
    categoryCodesExcl: List[String] = Nil
) {
  def merge(o: SearchParams): SearchParams = {
    val mergedText = (text, o.text) match {
      case (Some(l), Some(r)) => Some(s"$l $r")
      case _                  => text orElse o.text
    }
    SearchParams(
      text = mergedText,
      keywordIncl = keywordIncl ++ o.keywordIncl,
      keywordExcl = keywordExcl ++ o.keywordExcl,
      suppliersIncl = suppliersIncl ++ o.suppliersIncl,
      suppliersExcl = suppliersExcl ++ o.suppliersExcl,
      subjectsIncl = subjectsIncl ++ o.subjectsIncl,
      subjectsExcl = subjectsExcl ++ o.subjectsExcl,
      categoryCodesIncl = categoryCodesIncl ++ o.categoryCodesIncl,
      categoryCodesExcl = categoryCodesExcl ++ o.categoryCodesExcl
    )
  }
}
