package models

import conf.SearchTerm
import org.scalatest.flatspec.AnyFlatSpec
import org.scalatest.matchers.should.Matchers.convertToAnyShouldWrapper
import org.scalatestplus.mockito.MockitoSugar.mock
import service.FeatureSwitchProvider

class SearchParamsSpec extends AnyFlatSpec {

  it should "return empty search params when none are set" in new models {
    SearchParams.build(
      emptyQueryString,
      emptyBaseParams,
      featureMock
    ) shouldEqual emptySearchParams
  }
  it should "set an english search term when maybeFreeTextQuery is set" in new models {
    val baseParams = emptyBaseParams.copy(maybeFreeTextQuery = Some("query"))
    val result = SearchParams.build(emptyQueryString, baseParams, featureMock)
    result.text shouldEqual Some(SearchTerm.English("query"))
  }

  it should "set keywordExcl when this is defined in the query string" in new models {
    val result = SearchParams.build(
      Map("keywordExcl" -> Seq("a", "b")),
      emptyBaseParams,
      featureMock
    )
    result.keywordExcl shouldEqual List("a", "b")
  }

  it should "return full search params when all fields are set" in new models {
    val baseParams = BaseRequestParams(
      maybeFreeTextQuery = Some("hello"),
      keywords = List("keyword1"),
      suppliers = List("supplier1"),
      categoryCode = List("code1"),
      categoryCodeExcl = List("code2"),
      maybeStart = Some("start"),
      maybeEnd = Some("end"),
      maybeBeforeId = Some(2),
      maybeSinceId = Some(1),
      hasDataFormatting = Some(true)
    )
    val result = SearchParams.build(emptyQueryString, baseParams, featureMock)
    result shouldEqual SearchParams(
      text = Some(SearchTerm.English("hello")),
      start = Some("start"),
      end = Some("end"),
      keywordIncl = List("keyword1"),
      keywordExcl = Nil,
      suppliersIncl = List("supplier1"),
      suppliersExcl = Nil,
      categoryCodesIncl = List("code1"),
      categoryCodesExcl = List("code2"),
      hasDataFormatting = Some(true)
    )
  }
}

trait models {
  val emptyBaseParams = BaseRequestParams()
  val emptySearchParams = SearchParams(None)
  val emptyQueryString = Map[String, Seq[String]]()
  val featureMock = mock[FeatureSwitchProvider]
}
