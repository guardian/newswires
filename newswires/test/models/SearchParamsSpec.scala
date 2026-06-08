package models

import conf.SearchField.Slug
import conf._
import helpers.models
import org.mockito.Mockito.when
import org.scalatest.flatspec.AnyFlatSpec
import org.scalatest.matchers.should.Matchers.convertToAnyShouldWrapper
import org.scalatestplus.mockito.MockitoSugar.mock
import play.api.test.FakeRequest
import service.{FeatureSwitch, FeatureSwitchProvider, Off}

class SearchParamsSpec extends AnyFlatSpec with models {

  behavior of "build"

  it should "return empty search params when none are set with default supplier and source feed exclusions set" in new searchParamsMocks {
    SearchParams.build(
      emptyQueryString,
      emptyBaseParams,
      featureSwitchesOn
    )(FakeRequest()) shouldEqual emptySearchParams.copy(filters =
      emptyFilterParams.copy(
        suppliersExcl = List("UNAUTHED_EMAIL_FEED")
      )
    )
  }
  it should "set an english search term when maybeFreeTextQuery is set" in new searchParamsMocks {
    val baseParams = emptyBaseParams.copy(maybeFreeTextQuery = Some("query"))
    val result = SearchParams.build(
      emptyQueryString,
      baseParams,
      featureSwitchesOn
    )(FakeRequest())
    result.filters.searchTerms shouldEqual Some(
      ComboTerm(
        List(
          SearchTerm.CombinedFields("query"),
          SearchTerm.SingleField("query", Slug)
        ),
        OR
      )
    )
  }

  it should "set keywordExcl when this is defined in the query string" in new searchParamsMocks {
    val result = SearchParams.build(
      Map("keywordExcl" -> Seq("a", "b")),
      emptyBaseParams,
      featureSwitchesOn
    )(FakeRequest())
    result.filters.keywordExcl shouldEqual List("a", "b")
  }

  it should "return full search params when all fields are set" in new searchParamsMocks {
    val baseParams = BaseRequestParams(
      maybeFreeTextQuery = Some("hello"),
      keywords = List("keyword1"),
      suppliers = List("supplier1"),
      categoryCode = List("code1"),
      categoryCodeExcl = List("code2"),
      maybeCollectionId = Some(1),
      maybeStart = Some("start"),
      maybeEnd = Some("end"),
      maybeBeforeTimeStamp = Some("2023-01-01T00:00:00Z"),
      maybeAfterTimeStamp = Some("2023-01-02T00:00:00Z"),
      hasDataFormatting = Some(true),
      guSourceFeeds = List("A"),
      guSourceFeedsExcl = List("B"),
      eventCode = Some("event")
    )
    val result = SearchParams.build(
      emptyQueryString,
      baseParams,
      featureSwitchesOn
    )(FakeRequest())
    result shouldEqual SearchParams(
      FilterParams(
        searchTerms = Some(
          ComboTerm(
            List(
              SearchTerm.CombinedFields("hello"),
              SearchTerm.SingleField("hello", Slug)
            ),
            OR
          )
        ),
        keywordIncl = List("keyword1"),
        keywordExcl = Nil,
        suppliersIncl = List("supplier1"),
        suppliersExcl = List("UNAUTHED_EMAIL_FEED"),
        categoryCodesIncl = Some(CategoryCodesCondition(List("code1"), SOME)),
        categoryCodesExcl = List("code2"),
        hasDataFormatting = Some(true),
        collectionId = Some(1),
        preComputedCategories = Nil,
        preComputedCategoriesExcl = Nil,
        guSourceFeeds = List("A"),
        guSourceFeedsExcl = List("B"),
        eventCode = Some("event")
      ),
      DateRange(
        start = Some("start"),
        end = Some("end")
      )
    )
  }

  it should "include computed supplier exclusions when the showGuSuppliers feature switch is off " in new searchParamsMocks {
    val result =
      SearchParams.build(
        emptyQueryString,
        emptyBaseParams,
        showGuSuppliersFeatureOff
      )(FakeRequest())
    result.filters.suppliersExcl shouldEqual List(
      "UNAUTHED_EMAIL_FEED",
      "GuReuters",
      "GuAP"
    )
  }

  behavior of "computeSupplierExcl"

