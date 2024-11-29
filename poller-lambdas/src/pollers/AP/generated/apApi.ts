/* eslint-disable */
/* tslint:disable */
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

/** The type of notification (currently email only) */
export type ChannelType = "email";

/** A list of email addresses */
export type ChannelDestinations = string[];

/** The condition to monitor for */
export type ConditionType = "idleFeed" | "quality";

/**
 * Enable/disable this check
 * @default "true"
 */
export type ConditionEnabled = boolean;

/** Object containing criteria specific to $ref/type */
export interface ConditionCriteria {
  /** ISO-8601 Duration limited to Minutes and/or Hours. Range PT2M - PT12H */
  idleTime?: string;
}

/** The status of an individual monitored condition */
export interface ConditionStatus {
  /** true if this particular condition is enabled for monitoring */
  enabled?: boolean;
  /** A description of the status: ok|disabled|pending|initialized|alarm|recovered */
  status?: string;
  /** Miscellaneous detail relating to status */
  status_detail?: string;
  /**
   * When latest alert was issued
   * @format date-time
   */
  last_alerted?: string;
}

export type MonitoredBaseresponse = Baseresponse & SessionMonitorResponse;

export type SessionMonitorResponse = {
  /** High level monitor status for monitored sessions */
  monitor?: {
    /** Name of assigned Monitor */
    name?: string;
    /** Optional session_label */
    label?: string;
    /** true if the overall session is elligible for monitoring */
    enabled?: boolean;
    /**
     * When an eligible session monitor was last checked
     * @format date-time
     */
    last_checked?: string;
    /** Call this link to enable monitoring for this session */
    enable_session_monitor?: string;
    /** Call this link to disable monitoring for this session */
    disable_session_monitor?: string;
    conditionStatus?: {
      /** The status of an individual monitored condition */
      idleFeed?: ConditionStatus;
      /** The status of an individual monitored condition */
      quality?: ConditionStatus;
    };
    /** count of feed requests made in this session */
    feed_count?: number;
  };
};

export interface Baseresponse {
  /** The version of the API that generated the response */
  api_version: string;
  /** The API environment mode that generated the response */
  api_mode?: string;
  /** The specific build version of the API */
  api_build?: string;
  /** The ID of this session or response */
  id: string;
  /** The method that generated the response */
  method: string;
  /** The organization associated with the request's API key */
  org_name?: string;
  /** Optional customer label supplied at session creation */
  session_label?: string;
  /** The parameters issued with the request */
  params: Record<string, any>;
}

export type Errorresponse = Baseresponse & {
  error?: {
    /** The HTTP status code of this response */
    status?: number;
    /** The AP error code of this response */
    code?: number;
    /** A human-readable description of the error */
    message?: string;
    /**
     * the time at which the error was recorded
     * @format date-time
     */
    timestamp?: string;
    /** In the event of a pricing change at download time, this property will contain a link to the item metadata with new pricing details and download links. */
    item?: string;
  };
};

export type Contentresponse = Baseresponse & {
  data?: Contentresult;
};

export type Searchresponse = Baseresponse & {
  data?: {
    /** the query of the request */
    query?: string;
    /**
     * the time at which the response was generated
     * @format date-time
     */
    updated?: string;
    /** the requested page size */
    page_size?: number;
    /** the total number of items matching this query */
    total_items?: number;
    /** the page index of this response */
    current_page?: number;
    /** the number of items in this response */
    current_item_count?: number;
    /** a link to the next page of results */
    next_page?: string;
    /** a link to the previous page of results */
    previous_page?: string;
    /** a paging template string */
    page_template?: string;
    /** a link to the feed endpoint for the current query */
    feed_href?: string;
    /** The current page of results that match the query */
    items?: Contentresult[];
  };
};

export interface Rssresponse {
  rss?: {
    version?: string;
    channel?: {
      title?: string;
      description?: string;
      link?: string;
    };
  };
}

export type Feedresponse = MonitoredBaseresponse & {
  data?: {
    /** the query of the request */
    query?: string;
    /**
     * the time at which the response was generated
     * @format date-time
     */
    updated?: string;
    /** the total number of search results */
    total_items?: number;
    /** the current page index */
    current_page?: number;
    /** the requested page size */
    page_size?: number;
    /** the number of items in this response */
    current_item_count?: number;
    /** a link to the next page of results */
    next_page?: string;
    /** a link to the previous page of results */
    previous_page?: string;
    /** a template to use with client-side paging */
    page_template?: string;
    items?: Contentresult[];
  };
};

export type Accountresponse = Baseresponse & {
  data?: {
    id?: string;
    title?: string;
    updated?: string;
    links?: {
      title?: string;
      url?: string;
      description?: string;
    }[];
  };
};

export type MonitorsResponse = Baseresponse & {
  data?: any;
};

export type SessionsResponse = Baseresponse & {
  data?: any;
};

export type Accountfollowedtopicsresponse = Baseresponse & {
  data?: {
    id?: string;
    title?: string;
    updated?: string;
    followedtopics?: {
      id?: number;
      name?: string;
    }[];
  };
};

