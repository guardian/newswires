package conf

import conf.SearchField.{BodyText, Headline, Slug}
import conf.SearchTerm.SingleField
import conf.Suppliers._
import models.{FilterParams}

// Increase max line length to improve readability of search presets
// scalafmt: { maxColumn = 120 }
case class SearchPreset(searchParams: List[FilterParams], negatedSearchParams: List[FilterParams])
object SearchPreset {
  def apply(
      supplier: String,
      searchTerms: Option[SearchTerms] = None,
      categoryCodes: Option[CategoryCodesCondition] = None,
      categoryCodesExcl: List[String] = Nil,
      keyword: Option[String] = None,
      keywords: List[String] = Nil,
      keywordExcl: List[String] = Nil,
      hasDataFormatting: Option[Boolean] = None,
      preComputedCategories: List[String] = Nil,
      preComputedCategoriesExcl: List[String] = Nil
  ): FilterParams =
    FilterParams(
      searchTerms = searchTerms,
      suppliersIncl = List(supplier),
      suppliersExcl = Nil,
      keywordIncl = keyword.toList ::: keywords,
      keywordExcl = keywordExcl,
      categoryCodes = categoryCodes,
      categoryCodesExcl = categoryCodesExcl,
      hasDataFormatting = hasDataFormatting,
      preComputedCategories = preComputedCategories,
      preComputedCategoriesExcl = preComputedCategoriesExcl,
      collectionId = None,
      guSourceFeeds = Nil,
      guSourceFeedsExcl = Nil,
      eventCode = None
    )
}

