package conf

import db.SearchParams

object Subjects {
  val sportsRelated = List(
    "MCC:SPO",
    "N2:TEN",
    "a1312cat:s",
    "iptccat:GXX", // maybe, or maybe advertising "Tequila brand announces partnership with Fulham Football Club"
    "iptccat:RFC",
    "iptccat:RRR",
    "iptccat:RSR",
    "iptccat:SCN",
    "iptccat:SCR",
    "iptccat:SDA",
    "iptccat:SDB",
    "iptccat:SDP",
    "iptccat:SDQ",
    "iptccat:SDR",
    "iptccat:SDS",
    "iptccat:SFF",
    "iptccat:SJA",
    "iptccat:SJB",
    "iptccat:SRD",
    "iptccat:SRN",
    "iptccat:SRR",
    "iptccat:SRS",
    "iptccat:SRZ",
    "iptccat:SSD",
    "iptccat:SSF",
    "iptccat:SSO",
    "iptccat:SSS",
    "iptccat:SST",
    "iptccat:STA",
    "iptccat:STB",
    "iptccat:STR",
    "medtop:15000000"
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
