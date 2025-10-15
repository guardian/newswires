package models

import conf.SearchTerm
import service.FeatureSwitchProvider

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
    hasDataFormatting: Option[Boolean] = None
)

object SearchParams {
  def build(
      query: Map[String, Seq[String]],
      baseParams: BaseRequestParams,
      featureSwitch: FeatureSwitchProvider
  ) = {
    SearchParams(
      text = baseParams.maybeFreeTextQuery.map(SearchTerm.English(_)),
      start = baseParams.maybeStart,
      end = baseParams.maybeEnd,
      keywordIncl = baseParams.keywords,
      keywordExcl = query.get("keywordExcl").map(_.toList).getOrElse(Nil),
      suppliersIncl = baseParams.suppliers,
      suppliersExcl = computeSupplierExcl(
        query,
        featureSwitch.ShowGuSuppliers.isOn(),
        baseParams.suppliers
      ),
      categoryCodesIncl = baseParams.categoryCode,
      categoryCodesExcl = baseParams.categoryCodeExcl,
      hasDataFormatting = baseParams.hasDataFormatting
    )
  }

  def computeSupplierExcl(
      query: Map[String, Seq[String]],
      showGuSuppliers: Boolean,
      suppliers: List[String]
  ) = {
    val dotCopyIsSelected = query.get("preset").exists(_.contains("dot-copy"))

    val dotCopyExclusion =
      Option.when(!dotCopyIsSelected)("UNAUTHED_EMAIL_FEED").toList
    val guSuppliersExclusion =
      if (showGuSuppliers) Nil
      else List("GuReuters", "GuAP").filterNot(s => suppliers.contains(s))
    val exclusionFromParams =
      query.get("supplierExcl").map(_.toList).getOrElse(Nil)

    dotCopyExclusion ::: guSuppliersExclusion ::: exclusionFromParams
  }
}
