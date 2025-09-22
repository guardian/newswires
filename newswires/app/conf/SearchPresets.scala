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
      hasDataFormatting: Option[Boolean] = None
  ): SearchParams =
    SearchParams(
      text = None,
      suppliersIncl = List(supplier),
      keywordIncl = keyword.toList ::: keywords,
      keywordExcl = keywordExcl,
      categoryCodesIncl = categoryCodes,
      categoryCodesExcl = categoryCodesExcl,
      hasDataFormatting = hasDataFormatting
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
      text = Some(SearchTerm.Simple(text)),
      suppliersIncl = List(supplier),
      keywordIncl = keyword.toList,
      keywordExcl = keywordExcl,
      categoryCodesIncl = categoryCodes,
      categoryCodesExcl = categoryCodesExcl,
      hasDataFormatting = hasDataFormatting
    )

  def fromSearchTerm(
      supplier: String,
      searchTerm: SearchTerm,
      categoryCodes: List[String] = Nil,
      categoryCodesExcl: List[String] = Nil,
      keyword: Option[String] = None,
      keywordExcl: List[String] = Nil,
      hasDataFormatting: Option[Boolean] = None
  ): SearchParams =
    SearchParams(
      text = Some(searchTerm),
      suppliersIncl = List(supplier),
      keywordIncl = keyword.toList,
      keywordExcl = keywordExcl,
      categoryCodesIncl = categoryCodes,
      categoryCodesExcl = categoryCodesExcl,
      hasDataFormatting = hasDataFormatting
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
    case "f1"                   => Some(F1)
    case "golf"                 => Some(Golf)
    case "golf-results"         => Some(GolfResults)
    case "boxing"               => Some(Boxing)
    case "horse-racing"         => Some(HorseRacing)
    case "athletics"            => Some(Athletics)
    case "olympics"             => Some(Olympics)
    case "all-data-formats"     => Some(AllDataFormats)
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
      searchTerm = SearchTerm.Simple(SimpleSearchQueries.REUTERS_NEWS_SCHEDULE, SearchField.Headline),
      categoryCodes = List("MCC:DED")
    )
  )

  private val ReutersWorld = List(
    SearchPreset(REUTERS, categoryCodes = CategoryCodes.World.REUTERS),
    SearchPreset(
      REUTERS,
      categoryCodes = CategoryCodes.Other.REUTERS,
      categoryCodesExcl = CategoryCodes.Business.REUTERS ++ CategoryCodes.Sport.REUTERS
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
      searchTerm = SearchTerm.Simple("News Summary", SearchField.Headline),
      categoryCodes = List("MCC:OEC"),
      categoryCodesExcl = List("N2:GB", "N2:COM", "N2:ECI")
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
    SearchPreset.fromSearchTerm(REUTERS, searchTerm = SearchTerm.Simple("\\-soc-", Slug), CategoryCodes.Soccer.REUTERS),
    SearchPreset.fromSearchTerm(
      PA,
      searchTerm = SearchTerm.Simple("SOCCER", Slug),
      CategoryCodes.Soccer.PA,
      hasDataFormatting = Some(false)
    ),
    SearchPreset.fromText(AFP, SimpleSearchQueries.SOCCER, CategoryCodes.Sport.AFP),
    SearchPreset.fromSearchTerm(AAP, searchTerm = SearchTerm.Simple("Soccer", Slug), CategoryCodes.Soccer.AAP),
    SearchPreset(AP, CategoryCodes.Sport.AP, keyword = Some(SimpleSearchQueries.SOCCER))
  )

  private val SoccerScores = List(
    SearchPreset(
      PA,
      CategoryCodes.SoccerScores.PA
    ),
    SearchPreset.fromSearchTerm(PA, searchTerm = SearchTerm.Simple("SOCCER TABULATED RESULTS", Slug))
  )

  private val SoccerTables = List(
    SearchPreset.fromSearchTerm(
      PA,
      searchTerm = SearchTerm.Simple("SOCCER Tables", Slug),
      CategoryCodes.SoccerTables.PA
    )
  )
  // SoccerTablesDataFormats
  private val NoSoccer = List(
    SearchPreset(
      REUTERS,
      categoryCodes = CategoryCodes.Sport.REUTERS.filterNot(CategoryCodes.Soccer.REUTERS.contains),
      categoryCodesExcl = CategoryCodes.Soccer.REUTERS
    ),
    SearchPreset.fromSearchTerm(
      PA,
      searchTerm = SearchTerm.Simple("-SOCCER", Slug),
      categoryCodes = CategoryCodes.Sport.PA.filterNot(CategoryCodes.Soccer.PA.contains),
      categoryCodesExcl = CategoryCodes.Soccer.PA
    ),
    SearchPreset.fromText(AFP, SimpleSearchQueries.NOSOCCER, CategoryCodes.Sport.AFP),
    SearchPreset(
      AAP,
      categoryCodes = CategoryCodes.Sport.AAP.filterNot(CategoryCodes.Soccer.AAP.contains),
      categoryCodesExcl = CategoryCodes.Soccer.AAP
    ),
    SearchPreset(AP, CategoryCodes.Sport.AP, keyword = Some(SimpleSearchQueries.NOSOCCER))
  )

  private val Cricket = List(
    SearchPreset(REUTERS, CategoryCodes.Cricket.REUTERS),
    SearchPreset(PA, CategoryCodes.Cricket.PA),
    SearchPreset.fromText(AFP, text = SimpleSearchQueries.CRICKET, CategoryCodes.Sport.AFP),
    SearchPreset(AAP, CategoryCodes.Cricket.AAP),
    SearchPreset(AP, CategoryCodes.Sport.AP, keyword = Some(SimpleSearchQueries.CRICKET))
  )

  private val CricketResults = List(
    SearchPreset(PA, CategoryCodes.CricketResults.PA)
  )

  private val RugbyLeague = List(
    SearchPreset(REUTERS, CategoryCodes.RugbyLeague.REUTERS),
    SearchPreset.fromSearchTerm(
      PA,
      searchTerm = SearchTerm.Simple("RUGBYL", Slug),
      categoryCodes = List("paCat:SRS", "paCat:SSS")
    ),
    SearchPreset.fromText(AFP, text = SimpleSearchQueries.RUGBY_LEAGUE, CategoryCodes.Sport.AFP),
    SearchPreset(AAP, CategoryCodes.RugbyLeague.AAP),
    SearchPreset.fromText(AP, text = SimpleSearchQueries.RUGBY_LEAGUE, CategoryCodes.Sport.AP, keyword = Some("Rugby"))
  )

  private val RugbyUnion = List(
    SearchPreset(REUTERS, CategoryCodes.RugbyUnion.REUTERS),
    SearchPreset.fromSearchTerm(
      PA,
      searchTerm = SearchTerm.Simple("RUGBYU", Slug),
      categoryCodes = List("paCat:SRS", "paCat:SSS")
    ),
    SearchPreset.fromText(AFP, text = SimpleSearchQueries.RUGBY_UNION, CategoryCodes.Sport.AFP),
    SearchPreset(AAP, CategoryCodes.RugbyUnion.AAP),
    SearchPreset.fromText(AP, text = SimpleSearchQueries.RUGBY_UNION, CategoryCodes.Sport.AP, keyword = Some("Rugby"))
  )

  private val RugbyResults = List(
    SearchPreset(PA, categoryCodes = CategoryCodes.RugbyResults.PA)
  )

  private val Tennis = List(
    SearchPreset(REUTERS, CategoryCodes.Tennis.REUTERS),
    SearchPreset.fromSearchTerm(
      PA,
      searchTerm = SearchTerm.Simple("TENNIS", Slug),
      categoryCodes = List("paCat:SRS", "paCat:SSS"),
      categoryCodesExcl = List("paCat:RSR")
    ),
    SearchPreset.fromText(AFP, text = SimpleSearchQueries.TENNIS, CategoryCodes.Sport.AFP),
    SearchPreset(AAP, CategoryCodes.Tennis.AAP),
    SearchPreset(AP, CategoryCodes.Sport.AP, keyword = Some("Tennis"))
  )

  private val TennisResults = List(
    SearchPreset.fromSearchTerm(PA, searchTerm = SearchTerm.Simple("TENNIS", Slug), categoryCodes = List("paCat:RSR"))
  )

  private val Cycling = List(
    SearchPreset(REUTERS, CategoryCodes.Cycling.REUTERS),
    SearchPreset.fromSearchTerm(
      PA,
      searchTerm = SearchTerm.Simple("CYCLING", Slug),
      categoryCodes = List("paCat:SRS", "paCat:SSS")
    ),
    SearchPreset.fromText(AFP, text = SimpleSearchQueries.CYCLING, CategoryCodes.Sport.AFP),
    SearchPreset(AAP, CategoryCodes.Cycling.AAP),
    SearchPreset(AP, CategoryCodes.Sport.AP, keyword = Some("Cycling"))
  )

  private val F1 = List(
    SearchPreset(REUTERS, CategoryCodes.F1.REUTERS),
    SearchPreset.fromSearchTerm(
      PA,
      searchTerm = SearchTerm.Simple("auto", Slug),
      categoryCodes = List("paCat:SRS", "paCat:SSS", "paCat:RSR")
    ),
    SearchPreset.fromText(AFP, text = SimpleSearchQueries.F1, CategoryCodes.Sport.AFP),
    SearchPreset(AAP, CategoryCodes.F1.AAP),
    SearchPreset(AP, CategoryCodes.Sport.AP, keyword = Some("Formula One racing"))
  )

  private val Golf = List(
    SearchPreset(REUTERS, CategoryCodes.Golf.REUTERS),
    SearchPreset
      .fromSearchTerm(PA, searchTerm = SearchTerm.Simple("GOLF", Slug), categoryCodesExcl = List("paCat:RSR")),
    SearchPreset.fromText(AFP, text = SimpleSearchQueries.GOLF, CategoryCodes.Sport.AFP),
    SearchPreset(AAP, CategoryCodes.Golf.AAP),
    SearchPreset(AP, CategoryCodes.Sport.AP, keyword = Some("Golf"))
  )

  private val GolfResults = List(
    SearchPreset.fromSearchTerm(PA, searchTerm = SearchTerm.Simple("GOLF", Slug), categoryCodes = List("paCat:RSR"))
  )

  private val Boxing = List(
    SearchPreset(REUTERS, CategoryCodes.Boxing.REUTERS),
    SearchPreset.fromText(PA, text = SimpleSearchQueries.BOXING, categoryCodes = List("paCat:SRS", "paCat:SSS")),
    SearchPreset.fromText(AFP, text = SimpleSearchQueries.BOXING, CategoryCodes.Sport.AFP),
    SearchPreset(AAP, CategoryCodes.Boxing.AAP),
    SearchPreset(AP, CategoryCodes.Sport.AP, keyword = Some("Boxing"))
  )

  private val HorseRacing = List(
    SearchPreset(REUTERS, CategoryCodes.HorseRacing.REUTERS),
    SearchPreset(PA, CategoryCodes.HorseRacing.PA),
    SearchPreset.fromText(AFP, text = SimpleSearchQueries.HORSE_RACING, CategoryCodes.Sport.AFP),
    SearchPreset(AAP, CategoryCodes.HorseRacing.AAP),
    SearchPreset(AP, CategoryCodes.Sport.AP, keyword = Some("Horse racing"))
  )

  private val Athletics = List(
    SearchPreset(REUTERS, CategoryCodes.Athletics.REUTERS),
    SearchPreset.fromSearchTerm(
      PA,
      searchTerm = SearchTerm.Simple("ATHLETICS", Slug),
      categoryCodes = List("paCat:SRS", "paCat:SSS", "paCat:RSR")
    ),
    SearchPreset.fromSearchTerm(AFP, searchTerm = SearchTerm.Simple("ATHLETICS", Slug), CategoryCodes.Sport.AFP),
    SearchPreset(AAP, CategoryCodes.Athletics.AAP),
    SearchPreset(AP, CategoryCodes.Sport.AP, keyword = Some("Track and field"))
  )

  private val Olympics = List(
    SearchPreset.fromText(REUTERS, text = SimpleSearchQueries.OLYMPICS, categoryCodes = List("subj:15073000")),
    SearchPreset.fromText(PA, text = SimpleSearchQueries.OLYMPICS, categoryCodes = List("paCat:SRS", "paCat:SSS")),
    SearchPreset.fromText(AFP, text = SimpleSearchQueries.OLYMPICS, CategoryCodes.Sport.AFP),
    SearchPreset(AAP, CategoryCodes.Olympics.AAP),
    SearchPreset.fromText(AP, text = SimpleSearchQueries.OLYMPICS, CategoryCodes.Sport.AP)
  )

  private val AllDataFormats = List(
    SearchPreset(PA, hasDataFormatting = Some(true))
  )

}
