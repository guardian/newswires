package db

import org.scalatest.flatspec.AnyFlatSpec
import org.scalatest.matchers.should.Matchers

class FingerpostWireEntrySpec extends AnyFlatSpec with Matchers {

  behavior of "FingerpostWireEntry.generateWhereClause"

  it should "generate an empty where clause for a empty set of search params" in {
    val searchParams = SearchParams(
      text = None,
      start = None,
      end = None,
      keywordIncl = Nil,
      keywordExcl = Nil,
      suppliersIncl = Nil,
      suppliersExcl = Nil,
      subjectsIncl = Nil,
      subjectsExcl = Nil
    )

    val whereClause =
      FingerpostWireEntry.buildWhereClause(searchParams, None, None)
    whereClause.value should be(
      ""
    )
    whereClause.parameters should be(Nil)
  }

  it should "generate a where clause for a single field" in {
    val searchParams =
      SearchParams(
        text = Some("text1"),
        start = None,
        end = None,
        keywordIncl = Nil,
        keywordExcl = Nil,
        suppliersIncl = Nil,
        suppliersExcl = Nil,
        subjectsIncl = Nil,
        subjectsExcl = Nil
      )

    val whereClause =
      FingerpostWireEntry.buildWhereClause(searchParams, None, None)
    whereClause.value should be(
      "WHERE websearch_to_tsquery('english', ?) @@ fm.combined_textsearch"
    )
    whereClause.parameters should be(List("text1"))
  }

  it should "concatenate keywords and subjects with 'or'" in {
    val searchParams =
      SearchParams(
        text = None,
        start = None,
        end = None,
        keywordIncl = List("keyword1", "keyword2"),
        keywordExcl = Nil,
        suppliersExcl = Nil,
        subjectsIncl = List("subject1", "subject2"),
        subjectsExcl = Nil,
        categoryCodesIncl = List("category1", "category2")
      )

    val whereClause =
      FingerpostWireEntry.buildWhereClause(searchParams, None, None)
    whereClause.value should be(
      "WHERE ((fm.content -> 'keywords') ??| ? or (fm.content -> 'subjects' -> 'code') ??| ? or fm.category_codes && ?) and fm.category_codes && ?"
    )
    whereClause.parameters should be(
      List(
        List("keyword1", "keyword2"),
        List("subject1", "subject2"),
        List("category1", "category2"),
        List("category1", "category2")
      )
    )
  }

}
