package conf

sealed trait SetCombination

/** SOME translates to "at least one of the categoryCodes list matches the
  * category codes of the entry" It uses the PostgreSQL `&&` operator which
  * checks if the two arrays have any elements in common.
  * https://www.postgresql.org/docs/current/functions-array.html#FUNCTIONS-ARRAY
  */
case object SOME extends SetCombination

/** ALL translates to "all of the categoryCodes list are included in the
  * category codes of the entry" It uses the PostgreSQL `@>` operator which
  * checks if the left-hand array contains all elements of the right-hand array.
  * https://www.postgresql.org/docs/current/functions-array.html#FUNCTIONS-ARRAY
  */
case object ALL extends SetCombination

case class CategoryCodesCondition(
    categoryCodes: List[String],
    combiner: SetCombination
)
