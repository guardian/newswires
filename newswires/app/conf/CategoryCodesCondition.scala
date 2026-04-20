package conf

sealed trait SetCombination

case object SOME extends SetCombination
case object ALL extends SetCombination

case class CategoryCodesCondition(
    categoryCodes: List[String],
    combiner: SetCombination
)
