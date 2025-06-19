package conf

import conf.Suppliers._
import db.SearchParams

// Increase max line length to improve readability of search presets
// scalafmt: { maxColumn = 120 }

object SearchPreset {
  def apply(
      supplier: String,
      categoryCodes: List[String] = Nil,
      categoryCodesExcl: List[String] = Nil,
      text: Option[String] = None,
      searchTerm: Option[SearchTerm] = None,
      keyword: Option[String] = None,
      keywordExcl: List[String] = Nil
  ): SearchParams =
    SearchParams(
      text = searchTerm orElse text.map(SearchTerm(_, SearchConfig.Simple)),
      suppliersIncl = List(supplier),
      keywordIncl = keyword.toList,
      keywordExcl = keywordExcl,
      categoryCodesIncl = categoryCodes,
      categoryCodesExcl = categoryCodesExcl
    )
}

object SearchPresets {
  def get(name: String): Option[List[SearchParams]] = name match {
    case "reuters-world"        => Some(ReutersWorld)
    case "reuters-schedule"     => Some(ReutersSchedule)
    case "ap-world"             => Some(ApWorld)
    case "aap-world"            => Some(AapWorld)
    case "all-world"            => Some(AllWorld)
    case "afp-world"            => Some(AfpWorld)
    case "minor-agencies-world" => Some(MinorAgenciesWorld)
    case "all-uk"               => Some(AllUk)
    case "all-business"         => Some(AllBusiness)
    case "all-sport"            => Some(AllSport)
    case "soccer"               => Some(Soccer)
    case "cricket"              => Some(Cricket)
    case "rugby-league"         => Some(RugbyLeague)
    case "rugby-union"          => Some(RugbyUnion)
    case "tennis"               => Some(Tennis)
    case "cycling"              => Some(Cycling)
    case "f1"                   => Some(F1)
    case "golf"                 => Some(Golf)
    case "boxing"               => Some(Boxing)
    case "racing"               => Some(Racing)
    case _                      => None
  }

  /*
   * World
   */

  // format: off
  /**
   * Main config table for AP world ('NY:for') preset in Fip system.
   * (nb. 'NY' here is a Fip header, and doesn't seem to stand for New York)

   > ; Category Codes
   >  2	JC=a*				>w4apapi#NY:for
   >  2	JC=d*				>w4apapi#NY:fea
   >  2	JC=e*				>w4apapi#NY:fea
   >  2	JC=f*				>w4apapi#NY:fin
   >  2	JC=i*				>w4apapi#NY:for
   >  2	JC=s*				>w4apapi#NY:spt
   >  2	JC=t*				>w4apapi#NY:fea
   >  2	JC=w*				>w4apapi#NY:for
   > ; Default
   >  2	JC=*				>w4apapi#NY:for

   * The fingerpost system runs top to bottom, and '>' tells it to stop once it finds a match, so an item with
   * category code 'JC:ae' would be bucketed as 'NY:for' and not 'NY:fea', and an item with category code 'JC:ew'
   * would be bucketed as 'NY:fea' rather than 'NY:for'.
   * We're inclined to exclude sports, entertainment, finance, and technology news from this preset instead, even
   * if they have e.g. code 'a' (US news) code, because they're likely to be less relevant to International desk.
   * However, we should remain open to changing this in response to user feedback.
   */
  // format: on
  private val ApWorld = List(
    SearchPreset(
      AP,
      keyword = Some("World news"),
      categoryCodes = CategoryCodes.World.AP,
      categoryCodesExcl = CategoryCodes.Sport.AP ::: CategoryCodes.Business.AP ::: CategoryCodes.Other.AP
    )
  )

  private val ReutersSchedule = List(
    SearchPreset(REUTERS, text = Some(SimpleSearchQueries.REUTERS_NEWS_SCHEDULE), categoryCodes = List("MCC:DED"))
  )

