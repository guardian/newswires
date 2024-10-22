package conf

import db.SearchParams

object SearchBuckets {
  def get(name: String): Option[SearchParams] = name match {
    case "no-sports" => Some(NoSports)
    case _           => None
  }

  private val NoSports = SearchParams(
    text = None,
    keywordExcl = List("Sports"),
    subjectsExcl = List(
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
  )
}
