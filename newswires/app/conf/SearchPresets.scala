package conf

import conf.SearchField.Slug
import conf.Suppliers._
import models.SearchParams

// Increase max line length to improve readability of search presets
// scalafmt: { maxColumn = 120 }

object SearchPreset {
  def apply(
      supplier: String,
      categoryCodes: List[String] = Nil,
      categoryCodesExcl: List[String] = Nil,
      keyword: Option[String] = None,
      keywords: List[String] = Nil,
      keywordExcl: List[String] = Nil,
      hasDataFormatting: Option[Boolean] = None,
      preComputedCategories: List[String] = Nil,
      preComputedCategoriesExcl: List[String] = Nil
  ): SearchParams =
    SearchParams(
      text = List.empty,
      suppliersIncl = List(supplier),
      keywordIncl = keyword.toList ::: keywords,
      keywordExcl = keywordExcl,
      categoryCodesIncl = categoryCodes,
      categoryCodesExcl = categoryCodesExcl,
      hasDataFormatting = hasDataFormatting,
      preComputedCategories = preComputedCategories,
      preComputedCategoriesExcl = preComputedCategoriesExcl
    )

  def fromText(
      supplier: String,
      text: String,
      categoryCodes: List[String] = Nil,
      categoryCodesExcl: List[String] = Nil,
      keyword: Option[String] = None,
      keywordExcl: List[String] = Nil,
      hasDataFormatting: Option[Boolean] = None
  ): SearchParams =
    SearchParams(
      text = List(SearchTerm.Simple(text)),
      suppliersIncl = List(supplier),
      keywordIncl = keyword.toList,
      keywordExcl = keywordExcl,
      categoryCodesIncl = categoryCodes,
      categoryCodesExcl = categoryCodesExcl,
      hasDataFormatting = hasDataFormatting
    )

