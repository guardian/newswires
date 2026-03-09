package models

import conf.SearchTerms
import service.FeatureSwitchProvider

case class FilterParams(
    searchTerms: Option[SearchTerms],
    keywordIncl: List[String],
    keywordExcl: List[String],
    suppliersIncl: List[String],
    suppliersExcl: List[String],
    categoryCodesIncl: List[String],
    categoryCodesExcl: List[String],
    hasDataFormatting: Option[Boolean],
    preComputedCategories: List[String],
    preComputedCategoriesExcl: List[String],
    collectionId: Option[Int],
    guSourceFeeds: List[String],
    guSourceFeedsExcl: List[String]
)

case class DateRange(
    start: Option[String],
    end: Option[String]
)
case class SearchParams(
    filters: FilterParams,
    dateRange: DateRange
)

object SearchParams {
  def build(
      query: Map[String, Seq[String]],
      baseParams: BaseRequestParams,
      featureSwitch: FeatureSwitchProvider
  ) = {
    SearchParams(
      FilterParams(
        searchTerms = baseParams.textSearchTerms,
        keywordIncl = baseParams.keywords,
        keywordExcl = query.get("keywordExcl").map(_.toList).getOrElse(Nil),
        suppliersIncl = baseParams.suppliers,
        suppliersExcl = computeSupplierExcl(
          query,
          featureSwitch.ShowGuSuppliers.isOn(),
          featureSwitch.ShowPAAPI.isOn(),
          baseParams.suppliers
        ),
        categoryCodesIncl = baseParams.categoryCode,
        categoryCodesExcl = baseParams.categoryCodeExcl,
        hasDataFormatting = baseParams.hasDataFormatting,
        preComputedCategories = Nil,
        preComputedCategoriesExcl = Nil,
        collectionId = baseParams.maybeCollectionId,
        guSourceFeeds = baseParams.guSourceFeeds,
        guSourceFeedsExcl = computeGuSourceFeedExcl(
          showPAAPI = featureSwitch.ShowPAAPI.isOn(),
          guSourceFeeds = baseParams.guSourceFeeds,
          guSourceFeedsExcl = baseParams.guSourceFeedsExcl
        )
      ),
      DateRange(
        start = baseParams.maybeStart,
        end = baseParams.maybeEnd
      )
    )
  }

  def computeSupplierExcl(
      query: Map[String, Seq[String]],
      showGuSuppliers: Boolean,
      showPAAPI: Boolean,
      suppliers: List[String]
  ) = {
    val dotCopyIsSelected = query.get("preset").exists(_.contains("dot-copy"))

    val dotCopyExclusion =
      Option.when(!dotCopyIsSelected)("UNAUTHED_EMAIL_FEED").toList
    val guSuppliersExclusion =
      if (showGuSuppliers) Nil
      else
        List("GuReuters", "GuAP").filterNot(s => suppliers.contains(s))
    val paApiExclusion =
      if (showPAAPI) Nil
      else List("PAAPI").filterNot(s => suppliers.contains(s))
    val exclusionFromParams =
      query.get("supplierExcl").map(_.toList).getOrElse(Nil)

    dotCopyExclusion ::: guSuppliersExclusion ::: paApiExclusion ::: exclusionFromParams
  }

  def computeGuSourceFeedExcl(
      showPAAPI: Boolean,
      guSourceFeeds: List[String],
      guSourceFeedsExcl: List[String]
  ) = {
    val paApiExclusion =
      if (showPAAPI) Nil
      else
        List("PA_API", "PA_API DATA FORMATTING").filterNot(s =>
          guSourceFeeds.contains(s)
        )

    paApiExclusion ::: guSourceFeedsExcl
  }
}
