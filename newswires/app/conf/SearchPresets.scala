package conf

import conf.Suppliers.{AAP, AFP, AP, MINOR_AGENCIES, PA, REUTERS}
import db.{SearchConfig, SearchParams, SearchTerm}

object SearchPreset {
  def apply(
      supplier: String,
      categoryCode: Option[String] = None,
      categoryCodes: List[String] = Nil,
      categoryCodesExcl: List[String] = Nil,
      text: Option[String] = None,
      keyword: Option[String] = None,
      keywordExcl: List[String] = Nil
  ): SearchParams =
    SearchParams(
      text = text.map(SearchTerm(_, SearchConfig.Simple)),
      suppliersIncl = List(supplier),
      keywordIncl = keyword.toList,
      keywordExcl = keywordExcl,
      categoryCodesIncl = categoryCode match {
        case Some(value) => List(value)
        case None        => categoryCodes
      },
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
    case "pa-home"              => Some(PaHome)
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
      categoryCodes = List("apCat:i", "apCat:a", "apCat:w"),
      categoryCodesExcl = List("apCat:s", "apCat:e", "apCat:f")
    )
  )

  private val ReutersSchedule = List(
    SearchPreset(
      REUTERS,
      text = Some("\"REUTERS NEWS SCHEDULE\""),
      categoryCodes = List("MCC:DED")
    )
  )

  private val ReutersWorld = List(
    SearchPreset(
      REUTERS,
      categoryCodes = List("REUTERS:WORLD"),
      categoryCodesExcl = List("MCC:SPO")
    ),
    SearchPreset(
      REUTERS,
      categoryCodes = Categories.otherTopicCodes,
      categoryCodesExcl =
        Categories.businessRelatedTopicCodes ++ Categories.sportRelatedTopicCodes
    ),
    SearchPreset(
      REUTERS,
      categoryCodes =
        List("MCC:OVR", "MCC:QFE", "MCCL:OVR", "MCCL:OSM", "N2:US"),
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
      text = Some("News Summary")
    )
  )

  private val AapWorld = List(
    SearchPreset(
      AAP,
      keywordExcl = List("Sports"),
      categoryCodesExcl = Categories.sportsRelatedNewsCodes
    )
  )

  private val AfpWorld = List(
    SearchPreset(AFP, categoryCodesExcl = List("afpCat:SPO"))
  )

  private val MinorAgenciesWorld = List(
    SearchPreset(MINOR_AGENCIES, categoryCodesExcl = List("N2:GB"))
  )

  private val AllWorld =
    ApWorld ::: ReutersWorld ::: ReutersSchedule ::: AapWorld ::: AfpWorld ::: MinorAgenciesWorld

  /*
   * UK
   */

  private val PaHome = List(
    SearchPreset(
      PA,
      categoryCodes =
        List("paCat:HHH", "paCat:SCN", "paCat:IFN", "paCat:QFF", "paCat:PPP")
    )
  )

  private val MinorAgenciesUk = List(
    SearchPreset(MINOR_AGENCIES, Some("N2:GB"))
  )

  private val AllUk =
    PaHome ::: MinorAgenciesUk

  /*
   * Business
   */

  private val PaBusiness = List(
    SearchPreset(PA, categoryCodes = List("paCat:FFF", "paCat:GXX"))
  )

  private val ReutersBusiness = List(
    SearchPreset(
      REUTERS,
      categoryCodes = Categories.businessRelatedTopicCodes,
      categoryCodesExcl = List("MCC:SPO")
    )
  )

  private val ApBusiness = List(
    SearchPreset(
      AP,
      categoryCodes = List("apCat:f"),
      categoryCodesExcl = List("apCat:s", "apCat:e")
    )
  )

  private val AapBusiness = List(
    SearchPreset(AAP, categoryCodes = Categories.businessRelatedNewsCodes)
  )

  private val AllBusiness =
    ReutersBusiness ::: ApBusiness ::: AapBusiness ::: PaBusiness

  /*
   * Sports
   */

  private val ReutersSport = List(
    SearchPreset(REUTERS, categoryCodes = CategoryCodes.Sport.REUTERS)
  )

  private val PaSport = List(
    SearchPreset(PA, categoryCodes = CategoryCodes.Sport.PA)
  )

  private val AfpSport = List(
    SearchPreset(AFP, Some(CategoryCodes.Sport.AFP))
  )

  private val AapSport = List(
    SearchPreset(
      AAP,
      keyword = Some("Sports"),
      categoryCodes = CategoryCodes.Sport.AAP
    )
  )

  private val ApSport = List(SearchPreset(AP, Some(CategoryCodes.Sport.AP)))

  private val AllSport =
    ReutersSport ::: PaSport ::: AfpSport ::: AapSport ::: ApSport

  private val Soccer = List(
    SearchPreset(REUTERS, Some(CategoryCodes.Soccer.REUTERS)),
    SearchPreset(PA, Some(CategoryCodes.Soccer.PA)),
    SearchPreset(AFP, Some(CategoryCodes.Sport.AFP), text = Some("soccer")),
    SearchPreset(AAP, Some(CategoryCodes.Soccer.AAP)),
    SearchPreset(AP, Some(CategoryCodes.Sport.AP), keyword = Some("Soccer"))
  )

  private val Cricket = List(
    SearchPreset(REUTERS, Some(CategoryCodes.Cricket.REUTERS)),
    SearchPreset(PA, Some(CategoryCodes.Cricket.PA)),
    SearchPreset(AFP, Some(CategoryCodes.Sport.AFP), text = Some("cricket")),
    SearchPreset(AAP, Some(CategoryCodes.Cricket.AAP)),
    SearchPreset(AP, Some(CategoryCodes.Sport.AP), keyword = Some("Cricket"))
  )

  private val RugbyLeague = List(
    SearchPreset(REUTERS, Some(CategoryCodes.RugbyLeague.REUTERS)),
    SearchPreset(
      PA,
      categoryCodes = List("paCat:SRS", "paCat:SSS"),
      text = Some("rugby league")
    ),
    SearchPreset(
      AFP,
      Some(CategoryCodes.Sport.AFP),
      text = Some("rugby league")
    ),
    SearchPreset(AAP, Some(CategoryCodes.RugbyLeague.AAP)),
    SearchPreset(
      AP,
      Some(CategoryCodes.Sport.AP),
      text = Some("rugby league"),
      keyword = Some("Rugby")
    )
  )

  private val RugbyUnion = List(
    SearchPreset(REUTERS, Some(CategoryCodes.RugbyUnion.REUTERS)),
    SearchPreset(
      PA,
      categoryCodes = List("paCat:SRS", "paCat:SSS"),
      text = Some("rugby union")
    ),
    SearchPreset(
      AFP,
      Some(CategoryCodes.Sport.AFP),
      text = Some("rugby union")
    ),
    SearchPreset(AAP, Some(CategoryCodes.RugbyUnion.AAP)),
    SearchPreset(
      AP,
      Some(CategoryCodes.Sport.AP),
      text = Some("rugby union"),
      keyword = Some("Rugby")
    )
  )

  private val Tennis = List(
    SearchPreset(REUTERS, Some(CategoryCodes.Tennis.REUTERS)),
    SearchPreset(
      PA,
      categoryCodes = List("paCat:SRS", "paCat:SSS"),
      text = Some("tennis")
    ),
    SearchPreset(AFP, Some(CategoryCodes.Sport.AFP), text = Some("tennis")),
    SearchPreset(AAP, Some(CategoryCodes.Tennis.AAP)),
    SearchPreset(AP, Some(CategoryCodes.Sport.AP), keyword = Some("Tennis"))
  )

  private val Cycling = List(
    SearchPreset(REUTERS, Some(CategoryCodes.Cycling.REUTERS)),
    SearchPreset(
      PA,
      categoryCodes = List("paCat:SRS", "paCat:SSS"),
      text = Some("cycling")
    ),
    SearchPreset(AFP, Some(CategoryCodes.Sport.AFP), text = Some("cycling")),
    SearchPreset(AAP, Some(CategoryCodes.Cycling.AAP)),
    SearchPreset(AP, Some(CategoryCodes.Sport.AP), keyword = Some("Cycling"))
  )

  private val F1 = List(
    SearchPreset(REUTERS, Some(CategoryCodes.F1.REUTERS)),
    SearchPreset(
      PA,
      categoryCodes = List("paCat:SRS", "paCat:SSS"),
      text = Some("f1 \"formula one\"")
    ),
    SearchPreset(
      AFP,
      Some(CategoryCodes.Sport.AFP),
      text = Some("f1 \"formula one\"")
    ),
    SearchPreset(AAP, Some(CategoryCodes.F1.AAP)),
    SearchPreset(
      AP,
      Some(CategoryCodes.Sport.AP),
      keyword = Some("Formula One racing")
    )
  )

  private val Golf = List(
    SearchPreset(REUTERS, Some(CategoryCodes.Golf.REUTERS)),
    SearchPreset(
      PA,
      categoryCodes = List("paCat:SRS", "paCat:SSS"),
      text = Some("golf")
    ),
    SearchPreset(AFP, Some(CategoryCodes.Sport.AFP), text = Some("golf")),
    SearchPreset(AAP, Some(CategoryCodes.Golf.AAP)),
    SearchPreset(AP, Some(CategoryCodes.Sport.AP), keyword = Some("Golf"))
  )

  private val Boxing = List(
    SearchPreset(REUTERS, Some(CategoryCodes.Boxing.REUTERS)),
    SearchPreset(
      PA,
      categoryCodes = List("paCat:SRS", "paCat:SSS"),
      text = Some("\"boxing\"")
    ),
    SearchPreset(AFP, Some(CategoryCodes.Sport.AFP), text = Some("\"boxing\"")),
    SearchPreset(AAP, Some(CategoryCodes.Boxing.AAP)),
    SearchPreset(AP, Some(CategoryCodes.Sport.AP), keyword = Some("Boxing"))
  )

  private val Racing = List(
    SearchPreset(REUTERS, Some(CategoryCodes.Racing.REUTERS)),
    SearchPreset(PA, Some(CategoryCodes.Racing.PA)),
    SearchPreset(
      AFP,
      Some(CategoryCodes.Sport.AFP),
      text = Some("\"horse racing\"")
    ),
    SearchPreset(AAP, Some(CategoryCodes.Racing.AAP)),
    SearchPreset(
      AP,
      Some(CategoryCodes.Sport.AP),
      keyword = Some("Horse racing")
    )
  )
}
