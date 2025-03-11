package helpers

import org.scalatest.matchers.{MatchResult, Matcher}
import scalikejdbc.SQLSyntax

object WhereClauseMatcher {
  def matchWhereClause(
      expectedClause: String,
      expectedParams: List[Any]
  ): Matcher[SQLSyntax] =
    (left: SQLSyntax) => {
      // Standardise the SQL strings by removing whitespace.
      val standardise: String => String = _.replaceAll("\\s*", " ")

      val standardisedActual = standardise(left.value)
      val standardisedExpected = standardise(expectedClause)

      val clauseMatches = standardisedActual == standardisedExpected
      val paramsMatch = left.parameters == expectedParams

      MatchResult(
        clauseMatches && paramsMatch,
        s"WHERE clause did not match:\nExpected clause: [$expectedClause] with parameters: [$expectedParams]\nActual clause: [${left.value}] with parameters: [${left.parameters}]",
        "WHERE clause matched as expected."
      )
    }
}