export type Accountplansresponse = Baseresponse & {
  data?: {
    id?: string;
    title?: string;
    updated?: string;
    plans?: {
      id?: number;
      name?: string;
      /** @format date-time */
      updated?: string;
      plan_style?: "percent" | "downloads" | "duration";
      duration?: string;
      used?: number;
      usage_limit?: number;
      interval?: string;
      /** @format date */
      next_cycle_begins?: string;
      entitlements?: {
        id?: number;
        parent_id?: number;
        name?: string;
        tier?: string;
        type?: "Package" | "Product";
        meter_ticks?: number;
        /** @format float */
        base_cost?: number;
        overage_allowed?: boolean;
        /** @format float */
        overage_cost?: number;
        currency?: string;
        daypart?: {
          id?: number;
          type?: string;
        };
        search_link?: string;
        feed_link?: string;
      }[];
    }[];
  };
};

export type Accountdownloadsresponse = Baseresponse & {
  data?: {
    id?: string;
    title?: string;
    /** @format date-time */
    updated?: string;
    total_items?: number;
    current_item_count?: number;
    /** @format date-time */
    min_date?: string;
    /** @format date-time */
    max_date?: string;
    downloads?: {
      id?: string;
      item?: {
        id?: string;
        type?:
          | "Picture"
          | "Text"
          | "Audio"
          | "Video"
          | "Photo"
          | "Graphic"
          | "Graphics Bank"
          | "Complexdata"
          | "Composite"
          | "Print Graphics"
          | "Unknown";
        friendlykey?: string;
        title?: string;
        source?: string;
      };
      org_name?: string;
      downloaded_by?: string;
      /** @format date-time */
      download_date?: string;
      duplicate?: boolean;
      /** @format float */
      charge?: number;
      currency?: string;
    }[];
  };
};

export type Accountquotasresponse = Baseresponse & {
  data?: {
    id?: string;
    title?: string;
    account?: string;
    /** @format date-time */
    updated?: string;
    quotas?: {
      method?: "content" | "search" | "feed" | "account" | "plans" | "downloads" | "quotas" | "other";
      limit?: number;
      period?: string;
    }[];
  };
};

export interface Contentresult {
  meta?: {
    /** @format float */
    score?: number;
    /** Your entitlements that matched this piece of content */
    products?: {
      /** The ID of the matched entitlement */
      id?: number;
      /** The name of the matched entitlement */
      name?: string;
    }[];
    /** Your followed topics that matched this piece of content */
    followed_topics?: {
      /** The ID of the matched followed topic */
      id?: number;
      /** The name of the matched followed topic */
      name?: string;
    }[];
    pricing?: {
      amount?: number | null;
      currency?: string | null;
      formatted?: string | null;
      apusecode?: number;
      tier?: string;
      message: string;
      policy: {
        policytype: string;
        policyid: string;
        permissions?: {
          target: string;
          action: string;
          assigner: string;
          constraints: {
            operator: string;
            rightoperand: string;
            name: string;
          }[];
          duties: {
            action: string;
            constraints?: {
              operator: string;
              rightoperand: string;
              rightoperandunit: string;
              name: string;
              rightoperanddatatype: string;
            }[];
          }[];
        }[];
        prohibitions?: {
          target: string;
          action: string;
          assigner: string;
        }[];
      };
    };
  };
  item?: Contentitem;
}