  it should "return dotcopy exclusion when no additional exclusion params are set and showGuSuppliers is true" in new searchParamsMocks {
    val result = SearchParams.computeSupplierExcl(
      emptyQueryString,
      showGuSuppliers = true,
      Nil
    )
    result shouldEqual List("UNAUTHED_EMAIL_FEED")
  }
  it should "return dotcopy exclusion and gu suppliers when no additional exclusion params are set and showGuSuppliers is false" in new searchParamsMocks {
    val result = SearchParams.computeSupplierExcl(
      emptyQueryString,
      showGuSuppliers = false,
      Nil
    )
    result shouldEqual List("UNAUTHED_EMAIL_FEED", "GuReuters", "GuAP")
  }
  it should "return add any exclusions from the parameters" in {
    val result = SearchParams.computeSupplierExcl(
      Map("supplierExcl" -> Seq("supplier1")),
      showGuSuppliers = false,
      Nil
    )
    result shouldEqual List(
      "UNAUTHED_EMAIL_FEED",
      "GuReuters",
      "GuAP",
      "supplier1"
    )
  }
  it should "override gu suppliers exclusion when showGuSuppliers is false and the suppliers filter include a Gu supplier" in new searchParamsMocks {
    val result = SearchParams.computeSupplierExcl(
      emptyQueryString,
      showGuSuppliers = false,
      List("GuReuters")
    )
    result shouldEqual List("UNAUTHED_EMAIL_FEED", "GuAP")
  }
  it should "not include dotcopy exclusion when the dotcopy preset is set" in new searchParamsMocks {
    val result = SearchParams.computeSupplierExcl(
      Map("preset" -> Seq("dot-copy")),
      showGuSuppliers = true,
      Nil
    )
    result shouldEqual Nil
  }
  it should "include dotcopy exclusion when any other preset is set" in new searchParamsMocks {
    val result = SearchParams.computeSupplierExcl(
      Map("preset" -> Seq("soccer")),
      showGuSuppliers = true,
      Nil
    )
    result shouldEqual List("UNAUTHED_EMAIL_FEED")
  }

  behavior of "computeGuSourceFeedExcl"

  it should "return empty list when hideMediaDirectFeeds is false and no guSourceFeed is explicitly set" in new searchParamsMocks {
    val result = SearchParams.computeGuSourceFeedExcl(
      hideMediaDirectFeeds = false,
      guSourceFeeds = Nil,
      guSourceFeedsExcl = Nil
    )
    result shouldEqual Nil
  }

  it should "exclude media direct source feeds when hideMediaDirectFeeds is true and no guSourceFeed is explicitly set" in new searchParamsMocks {
    val result = SearchParams.computeGuSourceFeedExcl(
      hideMediaDirectFeeds = true,
      guSourceFeeds = Nil,
      guSourceFeedsExcl = Nil
    )
    result shouldEqual SearchParams.mediaDirectSourceFeeds
  }

  it should "pass through guSourceFeedsExcl unchanged when guSourceFeeds is non-empty" in new searchParamsMocks {
    val result = SearchParams.computeGuSourceFeedExcl(
      hideMediaDirectFeeds = true,
      guSourceFeeds = List("some-feed"),
      guSourceFeedsExcl = List("excluded-feed")
    )
    result shouldEqual List("excluded-feed")
  }

  it should "pass through guSourceFeedsExcl unchanged when guSourceFeedsExcl is non-empty" in new searchParamsMocks {
    val result = SearchParams.computeGuSourceFeedExcl(
      hideMediaDirectFeeds = true,
      guSourceFeeds = Nil,
      guSourceFeedsExcl = List("excluded-feed")
    )
    result shouldEqual List("excluded-feed")
  }

  it should "apply media direct feed exclusions via SearchParams.build when hideMediaDirectFeeds is on" in new searchParamsMocks {
    val result = SearchParams.build(
      emptyQueryString,
      emptyBaseParams,
      hideMediaDirectFeedsOn
    )(FakeRequest())
    result.filters.guSourceFeedsExcl shouldEqual SearchParams.mediaDirectSourceFeeds
  }
}

trait searchParamsMocks {
  val emptyBaseParams = BaseRequestParams()
  val emptyQueryString = Map[String, Seq[String]]()
  val featureSwitchesOn = mock[FeatureSwitchProvider]
  val showGuSuppliersFeatureOff = mock[FeatureSwitchProvider]
  val hideMediaDirectFeedsOn = mock[FeatureSwitchProvider]
  val featureSwitch = FeatureSwitch(
    name = "",
    safeState = Off,
    description = "",
    exposeToClient = true,
    isOn = _ => true
  )
  when(featureSwitchesOn.ShowGuSuppliers).thenReturn(featureSwitch)
  when(featureSwitchesOn.HideMediaDirectFeeds).thenReturn(
    featureSwitch.copy(isOn = _ => false)
  )
  when(showGuSuppliersFeatureOff.ShowGuSuppliers).thenReturn(
    featureSwitch.copy(isOn = _ => false)
  )
  when(showGuSuppliersFeatureOff.HideMediaDirectFeeds).thenReturn(
    featureSwitch.copy(isOn = _ => false)
  )
  when(hideMediaDirectFeedsOn.ShowGuSuppliers).thenReturn(featureSwitch)
  when(hideMediaDirectFeedsOn.HideMediaDirectFeeds).thenReturn(featureSwitch)
}
