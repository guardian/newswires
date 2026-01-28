package conf

import conf.SearchField.{BodyText, Headline, Slug}
import conf.SearchTerm.Simple
import conf.Suppliers._
import models.SearchParams

// Increase max line length to improve readability of search presets
// scalafmt: { maxColumn = 120 }

object SearchPreset {
  def apply(
      supplier: String,
      searchTerms: Option[SearchTerms] = None,
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
      searchTerms = searchTerms,
      suppliersIncl = List(supplier),
      keywordIncl = keyword.toList ::: keywords,
      keywordExcl = keywordExcl,
      categoryCodesIncl = categoryCodes,
      categoryCodesExcl = categoryCodesExcl,
      hasDataFormatting = hasDataFormatting,
      preComputedCategories = preComputedCategories,
      preComputedCategoriesExcl = preComputedCategoriesExcl
    )
}

object SearchPresets {
  def get(name: String): Option[(List[SearchParams], List[SearchParams])] = name match {
    case "reuters-world"        => Some((ReutersWorld, Nil))
    case "reuters-schedule"     => Some((ReutersSchedule, Nil))
    case "ap-world"             => Some((ApWorld, Nil))
    case "aap-world"            => Some((AapWorld, Nil))
    case "all-world"            => Some((AllWorld, Nil))
    case "afp-world"            => Some((AfpWorld, Nil))
    case "minor-agencies-world" => Some((MinorAgenciesWorld, Nil))
    case "all-uk"               => Some((AllUk, Nil))
    case "world-plus-uk"        => Some((WorldPlusUK, Nil))
    case "all-business"         => Some((AllBusiness, Nil))
    case "all-sport"            => Some((AllSport, Nil))
    case "all-sport-stories"    => Some((AllSportStories, Nil))
    case "soccer"               => Some((Soccer, Nil))
    case "soccer-scores"        => Some((SoccerScores, Nil))
    case "soccer-tables"        => Some((SoccerTables, Nil))
    case "no-soccer"            => Some((NoSoccer, Nil))
    case "american-football"    => Some((AmericanFootball, Nil))
    case "australian-rules"     => Some((AustralianRules, Nil))
    case "baseball"             => Some((Baseball, Nil))
    case "basketball"           => Some((Basketball, Nil))
    case "college-sports"       => Some((CollegeSports, Nil))
    case "cricket"              => Some((Cricket, Nil))
    case "cricket-scores"       => Some((CricketScores, Nil))
    case "rugby-league"         => Some((RugbyLeague, Nil))
    case "rugby-union"          => Some((RugbyUnion, Nil))
    case "rugby-scores"         => Some((RugbyScores, Nil))
    case "tennis"               => Some((Tennis, Nil))
    case "tennis-scores"        => Some((TennisScores, Nil))
    case "cycling"              => Some((Cycling, Nil))
    case "motor-sport"          => Some((MotorSport, Nil))
    case "golf"                 => Some((Golf, Nil))
    case "golf-scores"          => Some((GolfScores, Nil))
    case "boxing"               => Some((Boxing, Nil))
    case "horse-racing"         => Some((HorseRacing, Nil))
    case "ice-hockey"           => Some((IceHockey, Nil))
    case "athletics"            => Some((Athletics, Nil))
    case "olympics"             => Some((Olympics, Nil))
    case "all-data-formats"     => Some((AllDataFormats, Nil))
    case "dot-copy"             => Some((DotCopy, Nil))
    case "sport-other"          => Some((AllSport, SportOther))
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
    SearchPreset(
      REUTERS,
      searchTerms = Some(SingleTerm(Simple(SimpleSearchQueries.REUTERS_NEWS_SCHEDULE, Headline))),
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
    SearchPreset(
      REUTERS,
      searchTerms = Some(SingleTerm(SearchTerm.Simple("News Summary", Headline))),
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
    SearchPreset(MINOR_AGENCIES, categoryCodes = CategoryCodes.UK.MINOR_AGENCIES)
  )

  /*
   * All News
   */
  private val WorldPlusUK = AllWorld ::: AllUk

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
    SearchPreset(
      REUTERS,
      searchTerms = Some(
        ComboTerm(
          List(
            Simple("-(OPTA) -Gracenote", BodyText),
            Simple("-/FIXTURES -/RESULTS -/STANDINGS", Slug)
          ),
          AND
        )
      ),
      CategoryCodes.Sport.REUTERS
    ),
    SearchPreset(
      PA,
      searchTerms = Some(
        ComboTerm(
          List(
            Simple(
              "-\"TABULATED RESULTS\" -\"Divisional Summaries\" -GOALSCORERS " +
                "-Goalflash -Summaries -Teams -AMENDMENTS -\"Pools Grid \" -Statistics -CORRECTN -\"Top Goal Scorer\" " +
                "-BOOKINGS -\"Sending Off\" -\"SENT OFF\" -\"FULL-TIME\" -\"HALF-TIME\" -\"POOLS DIVIDEND\" -\"RACING GOING\" " +
                "-Postponed -\"SOCCER TEAMS\" -\"MATCH STATS\" -Collated -Advisory " +
                "-Formwatch -Pieces -Straps -\"wind surgery\" -Traveller -blinkers",
              Slug
            ),
            Simple("-fixtures", Headline)
          ),
          AND
        )
      ),
      categoryCodesExcl =
        CategoryCodes.UK.PA ::: CategoryCodes.Business.PA ::: CategoryCodes.CricketScores.PA ::: CategoryCodes.SoccerScores.PA
          ::: CategoryCodes.SoccerTables.PA ::: CategoryCodes.RugbyScores.PA ::: List(
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
    SearchPreset(
      AFP,
      searchTerms = Some(SingleTerm(Simple("-result -results -scorers -table", Headline))),
      CategoryCodes.Sport.AFP
    ),
    SearchPreset(AAP, categoryCodes = CategoryCodes.Sport.AAP),
    SearchPreset(
      AP,
      searchTerms = Some(
        SingleTerm(
          Simple(
            "-\"BC-\" -\"Injury Report \" -Results -\"Inactive Report\" " +
              "-\"Team List\" -Figures -SportsWatch -Transactions -Glance -listings -Prep OR (AP Sports Glance)",
            Slug
          )
        )
      ),
      CategoryCodes.Sport.AP
    )
  )

  private val Soccer = List(
    SearchPreset(
      REUTERS,
      searchTerms = Some(SingleTerm(Simple("-(OPTA)", BodyText))),
      CategoryCodes.Soccer.REUTERS
    ),
    SearchPreset(
      PA,
      searchTerms = Some(SingleTerm(Simple("-RUGBYU -RUGBY", Slug))),
      categoryCodes = CategoryCodes.Soccer.PA,
      hasDataFormatting = Some(false)
    ),
    SearchPreset(
      AFP,
      searchTerms = Some(
        ComboTerm(
          List(
            Simple("fbl", Slug),
            Simple("-result -results -scorers -table", Headline)
          ),
          AND
        )
      ),
      CategoryCodes.Sport.AFP
    ),
    SearchPreset(AAP, categoryCodes = CategoryCodes.Soccer.AAP),
    SearchPreset(
      AP,
      searchTerms = Some(SingleTerm(Simple("AP SOC -Glance", Slug))),
      CategoryCodes.Sport.AP,
      keyword = Some("Soccer")
    )
  )

  private val SoccerScores = List(
    SearchPreset(
      REUTERS,
      searchTerms = Some(SingleTerm(Simple("(OPTA)", BodyText))),
      CategoryCodes.Soccer.REUTERS
    ),
    SearchPreset(
      PA,
      searchTerms = Some(SingleTerm(Simple("SOCCER", Slug))),
      CategoryCodes.SoccerScores.PA
    ),
    SearchPreset(
      PA,
      searchTerms = Some(SingleTerm(Simple("\"Divisional Summaries\"", Slug))),
      CategoryCodes.SoccerScores.PA
    ),
    SearchPreset(PA, searchTerms = Some(SingleTerm(Simple("\"SOCCER TABULATED RESULTS\" OR `\"DATA FORMAT\"", Slug)))),
    SearchPreset(
      AFP,
      searchTerms = Some(ComboTerm(List(Simple("fbl", Slug), Simple("result OR results OR scorers", Headline)), AND)),
      CategoryCodes.Sport.AFP
    ),
    SearchPreset(
      AP,
      searchTerms = Some(SingleTerm(Simple("\"BC-SOC\" OR SOC Glance", Slug))),
      CategoryCodes.Sport.AP
    )
  )

  private val SoccerTables = List(
    SearchPreset(
      AFP,
      searchTerms = Some(ComboTerm(List(Simple("fbl", Slug), Simple("table", Headline)), AND)),
      CategoryCodes.Sport.AFP
    ),
    SearchPreset(
      PA,
      searchTerms = Some(SingleTerm(Simple("SOCCER Tables", Slug))),
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
    SearchPreset(
      PA,
      searchTerms = Some(SingleTerm(Simple("-SOCCER", Slug))),
      preComputedCategories = List("no-soccer"),
      categoryCodesExcl = CategoryCodes.Soccer.PA
    ),
    SearchPreset(
      AFP,
      searchTerms = Some(SingleTerm(Simple("-fbl", Slug))),
      categoryCodes = CategoryCodes.Sport.AFP
    ),
    SearchPreset(
      AAP,
      preComputedCategories = List("no-soccer"),
      categoryCodesExcl = CategoryCodes.Soccer.AAP
    ),
    SearchPreset(
      AP,
      searchTerms = Some(SingleTerm(Simple("-BC -SOC", Slug))),
      preComputedCategories = List("no-soccer"),
      keywordExcl = List("Soccer")
    )
  )

  private val AmericanFootball = List(
    SearchPreset(
      REUTERS,
      categoryCodes = List("N2:AMER", "N2:NFL", "subj:15003000", "subj:15003001")
    ),
    SearchPreset(
      PA,
      searchTerms = Some(SingleTerm(Simple("GRIDIRON", Slug)))
    ),
    SearchPreset(
      AAP,
      categoryCodes = List("subj:15003000", "subj:15003001")
    ),
    SearchPreset(
      AFP,
      searchTerms = Some(SingleTerm(Simple("Amfoot", Slug))),
      categoryCodes = CategoryCodes.Sport.AFP
    ),
    SearchPreset(
      AP,
      searchTerms = Some(SingleTerm(Simple("FBN -FBC", Slug))),
      CategoryCodes.Sport.AP
    ),
    SearchPreset(
      AP,
      searchTerms = Some(SingleTerm(Simple("-FBC", Slug))),
      keywords = List("Football", "NFL football", "NFL Playoffs"),
      categoryCodes = CategoryCodes.Sport.AP
    )
  )

  private val AustralianRules = List(
    SearchPreset(
      REUTERS,
      categoryCodes = List("N2:AUSR", "subj:15084000")
    ),
    SearchPreset(
      AAP,
      categoryCodes = List("subj:15084000")
    )
  )

  private val Baseball = List(
    SearchPreset(
      REUTERS,
      categoryCodes = List("N2:BASE", "subj:15007000")
    ),
    SearchPreset(
      AFP,
      searchTerms = Some(SingleTerm(Simple("baseball", Slug))),
      categoryCodes = CategoryCodes.Sport.AFP
    ),
    SearchPreset(
      AP,
      searchTerms = Some(SingleTerm(Simple("BBO -BBC", Slug))),
      CategoryCodes.Sport.AP
    ),
    SearchPreset(
      AP,
      searchTerms = Some(SingleTerm(Simple("-BBC", Slug))),
      keywords = List("Baseball", "MLB baseball"),
      categoryCodes = CategoryCodes.Sport.AP
    )
  )

  private val Basketball = List(
    SearchPreset(
      REUTERS,
      categoryCodes = List("N2:BASK", "subj:15008000", "subj:15008001")
    ),
    SearchPreset(
      PA,
      searchTerms = Some(SingleTerm(Simple("BASKETBALL", Slug))),
      CategoryCodes.Sport.PA ::: List("paCat:RSR")
    ),
    SearchPreset(
      AAP,
      categoryCodes = List("subj:15008000", "subj:15008001")
    ),
    SearchPreset(
      AFP,
      searchTerms = Some(SingleTerm(Simple("Basket", Slug))),
      categoryCodes = CategoryCodes.Sport.AFP
    ),
    SearchPreset(
      AP,
      searchTerms = Some(SingleTerm(Simple("-BKC -BKW BKN OR BKL", Slug))),
      categoryCodes = CategoryCodes.Sport.AP
    )
  )

  private val CollegeSports = List(
    SearchPreset(
      REUTERS,
      categoryCodes = List("N2:FBC", "N2:BKC", "N2:HKC")
    ),
    SearchPreset(
      AP,
      searchTerms = Some(SingleTerm(Simple("BKC OR BKW OR FBC OR HKC", Slug))),
      categoryCodes = CategoryCodes.Sport.AP
    ),
    SearchPreset(
      AP,
      categoryCodes = CategoryCodes.Sport.AP,
      keywords = List("College sports")
    )
  )

  private val Cricket = List(
    SearchPreset(
      REUTERS,
      searchTerms = Some(SingleTerm(Simple("-(OPTA)", BodyText))),
      categoryCodes = CategoryCodes.Cricket.REUTERS
    ),
    SearchPreset(
      PA,
      searchTerms = Some(
        ComboTerm(
          List(
            Simple("-fixtures -fixture", Headline),
            Simple("-Summaries", Slug)
          ),
          AND
        )
      ),
      CategoryCodes.Cricket.PA
    ),
    SearchPreset(
      AFP,
      searchTerms = Some(SingleTerm(Simple("cricket", Slug))),
      categoryCodes = CategoryCodes.Sport.AFP
    ),
    SearchPreset(AAP, categoryCodes = CategoryCodes.Cricket.AAP),
    SearchPreset(
      AP,
      searchTerms = Some(SingleTerm(Simple("\"AP-CRI\" -Glance -Figures -Runs", Slug))),
      CategoryCodes.Sport.AP
    )
  )

  private val CricketScores = List(
    SearchPreset(
      REUTERS,
      searchTerms = Some(SingleTerm(Simple("(OPTA)", BodyText))),
      categoryCodes = CategoryCodes.Cricket.REUTERS
    ),
    SearchPreset(PA, categoryCodes = CategoryCodes.CricketScores.PA),
    SearchPreset(
      PA,
      searchTerms = Some(SingleTerm(Simple("fixtures OR fixture", Headline))),
      categoryCodes = List("paCat:SCR")
    ),
    SearchPreset(
      PA,
      searchTerms = Some(SingleTerm(Simple("Summaries", Slug))),
      categoryCodes = List("paCat:SCR")
    ),
    SearchPreset(
      AP,
      searchTerms = Some(SingleTerm(Simple("\"AP-CRI\" Glance OR Figures OR Runs", Slug))),
      CategoryCodes.Sport.AP
    )
  )

  private val RugbyLeague = List(
    SearchPreset(
      REUTERS,
      searchTerms = Some(SingleTerm(Simple("-(OPTA)", BodyText))),
      CategoryCodes.RugbyLeague.REUTERS
    ),
    SearchPreset(
      PA,
      searchTerms = Some(SingleTerm(Simple("RUGBYL -Summaries -Scorer", Slug))),
      CategoryCodes.Sport.PA
    ),
    SearchPreset(
      AFP,
      searchTerms = Some(ComboTerm(List(Simple("RugbyL", Slug), Simple("-result -results", Headline)), AND)),
      CategoryCodes.Sport.AFP
    ),
    SearchPreset(AAP, categoryCodes = CategoryCodes.RugbyLeague.AAP),
    SearchPreset(
      AP,
      searchTerms = Some(SingleTerm(Simple("RGL", Slug))),
      CategoryCodes.Sport.AP,
      keyword = Some("Rugby")
    )
  )

  private val RugbyUnion = List(
    SearchPreset(
      REUTERS,
      searchTerms = Some(SingleTerm(Simple("-(OPTA)", BodyText))),
      CategoryCodes.RugbyUnion.REUTERS
    ),
    SearchPreset(
      PA,
      searchTerms = Some(SingleTerm(Simple("\"RUGBY UNION\" OR RUGBYU -Summaries -Scorer", Slug))),
      CategoryCodes.Sport.PA ::: List("paCat:SFF")
    ),
    SearchPreset(
      AFP,
      searchTerms = Some(ComboTerm(List(Simple("RugbyU", Slug), Simple("-result -results", Headline)), AND)),
      CategoryCodes.Sport.AFP
    ),
    SearchPreset(AAP, categoryCodes = CategoryCodes.RugbyUnion.AAP),
    SearchPreset(
      AP,
      searchTerms = Some(SingleTerm(Simple("RGU", Slug))),
      CategoryCodes.Sport.AP,
      keyword = Some("Rugby")
    )
  )

  private val RugbyScores = List(
    SearchPreset(
      PA,
      searchTerms = Some(SingleTerm(Simple("-SOCCER", Slug))),
      CategoryCodes.RugbyScores.PA
    ),
    SearchPreset(
      PA,
      searchTerms = Some(SingleTerm(Simple("RUGBY TABULATED", Slug))),
      categoryCodes = List("paCat:RFC")
    ),
    SearchPreset(
      PA,
      searchTerms = Some(
        SingleTerm(Simple("RUGBYU Summaries OR RUGBYL Summaries OR RUGBYU Scorer OR RUGBYL Scorer", Slug))
      ),
      CategoryCodes.Sport.PA
    ),
    SearchPreset(
      AFP,
      searchTerms = Some(
        ComboTerm(
          List(
            Simple("RugbyL OR RugbyU", Slug),
            Simple("result OR results", Headline)
          ),
          AND
        )
      ),
      CategoryCodes.Sport.AFP
    ),
    SearchPreset(
      REUTERS,
      searchTerms = Some(SingleTerm(Simple("(OPTA)", BodyText))),
      CategoryCodes.RugbyLeague.REUTERS
    )
  )

  private val Tennis = List(
    SearchPreset(
      REUTERS,
      searchTerms = Some(SingleTerm(Simple("-(OPTA)", BodyText))),
      CategoryCodes.Tennis.REUTERS
    ),
    SearchPreset(PA, searchTerms = Some(SingleTerm(Simple("TENNIS", Slug))), CategoryCodes.Sport.PA),
    SearchPreset(
      AFP,
      searchTerms = Some(ComboTerm(List(Simple("Tennis", Slug), Simple("-result -results", Headline)), AND)),
      CategoryCodes.Sport.AFP
    ),
    SearchPreset(AAP, categoryCodes = CategoryCodes.Tennis.AAP),
    SearchPreset(
      AP,
      searchTerms = Some(SingleTerm(Simple("AP TEN", Slug))),
      CategoryCodes.Sport.AP,
      keyword = Some("Tennis")
    )
  )

  private val TennisScores = List(
    SearchPreset(
      REUTERS,
      searchTerms = Some(SingleTerm(Simple("(OPTA)", BodyText))),
      CategoryCodes.Tennis.REUTERS
    ),
    SearchPreset(
      PA,
      searchTerms = Some(SingleTerm(Simple("TENNIS", Slug))),
      categoryCodes = List("paCat:RSR")
    ),
    SearchPreset(
      AFP,
      searchTerms = Some(ComboTerm(List(Simple("Tennis", Slug), Simple("result OR results", Headline)), AND)),
      CategoryCodes.Sport.AFP
    ),
    SearchPreset(
      AP,
      searchTerms = Some(SingleTerm(Simple("\"BC-TEN\"", Slug))),
      CategoryCodes.Sport.AP
    )
  )

  private val Cycling = List(
    SearchPreset(REUTERS, categoryCodes = CategoryCodes.Cycling.REUTERS),
    SearchPreset(PA, searchTerms = Some(SingleTerm(Simple("CYCLING", Slug))), CategoryCodes.Sport.PA),
    SearchPreset(AFP, searchTerms = Some(SingleTerm(Simple("cycling", Slug))), CategoryCodes.Sport.AFP),
    SearchPreset(AAP, categoryCodes = CategoryCodes.Cycling.AAP),
    SearchPreset(
      AP,
      searchTerms = Some(SingleTerm(Simple("CYC", Slug))),
      CategoryCodes.Sport.AP,
      keyword = Some("Cycling")
    )
  )

  private val MotorSport = List(
    SearchPreset(REUTERS, categoryCodes = CategoryCodes.MotorSport.REUTERS),
    SearchPreset(
      PA,
      searchTerms = Some(SingleTerm(Simple("auto OR MOTO", Slug))),
      categoryCodes = CategoryCodes.Sport.PA ::: List("paCat:RSR")
    ),
    SearchPreset(AFP, searchTerms = Some(SingleTerm(Simple("auto OR moto", Slug))), CategoryCodes.Sport.AFP),
    SearchPreset(AAP, categoryCodes = CategoryCodes.MotorSport.AAP),
    SearchPreset(AP, searchTerms = Some(SingleTerm(Simple("CAR", Slug))), categoryCodes = CategoryCodes.Sport.AP),
    SearchPreset(AP, categoryCodes = CategoryCodes.Sport.AP, keywords = List("Automobile racing", "Formula One racing"))
  )

  private val Golf = List(
    SearchPreset(
      REUTERS,
      searchTerms = Some(SingleTerm(Simple("-(OPTA)", BodyText))),
      CategoryCodes.Golf.REUTERS
    ),
    SearchPreset(
      PA,
      searchTerms = Some(SingleTerm(Simple("GOLF", Slug))),
      categoryCodesExcl = List("paCat:RSR")
    ),
    SearchPreset(AFP, searchTerms = Some(SingleTerm(Simple("golf", Slug))), CategoryCodes.Sport.AFP),
    SearchPreset(AAP, categoryCodes = CategoryCodes.Golf.AAP),
    SearchPreset(
      AP,
      searchTerms = Some(SingleTerm(Simple("GLF -Scores", Slug))),
      CategoryCodes.Sport.AP,
      keyword = Some("Golf")
    )
  )

  private val GolfScores = List(
    SearchPreset(
      REUTERS,
      searchTerms = Some(SingleTerm(Simple("(OPTA)", BodyText))),
      CategoryCodes.Golf.REUTERS
    ),
    SearchPreset(
      PA,
      searchTerms = Some(SingleTerm(Simple("GOLF", Slug))),
      categoryCodes = List("paCat:RSR")
    ),
    SearchPreset(
      AP,
      searchTerms = Some(
        SingleTerm(
          Simple(
            "GLF Scores OR GLF Leaders OR GLF Winners OR GLF Stax OR GLF Standings " +
              "OR GLF Ranking",
            Slug
          )
        )
      ),
      CategoryCodes.Sport.AP
    )
  )

  private val Boxing = List(
    SearchPreset(REUTERS, categoryCodes = CategoryCodes.Boxing.REUTERS),
    SearchPreset(
      PA,
      searchTerms = Some(SingleTerm(Simple("BOXING", Slug))),
      categoryCodes = List("paCat:SRS", "paCat:SSS")
    ),
    SearchPreset(AFP, searchTerms = Some(SingleTerm(Simple("Box", Slug))), CategoryCodes.Sport.AFP),
    SearchPreset(AAP, categoryCodes = CategoryCodes.Boxing.AAP),
    SearchPreset(
      AP,
      searchTerms = Some(SingleTerm(Simple("BOX", Slug))),
      keyword = Some("Boxing")
    )
  )

  private val HorseRacing = List(
    SearchPreset(REUTERS, categoryCodes = CategoryCodes.HorseRacing.REUTERS),
    SearchPreset(PA, categoryCodes = CategoryCodes.HorseRacing.PA),
    SearchPreset(AFP, searchTerms = Some(SingleTerm(Simple("racing", Slug))), CategoryCodes.Sport.AFP),
    SearchPreset(AAP, categoryCodes = CategoryCodes.HorseRacing.AAP),
    SearchPreset(AP, categoryCodes = CategoryCodes.Sport.AP, keyword = Some("Horse racing"))
  )

  private val IceHockey = List(
    SearchPreset(
      REUTERS,
      categoryCodes = List("N2:ICEH", "N2:NHL", "subj:15031000")
    ),
    SearchPreset(
      PA,
      searchTerms = Some(SingleTerm(Simple("ICEHOCKEY", Slug))),
      CategoryCodes.Sport.PA ::: List("paCat:RSR")
    ),
    SearchPreset(
      AFP,
      searchTerms = Some(SingleTerm(Simple("IHockey", Slug))),
      categoryCodes = CategoryCodes.Sport.AFP
    ),
    SearchPreset(
      AP,
      searchTerms = Some(SingleTerm(Simple("HKN OR HKW", Slug))),
      CategoryCodes.Sport.AP
    ),
    SearchPreset(
      AP,
      keywords = List("Hockey", "NHL hockey"),
      categoryCodes = CategoryCodes.Sport.AP
    )
  )

  private val Athletics = List(
    SearchPreset(REUTERS, categoryCodes = CategoryCodes.Athletics.REUTERS),
    SearchPreset(
      PA,
      searchTerms = Some(SingleTerm(Simple("ATHLETICS", Slug))),
      CategoryCodes.Sport.PA
    ),
    SearchPreset(AFP, searchTerms = Some(SingleTerm(Simple("ATHLETICS", Slug))), CategoryCodes.Sport.AFP),
    SearchPreset(AAP, categoryCodes = CategoryCodes.Athletics.AAP),
    SearchPreset(
      AP,
      searchTerms = Some(SingleTerm(Simple("ATH", Slug))),
      CategoryCodes.Sport.AP,
      keyword = Some("Track and field")
    )
  )

  private val Olympics = List(
    SearchPreset(REUTERS, categoryCodes = CategoryCodes.Olympics.REUTERS),
    SearchPreset(
      PA,
      searchTerms = Some(
        ComboTerm(
          List(Simple("Olympics OR IOC", Slug), Simple("Olympics OR IOC", Headline)),
          OR
        )
      ),
      CategoryCodes.Sport.PA
    ),
    SearchPreset(AFP, searchTerms = Some(SingleTerm(Simple("Oly", Slug))), CategoryCodes.Sport.AFP),
    SearchPreset(AAP, categoryCodes = CategoryCodes.Olympics.AAP),
    SearchPreset(
      AP,
      categoryCodes = CategoryCodes.Sport.AP,
      keywords = List("Olympic games", "2026 Milan Cortina Olympic Games")
    ),
    SearchPreset(AP, categoryCodes = CategoryCodes.Sport.AP, searchTerms = Some(SingleTerm(Simple("OLY-", Slug))))
  )

  private val AllDataFormats = List(
    SearchPreset(PA, hasDataFormatting = Some(true))
  )

  private val DotCopy = List(SearchPreset("UNAUTHED_EMAIL_FEED"))

  val SportOther: List[SearchParams] =
    Soccer ::: SoccerScores ::: SoccerTables ::: AmericanFootball ::: Athletics ::: AustralianRules ::: Baseball ::: Basketball ::: Boxing ::: CollegeSports ::: Cricket ::: CricketScores ::: Cycling ::: Golf ::: GolfScores ::: HorseRacing ::: IceHockey ::: MotorSport ::: Olympics ::: RugbyLeague ::: RugbyUnion ::: RugbyScores ::: Tennis ::: TennisScores ::: AllDataFormats

}
