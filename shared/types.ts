type FingerpostFeedPayload = {
	uri?: string;
	'source-feed'?: string;
	usn?: string;
	version?: string;
	type?: string; // this is 'text' in every entry we have in the CODE db on 1st Nov 2024 (175553 entries at time of checking)
	format?: string; // "GOA-WIRES-NINJS" in all records
	mimeType?: string; // application/ninjs+json
	firstVersion?: string;
	versionCreated?: string;
	dateTimeSent?: string; // more than 1/2 of the time identical to versionCreated
	originalUrn?: string; // almost all entries have a string here, but not very unique (181803 values, only 53988 unique values)
	slug?: string; // fp set this
	headline?: string;
	subhead?: string;
	byline?: string;
	priority?: string; // 1-5 in all records
	subjects?: {
		code?: string;
	};
	mediaCatCodes?: string;
	keywords?: string | string[];
	organisation?: {
		symbols?: string;
	}; // {"symbols": ""} {"symbols": [""]} in all records
	tabVtxt?: string; // always 'X' or null
	status?: string; //  always one of: "" "usable" "canceled" "embargoed" "withheld"
	usage?: string;
	ednote?: string;
	abstract?: string; // only present in REUTERS and AAP items
	language?: string;
	location?: string; // just plain string
	body_text?: string;
	copyrightHolder?: string;
	copyrightNotice?: string;
};

export type IngestorInputBody = FingerpostFeedPayload & {
	originalContentText?: string;
};

/**
 * Data structure produced by the ingestion lambda and saved to the database as JSONB in the `content` column.
 */
export type WireEntryContent = Omit<IngestorInputBody, 'keywords'> & {
	keywords: string[];
};