export interface Contentitem {
  /** The identifier for this content item expressed as a URI. */
  uri?: string;
  /** Alternative IDs of a content item */
  altids?: {
    /** A unique content item ID. For items with multiple versions, remains the same for the initial version and each subsequent revision. For example, if a news story is written and rewritten several times as new information is uncovered, this ID value remains the same for each rewrite because it points to the chain of revised stories, and not an individual version. */
    itemid: string;
    /**  A short digest (also known as checksum or hash) of the item's metadata. Useful for deduplication and conditional requests. */
    etag?: string;
    /** A human-readable ID of a content item. For video, this is the AP Archive story number. */
    friendlykey?: string;
    videoid?: string;
    /** Transmission Reference Number; the alphanumeric identifier (or file name) associated with a story or photo. */
    transref?: string;
    graphicsbankid?: string;
    "referenceid "?: string;
  };
  foreignkeys?: any[];
  /**
   * The content item version number: 0 for the initial version, 1 for the first version, 2 for the second version and so on. The higher the number, the more recent the content item's version.
   *  - For text stories, this is the version of the story revision.
   *  - For other media types (for example, photos, graphics and video), this is the version of the item metadata; for example, a photo caption. Typically, significant changes to the binary asset (such as a photo) are published as a new content item.
   */
  version?: number;
  /** The generic news type of this content item: text, picture, graphic, audio or video. */
  type?: "text" | "picture" | "graphic" | "audio" | "video";
  /** The type of information contained in the news item (also known as 'ItemContentType'); for example, Spot Development, Advisory and Weather Forecast. Currently, content types are applied to text and audio news items. For a complete list of values, see [Profile (ItemContentType)](https://api.ap.org/media/v/docs/api/#t=AP_Classification_Metadata.htm%23Profile__ItemContentType_). */
  profile?: string;
  /** The editorial urgency of the content from 1 to 8. 1 represents the highest urgency, 8 the lowest. */
  urgency?: number;
  editorialpriority?: string;
  /**
   * The two-letter code of the language that the news item is written in; for example, en or es.
   * @minLength 2
   * @maxLength 2
   */
  language?: string;
  /**
   * The date and time when this version of the content item was published.
   * @format date-time
   */
  versioncreated?: string;
  /**
   * The date and time when the first version of the item was created.
   *  - For photos and video, this is the date and time when the content for the item was created. For example, a photo taken at a Sunday night game and published on Monday morning would carry the firstcreated value from Sunday, and the versioncreated value for the photo entry would be from Monday.
   *  - For GraphicsBank items, this is the date of the news event that the graphic illustrates.
   * @format date-time
   */
  firstcreated?: string;
  /**
   * The date and time before which all versions of the content item are embargoed (if absent, this item is not embargoed).
   * @format date-time
   */
  embargoed?: string;
  editorialrole?: string;
  /** Named sets of regularly occurring content or features with a predictable focus; for example, "Financial Impact," "Film Reviews," "10 Things to Know," "Sports Briefs." For more information, see a complete list of [AP Fixtures](https://api.ap.org/media/v/docs/api/APFixtures.xls). */
  fixture?: {
    /** The name of the fixture; for example, "Film Reviews". */
    name?: string;
    /** The code for the fixture in AP systems. */
    code?: string;
  };
  /**
   * The publishing status of the content item, which contains information regarding the item's ability to be distributed to news consumers. This value is usable by default.
   *  - usable: This content item may be distributed to news consumers in publishing forms that do not violate your agreement with the AP and copyright information contained in the content item and its metadata.
   *  - embargoed (the same as Hold-For-Release): Do not distribute an embargoed content item to news consumers until the release date-time found in embargoed has occurred.
   *  - withheld: Do not distribute this content item to news consumers because it contains questionable information. Any distributed form of the content item must be recalled.
   *  - canceled (the same as Kill): Do not distribute this content item to news consumers because it contains erroneous information. Any distributed form of the content item must be recalled.
   *
   * **Important**
   * Do not use the pubstatus property alone to determine a content item's publishing status. Check the values of ednote, embargoed and editorialtypes to determine whether the content may be published.
   */
  pubstatus?: "usable" | "embargoed" | "withheld" | "canceled";
  /** Editorial instructions for processing the item. Do not distribute this information to news consumers. */
  ednote?: string;
  /**
   * The editorial condition of the content item revision:
   *  - For text: Add, Advisory, Clarification, Corrective, Disregard, HoldForRelease, Kill, Lead, Writethru, Takes or Withhold.
   *  - For photos: Correction, Elimination, Kill or Withhold.
   *  - For video: Kill
   */
  editorialtypes?: (
    | "Add"
    | "Advisory"
    | "Clarification"
    | "Corrective"
    | "Disregard"
    | "HoldForRelease"
    | "Kill"
    | "Lead"
    | "Writethru"
    | "Takes"
    | "Withhold"
    | "Correction"
    | "Elimination"
  )[];
  /** Machine-readable instructions for processing the content item. [Learn more](https://api.ap.org/media/v/docs/api/index.html#t=Content_Metadata_Fields.htm%23MiniTOCBookMark19) */
  signals?: (
    | "APWhollyOwned"
    | "explicitcontent"
    | "Test"
    | "Derived"
    | "DerivedLatest"
    | "isnotdigitized"
    | "NewsroomReady"
    | "newscontent"
    | "ConsumerReady"
    | "singlesource"
    | "whitelisted"
  )[];
  /** A short publishable value containing the title of the current version of the content item. */
  title?: string;
  /** A brief synopsis of the current version of the content item. For photos, this field may contain the names of the people featured in the photo. */
  headline?: string;
  headline_extended?: string;
  headline_seo?: string;
  /** A non-publishable sequence of tokens associated with the content that is used as a short human-readable identifier for the content item and version. */
  slugline?: string;
  /** The story summary. */
  description_summary?: string;
  /** The party who created or contributed to the content (if available and not captured in the photographer, captionwriter, producer or editor properties); for example, a writer (for text stories), an editor (for photos) or a speaker (for audio). To learn more, see [About Bylines](https://api.ap.org/media/v/docs/api/index.html#t=About_Bylines.htm). */
  bylines?: {
    /** A code identifying the creator or contributor. */
    code?: string;
    /** Additional information about the creator's or contributor's role. */
    parametric?: string;
    /** The name(s) of the content creator(s) and/or contributors. */
    by: string;
    /** The title of the party referenced in the byline. */
    title?: string;
  }[];
  /** A party that created or enhanced the content of this item. */
  producer?: {
    /** The name of the content producer. */
    name: string;
  };
  photographer?: {
    code?: string;
    name: string;
    title?: string;
  };
  /** The location where the news event or subject described or depicted by the content occurred. */
  located?: string;
  /** Contains detailed, uniform and machine-usable metadata about the location where the news event or subject described or depicted by the content occurred. */
  datelinelocation?: {
    /** The location's city. */
    city?: string;
    /** An abbreviated form of the location's country. */
    countrycode?: string;
    /** The full name of the location's country. */
    countryname?: string;
    /** The location's country area. A country area is a large-scale division within a country; for example, a U.S. state or Canadian province. */
    countryareacode?: string;
    /** The full name of the location's country area. A country area is a large-scale division within a country; for example, a U.S. state or Canadian province. */
    countryareaname?: string;
    /** A [GeoJson](http://geojson.org/) object holding geo data of this place. */
    geometry_geojson?: {
      /** Geometry type: Point. */
      type: "Point";
      /** Longitude and latitude of the location. */
      coordinates: number[];
    };
  };
  /** Any necessary copyright notice for claiming the intellectual property for the content. */
  copyrightnotice?: string;
  /** Rights information and usage limitations associated with the publication, including any special restrictions. In addition to the special restrictions in usageterms, make sure to check for any additional use information and editorial notes in ednote and in the video script and/or shotlist. */
  usageterms?: string[];
  /** A displayable set of keywords relevant to a publication that can be used to expedite content searching in your own system. */
  keywords?: string[];
  /** The last spoken words heard on the audio, used to help editors and news anchors construct program scripts and resume speaking after the broadcast of an audio file. */
  outcue?: string;
  /** The name of the provider. */
  provider?: string;
  /** A party (person or organization) that originated, modified, enhanced, distributed, aggregated or supplied the content or provided some information used to create or enhance the content. This information may be different from the copyright and provider. */
  infosource?: {
    /** The name of the infosource. */
    name: string;
    /** The source party's type in AP systems. */
    type?: string;
  }[];
  /** Contains external links; such as canonical links to full stories in AP News Archive. You can use canonical links to redirect web users to AP News Archive after your right to host AP content on websites expires at 30 days. */
  links?: {
    /** The URL for accessing the external content. */
    href: string;
    /** The type of link to external content; for example, *canonical*. */
    rel: string;
  }[];
  /** Individual human beings with a relationship to the content, such as named people mentioned in the content. */
  person?: {
    /** The code for the person in the AP controlled vocabulary (http://cv.ap.org/id/). */
    code?: string;
    /** The name of a person. */
    name: string;
    /** Indicates the origin of the person tag: Editorial (assigned by an AP editor) or Machine (assigned by the AP Classification system). */
    creator: string;
    /**
     * The relationship(s) of the content of the news item to the person:
     *  - direct. Indicates that the term was applied directly by the AP Classification system (always true for persons).
     *  - PERSON_FEATURED. Indicates that this person is featured in the photo.
     */
    rels: ("direct" | "personfeatured")[];
    associatedstates?: {
      code: string;
      name: string;
    }[];
    /**
     * (Only for athletes and coaches participating in Olympic games or FIFA World Cup)
     *  Represents a relationship between a person and a current event, typically, the person's participation in or some significant contribution to the event; for example, a player's participation in 2018 FIFA World Cup. For more information, see [Associated Event Name and Code Examples](https://api.ap.org/media/v/docs/api/#t=AP_Classification_Metadata.htm%23Associated_Event_Name_and_Code_Examples).
     */
    associatedevents?: {
      /** The code for the event in the AP controlled vocabulary. */
      code: string;
      /** The event name. */
      name: string;
    }[];
    /** (For team athletes and coaches only) The team values and codes are available as part of the list of [AP Organization terms](https://developer.ap.org/ap-taxonomy/Organization/). */
    teams?: {
      /** The team code in the AP Organization vocabulary. */
      code: string;
      /** The team name. */
      name: string;
    }[];
    /** The identifier of the AP controlled vocabulary. */
    scheme?: string;
    /** The main category that applies to a named individual; for example, POLITICIAN, ROYALTY, PROFESSIONAL_ATHLETE. */
    types?: string[];
  }[];
  /** Concepts with a relationship to the content, such as topics, categories or subjects that describe the content. For a complete list of values, see [AP Subject](https://developer.ap.org/ap-taxonomy/Subject/) terms, [AP Category Codes](https://api.ap.org/media/v/docs/api/#t=AP_Classification_Metadata.htm%23AP_Category_Code) and [AP Supplemental Categories](https://api.ap.org/media/v/docs/api/#t=AP_Classification_Metadata.htm%23AP_Supplemental_Category). */
  subject?: {
    /** The code for the standardized subject term in the AP controlled vocabulary (http://cv.ap.org/id/), the AP category or the AP supplemental category. */
    code: string;
    /** The name of the AP subject, AP category or AP supplemental category. */
    name: string;
    /** The IDs of broader terms, if available. */
    parentids?: string[];
    /**
     * The relationship of the content of the news item to the subject.
     *  - direct. Indicates the AP Subject terms applied directly by the AP Classification system.
     *  - ancestor. Indicates the AP Subject terms inferred from hierarchy. For instance, 'Events' is a broader subject for 'September 11 attacks.'
     *  - inferred. Indicates the AP Subject terms inferred from relationships other than hierarchy, such as additional subject occurrences that are added based on entity or subject matches. For example, a match on 'September 11 attacks' ensures the application of the subject terms 'Terrorism' and 'War and unrest.'
     *  - category. Indicates AP category codes, which are applied to text, photos, graphics and video by AP editors.
     *  - suppcategory. Indicates AP supplemental category codes, which are applied to photos and graphics by AP editors.
     */
    rels?: ("direct" | "ancestor" | "inferred" | "category" | "suppcategory")[];
    /** Indicates the origin of the subject/category tag: Editorial (assigned by an AP editor) or Machine (assigned by the AP Classification system). */
    creator: string;
    topparent?: boolean;
    /** The identifier of the AP controlled vocabulary. */
    scheme?: string;
  }[];
  /** Organizations with a relationship to the content - administrative and functional structures that may act as a business, as a political party or not-for-profit party. Includes terms from [AP Company](https://api.ap.org/media/v/docs/api/#t=AP_Classification_Metadata.htm%23AP_Company) (public companies with shares traded on major global and U.S. stock exchanges) and [AP Organization](https://api.ap.org/media/v/docs/api/#t=AP_Classification_Metadata.htm%23AP_Organization) (organizations such as government and non-profit organizations, sports teams, colleges, political groups, cultural and media organizations). For more information, see a complete list of [AP Organization terms](https://developer.ap.org/ap-taxonomy/Organization/). */
  organisation?: {
    /** The industries related to the company. */
    industries?: {
      /** The industry name. */
      code: string;
      /** The code for the industry in the AP Subject vocabulary. */
      name: string;
    }[];
    /** The code for the organization in the AP controlled vocabulary (http://cv.ap.org/id/). */
    code: string;
    /** The name of the organization/company. */
    name: string;
    /** The IDs of broader terms, if available. */
    parentids?: string[];
    /**
     * The relationship of the content of the news item to the organization.
     *  - direct. Indicates the terms applied directly by the AP Classification system. The relationship is always direct for public companies ([AP Company terms](http://api.ap.org/media/v/docs/api/Classification-Metadata/#ap-company)).
     *  - ancestor. Indicates the terms inferred from hierarchy. For instance, 'Organizations' is a broader term for 'Museum of Modern Art.'
     *  - inferred. Indicates the terms inferred from relationships other than hierarchy, such as additional organization or subject occurrences that are added based on entity or subject matches. For example, a match on a sports team organization term "Los Angeles Dodgers" ensures the application of the league organization term "Major League Baseball" even if the "Major League Baseball" tag application rule does not match the article. In another example, a national government "Canada government" (organization term) ensures a match on its related concept "Government and politics" (subject term) even if the "Government and politics" rule does not match the article.
     */
    rels?: string[];
    /** Indicates the origin of the organization tag: Editorial (assigned by an AP editor) or Machine (assigned by the AP Classification system). */
    creator: string;
    /** Symbols used for a financial instrument linked to the company at a specific marketplace. */
    symbols?: {
      /** Combination of the company's ticker symbol and the stock exchange that it trades on, separated by a colon. */
      instrument: string;
      /** Ticker symbol used for the financial instrument. */
      ticker: string;
      /** Identifier for the marketplace which uses the ticker symbols of the ticker property. For a list of stock exchanges, see [Stock Exchange Codes](http://api.ap.org/media/v/docs/api/Classification-Metadata/#stock-exchange-codes). */
      exchange: string;
    }[];
    /** The value of true indicates that this term is the top term in the AP Organization vocabulary hierarchy. */
    topparent?: boolean;
    /** The identifier of the AP controlled vocabulary. */
    scheme: string;
  }[];
  /** Named locations mentioned in the content, such as continents, world regions, countries, territories, U.S. states, Canadian provinces and major cities. For more information, see a complete list of [AP Geography terms](https://developer.ap.org/ap-taxonomy/Geography/). */
  place?: {
    /** The code for the place the AP controlled vocabulary (http://cv.ap.org/id/). */
    code: string;
    /** The name of the place. */
    name: string;
    /** The IDs of broader terms, if available. */
    parentids?: string[];
    /**
     * The relationship of the content of the news item to the place.
     *  - direct. Indicates the terms applied directly by the AP Classification system.
     *  - ancestor. Indicates the terms inferred from hierarchy. For instance, 'North America' is a broader term for 'United States.'
     */
    rels: ("direct" | "ancestor")[];
    /** The generic type of a geographic entity; for example, City, Province, Continent. For a list of values, see [Location Type](http://api.ap.org/media/v/docs/api/Classification-Metadata/#location-type). */
    locationtype?: {
      /** The code for the location type in the AP vocabulary. */
      code: string;
      /** The location type name. */
      name: string;
    };
    /** Indicates the origin of the organization tag: Editorial (assigned by an AP editor) or Machine (assigned by the AP Classification system). */
    creator: "Editorial" | "Machine";
    /** The value of true indicates that this term is the top term in the AP Geography vocabulary hierarchy. */
    topparent?: boolean;
    /** The identifier of the AP controlled vocabulary. */
    scheme: string;
    /** A [GeoJson](http://geojson.org/) object holding geo data of this place. */
    geometry_geojson?: {
      /** Geometry type: Point. */
      type: "Point";
      /** Centroid coordinates - the WGS84 longitude and latitude of the location in decimal degrees. */
      coordinates: number[];
    };
  }[];
  /** Something that happens in a planned or unplanned manner; for example, sports events or developing news events (such as [The Latest](https://api.ap.org/media/v/docs/api/#t=The_Latest.htm)). */
  event?: Record<string, any>[];
  audiences?: {
    /** The code for the audience in the AP vocabulary. */
    code: string;
    /** The audience type. */
    type: string;
    /** The audience name. */
    name: string;
  }[];
  /** A freeform textual description of the content item. */
  description_caption?: string;
  /** The party or parties that are credited with providing the content (a natural-language statement of credit information). */
  description_creditline?: string;
  /** A section of text that is separate from the main story body, but is publishable. */
  description_editornotes?: string;
  /** Legacy typeset format. */
  textformat?: string;
  /** Content of news items that are associated with this content item; for example, photos and/or videos associated with a news story or AP news stories that are part of [AP Top Headlines](https://api.ap.org/media/v/docs/api/#t=AP_Top_Headlines.htm). Each associated news item in the list of all news items associated with this content item is assigned a sequence number ("1", "2", "3" and so on). For example, if two photos and two videos are associated with a news story (in that particular order), the "associationrank" will be "1" for the first photo, "2" for the second photo, "3" for the first video and "4" for the second video. */
  associations?: Record<
    string,
    {
      /** A brief synopsis of the associated news item. */
      headline?: string;
      altids?: {
        /** The item ID of the associated news item. */
        itemid: string;
        /**  A short digest (also known as checksum or hash) of the associated item's metadata. Useful for deduplication and conditional requests. */
        etag: string;
      };
      /** The media type of the associated news item: text, picture, graphic, audio or video. */
      type?: "text" | "picture" | "graphic" | "audio" | "video";
      /** The URL for the associated news item. */
      uri: string;
    }
  >;
  /** Wrapper for different [renditions](https://api.ap.org/media/v/docs/api/#t=Content_File_Formats_and_Renditions.htm%23Content_Item_Formats_and_Renditions) of the content item. */
  renditions?: Record<
    string,
    {
      /** (For images only) The image orientation, which indicates whether the human interpretation of the top of the image is aligned to its short side (vertical) or long side (horizontal). */
      orientation?: "Horizontal" | "Vertical";
      /** Description of recording scene; used only for images. */
      scene?: string;
      /** For still and moving images: the height of the display area measured in pixels. */
      height?: number;
      /** The URL for accessing the rendition as a resource. */
      href?: string;
      /** The total time duration of the content (in milliseconds for video; in seconds for audio). */
      duration?: number;
      /** The number of audio samples per second in the audio or video content, expressed as audio sampling frequency in hertz (Hz). */
      samplerate?: string;
      /** A short digest (also known as checksum or hash) of the rendition data. */
      digest?: string;
      /** The size of the rendition resource in bytes. */
      sizeinbytes?: number;
      /** The title of the content item rendition that can be used for posting on a website. */
      title?: string;
      /** The average amount of data that is transferred per second in the audio or video content. */
      averagebitrate?: string;
      /** For still and moving images: the width of the display area measured in pixels. */
      width?: number;
      /** The content item rendition; for example, Main, Preview, Thumbnail and Caption for images; and Main, Preview, Thumbnail, Caption, Script and/or Shotlist for video. */
      rel?: "Main" | "Preview" | "Thumbnail" | "Caption" | "Script" | "Shotlist";
      /**
       * Video scaling, which describes how the aspect ratio of a video has been changed from the original in order to accommodate a different display dimension:
       *  - pillarboxed. Bars to the left and right.
       *  - letterboxed. Bars to the top and bottom.
       *  - mixed. Two or more different aspect ratios are used in the video over the timeline.
       *  - original. No scaling has been applied.
       */
      videoscaling?: "pillarboxed" | "letterboxed" | "mixed" | "original";
      /**
       * A code used to identify the content item rendition.
       *
       * **Tip**
       * The contentid values of the text renditions (for example, the NITF renditions of a video caption and a script) are not guaranteed to be unique. If you are using contentid values to name downloaded files, use rel and/or fileextension in addition to contentid to differentiate between the text renditions. For example, to save video captions and scripts with unique names, you can use the {itemid}-{version}-{contentid}-{rel}.{ext} file naming format.
       */
      contentid?: string;
      /** The media type of the rendition: text, picture, graphic, audio or video. */
      type?: "text" | "picture" | "graphic" | "audio" | "video";
      /** The video encoding system used to create the content. */
      videocodec?: string;
      /** A format that applies to the rendition. */
      format?: string;
      /** The word count of the rendition. */
      words?: number;
      /** The file extension of the content item. */
      fileextension?: string;
      /** Disregard - for internal Agent use. */
      mediafilterid?: string;
      /** Aspect ratio of the video file, which is the ratio of the width of video to its height, such as 16:9 and 4:3. */
      aspectratio?: "16:9" | "4:3";
      /** The name of the original media file. */
      originalfilename?: string;
      /** A MIME type that applies to the rendition. */
      mimetype?: string;
      /** The number of video frames per second, which is the rate at which the material should be shown in order to achieve the intended visual effect. */
      framerate?: number;
      /** The color space of video (if available). */
      colourspace?: "Color" | "Black and White" | "RGB" | "Greyscale";
      backgroundcolour?: string;
      /**
       * The recording or image resolution of the content (if available):
       *  - For images: the recommended printing resolution in dots per inch.
       *  - For video: the number of distinct pixels in each dimension.
       *  - For audio: the recording resolution in bits per sample.
       */
      resolution?: number;
      /** (For ANPA stories only) The same story in the ANPA format may be filed multiple times; for example, with a different category code. When versions=all is specified in the request, the response includes links to all filings of ANPA-formatted stories in renditions.anpa.version_links. If versions=latest is specified in the request or if this parameter is not specified, only the latest filing of the ANPA story is returned in renditions.anpa.href. */
      version_links?: string[];
    }
  >;
}

