package conf

import db.SearchParams

object Categories {
  val sportsRelated = List(
    "MCC:SPO",
    "N2:TEN",
    "a1312cat:s",
    "paCat:GXX", // maybe, or maybe advertising "Tequila brand announces partnership with Fulham Football Club"
    "paCat:RDR",
    "paCat:RFC",
    "paCat:RRB",
    "paCat:RRF",
    "paCat:RRG",
    "paCat:RRR",
    "paCat:RSF",
    "paCat:RSR",
    "paCat:SCN",
    "paCat:SCR",
    "paCat:SDA",
    "paCat:SDB",
    "paCat:SDP",
    "paCat:SDQ",
    "paCat:SDR",
    "paCat:SDS",
    "paCat:SFF",
    "paCat:SJA",
    "paCat:SJB",
    "paCat:SOD",
    "paCat:SOS",
    "paCat:SPO",
    "paCat:SRD",
    "paCat:SRN",
    "paCat:SRR",
    "paCat:SRS",
    "paCat:SRZ",
    "paCat:SSD",
    "paCat:SSF",
    "paCat:SSO",
    "paCat:SSS",
    "paCat:SST",
    "paCat:STA",
    "paCat:STB",
    "paCat:STC",
    "paCat:STD",
    "paCat:STR",
    "medtop:15000000"
  )

