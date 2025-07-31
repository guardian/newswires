package helpers

import org.scalatest.matchers.{MatchResult, Matcher}
import scalikejdbc.SQLSyntax

object SqlSnippetMatcher {
  def matchSqlSnippet(
      expectedClause: String,
      expectedParams: List[Any]
  ): Matcher[SQLSyntax] =
    (left: SQLSyntax) => {
      // Standardise the SQL strings by removing whitespace.
      val standardise: String => String = _.replaceAll("\\s+", " ")

      val standardisedActual = standardise(left.value)
      val standardisedExpected = standardise(expectedClause)

      val clauseMatches = standardisedActual == standardisedExpected
      val paramsMatch = left.parameters == expectedParams

      MatchResult(
        clauseMatches && paramsMatch,
        s"Clause: $standardisedActual Params: ${left.parameters} did not equal Clause: $standardisedExpected Params: $expectedParams",
        "SQL snippet matched as expected."
      )
    }
}
