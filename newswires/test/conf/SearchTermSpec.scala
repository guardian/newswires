package conf

import conf.SearchTerm.CombinedFields
import org.scalatest.flatspec.AnyFlatSpec
import org.scalatest.matchers.should.Matchers.convertToAnyShouldWrapper
import scalikejdbc.scalikejdbcSQLInterpolationImplicitDef

class SearchTermSpec extends AnyFlatSpec {
  behavior of "textSearchConfiguration"
  it should "return the simple search if query has quotes" in {
    val combinedFields = CombinedFields("\"has died\"")
    combinedFields.textSearchConfiguration shouldEqual sqls"simple_unaccent"
  }
  it should "return the english search if query does not have quotes" in {
    val combinedFields =
      CombinedFields("sunday racing")
    combinedFields.textSearchConfiguration shouldEqual sqls"english_unaccent"
  }
}