object SearchPresets {
  def get(name: String): Option[SearchPreset] = name match {
    case "reuters-world"        => Some(SearchPreset(ReutersWorld, Nil))
    case "reuters-schedule"     => Some(SearchPreset(ReutersSchedule, Nil))
    case "ap-world"             => Some(SearchPreset(ApWorld, Nil))
    case "aap-world"            => Some(SearchPreset(AapWorld, Nil))
    case "all-world"            => Some(SearchPreset(AllWorld, Nil))
    case "afp-world"            => Some(SearchPreset(AfpWorld, Nil))
    case "minor-agencies-world" => Some(SearchPreset(MinorAgenciesWorld, Nil))
    case "all-uk"               => Some(SearchPreset(AllUk, Nil))
    case "all-us"               => Some(SearchPreset(AllUs, Nil))
    case "world-plus-uk"        => Some(SearchPreset(WorldPlusUK, Nil))
    case "all-business"         => Some(SearchPreset(AllBusiness, Nil))
    case "all-sport"            => Some(SearchPreset(AllSport, Nil))
    case "all-sport-stories"    => Some(SearchPreset(AllSportStories, Nil))
    case "soccer"               => Some(SearchPreset(Soccer, Nil))
    case "soccer-scores"        => Some(SearchPreset(SoccerScores, Nil))
    case "soccer-tables"        => Some(SearchPreset(SoccerTables, Nil))
    case "no-soccer"            => Some(SearchPreset(NoSoccer, Nil))
    case "american-football"    => Some(SearchPreset(AmericanFootball, Nil))
    case "australian-rules"     => Some(SearchPreset(AustralianRules, Nil))
    case "baseball"             => Some(SearchPreset(Baseball, Nil))
    case "basketball"           => Some(SearchPreset(Basketball, Nil))
    case "college-sports"       => Some(SearchPreset(CollegeSports, Nil))
    case "cricket"              => Some(SearchPreset(Cricket, Nil))
    case "cricket-scores"       => Some(SearchPreset(CricketScores, Nil))
    case "rugby-league"         => Some(SearchPreset(RugbyLeague, Nil))
    case "rugby-union"          => Some(SearchPreset(RugbyUnion, Nil))
    case "rugby-scores"         => Some(SearchPreset(RugbyScores, Nil))
    case "tennis"               => Some(SearchPreset(Tennis, Nil))
    case "tennis-scores"        => Some(SearchPreset(TennisScores, Nil))
    case "cycling"              => Some(SearchPreset(Cycling, Nil))
    case "motor-sport"          => Some(SearchPreset(MotorSport, Nil))
    case "golf"                 => Some(SearchPreset(Golf, Nil))
    case "golf-scores"          => Some(SearchPreset(GolfScores, Nil))
    case "boxing"               => Some(SearchPreset(Boxing, Nil))
    case "horse-racing"         => Some(SearchPreset(HorseRacing, Nil))
    case "ice-hockey"           => Some(SearchPreset(IceHockey, Nil))
    case "athletics"            => Some(SearchPreset(Athletics, Nil))
    case "olympics"             => Some(SearchPreset(Olympics, Nil))
    case "all-data-formats"     => Some(SearchPreset(AllDataFormats, Nil))
    case "dot-copy"             => Some(SearchPreset(DotCopy, Nil))
    case "sport-other"          => Some(SearchPreset(AllSport, SportOther))
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
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.World.AP, OR))
    )
  )

  private val ReutersSchedule = List(
    SearchPreset(
      REUTERS,
      searchTerms = Some(SingleTerm(SingleField(SimpleSearchQueries.REUTERS_NEWS_SCHEDULE, Headline))),
      categoryCodes = Some(CategoryCodesCondition(List("MCC:DED"), OR))
    )
  )

  private val ReutersWorld = List(
    SearchPreset(REUTERS, categoryCodes = Some(CategoryCodesCondition(CategoryCodes.World.REUTERS, OR))),
    SearchPreset(
      REUTERS,
      preComputedCategories = List("other-topic-codes"),
      preComputedCategoriesExcl = List("sports-related-topic-codes", "business-related-topic-codes")
    ),
    SearchPreset(
      REUTERS,
      categoryCodes = Some(CategoryCodesCondition(List("MCC:OVR", "MCC:QFE", "MCCL:OVR", "MCCL:OSM", "MCC:DED", "N2:US"), OR)),
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
      searchTerms = Some(SingleTerm(SearchTerm.SingleField("News Summary", Headline))),
      categoryCodes = Some(CategoryCodesCondition(List("MCC:OEC"), OR)),
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

  private val PaWorld = List(
    SearchPreset(PA, categoryCodes = Some(CategoryCodesCondition(CategoryCodes.World.PA, OR)))
  )

  private val AllWorld =
    ApWorld ::: ReutersWorld ::: ReutersSchedule ::: AapWorld ::: AfpWorld ::: MinorAgenciesWorld ::: PaWorld

  /*
   * UK domestic
   */

  private val AllUk = List(
    SearchPreset(
      PA,
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.UK.PA, OR))
    ), // We aren't excluding CategoryCodes.World.PA because PA's still fairly UK-focused, and UK eds are used to seeing all non-sport, non-business PA content in the UK feed
    SearchPreset(MINOR_AGENCIES, categoryCodes = Some(CategoryCodesCondition(CategoryCodes.UK.MINOR_AGENCIES, OR)))
  )

  /*
   * US domestic
   */
  private val AllUs = List(
    SearchPreset(
      AP,
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.US.AP, OR))
    ),
    SearchPreset(
      REUTERS,
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.US.REUTERS, OR)),
      preComputedCategoriesExcl = List(
        "sports-related-topic-codes",
        "sports-related-news-codes",
        "business-related-topic-codes",
        "business-related-news-codes"
      )
    )
  )

  /*
   * All News
   */
  private val WorldPlusUK = AllWorld ::: AllUk

  /*
   * Business
   */

  private val AllBusiness = List(
    SearchPreset(PA, categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Business.PA, OR))),
    SearchPreset(
      REUTERS,
      preComputedCategories = List("business-related-topic-codes"),
      categoryCodesExcl = List("MCC:SPO")
    ),
    SearchPreset(
      AP,
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Business.AP, OR)),
      categoryCodesExcl = CategoryCodes.Sport.AP ::: CategoryCodes.Other.AP
    ),
    SearchPreset(AAP, preComputedCategories = List("business-related-news-codes"))
  )

  /*
   * Sports
   */

  private val AllSport = List(
    SearchPreset(PA, categoryCodesExcl = CategoryCodes.UK.PA ::: CategoryCodes.Business.PA ::: CategoryCodes.World.PA),
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
            SingleField("-(OPTA) -Gracenote", BodyText),
            SingleField("-/FIXTURES -/RESULTS -/STANDINGS", Slug)
          ),
          AND
        )
      ),
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Sport.REUTERS, OR))
    ),
    SearchPreset(
      PA,
      searchTerms = Some(
        ComboTerm(
          List(
            SingleField(
              "-\"TABULATED RESULTS\" -\"Divisional Summaries\" -GOALSCORERS " +
                "-Goalflash -Summaries -Teams -AMENDMENTS -\"Pools Grid \" -Statistics -CORRECTN -\"Top Goal Scorer\" " +
                "-BOOKINGS -\"Sending Off\" -\"SENT OFF\" -\"FULL-TIME\" -\"HALF-TIME\" -\"POOLS DIVIDEND\" -\"RACING GOING\" " +
                "-Postponed -\"SOCCER TEAMS\" -\"MATCH STATS\" -Collated -Advisory " +
                "-Formwatch -Pieces -Straps -\"wind surgery\" -Traveller -blinkers",
              Slug
            ),
            SingleField("-fixtures", Headline)
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
      searchTerms = Some(SingleTerm(SingleField("-result -results -scorers -table", Headline))),
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Sport.AFP, OR))
    ),
    SearchPreset(AAP, categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Sport.AAP, OR))),
    SearchPreset(
      AP,
      searchTerms = Some(
        SingleTerm(
          SingleField(
            "-\"BC-\" -\"Injury Report \" -Results -\"Inactive Report\" " +
              "-\"Team List\" -Figures -SportsWatch -Transactions -Glance -listings -Prep OR (AP Sports Glance)",
            Slug
          )
        )
      ),
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Sport.AP, OR))
    )
  )

  private val Soccer = List(
    SearchPreset(
      REUTERS,
      searchTerms = Some(SingleTerm(SingleField("-(OPTA)", BodyText))),
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Soccer.REUTERS, OR))
    ),
    SearchPreset(
      PA,
      searchTerms = Some(SingleTerm(SingleField("-RUGBYU -RUGBY", Slug))),
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Soccer.PA, OR)),
      hasDataFormatting = Some(false)
    ),
    SearchPreset(
      AFP,
      searchTerms = Some(
        ComboTerm(
          List(
            SingleField("fbl", Slug),
            SingleField("-result -results -scorers -table", Headline)
          ),
          AND
        )
      ),
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Sport.AFP, OR))
    ),
    SearchPreset(AAP, categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Soccer.AAP, OR))),
    SearchPreset(
      AP,
      searchTerms = Some(SingleTerm(SingleField("AP SOC -Glance", Slug))),
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Sport.AP, OR)),
      keyword = Some("Soccer")
    )
  )

  private val SoccerScores = List(
    SearchPreset(
      REUTERS,
      searchTerms = Some(SingleTerm(SingleField("(OPTA)", BodyText))),
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Soccer.REUTERS, OR))
    ),
    SearchPreset(
      PA,
      searchTerms = Some(SingleTerm(SingleField("-RUGBY -RUGBYU -RUGBYL", Slug))),
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.SoccerScores.PA, OR))
    ),
    SearchPreset(PA, searchTerms = Some(SingleTerm(SingleField("\"SOCCER TABULATED RESULTS\"", Slug)))),
    SearchPreset(
      AFP,
      searchTerms =
        Some(ComboTerm(List(SingleField("fbl", Slug), SingleField("result OR results OR scorers", Headline)), AND)),
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Sport.AFP, OR))
    ),
    SearchPreset(
      AP,
      searchTerms = Some(SingleTerm(SingleField("\"BC-SOC\" OR SOC Glance", Slug))),
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Sport.AP, OR))
    )
  )

  private val SoccerTables = List(
    SearchPreset(
      AFP,
      searchTerms = Some(ComboTerm(List(SingleField("fbl", Slug), SingleField("table", Headline)), AND)),
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Sport.AFP, OR))
    ),
    SearchPreset(
      PA,
      searchTerms = None,
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.SoccerTables.PA, OR))
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
      searchTerms = Some(SingleTerm(SingleField("-SOCCER", Slug))),
      preComputedCategories = List("no-soccer"),
      categoryCodesExcl = CategoryCodes.Soccer.PA
    ),
    SearchPreset(
      AFP,
      searchTerms = Some(SingleTerm(SingleField("-fbl", Slug))),
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Sport.AFP, OR))
    ),
    SearchPreset(
      AAP,
      preComputedCategories = List("no-soccer"),
      categoryCodesExcl = CategoryCodes.Soccer.AAP
    ),
    SearchPreset(
      AP,
      searchTerms = Some(SingleTerm(SingleField("-BC -SOC", Slug))),
      preComputedCategories = List("no-soccer"),
      keywordExcl = List("Soccer")
    )
  )

  private val AmericanFootball = List(
    SearchPreset(
      REUTERS,
      categoryCodes = Some(CategoryCodesCondition(List("N2:AMER", "N2:NFL", "subj:15003000", "subj:15003001"), OR))
    ),
    SearchPreset(
      PA,
      searchTerms = Some(SingleTerm(SingleField("GRIDIRON", Slug)))
    ),
    SearchPreset(
      AAP,
      categoryCodes = Some(CategoryCodesCondition(List("subj:15003000", "subj:15003001"), OR))
    ),
    SearchPreset(
      AFP,
      searchTerms = Some(SingleTerm(SingleField("Amfoot", Slug))),
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Sport.AFP, OR))
    ),
    SearchPreset(
      AP,
      searchTerms = Some(SingleTerm(SingleField("FBN -FBC", Slug))),
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Sport.AP, OR))
    ),
    SearchPreset(
      AP,
      searchTerms = Some(SingleTerm(SingleField("-FBC", Slug))),
      keywords = List("Football", "NFL football", "NFL Playoffs"),
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Sport.AP, OR))
    )
  )

  private val AustralianRules = List(
    SearchPreset(
      REUTERS,
      categoryCodes = Some(CategoryCodesCondition(List("N2:AUSR", "subj:15084000"), OR))
    ),
    SearchPreset(
      AAP,
      categoryCodes = Some(CategoryCodesCondition(List("subj:15084000"), OR))
    )
  )

  private val Baseball = List(
    SearchPreset(
      REUTERS,
      categoryCodes = Some(CategoryCodesCondition(List("N2:BASE", "subj:15007000"), OR))
    ),
    SearchPreset(
      AFP,
      searchTerms = Some(SingleTerm(SingleField("baseball", Slug))),
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Sport.AFP, OR))
    ),
    SearchPreset(
      AP,
      searchTerms = Some(SingleTerm(SingleField("BBO -BBC", Slug))),
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Sport.AP, OR))
    ),
    SearchPreset(
      AP,
      searchTerms = Some(SingleTerm(SingleField("-BBC", Slug))),
      keywords = List("Baseball", "MLB baseball"),
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Sport.AP, OR))
    )
  )

  private val Basketball = List(
    SearchPreset(
      REUTERS,
      categoryCodes = Some(CategoryCodesCondition(List("N2:BASK", "subj:15008000", "subj:15008001"), OR))
    ),
    SearchPreset(
      PA,
      searchTerms = Some(SingleTerm(SingleField("BASKETBALL", Slug))),
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Sport.PA ::: List("paCat:RSR"), OR))
    ),
    SearchPreset(
      AAP,
      categoryCodes = Some(CategoryCodesCondition(List("subj:15008000", "subj:15008001"), OR))
    ),
    SearchPreset(
      AFP,
      searchTerms = Some(SingleTerm(SingleField("Basket", Slug))),
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Sport.AFP, OR))
    ),
    SearchPreset(
      AP,
      searchTerms = Some(SingleTerm(SingleField("-BKC -BKW BKN OR BKL", Slug))),
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Sport.AP, OR))
    )
  )

  private val CollegeSports = List(
    SearchPreset(
      REUTERS,
      categoryCodes = Some(CategoryCodesCondition(List("N2:FBC", "N2:BKC", "N2:HKC"), OR))
    ),
    SearchPreset(
      AP,
      searchTerms = Some(SingleTerm(SingleField("BKC OR BKW OR FBC OR HKC", Slug))),
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Sport.AP, OR))
    ),
    SearchPreset(
      AP,
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Sport.AP, OR)),
      keywords = List("College sports")
    )
  )

  private val Cricket = List(
    SearchPreset(
      REUTERS,
      searchTerms = Some(SingleTerm(SingleField("-(OPTA)", BodyText))),
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Cricket.REUTERS, OR))
    ),
    SearchPreset(
      PA,
      searchTerms = Some(
        ComboTerm(
          List(
            SingleField("-fixtures -fixture", Headline),
            SingleField("-Summaries", Slug)
          ),
          AND
        )
      ),
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Cricket.PA, OR))
    ),
    SearchPreset(
      AFP,
      searchTerms = Some(SingleTerm(SingleField("cricket", Slug))),
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Sport.AFP, OR))
    ),
    SearchPreset(AAP, categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Cricket.AAP, OR))),
    SearchPreset(
      AP,
      searchTerms = Some(SingleTerm(SingleField("\"AP-CRI\" -Glance -Figures -Runs", Slug))),
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Sport.AP, OR))
    )
  )

  private val CricketScores = List(
    SearchPreset(
      REUTERS,
      searchTerms = Some(SingleTerm(SingleField("(OPTA)", BodyText))),
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Cricket.REUTERS, OR))
    ),
    SearchPreset(PA, categoryCodes = Some(CategoryCodesCondition(CategoryCodes.CricketScores.PA, OR))),
    SearchPreset(
      PA,
      searchTerms = Some(SingleTerm(SingleField("fixtures OR fixture", Headline))),
      categoryCodes = Some(CategoryCodesCondition(List("paCat:SCR"), OR))
    ),
    SearchPreset(
      PA,
      searchTerms = Some(SingleTerm(SingleField("Summaries", Slug))),
      categoryCodes = Some(CategoryCodesCondition(List("paCat:SCR"), OR))
    ),
    SearchPreset(
      AP,
      searchTerms = Some(SingleTerm(SingleField("\"AP-CRI\" Glance OR Figures OR Runs", Slug))),
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Sport.AP, OR))
    )
  )

  private val RugbyLeague = List(
    SearchPreset(
      REUTERS,
      searchTerms = Some(SingleTerm(SingleField("-(OPTA)", BodyText))),
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.RugbyLeague.REUTERS, OR))
    ),
    SearchPreset(
      REUTERS,
      searchTerms = Some((ComboTerm(List(SingleField("(OPTA)", BodyText), SingleField("/SUMMARIES", Slug)), AND))),
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.RugbyLeague.REUTERS, OR))
    ),
    SearchPreset(
      PA,
      searchTerms = Some(SingleTerm(SingleField("RUGBYL -Scorer", Slug))),
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Sport.PA, OR))
    ),
    SearchPreset(
      AFP,
      searchTerms = Some(ComboTerm(List(SingleField("RugbyL", Slug), SingleField("-result -results", Headline)), AND)),
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Sport.AFP, OR))
    ),
    SearchPreset(
      PA,
      searchTerms = Some(SingleTerm(SingleField("RUGBYL -SOCCER Summaries", Slug))),
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.RugbyScores.PA, OR))
    ),
    SearchPreset(AAP, categoryCodes = Some(CategoryCodesCondition(CategoryCodes.RugbyLeague.AAP, OR))),
    SearchPreset(
      AP,
      searchTerms = Some(SingleTerm(SingleField("RGL", Slug))),
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Sport.AP, OR)),
      keyword = Some("Rugby")
    )
  )

  private val RugbyUnion = List(
    SearchPreset(
      REUTERS,
      searchTerms = Some(SingleTerm(SingleField("-(OPTA)", BodyText))),
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.RugbyUnion.REUTERS, OR))
    ),
    SearchPreset(
      PA,
      searchTerms = Some(SingleTerm(SingleField("\"RUGBY UNION\" OR RUGBYU -SOCCER Summaries", Slug))),
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.RugbyScores.PA, OR))
    ),
    SearchPreset(
      PA,
      searchTerms = Some(SingleTerm(SingleField("\"RUGBY UNION\" OR RUGBYU -Scorer", Slug))),
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Sport.PA ::: List("paCat:SFF"), OR))
    ),
    SearchPreset(
      AFP,
      searchTerms = Some(ComboTerm(List(SingleField("RugbyU", Slug), SingleField("-result -results", Headline)), AND)),
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Sport.AFP, OR))
    ),
    SearchPreset(AAP, categoryCodes = Some(CategoryCodesCondition(CategoryCodes.RugbyUnion.AAP, OR))),
    SearchPreset(
      AP,
      searchTerms = Some(SingleTerm(SingleField("RGU", Slug))),
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Sport.AP, OR)),
      keyword = Some("Rugby")
    )
  )

  private val RugbyScores = List(
    SearchPreset(
      PA,
      searchTerms = Some(SingleTerm(SingleField("-SOCCER -Summaries", Slug))),
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.RugbyScores.PA, OR))
    ),
    SearchPreset(
      PA,
      searchTerms = Some(SingleTerm(SingleField("RUGBY", Slug))),
      categoryCodes = Some(CategoryCodesCondition(List("paCat:RFC"), OR))
    ),
    SearchPreset(
      PA,
      searchTerms = Some(
        SingleTerm(SingleField("RUGBYU Scorer OR RUGBYL Scorer", Slug))
      ),
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Sport.PA, OR))
    ),
    SearchPreset(
      AFP,
      searchTerms = Some(
        ComboTerm(
          List(
            SingleField("RugbyL OR RugbyU", Slug),
            SingleField("result OR results", Headline)
          ),
          AND
        )
      ),
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Sport.AFP, OR))
    ),
    SearchPreset(
      REUTERS,
      searchTerms = Some((ComboTerm(List(SingleField("(OPTA)", BodyText), SingleField("-/SUMMARIES", Slug)), AND))),
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.RugbyLeague.REUTERS, OR))
    )
  )

  private val Tennis = List(
    SearchPreset(
      REUTERS,
      searchTerms = Some(SingleTerm(SingleField("-(OPTA)", BodyText))),
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Tennis.REUTERS, OR))
    ),
    SearchPreset(PA, searchTerms = Some(SingleTerm(SingleField("TENNIS", Slug))), categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Sport.PA, OR))),
    SearchPreset(
      AFP,
      searchTerms = Some(ComboTerm(List(SingleField("Tennis", Slug), SingleField("-result -results", Headline)), AND)),
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Sport.AFP, OR))
    ),
    SearchPreset(AAP, categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Tennis.AAP, OR))),
    SearchPreset(
      AP,
      searchTerms = Some(SingleTerm(SingleField("AP TEN", Slug))),
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Sport.AP, OR)),
      keyword = Some("Tennis")
    )
  )

  private val TennisScores = List(
    SearchPreset(
      REUTERS,
      searchTerms = Some(SingleTerm(SingleField("(OPTA)", BodyText))),
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Tennis.REUTERS, OR))
    ),
    SearchPreset(
      PA,
      searchTerms = Some(SingleTerm(SingleField("TENNIS", Slug))),
      categoryCodes = Some(CategoryCodesCondition(List("paCat:RSR"), OR))
    ),
    SearchPreset(
      AFP,
      searchTerms = Some(ComboTerm(List(SingleField("Tennis", Slug), SingleField("result OR results", Headline)), AND)),
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Sport.AFP, OR))
    ),
    SearchPreset(
      AP,
      searchTerms = Some(SingleTerm(SingleField("\"BC-TEN\"", Slug))),
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Sport.AP, OR))
    )
  )

  private val Cycling = List(
    SearchPreset(REUTERS, categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Cycling.REUTERS, OR))),
    SearchPreset(PA, searchTerms = Some(SingleTerm(SingleField("CYCLING", Slug))), categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Sport.PA, OR))),
    SearchPreset(AFP, searchTerms = Some(SingleTerm(SingleField("cycling", Slug))), categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Sport.AFP, OR))),
    SearchPreset(AAP, categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Cycling.AAP, OR))),
    SearchPreset(
      AP,
      searchTerms = Some(SingleTerm(SingleField("CYC", Slug))),
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Sport.AP, OR)),
      keyword = Some("Cycling")
    )
  )

  private val MotorSport = List(
    SearchPreset(REUTERS, categoryCodes = Some(CategoryCodesCondition(CategoryCodes.MotorSport.REUTERS, OR))),
    SearchPreset(
      PA,
      searchTerms = Some(SingleTerm(SingleField("auto OR MOTO", Slug))),
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Sport.PA ::: List("paCat:RSR"), OR))
    ),
    SearchPreset(AFP, searchTerms = Some(SingleTerm(SingleField("auto OR moto", Slug))), categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Sport.AFP, OR))),
    SearchPreset(AAP, categoryCodes = Some(CategoryCodesCondition(CategoryCodes.MotorSport.AAP, OR))),
    SearchPreset(AP, searchTerms = Some(SingleTerm(SingleField("CAR", Slug))), categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Sport.AP, OR))),
    SearchPreset(AP, categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Sport.AP, OR)), keywords = List("Automobile racing", "Formula One racing"))
  )

  private val Golf = List(
    SearchPreset(
      REUTERS,
      searchTerms = Some(SingleTerm(SingleField("-(OPTA)", BodyText))),
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Golf.REUTERS, OR))
    ),
    SearchPreset(
      PA,
      searchTerms = Some(SingleTerm(SingleField("GOLF", Slug))),
      categoryCodesExcl = List("paCat:RSR")
    ),
    SearchPreset(AFP, searchTerms = Some(SingleTerm(SingleField("golf", Slug))), categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Sport.AFP, OR))),
    SearchPreset(AAP, categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Golf.AAP, OR))),
    SearchPreset(
      AP,
      searchTerms = Some(SingleTerm(SingleField("GLF -Scores", Slug))),
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Sport.AP, OR)),
      keyword = Some("Golf")
    )
  )

  private val GolfScores = List(
    SearchPreset(
      REUTERS,
      searchTerms = Some(SingleTerm(SingleField("(OPTA)", BodyText))),
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Golf.REUTERS, OR))
    ),
    SearchPreset(
      PA,
      searchTerms = Some(SingleTerm(SingleField("GOLF", Slug))),
      categoryCodes = Some(CategoryCodesCondition(List("paCat:RSR"), OR))
    ),
    SearchPreset(
      AP,
      searchTerms = Some(
        SingleTerm(
          SingleField(
            "GLF Scores OR GLF Leaders OR GLF Winners OR GLF Stax OR GLF Standings " +
              "OR GLF Ranking",
            Slug
          )
        )
      ),
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Sport.AP, OR))
    )
  )

  private val Boxing = List(
    SearchPreset(REUTERS, categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Boxing.REUTERS, OR))),
    SearchPreset(
      PA,
      searchTerms = Some(SingleTerm(SingleField("BOXING", Slug))),
      categoryCodes = Some(CategoryCodesCondition(List("paCat:SRS", "paCat:SSS"), OR))
    ),
    SearchPreset(AFP, searchTerms = Some(SingleTerm(SingleField("Box", Slug))), categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Sport.AFP, OR))),
    SearchPreset(AAP, categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Boxing.AAP, OR))),
    SearchPreset(
      AP,
      searchTerms = Some(SingleTerm(SingleField("BOX", Slug))),
      keyword = Some("Boxing")
    )
  )

  private val HorseRacing = List(
    SearchPreset(REUTERS, categoryCodes = Some(CategoryCodesCondition(CategoryCodes.HorseRacing.REUTERS, OR))),
    SearchPreset(PA, categoryCodes = Some(CategoryCodesCondition(CategoryCodes.HorseRacing.PA, OR))),
    SearchPreset(AFP, searchTerms = Some(SingleTerm(SingleField("racing", Slug))), categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Sport.AFP, OR))),
    SearchPreset(AAP, categoryCodes = Some(CategoryCodesCondition(CategoryCodes.HorseRacing.AAP, OR))),
    SearchPreset(AP, categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Sport.AP, OR)), keyword = Some("Horse racing"))
  )

  private val IceHockey = List(
    SearchPreset(
      REUTERS,
      categoryCodes = Some(CategoryCodesCondition(List("N2:ICEH", "N2:NHL", "subj:15031000"), OR))
    ),
    SearchPreset(
      PA,
      searchTerms = Some(SingleTerm(SingleField("ICEHOCKEY", Slug))),
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Sport.PA ::: List("paCat:RSR"), OR))
    ),
    SearchPreset(
      AFP,
      searchTerms = Some(SingleTerm(SingleField("IHockey", Slug))),
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Sport.AFP, OR))
    ),
    SearchPreset(
      AP,
      searchTerms = Some(SingleTerm(SingleField("HKN OR HKW", Slug))),
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Sport.AP, OR))
    ),
    SearchPreset(
      AP,
      keywords = List("Hockey", "NHL hockey"),
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Sport.AP, OR))
    )
  )

  private val Athletics = List(
    SearchPreset(REUTERS, categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Athletics.REUTERS, OR))),
    SearchPreset(
      PA,
      searchTerms = Some(SingleTerm(SingleField("ATHLETICS", Slug))),
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Sport.PA, OR))
    ),
    SearchPreset(AFP, searchTerms = Some(SingleTerm(SingleField("ATHLETICS", Slug))), categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Sport.AFP, OR))),
    SearchPreset(AAP, categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Athletics.AAP, OR))),
    SearchPreset(
      AP,
      searchTerms = Some(SingleTerm(SingleField("ATH", Slug))),
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Sport.AP, OR)),
      keyword = Some("Track and field")
    )
  )

  private val Olympics = List(
    SearchPreset(REUTERS, categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Olympics.REUTERS, OR))),
    SearchPreset(
      PA,
      searchTerms = Some(
        ComboTerm(
          List(SingleField("Olympics OR IOC", Slug), SingleField("Olympics OR IOC", Headline)),
          OR
        )
      ),
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Sport.PA, OR))
    ),
    SearchPreset(AFP, searchTerms = Some(SingleTerm(SingleField("Oly", Slug))), categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Sport.AFP, OR))),
    SearchPreset(AAP, categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Olympics.AAP, OR))),
    SearchPreset(
      AP,
      categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Sport.AP, OR)),
      keywords = List("Olympic games", "2026 Milan Cortina Olympic Games")
    ),
    SearchPreset(AP, categoryCodes = Some(CategoryCodesCondition(CategoryCodes.Sport.AP, OR)), searchTerms = Some(SingleTerm(SingleField("OLY-", Slug))))
  )

  private val AllDataFormats = List(
    SearchPreset(PA, hasDataFormatting = Some(true))
  )

  private val DotCopy = List(SearchPreset("UNAUTHED_EMAIL_FEED"))

  val SportOther: List[FilterParams] =
    Soccer ::: SoccerScores ::: SoccerTables ::: AmericanFootball ::: Athletics ::: AustralianRules ::: Baseball ::: Basketball ::: Boxing ::: CollegeSports ::: Cricket ::: CricketScores ::: Cycling ::: Golf ::: GolfScores ::: HorseRacing ::: IceHockey ::: MotorSport ::: Olympics ::: RugbyLeague ::: RugbyUnion ::: RugbyScores ::: Tennis ::: TennisScores ::: AllDataFormats

}