  private val ReutersWorld = List(
    SearchPreset(REUTERS, categoryCodes = CategoryCodes.World.REUTERS, categoryCodesExcl = List("MCC:SPO")),
    SearchPreset(
      REUTERS,
      categoryCodes = CategoryCodes.Other.REUTERS,
      categoryCodesExcl = CategoryCodes.Business.REUTERS ++ CategoryCodes.Sport.REUTERS
    ),
    SearchPreset(
      REUTERS,
      categoryCodes = List("MCC:OVR", "MCC:QFE", "MCCL:OVR", "MCCL:OSM", "N2:US"),
      categoryCodesExcl = List(
        "MCC:DED",
        "MCC:SPO",
        "MCC:OEC",
        "MCCL:OEC",
        "N2:GB",
        "N2:COM",
        "N2:ECI"
      )
    ),
    SearchPreset(
      REUTERS,
      categoryCodes = List("MCC:OEC"),
      categoryCodesExcl = List("N2:GB", "N2:COM", "N2:ECI"),
      searchTerm = Some(SearchTerm("News Summary", SearchConfig.Simple, "headline"))
    )
  )

  private val AapWorld = List(
    SearchPreset(AAP, keywordExcl = List("Sports"), categoryCodesExcl = CategoryCodes.Sport.AAP)
  )

  private val AfpWorld = List(
    SearchPreset(AFP, categoryCodesExcl = CategoryCodes.Sport.AFP)
  )

  private val MinorAgenciesWorld = List(
    SearchPreset(MINOR_AGENCIES, categoryCodesExcl = CategoryCodes.UK.MINOR_AGENCIES)
  )

  private val AllWorld =
    ApWorld ::: ReutersWorld ::: ReutersSchedule ::: AapWorld ::: AfpWorld ::: MinorAgenciesWorld

  /*
   * UK
   */

  private val AllUk = List(
    SearchPreset(PA, categoryCodes = CategoryCodes.UK.PA),
    SearchPreset(MINOR_AGENCIES, CategoryCodes.UK.MINOR_AGENCIES)
  )

  /*
   * Business
   */

  private val AllBusiness = List(
    SearchPreset(PA, categoryCodes = CategoryCodes.Business.PA),
    SearchPreset(REUTERS, categoryCodes = CategoryCodes.Business.REUTERS, categoryCodesExcl = List("MCC:SPO")),
    SearchPreset(
      AP,
      categoryCodes = CategoryCodes.Business.AP,
      categoryCodesExcl = CategoryCodes.Sport.AP ::: CategoryCodes.Other.AP
    ),
    SearchPreset(AAP, categoryCodes = CategoryCodes.Business.AAP)
  )

  /*
   * Sports
   */
  private val AllSport = List(
    SearchPreset(REUTERS, categoryCodes = CategoryCodes.Sport.REUTERS),
    SearchPreset(PA, categoryCodes = CategoryCodes.Sport.PA),
    SearchPreset(AFP, CategoryCodes.Sport.AFP),
    SearchPreset(AAP, categoryCodes = CategoryCodes.Sport.AAP),
    SearchPreset(AP, CategoryCodes.Sport.AP)
  )

  private val Soccer = List(
    SearchPreset(REUTERS, CategoryCodes.Soccer.REUTERS),
    SearchPreset(PA, CategoryCodes.Soccer.PA),
    SearchPreset(AFP, CategoryCodes.Sport.AFP, text = Some(SimpleSearchQueries.SOCCER)),
    SearchPreset(AAP, CategoryCodes.Soccer.AAP),
    SearchPreset(AP, CategoryCodes.Sport.AP, keyword = Some(SimpleSearchQueries.SOCCER))
  )

  private val Cricket = List(
    SearchPreset(REUTERS, CategoryCodes.Cricket.REUTERS),
    SearchPreset(PA, CategoryCodes.Cricket.PA),
    SearchPreset(AFP, CategoryCodes.Sport.AFP, text = Some(SimpleSearchQueries.CRICKET)),
    SearchPreset(AAP, CategoryCodes.Cricket.AAP),
    SearchPreset(AP, CategoryCodes.Sport.AP, keyword = Some(SimpleSearchQueries.CRICKET))
  )

  private val RugbyLeague = List(
    SearchPreset(REUTERS, CategoryCodes.RugbyLeague.REUTERS),
    SearchPreset(PA, categoryCodes = List("paCat:SRS", "paCat:SSS"), text = Some(SimpleSearchQueries.RUGBY_LEAGUE)),
    SearchPreset(AFP, CategoryCodes.Sport.AFP, text = Some(SimpleSearchQueries.RUGBY_LEAGUE)),
    SearchPreset(AAP, CategoryCodes.RugbyLeague.AAP),
    SearchPreset(AP, CategoryCodes.Sport.AP, text = Some(SimpleSearchQueries.RUGBY_LEAGUE), keyword = Some("Rugby"))
  )

