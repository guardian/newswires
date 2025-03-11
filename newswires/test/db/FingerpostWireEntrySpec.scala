package db

import helpers.WhereClauseMatcher.matchWhereClause
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
      FingerpostWireEntry.buildWhereClause(List(searchParams), None, None)

    whereClause should matchWhereClause(
      expectedClause = "",
      expectedParams = Nil
    )
  }

  it should "generate a where clause for a single field" in {
    val searchParams =
      SearchParams(
        text = Some("text1")
      )

    val whereClause =
      FingerpostWireEntry.buildWhereClause(List(searchParams), None, None)

    whereClause should matchWhereClause(
      "WHERE websearch_to_tsquery('english', ?) @@ fm.combined_textsearch",
      expectedParams = List("text1")
    )
  }

  it should "concatenate keywords, subjects and category codes with 'or'" in {
    val searchParams =
      SearchParams(
        text = None,
        keywordIncl = List("keyword1", "keyword2"),
        subjectsIncl = List("subject1", "subject2"),
        categoryCodesIncl = List("category1", "category2")
      )

    val whereClause =
      FingerpostWireEntry.buildWhereClause(List(searchParams), None, None)

    whereClause should matchWhereClause(
      "WHERE ((fm.content -> 'keywords') ??| ? or (fm.content -> 'subjects' -> 'code') ??| ? or fm.category_codes && ?)",
      List(
        List("keyword1", "keyword2"),
        List("subject1", "subject2"),
        List("category1", "category2")
      )
    )
  }

  it should "join other clauses using 'and'" in {
    val searchParams =
      SearchParams(
        text = Some("text1"),
        start = Some("2025-03-10T00:00:00.000Z"),
        end = Some("2025-03-10T23:59:59.999Z"),
        suppliersExcl = List("supplier1", "supplier2"),
        keywordExcl = List("keyword1"),
        categoryCodesExcl = List("category1", "category2")
      )

    val whereClause =
      FingerpostWireEntry.buildWhereClause(List(searchParams), Some(1), None)

    whereClause should matchWhereClause(
      """WHERE fm.id < ? and NOT EXISTS (
        |  SELECT FROM fingerpost_wire_entry keywordsExcl
        |  WHERE fm.id = keywordsExcl.id
        |    AND (keywordsExcl.content->'keywords') ??| ?
        |) and websearch_to_tsquery('english', ?) @@ fm.combined_textsearch and NOT EXISTS (
        |  SELECT FROM fingerpost_wire_entry sourceFeedsExcl
        |  WHERE fm.id = sourceFeedsExcl.id
        |    AND  upper(sourceFeedsExcl.supplier) in (upper(?), upper(?))
        |) and (fm.ingested_at BETWEEN CAST(? AS timestamptz) AND CAST(? AS timestamptz)) and NOT EXISTS (
        |  SELECT FROM fingerpost_wire_entry categoryCodesExcl
        |  WHERE fm.id = categoryCodesExcl.id
        |    AND categoryCodesExcl.category_codes && ?
        |)""".stripMargin,
      List(
        1,
        List("keyword1"),
        "text1",
        "supplier1",
        "supplier2",
        "2025-03-10T00:00:00.000Z",
        "2025-03-10T23:59:59.999Z",
        List("category1", "category2")
      )
    )
  }

  it should "Should cast a lower bound date only" in {
    val searchParams = SearchParams(
      text = None,
      start = Some("2025-03-10T00:00:00.000Z")
    )

    val whereClause =
      FingerpostWireEntry.buildWhereClause(List(searchParams), None, None)

    whereClause should matchWhereClause(
      "WHERE fm.ingested_at >= CAST(? AS timestamptz)",
      List("2025-03-10T00:00:00.000Z")
    )
  }

  it should "Should cast an upper bound date only" in {
    val searchParams = SearchParams(
      text = None,
      end = Some("2025-03-10T23:59:59.999Z")
    )

    val whereClause =
      FingerpostWireEntry.buildWhereClause(List(searchParams), None, None)

    whereClause should matchWhereClause(
      "WHERE fm.ingested_at <= CAST(? AS timestamptz)",
      List("2025-03-10T23:59:59.999Z")
    )
  }

  it should "should join complex bucket presets using 'or'" in {
    val searchParamList = List(
      SearchParams(
        text = Some("News Summary"),
        suppliersIncl = List("REUTERS"),
        subjectsIncl = List(
          "MCC:OEC"
        ),
        subjectsExcl = List(
          "N2:GB",
          "N2:COM",
          "N2:ECI"
        )
      ),
      SearchParams(
        text = None,
        suppliersIncl = List("REUTERS"),
        subjectsIncl = List(
          "MCC:OVR",
          "MCCL:OVR",
          "MCCL:OSM",
          "N2:US"
        ),
        subjectsExcl = List(
          "N2:GB",
          "N2:COM",
          "N2:ECI"
        )
      )
    )

    val whereClause =
      FingerpostWireEntry.buildWhereClause(searchParamList, None, None)

    whereClause should matchWhereClause(
      """WHERE ((fm.content -> 'subjects' -> 'code') ??| ? and NOT EXISTS (
        |  SELECT FROM fingerpost_wire_entry subjectsExcl
        |  WHERE fm.id = subjectsExcl.id
        |    AND (subjectsExcl.content->'subjects'->'code') ??| ?
        |) and websearch_to_tsquery('english', ?) @@ fm.combined_textsearch and  upper(fm.supplier) in (upper(?))) or ((fm.content -> 'subjects' -> 'code') ??| ? and NOT EXISTS (
        |  SELECT FROM fingerpost_wire_entry subjectsExcl
        |  WHERE fm.id = subjectsExcl.id
        |    AND (subjectsExcl.content->'subjects'->'code') ??| ?
        |) and  upper(fm.supplier) in (upper(?)))""".stripMargin,
      List(
        List("MCC:OEC"),
        List("N2:GB", "N2:COM", "N2:ECI"),
        "News Summary",
        "REUTERS",
        List("MCC:OVR", "MCCL:OVR", "MCCL:OSM", "N2:US"),
        List("N2:GB", "N2:COM", "N2:ECI"),
        "REUTERS"
      )
    )
  }
}
