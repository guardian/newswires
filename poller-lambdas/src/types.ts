export type SecretValue = string; //TODO refine type

export type PollerInput = string | undefined;

export interface CorePollerOutput {
	payloadForIngestionLambda: IngestorPayload[];
}
export type LongPollOutput = CorePollerOutput & {
	valueForNextPoll: PollerInput;
};

export type FixedFrequencyPollOutput = CorePollerOutput & {
	idealFrequencyInSeconds: number;
};

export type LongPollFunction = (
	secret: SecretValue,
	input: PollerInput,
) => Promise<LongPollOutput>;

export type FixedFrequencyPollFunction = (
	secret: SecretValue,
) => Promise<FixedFrequencyPollOutput>;

export type PollFunction = LongPollFunction | FixedFrequencyPollFunction;

export type IngestorPayload = {
	item: { externalId: string; body?: IngestorItem };
};

type IngestorItem = FingerpostFeedPayload & { originalContentText?: string };

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
	keywords?: string;
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