  def fromSearchTerm(
      supplier: String,
      searchTerms: List[SearchTerm],
      categoryCodes: List[String] = Nil,
      categoryCodesExcl: List[String] = Nil,
      keyword: Option[String] = None,
      keywordExcl: List[String] = Nil,
      hasDataFormatting: Option[Boolean] = None,
      preComputedCategories: List[String] = Nil
  ): SearchParams =
    SearchParams(
      text = searchTerms,
      suppliersIncl = List(supplier),
      keywordIncl = keyword.toList,
      keywordExcl = keywordExcl,
      categoryCodesIncl = categoryCodes,
      categoryCodesExcl = categoryCodesExcl,
      hasDataFormatting = hasDataFormatting,
      preComputedCategories = preComputedCategories
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
    case "all-sport-stories"    => Some(AllSportStories)
    case "soccer"               => Some(Soccer)
    case "soccer-scores"        => Some(SoccerScores)
    case "soccer-tables"        => Some(SoccerTables)
    case "no-soccer"            => Some(NoSoccer)
    case "cricket"              => Some(Cricket)
    case "cricket-results"      => Some(CricketResults)
    case "rugby-league"         => Some(RugbyLeague)
    case "rugby-union"          => Some(RugbyUnion)
    case "rugby-results"        => Some(RugbyResults)
    case "tennis"               => Some(Tennis)
    case "tennis-results"       => Some(TennisResults)
    case "cycling"              => Some(Cycling)
    case "cycling-results"      => Some(CyclingResults)
    case "motor-racing"         => Some(MotorRacing)
    case "golf"                 => Some(Golf)
    case "golf-results"         => Some(GolfResults)
    case "boxing"               => Some(Boxing)
    case "horse-racing"         => Some(HorseRacing)
    case "athletics"            => Some(Athletics)
    case "olympics"             => Some(Olympics)
    case "all-data-formats"     => Some(AllDataFormats)
    case "dot-copy"             => Some(DotCopy)
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
      keywords = List("General news"),
      categoryCodes = CategoryCodes.World.AP
    )
  )

  private val ReutersSchedule = List(
    SearchPreset.fromSearchTerm(
      REUTERS,
      searchTerms = List(SearchTerm.Simple(SimpleSearchQueries.REUTERS_NEWS_SCHEDULE, SearchField.Headline)),
      categoryCodes = List("MCC:DED")
    )
  )

  private val ReutersWorld = List(
    SearchPreset(REUTERS, categoryCodes = CategoryCodes.World.REUTERS),
    SearchPreset(
      REUTERS,
      preComputedCategories = List("other-topic-codes"),
      preComputedCategoriesExcl = List("sports-related-topic-codes", "business-related-topic-codes")
    ),
    SearchPreset(
      REUTERS,
      categoryCodes = List("MCC:OVR", "MCC:QFE", "MCCL:OVR", "MCCL:OSM", "MCC:DED", "N2:US"),
      categoryCodesExcl = List(
        "MCC:SPO",
        "MCC:OEC",
        "MCCL:OEC",
        "N2:GB",
        "N2:COM",
        "N2:ECI"
      )
    ),
    SearchPreset.fromSearchTerm(
      REUTERS,
      searchTerms = List(SearchTerm.Simple("News Summary", SearchField.Headline)),
      categoryCodes = List("MCC:OEC"),
      categoryCodesExcl = List("N2:GB", "N2:COM", "N2:ECI")
    )
  )

  private val AapWorld = List(
    SearchPreset(AAP, keywordExcl = List("Sports"), preComputedCategoriesExcl = List("sports-related-news-codes"))
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
    SearchPreset(
      REUTERS,
      preComputedCategories = List("business-related-topic-codes"),
      categoryCodesExcl = List("MCC:SPO")
    ),
    SearchPreset(
      AP,
      categoryCodes = CategoryCodes.Business.AP,
      categoryCodesExcl = CategoryCodes.Sport.AP ::: CategoryCodes.Other.AP
    ),
    SearchPreset(AAP, preComputedCategories = List("business-related-news-codes"))
  )

  /*
   * Sports
   */

  private val AllSport = List(
    SearchPreset(PA, categoryCodesExcl = CategoryCodes.UK.PA ::: CategoryCodes.Business.PA),
    SearchPreset(REUTERS, preComputedCategories = List("all-sports")),
    SearchPreset(AP, preComputedCategories = List("all-sports")),
    SearchPreset(AAP, preComputedCategories = List("all-sports")),
    SearchPreset(AFP, preComputedCategories = List("all-sports"))
  )

  private val AllSportStories = List(
    SearchPreset.fromSearchTerm(
      REUTERS,
      searchTerms = List(SearchTerm.Simple("-(OPTA) -Gracenote", SearchField.BodyText)),
      CategoryCodes.Sport.REUTERS
    ),
    SearchPreset.fromSearchTerm(
      PA,
      searchTerms = List(
        SearchTerm.Simple(
          "-\"TABULATED RESULTS\" -\"Divisional Summaries\" -GOALSCORERS " +
            "-Goalflash -Summaries -Teams -AMENDMENTS -\"Pools Grid \" -Statistics -CORRECTN -\"Top Goal Scorer\" " +
            "-BOOKINGS -\"Sending Off\" -\"SENT OFF\" -\"FULL-TIME\" -\"HALF-TIME\" -\"POOLS DIVIDEND\" -\"RACING GOING\" " +
            "-Postponed -\"SOCCER TEAMS\" -\"MATCH STATS\" -Collated -Advisory " +
            "-Formwatch -Pieces -Straps -\"wind surgery\" -Traveller -blinkers",
          Slug
        )
      ),
      categoryCodesExcl =
        CategoryCodes.UK.PA ::: CategoryCodes.Business.PA ::: CategoryCodes.CricketResults.PA ::: CategoryCodes.SoccerScores.PA
          ::: CategoryCodes.SoccerTables.PA ::: CategoryCodes.RugbyResults.PA ::: List(
            "paCat:RSR",
            "paCat:SRD",
            "paCat:SRN",
            "paCat:RRR",
            "paCat:RDR",
            "paCat:SFF",
            "paCat:SSF",
            "paCat:SSD",
            "paCat:SRZ",
            "paCat:RMS",
            "paCat:SFU",
            "paCat:NMS",
            "paCat:SSP",
            "paCat:MDS"
          ),
      hasDataFormatting = Some(false)
    ),
    SearchPreset.fromSearchTerm(
      AFP,
      searchTerms = List(SearchTerm.Simple("-result -results -scorers -table", SearchField.Headline)),
      CategoryCodes.Sport.AFP
    ),
    SearchPreset(AAP, categoryCodes = CategoryCodes.Sport.AAP),
    SearchPreset.fromSearchTerm(
      AP,
      searchTerms = List(
        SearchTerm.Simple(
          "-\"BC-\" -\"Injury Report \" -Results -\"Inactive Report\" " +
            "-\"Team List\" -Figures -SportsWatch -Transactions -Glance -listings -Prep OR (AP Sports Glance)",
          Slug
        )
      ),
      CategoryCodes.Sport.AP
    )
  )

  private val Soccer = List(
    SearchPreset.fromSearchTerm(
      REUTERS,
      searchTerms = List(SearchTerm.Simple("-(OPTA)", SearchField.BodyText)),
      CategoryCodes.Soccer.REUTERS
    ),
    SearchPreset(PA, CategoryCodes.Soccer.PA, hasDataFormatting = Some(false)),
    SearchPreset.fromSearchTerm(
      AFP,
      searchTerms = List(
        SearchTerm.Simple("fbl", Slug),
        SearchTerm
          .Simple("-result -results -scorers -table", SearchField.Headline)
      ),
      CategoryCodes.Sport.AFP
    ),
    SearchPreset(AAP, CategoryCodes.Soccer.AAP),
    SearchPreset.fromSearchTerm(
      AP,
      searchTerms = List(SearchTerm.Simple("AP SOC -Glance", Slug)),
      CategoryCodes.Sport.AP,
      keyword = Some("Soccer")
    )
  )

  private val SoccerScores = List(
    SearchPreset.fromSearchTerm(
      REUTERS,
      searchTerms = List(SearchTerm.Simple("(OPTA)", SearchField.BodyText)),
      CategoryCodes.Soccer.REUTERS
    ),
    SearchPreset.fromSearchTerm(
      PA,
      searchTerms = List(SearchTerm.Simple("SOCCER", Slug)),
      CategoryCodes.SoccerScores.PA
    ),
    SearchPreset.fromSearchTerm(PA, searchTerms = List(SearchTerm.Simple("SOCCER TABULATED RESULTS", Slug))),
    SearchPreset.fromSearchTerm(
      AFP,
      searchTerms =
        List(SearchTerm.Simple("fbl", Slug), SearchTerm.Simple("result OR results OR scorers", SearchField.Headline)),
      CategoryCodes.Sport.AFP
    ),
    SearchPreset.fromSearchTerm(
      AP,
      searchTerms = List(SearchTerm.Simple("\"BC-SOC\" OR SOC Glance", Slug)),
      CategoryCodes.Sport.AP
    )
  )

  private val SoccerTables = List(
    SearchPreset.fromSearchTerm(
      AFP,
      searchTerms = List(SearchTerm.Simple("fbl", Slug), SearchTerm.Simple("table", SearchField.Headline)),
      CategoryCodes.Sport.AFP
    ),
    SearchPreset.fromSearchTerm(
      PA,
      searchTerms = List(SearchTerm.Simple("SOCCER Tables", Slug)),
      CategoryCodes.SoccerTables.PA
    )
  )
  // SoccerTablesDataFormats
  private val NoSoccer = List(
    SearchPreset(
      REUTERS,
      preComputedCategories = List("no-soccer"),
      categoryCodesExcl = CategoryCodes.Soccer.REUTERS
    ),
    SearchPreset.fromSearchTerm(
      PA,
      searchTerms = List(SearchTerm.Simple("-SOCCER", Slug)),
      preComputedCategories = List("no-soccer"),
      categoryCodesExcl = CategoryCodes.Soccer.PA
    ),
    SearchPreset
      .fromSearchTerm(
        AFP,
        searchTerms = List(SearchTerm.Simple("-fbl", Slug)),
        categoryCodes = CategoryCodes.Sport.AFP
      ),
    SearchPreset(
      AAP,
      preComputedCategories = List("no-soccer"),
      categoryCodesExcl = CategoryCodes.Soccer.AAP
    ),
    SearchPreset.fromSearchTerm(
      AP,
      searchTerms = List(SearchTerm.Simple("-BC -SOC", Slug)),
      preComputedCategories = List("no-soccer"),
      keywordExcl = List("Soccer")
    )
  )

  private val Cricket = List(
    SearchPreset
      .fromSearchTerm(
        REUTERS,
        searchTerms = List(SearchTerm.Simple("-(OPTA)", SearchField.BodyText)),
        categoryCodes = CategoryCodes.Cricket.REUTERS
      ),
    SearchPreset(PA, CategoryCodes.Cricket.PA),
    SearchPreset
      .fromSearchTerm(
        AFP,
        searchTerms = List(SearchTerm.Simple("cricket", Slug)),
        categoryCodes = CategoryCodes.Sport.AFP
      ),
    SearchPreset(AAP, CategoryCodes.Cricket.AAP),
    SearchPreset.fromSearchTerm(
      AP,
      searchTerms = List(SearchTerm.Simple("\"AP-CRI\" -Glance -Figures -Runs", Slug)),
      CategoryCodes.Sport.AP
    )
  )

  private val CricketResults = List(
    SearchPreset
      .fromSearchTerm(
        REUTERS,
        searchTerms = List(SearchTerm.Simple("(OPTA)", SearchField.BodyText)),
        categoryCodes = CategoryCodes.Cricket.REUTERS
      ),
    SearchPreset(PA, CategoryCodes.CricketResults.PA),
    SearchPreset.fromSearchTerm(
      AP,
      searchTerms = List(SearchTerm.Simple("\"AP-CRI\" Glance OR Figures OR Runs", Slug)),
      CategoryCodes.Sport.AP
    )
  )

  private val RugbyLeague = List(
    SearchPreset.fromSearchTerm(
      REUTERS,
      searchTerms = List(SearchTerm.Simple("-(OPTA)", SearchField.BodyText)),
      CategoryCodes.RugbyLeague.REUTERS
    ),
    SearchPreset.fromSearchTerm(
      PA,
      searchTerms = List(SearchTerm.Simple("RUGBYL", Slug)),
      CategoryCodes.Sport.PA
    ),
    SearchPreset.fromSearchTerm(
      AFP,
      searchTerms =
        List(SearchTerm.Simple("RugbyL", Slug), SearchTerm.Simple("-result -results", SearchField.Headline)),
      CategoryCodes.Sport.AFP
    ),
    SearchPreset(AAP, CategoryCodes.RugbyLeague.AAP),
    SearchPreset.fromSearchTerm(
      AP,
      searchTerms = List(SearchTerm.Simple("RGL", Slug)),
      CategoryCodes.Sport.AP,
      keyword = Some("Rugby")
    )
  )

  private val RugbyUnion = List(
    SearchPreset.fromSearchTerm(
      REUTERS,
      searchTerms = List(SearchTerm.Simple("-(OPTA)", SearchField.BodyText)),
      CategoryCodes.RugbyUnion.REUTERS
    ),
    SearchPreset.fromSearchTerm(
      PA,
      searchTerms = List(SearchTerm.Simple("RUGBYU", Slug)),
      CategoryCodes.Sport.PA
    ),
    SearchPreset.fromSearchTerm(
      AFP,
      searchTerms =
        List(SearchTerm.Simple("RugbyU", Slug), SearchTerm.Simple("-result -results", SearchField.Headline)),
      CategoryCodes.Sport.AFP
    ),
    SearchPreset(AAP, CategoryCodes.RugbyUnion.AAP),
    SearchPreset.fromSearchTerm(
      AP,
      searchTerms = List(SearchTerm.Simple("RGU", Slug)),
      CategoryCodes.Sport.AP,
      keyword = Some("Rugby")
    )
  )

  private val RugbyResults = List(
    SearchPreset.fromSearchTerm(
      PA,
      searchTerms = List(SearchTerm.Simple("-SOCCER", Slug)),
      CategoryCodes.RugbyResults.PA
    ),
    SearchPreset.fromSearchTerm(
      AFP,
      searchTerms = List(
        SearchTerm.Simple("RugbyL OR RugbyU", Slug),
        SearchTerm.Simple("result OR results", SearchField.Headline)
      ),
      CategoryCodes.Sport.AFP
    ),
    SearchPreset.fromSearchTerm(
      REUTERS,
      searchTerms = List(SearchTerm.Simple("(OPTA)", SearchField.BodyText)),
      CategoryCodes.RugbyLeague.REUTERS
    )
  )

  private val Tennis = List(
    SearchPreset.fromSearchTerm(
      REUTERS,
      searchTerms = List(SearchTerm.Simple("-(OPTA)", SearchField.BodyText)),
      CategoryCodes.Tennis.REUTERS
    ),
    SearchPreset.fromSearchTerm(PA, searchTerms = List(SearchTerm.Simple("TENNIS", Slug)), CategoryCodes.Sport.PA),
    SearchPreset.fromSearchTerm(
      AFP,
      searchTerms =
        List(SearchTerm.Simple("Tennis", Slug), SearchTerm.Simple("-result -results", SearchField.Headline)),
      CategoryCodes.Sport.AFP
    ),
    SearchPreset(AAP, CategoryCodes.Tennis.AAP),
    SearchPreset.fromSearchTerm(
      AP,
      searchTerms = List(SearchTerm.Simple("AP TEN", Slug)),
      CategoryCodes.Sport.AP,
      keyword = Some("Tennis")
    )
  )

  private val TennisResults = List(
    SearchPreset.fromSearchTerm(
      REUTERS,
      searchTerms = List(SearchTerm.Simple("(OPTA)", SearchField.BodyText)),
      CategoryCodes.Tennis.REUTERS
    ),
    SearchPreset.fromSearchTerm(
      PA,
      searchTerms = List(SearchTerm.Simple("TENNIS", Slug)),
      hasDataFormatting = Some(true)
    ),
    SearchPreset.fromSearchTerm(
      AFP,
      searchTerms =
        List(SearchTerm.Simple("Tennis", Slug), SearchTerm.Simple("result OR results", SearchField.Headline)),
      CategoryCodes.Sport.AFP
    ),
    SearchPreset.fromSearchTerm(
      AP,
      searchTerms = List(SearchTerm.Simple("\"BC-TEN\"", Slug)),
      CategoryCodes.Sport.AP
    )
  )

  private val Cycling = List(
    SearchPreset.fromSearchTerm(
      REUTERS,
      searchTerms = List(SearchTerm.Simple("-Gracenote", SearchField.BodyText)),
      CategoryCodes.Cycling.REUTERS
    ),
    SearchPreset.fromSearchTerm(PA, searchTerms = List(SearchTerm.Simple("CYCLING", Slug)), CategoryCodes.Sport.PA),
    SearchPreset.fromSearchTerm(AFP, searchTerms = List(SearchTerm.Simple("cycling", Slug)), CategoryCodes.Sport.AFP),
    SearchPreset(AAP, CategoryCodes.Cycling.AAP),
    SearchPreset.fromSearchTerm(
      AP,
      searchTerms = List(SearchTerm.Simple("CYC", Slug)),
      CategoryCodes.Sport.AP,
      keyword = Some("Cycling")
    )
  )

  private val CyclingResults = List(
    SearchPreset.fromSearchTerm(
      REUTERS,
      searchTerms = List(SearchTerm.Simple("Gracenote", SearchField.BodyText)),
      CategoryCodes.Cycling.REUTERS
    )
  )
  private val MotorRacing = List(
    SearchPreset(REUTERS, CategoryCodes.MotorRacing.REUTERS),
    SearchPreset.fromSearchTerm(PA, searchTerms = List(SearchTerm.Simple("auto", Slug)), CategoryCodes.Sport.PA),
    SearchPreset.fromSearchTerm(AFP, searchTerms = List(SearchTerm.Simple("auto", Slug)), CategoryCodes.Sport.AFP),
    SearchPreset(AAP, CategoryCodes.MotorRacing.AAP),
    SearchPreset(AP, CategoryCodes.Sport.AP, keyword = Some("Automobile racing"))
  )

  private val Golf = List(
    SearchPreset(REUTERS, CategoryCodes.Golf.REUTERS),
    SearchPreset
      .fromSearchTerm(PA, searchTerms = List(SearchTerm.Simple("GOLF", Slug)), categoryCodesExcl = List("paCat:RSR")),
    SearchPreset.fromSearchTerm(AFP, searchTerms = List(SearchTerm.Simple("golf", Slug)), CategoryCodes.Sport.AFP),
    SearchPreset(AAP, CategoryCodes.Golf.AAP),
    SearchPreset.fromSearchTerm(
      AP,
      searchTerms = List(SearchTerm.Simple("GLF -Scores", Slug)),
      CategoryCodes.Sport.AP,
      keyword = Some("Golf")
    )
  )

  private val GolfResults = List(
    SearchPreset
      .fromSearchTerm(PA, searchTerms = List(SearchTerm.Simple("GOLF", Slug)), categoryCodes = List("paCat:RSR")),
    SearchPreset.fromSearchTerm(
      AP,
      searchTerms = List(
        SearchTerm.Simple(
          "GLF Scores OR GLF Leaders OR GLF Winners OR GLF Stax OR GLF Standings " +
            "OR GLF Ranking",
          Slug
        )
      ),
      CategoryCodes.Sport.AP
    )
  )

  private val Boxing = List(
    SearchPreset(REUTERS, CategoryCodes.Boxing.REUTERS),
    SearchPreset.fromSearchTerm(
      PA,
      searchTerms = List(SearchTerm.Simple("BOXING", Slug)),
      categoryCodes = List("paCat:SRS", "paCat:SSS")
    ),
    SearchPreset.fromSearchTerm(AFP, searchTerms = List(SearchTerm.Simple("Box", Slug)), CategoryCodes.Sport.AFP),
    SearchPreset(AAP, CategoryCodes.Boxing.AAP),
    SearchPreset.fromSearchTerm(AP, searchTerms = List(SearchTerm.Simple("BOX", Slug)), keyword = Some("Boxing"))
  )

  private val HorseRacing = List(
    SearchPreset(REUTERS, CategoryCodes.HorseRacing.REUTERS),
    SearchPreset(PA, CategoryCodes.HorseRacing.PA),
    SearchPreset.fromSearchTerm(AFP, searchTerms = List(SearchTerm.Simple("racing", Slug)), CategoryCodes.Sport.AFP),
    SearchPreset(AAP, CategoryCodes.HorseRacing.AAP),
    SearchPreset(AP, CategoryCodes.Sport.AP, keyword = Some("Horse racing"))
  )

  private val Athletics = List(
    SearchPreset(REUTERS, CategoryCodes.Athletics.REUTERS),
    SearchPreset.fromSearchTerm(
      PA,
      searchTerms = List(SearchTerm.Simple("ATHLETICS", Slug)),
      categoryCodes = List("paCat:SRS", "paCat:SSS", "paCat:RSR")
    ),
    SearchPreset.fromSearchTerm(AFP, searchTerms = List(SearchTerm.Simple("ATHLETICS", Slug)), CategoryCodes.Sport.AFP),
    SearchPreset(AAP, CategoryCodes.Athletics.AAP),
    SearchPreset.fromSearchTerm(
      AP,
      searchTerms = List(SearchTerm.Simple("ATH", Slug)),
      CategoryCodes.Sport.AP,
      keyword = Some("Track and field")
    )
  )

  private val Olympics = List(
    SearchPreset(REUTERS, CategoryCodes.Olympics.REUTERS),
    SearchPreset.fromText(
      PA,
      text = SimpleSearchQueries.OLYMPICS,
      categoryCodes = List("paCat:SRS", "paCat:SSS")
    ),
    SearchPreset.fromSearchTerm(AFP, searchTerms = List(SearchTerm.Simple("Oly", Slug)), CategoryCodes.Sport.AFP),
    SearchPreset(AAP, CategoryCodes.Olympics.AAP),
    SearchPreset(AP, CategoryCodes.Sport.AP, keyword = Some("Olympic games"))
  )

  private val AllDataFormats = List(
    SearchPreset(PA, hasDataFormatting = Some(true))
  )

  private val DotCopy = List(SearchPreset("UNAUTHED_EMAIL_FEED"))

}
