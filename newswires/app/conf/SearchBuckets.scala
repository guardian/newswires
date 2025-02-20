package conf

import db.SearchParams

object Subjects {
  val sportsRelated = List(
    "MCC:SPO",
    "N2:TEN",
    "a1312cat:s",
    "iptccat:GXX", // maybe, or maybe advertising "Tequila brand announces partnership with Fulham Football Club"
    "iptccat:RDR",
    "iptccat:RFC",
    "iptccat:RRB",
    "iptccat:RRR",
    "iptccat:RSF",
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
    "iptccat:SOD",
    "iptccat:SOS",
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
    "iptccat:STC",
    "iptccat:STD",
    "iptccat:STR",
    "medtop:15000000"
  )
}

object SearchBuckets {
  def get(name: String): Option[SearchParams] = name match {
    case "no-sports"     => Some(NoSports)
    case "reuters-world" => Some(ReutersWorld)
    case "pa-home"       => Some(PaHome)
    case "us-election"   => Some(UsElection)
    case "ap-world"      => Some(ApWorld)
    case _               => None
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

  // format: off
  /**
    * Main config table for AP world ('NY:for') bucket in Fip system.
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
    * We're inclined to exclude sports, entertainment, finance, and technology news from this bucket instead, even
    * if they have e.g. code 'a' (US news) code, because they're likely to be less relevant to International desk.
    * However, we should remain open to changing this in response to user feedback.
    */
  // format: on
  private val ApWorld = SearchParams(
    text = None,
    suppliersIncl = List("AP"),
    keywordIncl = List("World news"),
    categoryCodesIncl = List("apCat:i", "apCat:a", "apCat:w"),
    categoryCodesExcl = List("apCat:s", "apCat:e", "apCat:f")
  )

  private val ReutersWorld = SearchParams(
    text = None,
    subjectsIncl = List(
      "MCC:OVR",
      "MCC:OEC",
      "MCCL:OVR",
      "MCCL:OSM",
      "N2:US"
    ),
    subjectsExcl = List(
      "N2:GB",
      "N2:COM",
      "N2:ECI"
    )
  )

  private val NoSports = SearchParams(
    text = None,
    keywordExcl = List("Sports"),
    subjectsExcl = Subjects.sportsRelated
  )
}