/** @example {"monitor":{"name":"sample_monitor","description":"Simple example monitor for creation via API.","playbook":"Check the health of your feed script.","repeatAlerts":"PT2H","notify":[{"channelType":"email","channelDestinations":["set-with-real-address- @@ example.com"]}],"conditions":[{"type":"idleFeed","enabled":true,"criteria":{"idleTime":"PT15M"}}]}} */
export interface Monitor {
  monitor: {
    /**
     * Name of the monitor
     * @minLength 1
     * @maxLength 20
     * @pattern ^[a-zA-Z0-9_.-]*$
     */
    name?: string;
    /** Brief description of monitors purpose. */
    description?: string;
    /** Helpful instructions/guidance to include in verbose Notifications */
    playbook?: string;
    /** ISO-8601 Duration format limited to Hours and Minutes, range 10 minutes to 24 hours. 0 is valid to disable reminders. ^(0|PT[0-9]*[MH])$ */
    repeatAlerts?: string;
    /**
     * One or more objects describing the type of transport (email) and the destinations (email addresses)
     * @maxItems 5
     * @minItems 1
     */
    notify?: {
      /** The type of notification (currently email only) */
      channelType?: ChannelType;
      /** A list of email addresses */
      channelDestinations?: ChannelDestinations;
    }[];
    /**
     * One or more objects describing specific conditions to monitor for
     * @maxItems 5
     * @minItems 1
     */
    conditions?: {
      /** The condition to monitor for */
      type?: ConditionType;
      /** Enable/disable this check */
      enabled?: ConditionEnabled;
      /** Object containing criteria specific to $ref/type */
      criteria?: ConditionCriteria;
    }[];
  };
}