  private val RugbyUnion = List(
    SearchPreset(REUTERS, CategoryCodes.RugbyUnion.REUTERS),
    SearchPreset(PA, categoryCodes = List("paCat:SRS", "paCat:SSS"), text = Some(SimpleSearchQueries.RUGBY_UNION)),
    SearchPreset(AFP, CategoryCodes.Sport.AFP, text = Some(SimpleSearchQueries.RUGBY_UNION)),
    SearchPreset(AAP, CategoryCodes.RugbyUnion.AAP),
    SearchPreset(AP, CategoryCodes.Sport.AP, text = Some(SimpleSearchQueries.RUGBY_UNION), keyword = Some("Rugby"))
  )

  private val Tennis = List(
    SearchPreset(REUTERS, CategoryCodes.Tennis.REUTERS),
    SearchPreset(PA, categoryCodes = List("paCat:SRS", "paCat:SSS"), text = Some(SimpleSearchQueries.TENNIS)),
    SearchPreset(AFP, CategoryCodes.Sport.AFP, text = Some(SimpleSearchQueries.TENNIS)),
    SearchPreset(AAP, CategoryCodes.Tennis.AAP),
    SearchPreset(AP, CategoryCodes.Sport.AP, keyword = Some("Tennis"))
  )

  private val Cycling = List(
    SearchPreset(REUTERS, CategoryCodes.Cycling.REUTERS),
    SearchPreset(PA, categoryCodes = List("paCat:SRS", "paCat:SSS"), text = Some(SimpleSearchQueries.CYCLING)),
    SearchPreset(AFP, CategoryCodes.Sport.AFP, text = Some(SimpleSearchQueries.CYCLING)),
    SearchPreset(AAP, CategoryCodes.Cycling.AAP),
    SearchPreset(AP, CategoryCodes.Sport.AP, keyword = Some("Cycling"))
  )

  private val F1 = List(
    SearchPreset(REUTERS, CategoryCodes.F1.REUTERS),
    SearchPreset(PA, categoryCodes = List("paCat:SRS", "paCat:SSS"), text = Some(SimpleSearchQueries.F1)),
    SearchPreset(AFP, CategoryCodes.Sport.AFP, text = Some(SimpleSearchQueries.F1)),
    SearchPreset(AAP, CategoryCodes.F1.AAP),
    SearchPreset(AP, CategoryCodes.Sport.AP, keyword = Some("Formula One racing"))
  )

  private val Golf = List(
    SearchPreset(REUTERS, CategoryCodes.Golf.REUTERS),
    SearchPreset(PA, categoryCodes = List("paCat:SRS", "paCat:SSS"), text = Some(SimpleSearchQueries.GOLF)),
    SearchPreset(AFP, CategoryCodes.Sport.AFP, text = Some(SimpleSearchQueries.GOLF)),
    SearchPreset(AAP, CategoryCodes.Golf.AAP),
    SearchPreset(AP, CategoryCodes.Sport.AP, keyword = Some("Golf"))
  )

  private val Boxing = List(
    SearchPreset(REUTERS, CategoryCodes.Boxing.REUTERS),
    SearchPreset(PA, categoryCodes = List("paCat:SRS", "paCat:SSS"), text = Some(SimpleSearchQueries.BOXING)),
    SearchPreset(AFP, CategoryCodes.Sport.AFP, text = Some(SimpleSearchQueries.BOXING)),
    SearchPreset(AAP, CategoryCodes.Boxing.AAP),
    SearchPreset(AP, CategoryCodes.Sport.AP, keyword = Some("Boxing"))
  )

  private val Racing = List(
    SearchPreset(REUTERS, CategoryCodes.Racing.REUTERS),
    SearchPreset(PA, CategoryCodes.Racing.PA),
    SearchPreset(AFP, CategoryCodes.Sport.AFP, text = Some(SimpleSearchQueries.RACING)),
    SearchPreset(AAP, CategoryCodes.Racing.AAP),
    SearchPreset(AP, CategoryCodes.Sport.AP, keyword = Some("Horse racing"))
  )
}
