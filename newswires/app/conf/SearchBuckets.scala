package conf

import db.SearchParams

object Subjects {
  val sportsRelated = List(
    "medtop:15000000",
    "iptccat:SFF",
    "iptccat:SSO",
    "iptccat:STR",
    "iptccat:SRR",
    "iptccat:SRD",
    "iptccat:SRN",
    "iptccat:SDP",
    "iptccat:SDR",
    "iptccat:SSS",
    "iptccat:SRS",
    "iptccat:SRZ",
    "iptccat:SDS",
    "iptccat:SDQ",
    "iptccat:SCR",
    "iptccat:SST",
    "iptccat:RSR",
    "iptccat:STA",
    "iptccat:STB",
    "iptccat:SJA",
    "iptccat:SJB",
    "iptccat:SDA",
    "iptccat:SDB",
    "iptccat:SCN",
    "iptccat:GXX", // maybe, or maybe advertising "Tequila brand announces partnership with Fulham Football Club"
    "iptccat:RFC",
    "a1312cat:s",
    "MCC:SPO",
    "N2:TEN"
  )
}

object SearchBuckets {
  def get(name: String): Option[SearchParams] = name match {
    case "no-sports"   => Some(NoSports)
    case "pa-home"     => Some(PaHome)
    case "us-election" => Some(UsElection)
    case "ap-world"    => Some(ApWorld)
    case _             => None
  }

  private val PaHome = SearchParams(
    text = None,
    suppliersIncl = List("PA"),
    subjectsExcl = Subjects.sportsRelated
  )

  private val UsElection = SearchParams(
    text = None,
    keywordIncl = List("2024 United States presidential election"),
    subjectsIncl = List(
      "N2:VOTP"
    )
  )

  private val ApWorld = SearchParams(
    text = None,
    keywordIncl = List("World news"),
    subjectsIncl = Nil
  )

  private val NoSports = SearchParams(
    text = None,
    keywordExcl = List("Sports"),
    subjectsExcl = Subjects.sportsRelated
  )
}