export interface ContentDetailParams {
  /** Comma separated list of fields to include from the response */
  include?: string[];
  /** Comma separated list of fields to exclude from the response */
  exclude?: string[];
  /** Whether to include pricing information with the results */
  pricing?: boolean;
  /** Specifying in_my_plan=true in the request returns only those associations of the content item that do not incur any additional cost to download. */
  in_my_plan?: boolean;
  /** The desired response format */
  format?: string;
  /** The itemid of the desired piece of content */
  itemId: string;
}

export type ContentDetailData = Contentresponse;

export type ContentDetailError = Errorresponse;

export interface SearchListParams {
  /** Your query */
  q?: string;
  /** Comma separated list of fields to include from the response */
  include?: string[];
  /** Comma separated list of fields to exclude from the response */
  exclude?: string[];
  /**
   * Your desired sorting criteria
   * @default "_score:desc"
   */
  sort?: string;
  /** The desired page number. Page numbers begin at 1 */
  page?: string;
  /** Number of items to return per page */
  page_size?: number;
  /** Whether to include pricing information with the results */
  pricing?: boolean;
  /** Specifying in_my_plan=true in the request returns only those items that do not incur additional cost to download. Additionally, items returned include only those associations that do not incur any additional cost to download. */
  in_my_plan?: boolean;
  /**
   * Attach an informational label to this session
   * @minLength 1
   * @maxLength 48
   * @pattern ^[a-zA-Z0-9_. -]*$
   */
  session_label?: string;
}