  val sportsRelatedNewsCodes = List(
    "subj:15000000",
    "subj:15001000",
    "subj:15001001",
    "subj:15001002",
    "subj:15002000",
    "subj:15002001",
    "subj:15002002",
    "subj:15002003",
    "subj:15002004",
    "subj:15002005",
    "subj:15003000",
    "subj:15003001",
    "subj:15003002",
    "subj:15003003",
    "subj:15004000",
    "subj:15004001",
    "subj:15004002",
    "subj:15005000",
    "subj:15005001",
    "subj:15005002",
    "subj:15005003",
    "subj:15005004",
    "subj:15005005",
    "subj:15005006",
    "subj:15005007",
    "subj:15005008",
    "subj:15005009",
    "subj:15005010",
    "subj:15005011",
    "subj:15005012",
    "subj:15005013",
    "subj:15005014",
    "subj:15005015",
    "subj:15005016",
    "subj:15005017",
    "subj:15005018",
    "subj:15005019",
    "subj:15005020",
    "subj:15005021",
    "subj:15005022",
    "subj:15005023",
    "subj:15005024",
    "subj:15005025",
    "subj:15005026",
    "subj:15005027",
    "subj:15005028",
    "subj:15005029",
    "subj:15005030",
    "subj:15005031",
    "subj:15005032",
    "subj:15005033",
    "subj:15005034",
    "subj:15005035",
    "subj:15005036",
    "subj:15005037",
    "subj:15005038",
    "subj:15005039",
    "subj:15005040",
    "subj:15005041",
    "subj:15005042",
    "subj:15005043",
    "subj:15005044",
    "subj:15005045",
    "subj:15005046",
    "subj:15005047",
    "subj:15005048",
    "subj:15005049",
    "subj:15005050",
    "subj:15005051",
    "subj:15005052",
    "subj:15005053",
    "subj:15005054",
    "subj:15005055",
    "subj:15005056",
    "subj:15005057",
    "subj:15005058",
    "subj:15005059",
    "subj:15005060",
    "subj:15005061",
    "subj:15005062",
    "subj:15005063",
    "subj:15005064",
    "subj:15005065",
    "subj:15005066",
    "subj:15005067",
    "subj:15005068",
    "subj:15005069",
    "subj:15006000",
    "subj:15007000",
    "subj:15007001",
    "subj:15007002",
    "subj:15007003",
    "subj:15007004",
    "subj:15007005",
    "subj:15007006",
    "subj:15008000",
    "subj:15008001",
    "subj:15008002",
    "subj:15008003",
    "subj:15008004",
    "subj:15008005",
    "subj:15009000",
    "subj:15009001",
    "subj:15009002",
    "subj:15009003",
    "subj:15009004",
    "subj:15009005",
    "subj:15009006",
    "subj:15010000",
    "subj:15010001",
    "subj:15010002",
    "subj:15010003",
    "subj:15010004",
    "subj:15010005",
    "subj:15010006",
    "subj:15011000",
    "subj:15011001",
    "subj:15011002",
    "subj:15012000",
    "subj:15013000",
    "subj:15014000",
    "subj:15014001",
    "subj:15014002",
    "subj:15014003",
    "subj:15014004",
    "subj:15014005",
    "subj:15014006",
    "subj:15014007",
    "subj:15014008",
    "subj:15014009",
    "subj:15014010",
    "subj:15014011",
    "subj:15014012",
    "subj:15014013",
    "subj:15014014",
    "subj:15014015",
    "subj:15014016",
    "subj:15014017",
    "subj:15014018",
    "subj:15014019",
    "subj:15014020",
    "subj:15014021",
    "subj:15014022",
    "subj:15014023",
    "subj:15014024",
    "subj:15015000",
    "subj:15015001",
    "subj:15015002",
    "subj:15015003",
    "subj:15015004",
    "subj:15015005",
    "subj:15015006",
    "subj:15015007",
    "subj:15015008",
    "subj:15015009",
    "subj:15015010",
    "subj:15015011",
    "subj:15015012",
    "subj:15016000",
    "subj:15016001",
    "subj:15016002",
    "subj:15017000",
    "subj:15018000",
    "subj:15018001",
    "subj:15019000",
    "subj:15019001",
    "subj:15019002",
    "subj:15019003",
    "subj:15019004",
    "subj:15019005",
    "subj:15019006",
    "subj:15019007",
    "subj:15019008",
    "subj:15019009",
    "subj:15019010",
    "subj:15019011",
    "subj:15019012",
    "subj:15019013",
    "subj:15019014",
    "subj:15019015",
    "subj:15019016",
    "subj:15019017",
    "subj:15019018",
    "subj:15019019",
    "subj:15019020",
    "subj:15019021",
    "subj:15020000",
    "subj:15021000",
    "subj:15021001",
    "subj:15021002",
    "subj:15021003",
    "subj:15021004",
    "subj:15021005",
    "subj:15021006",
    "subj:15022000",
    "subj:15022001",
    "subj:15022002",
    "subj:15022003",
    "subj:15022004",
    "subj:15023000",
    "subj:15023001",
    "subj:15023002",
    "subj:15023003",
    "subj:15024000",
    "subj:15024001",
    "subj:15025000",
    "subj:15025001",
    "subj:15025002",
    "subj:15025003",
    "subj:15026000",
    "subj:15026001",
    "subj:15026002",
    "subj:15026003",
    "subj:15027000",
    "subj:15028000",
    "subj:15028001",
    "subj:15028002",
    "subj:15028003",
    "subj:15028004",
    "subj:15028005",
    "subj:15028006",
    "subj:15028007",
    "subj:15028008",
    "subj:15028009",
    "subj:15028010",
    "subj:15028011",
    "subj:15028012",
    "subj:15028013",
    "subj:15028014",
    "subj:15028015",
    "subj:15029000",
    "subj:15030000",
    "subj:15030001",
    "subj:15030002",
    "subj:15030003",
    "subj:15030004",
    "subj:15031000",
    "subj:15031001",
    "subj:15031002",
    "subj:15032000",
    "subj:15032001",
    "subj:15032002",
    "subj:15032003",
    "subj:15032004",
    "subj:15032005",
    "subj:15032006",
    "subj:15032007",
    "subj:15032008",
    "subj:15032009",
    "subj:15032010",
    "subj:15032011",
    "subj:15032012",
    "subj:15033000",
    "subj:15033001",
    "subj:15033002",
    "subj:15033003",
    "subj:15033004",
    "subj:15033005",
    "subj:15033006",
    "subj:15033007",
    "subj:15034000",
    "subj:15034001",
    "subj:15034002",
    "subj:15035000",
    "subj:15036000",
    "subj:15036001",
    "subj:15036002",
    "subj:15037000",
    "subj:15038000",
    "subj:15038001",
    "subj:15038002",
    "subj:15038003",
    "subj:15038004",
    "subj:15038005",
    "subj:15039000",
    "subj:15039001",
    "subj:15039002",
    "subj:15039003",
    "subj:15039004",
    "subj:15039005",
    "subj:15039006",
    "subj:15039007",
    "subj:15039008",
    "subj:15040000",
    "subj:15040001",
    "subj:15040002",
    "subj:15040003",
    "subj:15041000",
    "subj:15041001",
    "subj:15041002",
    "subj:15041003",
    "subj:15041004",
    "subj:15041005",
    "subj:15041006",
    "subj:15041007",
    "subj:15041008",
    "subj:15041009",
    "subj:15041010",
    "subj:15041011",
    "subj:15041012",
    "subj:15041013",
    "subj:15041014",
    "subj:15042000",
    "subj:15043000",
    "subj:15043001",
    "subj:15043002",
    "subj:15043003",
    "subj:15043004",
    "subj:15043005",
    "subj:15043006",
    "subj:15043007",
    "subj:15043008",
    "subj:15043009",
    "subj:15043010",
    "subj:15043011",
    "subj:15043012",
    "subj:15043013",
    "subj:15043014",
    "subj:15043015",
    "subj:15043016",
    "subj:15043017",
    "subj:15044000",
    "subj:15044001",
    "subj:15045000",
    "subj:15046000",
    "subj:15046001",
    "subj:15046002",
    "subj:15047000",
    "subj:15047001",
    "subj:15047002",
    "subj:15047003",
    "subj:15047004",
    "subj:15047005",
    "subj:15047006",
    "subj:15047007",
    "subj:15048000",
    "subj:15049000",
    "subj:15049001",
    "subj:15050000",
    "subj:15050001",
    "subj:15050002",
    "subj:15050003",
    "subj:15050004",
    "subj:15050005",
    "subj:15050006",
    "subj:15050007",
    "subj:15050008",
    "subj:15050009",
    "subj:15050010",
    "subj:15050011",
    "subj:15050012",
    "subj:15050013",
    "subj:15050014",
    "subj:15050015",
    "subj:15050016",
    "subj:15051000",
    "subj:15051001",
    "subj:15051002",
    "subj:15051003",
    "subj:15051004",
    "subj:15051005",
    "subj:15051006",
    "subj:15051007",
    "subj:15051008",
    "subj:15051009",
    "subj:15051010",
    "subj:15051011",
    "subj:15051012",
    "subj:15052000",
    "subj:15052001",
    "subj:15052002",
    "subj:15052003",
    "subj:15053000",
    "subj:15053001",
    "subj:15053002",
    "subj:15054000",
    "subj:15055000",
    "subj:15056000",
    "subj:15056001",
    "subj:15056002",
    "subj:15056003",
    "subj:15056004",
    "subj:15056005",
    "subj:15056006",
    "subj:15056007",
    "subj:15056008",
    "subj:15056009",
    "subj:15056010",
    "subj:15056011",
    "subj:15056012",
    "subj:15056013",
    "subj:15056014",
    "subj:15057000",
    "subj:15058000",
    "subj:15058001",
    "subj:15058002",
    "subj:15058003",
    "subj:15058004",
    "subj:15058005",
    "subj:15059000",
    "subj:15060000",
    "subj:15061000",
    "subj:15062000",
    "subj:15062001",
    "subj:15062002",
    "subj:15062003",
    "subj:15062004",
    "subj:15062005",
    "subj:15062006",
    "subj:15062007",
    "subj:15062008",
    "subj:15062009",
    "subj:15062010",
    "subj:15062011",
    "subj:15062012",
    "subj:15062013",
    "subj:15062014",
    "subj:15062015",
    "subj:15062016",
    "subj:15062017",
    "subj:15062018",
    "subj:15062019",
    "subj:15062020",
    "subj:15062021",
    "subj:15062022",
    "subj:15062023",
    "subj:15062024",
    "subj:15062025",
    "subj:15062026",
    "subj:15063000",
    "subj:15064000",
    "subj:15064001",
    "subj:15064002",
    "subj:15064003",
    "subj:15064004",
    "subj:15064005",
    "subj:15064006",
    "subj:15064007",
    "subj:15064008",
    "subj:15065000",
    "subj:15065001",
    "subj:15066000",
    "subj:15066001",
    "subj:15066002",
    "subj:15066003",
    "subj:15067000",
    "subj:15067001",
    "subj:15068000",
    "subj:15069000",
    "subj:15069001",
    "subj:15069002",
    "subj:15069003",
    "subj:15069004",
    "subj:15070000",
    "subj:15070001",
    "subj:15070002",
    "subj:15070003",
    "subj:15070004",
    "subj:15070005",
    "subj:15070006",
    "subj:15070007",
    "subj:15070008",
    "subj:15070009",
    "subj:15070010",
    "subj:15070011",
    "subj:15070012",
    "subj:15070013",
    "subj:15070014",
    "subj:15070015",
    "subj:15070016",
    "subj:15071000",
    "subj:15071001",
    "subj:15071002",
    "subj:15071003",
    "subj:15071004",
    "subj:15072000",
    "subj:15072001",
    "subj:15072002",
    "subj:15072003",
    "subj:15072004",
    "subj:15072005",
    "subj:15072006",
    "subj:15072007",
    "subj:15072008",
    "subj:15072009",
    "subj:15072010",
    "subj:15072011",
    "subj:15072012",
    "subj:15073000",
    "subj:15073001",
    "subj:15073002",
    "subj:15073003",
    "subj:15073004",
    "subj:15073005",
    "subj:15073006",
    "subj:15073007",
    "subj:15073008",
    "subj:15073009",
    "subj:15073010",
    "subj:15073011",
    "subj:15073012",
    "subj:15073013",
    "subj:15073014",
    "subj:15073015",
    "subj:15073016",
    "subj:15073017",
    "subj:15073018",
    "subj:15073019",
    "subj:15073020",
    "subj:15073021",
    "subj:15073022",
    "subj:15073023",
    "subj:15073024",
    "subj:15073025",
    "subj:15073026",
    "subj:15073027",
    "subj:15073028",
    "subj:15073029",
    "subj:15073030",
    "subj:15073031",
    "subj:15073032",
    "subj:15073033",
    "subj:15073034",
    "subj:15073035",
    "subj:15073036",
    "subj:15073037",
    "subj:15073038",
    "subj:15073039",
    "subj:15073040",
    "subj:15073041",
    "subj:15073042",
    "subj:15073043",
    "subj:15073044",
    "subj:15073045",
    "subj:15073046",
    "subj:15073047",
    "subj:15074000",
    "subj:15074001",
    "subj:15074002",
    "subj:15074003",
    "subj:15074004",
    "subj:15074005",
    "subj:15074006",
    "subj:15074007",
    "subj:15075000",
    "subj:15076000",
    "subj:15077000",
    "subj:15077001",
    "subj:15077002",
    "subj:15077003",
    "subj:15077004",
    "subj:15077005",
    "subj:15077006",
    "subj:15077007",
    "subj:15077008",
    "subj:15077009",
    "subj:15077010",
    "subj:15078000",
    "subj:15079000",
    "subj:15080000",
    "subj:15081000",
    "subj:15082000",
    "subj:15082001",
    "subj:15082002",
    "subj:15083000",
    "subj:15084000",
    "subj:15085000",
    "subj:15086000",
    "subj:15087000",
    "subj:15088000",
    "subj:15089000",
    "subj:15090000",
    "subj:15091000",
    "subj:15092000",
    "subj:15093000",
    "subj:15094000",
    "subj:15095000",
    "subj:15096000",
    "subj:15097000",
    "subj:15098000",
    "subj:15099000",
    "subj:15100000",
    "subj:15101000",
    "subj:15102000",
    "subj:15103000"
  )
}

object SearchBuckets {
  def get(name: String): Option[List[SearchParams]] = name match {
    case "reuters-world" => Some(ReutersWorld)
    case "ap-world"      => Some(ApWorld)
    case "aap-world"     => Some(AapWorld)
    case "all-world"     => Some(AllWorld)
    case "afp-world"     => Some(AfpWorld)
    case _               => None
  }

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
  private val ApWorld = List(
    SearchParams(
      text = None,
      suppliersIncl = List("AP"),
      keywordIncl = List("World news"),
      categoryCodesIncl = List("apCat:i", "apCat:a", "apCat:w"),
      categoryCodesExcl = List("apCat:s", "apCat:e", "apCat:f")
    )
  )

  private val ReutersWorld = List(
    SearchParams(
      text = None,
      suppliersIncl = List("REUTERS"),
      categoryCodesIncl = List(
        "MCC:OVR",
        "MCCL:OVR",
        "MCCL:OSM",
        "N2:US"
      ),
      categoryCodesExcl = List(
        "MCC:OEC",
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

  private val AllWorld = ApWorld ::: ReutersWorld ::: AapWorld ::: AfpWorld
}
