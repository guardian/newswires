package models

import conf.SearchField.Slug
import conf.{AND, ComboTerm, OR, SearchTerm}
import helpers.models
import org.mockito.Mockito.when
import org.scalatest.flatspec.AnyFlatSpec
import org.scalatest.matchers.should.Matchers.convertToAnyShouldWrapper
import org.scalatestplus.mockito.MockitoSugar.mock
import service.{FeatureSwitch, FeatureSwitchProvider, Off}

class SearchParamsSpec extends AnyFlatSpec with models {

  behavior of "build"

  it should "return empty search params when none are set with default supplier exclusion set" in new searchParamsMocks {
    SearchParams.build(
      emptyQueryString,
      emptyBaseParams,
      featureSwitchShowGuSuppliersOn
    ) shouldEqual emptySearchParams.copy(filters =
      emptyFilterParams.copy(suppliersExcl = List("UNAUTHED_EMAIL_FEED"))
    )
  }
  it should "set an english search term when maybeFreeTextQuery is set" in new searchParamsMocks {
    val baseParams = emptyBaseParams.copy(maybeFreeTextQuery = Some("query"))
    val result = SearchParams.build(
      emptyQueryString,
      baseParams,
      featureSwitchShowGuSuppliersOn
    )
    result.filters.searchTerms shouldEqual Some(
      ComboTerm(
        List(SearchTerm.English("query"), SearchTerm.Simple("query", Slug)),
        OR
      )
    )
  }

  it should "set keywordExcl when this is defined in the query string" in new searchParamsMocks {
    val result = SearchParams.build(
      Map("keywordExcl" -> Seq("a", "b")),
      emptyBaseParams,
      featureSwitchShowGuSuppliersOn
    )
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
      maybeBeforeId = Some(100),
      maybeSinceId = Some(50),
      hasDataFormatting = Some(true)
    )
    val result = SearchParams.build(
      emptyQueryString,
      baseParams,
      featureSwitchShowGuSuppliersOn
    )
    result shouldEqual SearchParams(
      FilterParams(
        searchTerms = Some(
          ComboTerm(
            List(SearchTerm.English("hello"), SearchTerm.Simple("hello", Slug)),
            OR
          )
        ),
        keywordIncl = List("keyword1"),
        keywordExcl = Nil,
        suppliersIncl = List("supplier1"),
        suppliersExcl = List("UNAUTHED_EMAIL_FEED"),
        categoryCodesIncl = List("code1"),
        categoryCodesExcl = List("code2"),
        hasDataFormatting = Some(true),
        collectionId = Some(1),
        preComputedCategories = Nil,
        preComputedCategoriesExcl = Nil,
      ),
      DateRange(
        start = Some("start"),
        end = Some("end")
      )
    )
  }

  it should "include computed supplier exclusions" in new searchParamsMocks {
    val result =
      SearchParams.build(
        emptyQueryString,
        emptyBaseParams,
        featureSwitchShowGuSuppliersOff
      )
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
}

trait searchParamsMocks {
  val emptyBaseParams = BaseRequestParams()
  val emptyQueryString = Map[String, Seq[String]]()
  val featureSwitchShowGuSuppliersOn = mock[FeatureSwitchProvider]
  val featureSwitchShowGuSuppliersOff = mock[FeatureSwitchProvider]
  val featureSwitch = FeatureSwitch(
    name = "",
    safeState = Off,
    description = "",
    exposeToClient = true,
    isOn = () => true
  )
  when(featureSwitchShowGuSuppliersOn.ShowGuSuppliers).thenReturn(featureSwitch)
  when(featureSwitchShowGuSuppliersOff.ShowGuSuppliers).thenReturn(
    featureSwitch.copy(isOn = () => false)
  )
}