export type SearchListData = Searchresponse;

export type SearchListError = Errorresponse;

export interface FeedListParams {
  /** Your query */
  q?: string;
  /** Comma separated list of fields to include from the response */
  include?: string[];
  /** Comma separated list of fields to exclude from the response */
  exclude?: string[];
  /** Number of items to return per page */
  page_size?: number;
  /** Whether to include pricing information with the results */
  pricing?: boolean;
  /** Specifying in_my_plan=true in the request returns only those items that do not incur additional cost to download. Additionally, items returned include only those associations that do not incur any additional cost to download. */
  in_my_plan?: boolean;
  /**
   * Apply the named Monitor to subsequent calls for this session
   * @minLength 4
   * @maxLength 24
   * @pattern ^[a-zA-Z0-9_.-]*$
   */
  with_monitor?: string;
  /**
   * Attach an informational label to this session
   * @minLength 1
   * @maxLength 48
   * @pattern ^[a-zA-Z0-9_. -]*$
   */
  session_label?: string;
}

export type FeedListData = Feedresponse;

export type FeedListError = Errorresponse;

export type GetContentData = Rssresponse;

export type GetContentError = Errorresponse;

export interface GetContent2Params {
  /** Comma separated list of fields to include from the response */
  include?: string[];
  /** Comma separated list of fields to exclude from the response */
  exclude?: string[];
  /** Number of items to return per page */
  page_size?: number;
  /** The product ID for the desired RSS feed (see /content/rss)  */
  rssId: number;
}

