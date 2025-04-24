export const ukPlaces = [
    // Countries and regions
    "united kingdom", "great britain", "uk", "britain",
    "england", "scotland", "wales", "northern ireland",
    // England counties
    "bedfordshire", "berkshire", "buckinghamshire", "cambridgeshire",
    "cheshire", "city of london", "cornwall", "cumbria", "derbyshire", "devon",
    "dorset", "east riding of yorkshire", "east sussex", "essex",
    "gloucestershire", "greater london", "greater manchester", "hampshire",
    "herefordshire", "hertfordshire", "isle of wight", "kent", "lancashire",
    "leicestershire", "lincolnshire", "merseyside", "norfolk", "north east somerset",
    "north lincolnshire", "north yorkshire", "northamptonshire",
    "northumberland", "nottinghamshire", "oxfordshire", "rutland",
    "shropshire", "somerset", "south yorkshire", "staffordshire", "suffolk",
    "surrey", "tyne and wear", "warwickshire", "west midlands", "west sussex",
    "west yorkshire", "wiltshire",
    // Wales counties
    "clwyd", "dyfed", "gwent", "gwynedd", "mid glamorgan", "powys", "south glamorgan", "west glamorgan",
    // Scotland counties
    "aberdeenshire", "angus", "argyll", "ayrshire", "banffshire", "berwickshire", "buteshire",
    "caithness", "clackmannanshire", "cromartyshire", "dumfriesshire", "dunbartonshire",
    "east lothian", "fife", "inverness-shire", "kincardineshire", "kinross-shire", "kirkcudbrightshire",
    "lanarkshire", "midlothian", "moray", "nairnshire", "orkney", "peeblesshire", "perth and kinross", "renfrewshire",
    "ross-shire", "roxburghshire", "selkirkshire", "shetland", "stirlingshire", "sutherland",
    "west lothian", "wigtownshire",
    // Northern Ireland counties
    "antrim", "armagh", "down", "fermanagh", "londonderry", "tyrone",
    // England areas
    "north east england", "north west england", "yorkshire dales",
    "east midlands", "west midlands", "east of england",
    "south east england", "south west england", "south downs", "south coast",
    "cotswolds", "peak district", "lake district",
    // Wales areas
    "north wales", "mid wales", "south wales", "pembrokeshire coast",
    "snowdonia", "brecon beacons",
    // Scotland areas
    "highlands and islands", "central belt", "east scotland", "west scotland",
    "scottish borders", "grampian mountains", "cairngorms",
    // London boroughs
    "barking and dagenham", "barnet", "bexley", "brent", "bromley",
    "camden", "croydon", "ealing", "enfield", "greenwich", "hackney",
    "hammersmith and fulham", "haringey", "harrow", "havering",
    "hillingdon", "hounslow", "islington", "kensington and chelsea",
    "kingston upon thames", "lambeth", "lewisham", "merton", "newham",
    "redbridge", "richmond upon thames", "southwark", "sutton",
    "tower hamlets", "waltham forest", "wandsworth", "westminster",
    // Major cities
    "london", "birmingham", "manchester", "glasgow", "liverpool", "leeds",
    "sheffield", "edinburgh", "bristol", "cardiff", "belfast", "newcastle",
    "nottingham", "leicester", "coventry", "kingston upon hull", "aberdeen",
    "brighton", "cambridge", "canterbury", "carlisle", "chester", "derby",
    "dundee", "durham", "exeter", "gloucester", "inverness", "lancaster",
    "lincoln", "norwich", "oxford", "peterborough", "plymouth", "portsmouth",
    "preston", "salford", "salisbury", "southampton", "stirling",
    "stoke-on-trent", "sunderland", "swansea", "wakefield", "winchester",
    "wolverhampton", "worcester", "york",
    // England towns
    "bournemouth", "bath", "bedford", "blackpool", "bolton", "bradford",
    "maidstone", "newbury", "reading", "slough", "maidenhead", "basingstoke",
    "guildford", "st albans", "royal tunbridge wells", "wokingham", "chichester",
    "darlington", "doncaster", "dudley", "gateshead", "grimsby", "halifax",
    "harrogate", "hastings", "huddersfield", "ipswich", "middlesbrough",
    "milton keynes", "northampton", "oldham", "poole", "rochdale", "rotherham",
    "scarborough", "shrewsbury", "southend-on-sea", "southport", "stevenage",
    "stockport", "stratford-upon-avon", "swindon", "telford", "torquay",
    "warrington", "watford", "wigan", "windsor", "worthing", "st austell",
    "canvey island", "hatfield", "guiseley", "oulton", "filching", "everleigh",
    "tutbury", "elmer", "ironbridge", "wembley", "portland", "kings lynn", "glastonbury",
    // Wales towns and smaller cities
    "aberdare", "bridgend", "caernarfon", "conwy", "merthyr tydfil", "wrexham",
    "llantrisant", "neath", "port talbot", "newport", "st davids", "llandudno",
    "barry", "cwmbran", "llanelli", "aberystwyth", "bangor", "haverfordwest", "rhyl",
    // Scotland towns
    "stornoway", "campbeltown", "dunoon", "cumbernauld", "linlithgow", "dalkeith",
    "cupar", "glenrothes", "elgin", "anstruther", "pitlochry", "dumfries", "largs",
    "east kilbride", "falkirk", "greenock", "hamilton", "irvine", "kilmarnock",
    "motherwell", "paisley", "perth", "st andrews", "airdrie", "dunfermline", "ayr",
    "coatbridge", "livingston", "rutherglen", "oban", "fort william", "peebles", "galashiels",
    // Northern Ireland towns
    "limavady", "coleraine", "dungannon", "omagh", "larne", "ballymena",
    "newtownabbey", "magherafelt", "ballymoney", "enniskillen", "carrickfergus",
    "newry", "newtownards", "bangor", "lisburn", "portadown", "derry",
    // Islands & Regions
    "channel islands", "guernsey", "inner hebrides", "isle of man", "isles of scilly",
    "jersey", "outer hebrides", "western isles", "skye", "anglesey", "barra",
    "lewis", "mull", "iona", "arran", "bute", "jura", "islay", "sark", "alderney", "herm",
    // Landmarks
    "thames", "loch ness", "ben nevis", "snowdon", "giant's causeway", "hadrian's wall",
    "stonehenge", "cheddar gorge", "dover white cliffs", "tower bridge", "tower of london",
    "buckingham palace", "windsor castle", "edinburgh castle", "holyrood palace", "balmoral castle",
];

/**
 * Provide UK places to help compromise extract both well-known landmarks
 * (e.g. "Stonehenge") and less commonly detected locations (e.g. "Hackney").
 */
export const lexicon: Record<string, string> = Object.fromEntries(
    ukPlaces.map((_) => [_, 'Place'])
);
