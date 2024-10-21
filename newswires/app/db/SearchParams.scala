package db

case class SearchParams(
    text: Option[String],
    keywordIncl: List[String] = Nil,
    keywordExcl: List[String] = Nil,
    suppliersIncl: List[String] = Nil,
    suppliersExcl: List[String] = Nil,
    subjectsIncl: List[String] = Nil,
    subjectsExcl: List[String] = Nil,
    mediaCatCodesIncl: List[String] = Nil,
    mediaCatCodesExcl: List[String] = Nil
)