export type GetContent2Data = any;

export type GetContent2Error = Errorresponse;

export interface OndemandListParams {
  /**
   * A user defined identifier for the consumer of this feed.
   * Each unique consumer ID will receive every item in your organization's OnDemand queue once.
   * If not specified, the API key of the request will be used.
   */
  consumer_id?: string;
  /** The ID of the desired queue. */
  queue?: string;
  /** Comma separated list of fields to include from the response */
  include?: string[];
  /** Comma separated list of fields to exclude from the response */
  exclude?: string[];
  /** Number of items to return per page */
  page_size?: number;
  /** Whether to include pricing information with the results */
  pricing?: boolean;
}

export type OndemandListData = Feedresponse;

export type OndemandListError = Errorresponse;

export type AccountListData = Accountresponse;

export type AccountListError = Errorresponse;

export interface FollowedtopicsListParams {
  /** 'json' is the default. Use 'csv' for simplified CSV output/download. */
  format?: "json" | "csv";
  /** Comma separated list of fields to include from the response. */
  include?: string[];
}

export type FollowedtopicsListData = Accountfollowedtopicsresponse;

export type FollowedtopicsListError = Errorresponse;

export interface PlansListParams {
  /** Comma separated list of fields to include from the response. */
  include?: string[];
  /** Comma separated list of fields to exclude from the response. */
  exclude?: string[];
  /** 'json' is the default. Use 'csv' for simplified CSV output/download. */
  format?: "json" | "csv";
}

