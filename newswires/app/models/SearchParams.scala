package models

import conf.SearchTerms
import play.api.mvc.Request
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
    guSourceFeedsExcl: List[String],
    eventNames: List[String]
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
  )(implicit req: Request[_]) = {
    SearchParams(
      FilterParams(
        searchTerms = baseParams.textSearchTerms,
        keywordIncl = baseParams.keywords,
        keywordExcl = query.get("keywordExcl").map(_.toList).getOrElse(Nil),
        suppliersIncl = baseParams.suppliers,
        suppliersExcl = computeSupplierExcl(
          query,
          featureSwitch.ShowGuSuppliers.isOn(req),
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
          showPAAPI = featureSwitch.ShowPAAPI.isOn(req),
          guSourceFeeds = baseParams.guSourceFeeds,
          guSourceFeedsExcl = baseParams.guSourceFeedsExcl
        ),
        eventNames = baseParams.eventNames
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
      suppliers: List[String]
  ) = {
    val dotCopyIsSelected = query.get("preset").exists(_.contains("dot-copy"))

    val dotCopyExclusion =
      Option.when(!dotCopyIsSelected)("UNAUTHED_EMAIL_FEED").toList
    val guSuppliersExclusion =
      if (showGuSuppliers) Nil
      else
        List("GuReuters", "GuAP").filterNot(s => suppliers.contains(s))
    val exclusionFromParams =
      query.get("supplierExcl").map(_.toList).getOrElse(Nil)

    dotCopyExclusion ::: guSuppliersExclusion ::: exclusionFromParams
  }

  val legacyPaSourceFeeds = List(
    "PA PR NEWSWIRE",
    "PA PA MEDIA PRESS CENTRES",
    "PA PA MEDIA ASSIGNMENTS",
    "PA BUSINESSWIRE",
    "PA THE ACADEMY OF MEDICAL SCIENCES",
    "PA PA SPORT LATEST",
    "PA PRESSWIRE",
    "PA PA",
    "PA GLOBENEWSWIRE",
    "PA EQS NEWSWIRE",
    "PA LATEST",
    "PA RESPONSESOURCE",
    "PA ACCESS NEWSWIRE",
    "PA UK GOVERNMENT AND PUBLIC SECTOR",
    "PA PA SPORT",
    "PA PA ADVISORY",
    "PA AGILITY PR SOLUTIONS",
    "PA NEWS AKTUELL",
    "PA ADVISORY",
    "PA MARKETTIERS",
    "PA RNS",
    "PA",
    "PA PA SPORT SNAP",
    "PA NEWSFILE",
    "PA PRESSAT",
    "PA SNAP"
  )

  val newPaSourceFeeds = List(
    "PA_API",
    "PA_API DATA FORMATTING"
  )

  def computeGuSourceFeedExcl(
      showPAAPI: Boolean,
      guSourceFeeds: List[String],
      guSourceFeedsExcl: List[String]
  ) = {
    if (guSourceFeeds.nonEmpty || guSourceFeedsExcl.nonEmpty) {
      guSourceFeedsExcl
    } else if (showPAAPI) {
      legacyPaSourceFeeds
    } else
      newPaSourceFeeds
  }
}
