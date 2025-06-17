package conf

import db.SearchParams

object SearchPreset {
  def apply(
      supplier: String,
      categoryCode: String
  ): SearchParams =
    SearchParams(
      text = None,
      suppliersIncl = List(supplier),
      categoryCodesIncl = List(categoryCode)
    )

  def apply(
      supplier: String,
      categoryCode: String,
      text: Option[String]
  ): SearchParams =
    SearchParams(
      text = text,
      suppliersIncl = List(supplier),
      categoryCodesIncl = List(categoryCode)
    )

  def apply(
      supplier: String,
      categoryCode: String,
      keyword: String
  ): SearchParams =
    SearchParams(
      text = None,
      suppliersIncl = List(supplier),
      categoryCodesIncl = List(categoryCode),
      keywordIncl = List(keyword)
    )

  def apply(
      supplier: String,
      categoryCode: String,
      keyword: String,
      text: Option[String]
  ): SearchParams =
    SearchParams(
      text = text,
      suppliersIncl = List(supplier),
      categoryCodesIncl = List(categoryCode),
      keywordIncl = List(keyword)
    )

  def apply(
      supplier: String,
      categoryCodes: List[String],
      categoryCodesExcl: List[String] = List(),
      text: Option[String] = None,
      keyword: List[String] = Nil
  ): SearchParams =
    SearchParams(
      text = text,
      suppliersIncl = List(supplier),
      keywordIncl = keyword,
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
      "AP",
      keyword = List("World news"),
      categoryCodes = List("apCat:i", "apCat:a", "apCat:w"),
      categoryCodesExcl = List("apCat:s", "apCat:e", "apCat:f")
    )
  )

  private val ReutersSchedule = List(
    SearchParams(
      text = Some("\"REUTERS NEWS SCHEDULE\""),
      suppliersIncl = List("REUTERS"),
      categoryCodesIncl = List(
        "MCC:DED"
      )
    )
  )

  private val ReutersWorld = List(
    SearchParams(
      text = None,
      suppliersIncl = List("REUTERS"),
      categoryCodesIncl = List("REUTERS:WORLD"),
      categoryCodesExcl = List(
        "MCC:SPO"
      )
    ),
    SearchParams(
      text = None,
      suppliersIncl = List("REUTERS"),
      categoryCodesIncl = Categories.otherTopicCodes,
      categoryCodesExcl =
        Categories.businessRelatedTopicCodes ++ Categories.sportsRelatedTopicCodes
    ),
    SearchParams(
      text = None,
      suppliersIncl = List("REUTERS"),
      categoryCodesIncl = List(
        "MCC:OVR",
        "MCC:QFE",
        "MCCL:OVR",
        "MCCL:OSM",
        "N2:US"
      ),
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
    SearchParams(
      text = Some("News Summary"),
      suppliersIncl = List("REUTERS"),
      categoryCodesIncl = List(
        "MCC:OEC"
      ),
      categoryCodesExcl = List(
        "N2:GB",
        "N2:COM",
        "N2:ECI"
      )
    )
  )

  private val AapWorld = List(
    SearchParams(
      text = None,
      suppliersIncl = List("AAP"),
      keywordExcl = List("Sports"),
      categoryCodesExcl = Categories.sportsRelatedNewsCodes
    )
  )

  private val AfpWorld = List(
    SearchParams(
      text = None,
      suppliersIncl = List("AFP"),
      categoryCodesExcl = List("afpCat:SPO")
    )
  )

  private val MinorAgenciesWorld = List(
    SearchParams(
      text = None,
      suppliersIncl = List("MINOR_AGENCIES"),
      categoryCodesExcl = List("N2:GB")
    )
  )

  private val PaHome = List(
    SearchPreset(
      "PA",
      List(
        "paCat:HHH",
        "paCat:SCN",
        "paCat:IFN",
        "paCat:QFF",
        "paCat:PPP"
      )
    )
  )

  private val PaBusiness = List(
    SearchPreset(
      "PA",
      List(
        "paCat:FFF",
        "paCat:GXX"
      )
    )
  )

  private val MinorAgenciesUk = List(
    SearchPreset("MINOR_AGENCIES", "N2:GB")
  )

  private val ReutersBusiness = List(
    SearchPreset(
      "REUTERS",
      categoryCodes = Categories.businessRelatedTopicCodes,
      categoryCodesExcl = List("MCC:SPO")
    )
  )

  private val ApBusiness = List(
    SearchParams(
      text = None,
      suppliersIncl = List("AP"),
      categoryCodesIncl = List("apCat:f"),
      categoryCodesExcl = List("apCat:s", "apCat:e")
    )
  )

  private val AapBusiness = List(
    SearchPreset("AAP", Categories.businessRelatedNewsCode)
  )

  private val ReutersSport = List(
    SearchPreset("REUTERS", Categories.sportRelatedTopicCodes)
  )

  private val PaSport = List(
    SearchPreset(
      "PA",
      List(
        "paCat:SRS", // General Sport News
        "paCat:SSS", // General Sport News
        "paCat:SSO", // Soccer News
        "paCat:SCR", // Cricket News
        "paCat:SRR", // Racing News
        "paCat:SST" // Scottish sports
      )
    )
  )

  private val AfpSport = List(SearchPreset("AFP", CategoryCodes.Sport.AFP))

  private val AapSport = List(
    SearchPreset(
      "AAP",
      keyword = List("Sports"),
      categoryCodes = Categories.sportsRelatedNewsCodes
    )
  )

  private val ApSport = List(SearchPreset("AP", CategoryCodes.Sport.AP))

  private val AllWorld =
    ApWorld ::: ReutersWorld ::: ReutersSchedule ::: AapWorld ::: AfpWorld ::: MinorAgenciesWorld

  private val AllUk =
    PaHome ::: MinorAgenciesUk

  private val AllBusiness =
    ReutersBusiness ::: ApBusiness ::: AapBusiness ::: PaBusiness

  private val AllSport =
    ReutersSport ::: PaSport ::: AfpSport ::: AapSport ::: ApSport

  private val Soccer = List(
    SearchPreset("REUTERS", CategoryCodes.Soccer.REUTERS),
    SearchPreset("PA", CategoryCodes.Soccer.PA),
    SearchPreset("AFP", CategoryCodes.Sport.AFP, text = Some("soccer")),
    SearchPreset("AAP", CategoryCodes.Soccer.AAP),
    SearchPreset("AP", CategoryCodes.Sport.AP, keyword = "Soccer")
  )

  private val Cricket = List(
    SearchPreset("REUTERS", CategoryCodes.Cricket.REUTERS),
    SearchPreset("PA", CategoryCodes.Cricket.PA),
    SearchPreset("AFP", CategoryCodes.Sport.AFP, text = Some("cricket")),
    SearchPreset("AAP", CategoryCodes.Cricket.AAP),
    SearchPreset("AP", CategoryCodes.Sport.AP, keyword = "Cricket")
  )

  private val RugbyLeague = List(
    SearchPreset("REUTERS", CategoryCodes.RugbyLeague.REUTERS),
    SearchPreset(
      "PA",
      categoryCodes = List(
        "paCat:SRS",
        "paCat:SSS"
      ),
      categoryCodesExcl = List("paCat:SSO", "paCat:SCR", "paCat:SRR"),
      text = Some("rugby league")
    ),
    SearchPreset("AFP", CategoryCodes.Sport.AFP, text = Some("rugby league")),
    SearchPreset("AAP", CategoryCodes.RugbyLeague.AAP),
    SearchPreset(
      "AP",
      CategoryCodes.Sport.AP,
      text = Some("rugby league"),
      keyword = "Rugby"
    )
  )

  private val RugbyUnion = List(
    SearchPreset("REUTERS", CategoryCodes.RugbyUnion.REUTERS),
    SearchPreset(
      "PA",
      categoryCodes = List(
        "paCat:SRS",
        "paCat:SSS"
      ),
      categoryCodesExcl = List("paCat:SSO", "paCat:SCR", "paCat:SRR"),
      text = Some("rugby union")
    ),
    SearchPreset("AFP", CategoryCodes.Sport.AFP, text = Some("rugby union")),
    SearchPreset("AAP", CategoryCodes.RugbyUnion.AAP),
    SearchPreset(
      "AP",
      CategoryCodes.Sport.AP,
      text = Some("rugby union"),
      keyword = "Rugby"
    )
  )

  private val Tennis = List(
    SearchPreset("REUTERS", CategoryCodes.Tennis.REUTERS),
    SearchPreset(
      "PA",
      categoryCodes = List(
        "paCat:SRS",
        "paCat:SSS"
      ),
      categoryCodesExcl = List("paCat:SSO", "paCat:SCR", "paCat:SRR"),
      text = Some("tennis")
    ),
    SearchPreset("AFP", CategoryCodes.Sport.AFP, text = Some("tennis")),
    SearchPreset("AAP", CategoryCodes.Tennis.AAP),
    SearchPreset("AP", CategoryCodes.Sport.AP, keyword = "Tennis")
  )

  private val Cycling = List(
    SearchPreset("REUTERS", CategoryCodes.Cycling.REUTERS),
    SearchPreset(
      "PA",
      categoryCodes = List(
        "paCat:SRS",
        "paCat:SSS"
      ),
      categoryCodesExcl = List("paCat:SSO", "paCat:SCR", "paCat:SRR"),
      text = Some("cycling")
    ),
    SearchPreset("AFP", CategoryCodes.Sport.AFP, text = Some("cycling")),
    SearchPreset("AAP", CategoryCodes.Cycling.AAP),
    SearchPreset("AP", CategoryCodes.Sport.AP, keyword = "Cycling")
  )

  private val F1 = List(
    SearchPreset("REUTERS", CategoryCodes.F1.REUTERS),
    SearchPreset(
      "PA",
      categoryCodes = List(
        "paCat:SRS",
        "paCat:SSS"
      ),
      categoryCodesExcl = List("paCat:SSO", "paCat:SCR", "paCat:SRR"),
      text = Some("f1 \"formula one\"")
    ),
    SearchPreset(
      "AFP",
      CategoryCodes.Sport.AFP,
      text = Some("f1 \"formula one\"")
    ),
    SearchPreset("AAP", CategoryCodes.F1.AAP),
    SearchPreset("AP", CategoryCodes.Sport.AP, keyword = "Formula One racing")
  )

  private val Golf = List(
    SearchPreset("REUTERS", CategoryCodes.Golf.REUTERS),
    SearchPreset(
      "PA",
      categoryCodes = List(
        "paCat:SRS",
        "paCat:SSS"
      ),
      categoryCodesExcl = List("paCat:SSO", "paCat:SCR", "paCat:SRR"),
      text = Some("golf")
    ),
    SearchPreset("AFP", CategoryCodes.Sport.AFP, text = Some("golf")),
    SearchPreset("AAP", CategoryCodes.Golf.AAP),
    SearchPreset("AP", CategoryCodes.Sport.AP, keyword = "Golf")
  )

  private val Boxing = List(
    SearchPreset("REUTERS", CategoryCodes.Boxing.REUTERS),
    SearchPreset(
      "PA",
      categoryCodes = List(
        "paCat:SRS",
        "paCat:SSS"
      ),
      categoryCodesExcl = List("paCat:SSO", "paCat:SCR", "paCat:SRR"),
      text = Some("\"boxing\"")
    ),
    SearchPreset("AFP", CategoryCodes.Sport.AFP, text = Some("\"boxing\"")),
    SearchPreset("AAP", CategoryCodes.Boxing.AAP),
    SearchPreset("AP", CategoryCodes.Sport.AP, keyword = "Boxing")
  )

  private val Racing = List(
    SearchPreset("REUTERS", CategoryCodes.Racing.REUTERS),
    SearchPreset("PA", CategoryCodes.Racing.PA),
    SearchPreset(
      "AFP",
      CategoryCodes.Sport.AFP,
      text = Some("\"horse racing\"")
    ),
    SearchPreset("AAP", CategoryCodes.Racing.AAP),
    SearchPreset("AP", CategoryCodes.Sport.AP, keyword = "Horse racing")
  )
}