export type PlansListData = Accountplansresponse;

export type PlansListError = Errorresponse;

export interface DownloadsListParams {
  /** Comma separated list of fields to include from the response */
  include?: string[];
  /** Comma separated list of fields to exclude from the response */
  exclude?: string[];
  /**
   * The date and time after which the content items were downloaded, in the format
   * YYYY-MM-DD(THH:mm:ss) or YYYY-MM.
   * The default is 30 days prior to the time of the request.
   * Simple ISO-8601 Duration notation can also be used to define the date relative to today.
   */
  min_date?: string;
  /**
   * The date and time before which the content items were downloaded, in the
   * format YYYY-MM-DD(THH:mm:ss) or YYYY-MM.
   * The default is the time of the request.
   */
  max_date?: string;
  /** The ID of the desired order to return. The correct date-range must be provided. */
  order?: number;
  /** 'json' is the default. Use 'csv' for simplified CSV output/download */
  format?: "json" | "csv";
}

export type DownloadsListData = Accountdownloadsresponse;

export type DownloadsListError = Errorresponse;

export type QuotasListData = Accountquotasresponse;

export type QuotasListError = Errorresponse;

export type MonitorsCreateCreateError = Errorresponse;

export type MonitorsUpdateCreateError = Errorresponse;

export type MonitorsDeleteDeleteError = Errorresponse;

export type MonitorsListError = Errorresponse;

export type MonitorsDetailError = Errorresponse;

export interface MonitorsAlertsListParams {
  /** Return full details of Monitors and latest Alert */
  show_detail?: boolean;
  /** Constrain operation to one Agent */
  agentid?: string;
}

export type MonitorsAlertsListError = Errorresponse;

export interface MonitorsSessionsListParams {
  /** Return full details of Monitors and latest Alert */
  show_detail?: boolean;
  /** Constrain operation to one Agent */
  agentid?: string;
}

export type MonitorsSessionsListError = Errorresponse;

export interface MonitorsSessionsDetailParams {
  /** Return full details of Monitors and latest Alert */
  show_detail?: boolean;
  /** The unique ID for a Session */
  sessionId: string;
}

export type MonitorsSessionsDetailError = Errorresponse;

export interface MonitorsSessionsDisableDetailParams {
  /** Constrain operation to one Agent */
  agentid?: string;
  /** The unique ID for a Session */
  sessionId: string;
}

export type MonitorsSessionsDisableDetailError = Errorresponse;

export interface MonitorsSessionsEnableDetailParams {
  /** Constrain operation to one Agent */
  agentid?: string;
  /** The unique ID for a Session */
  sessionId: string;
}

export type MonitorsSessionsEnableDetailError = Errorresponse;
