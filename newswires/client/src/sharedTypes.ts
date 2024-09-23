export type WireData = {
	id: number;
	externalId: string;
	ingestedAt: string;
	content: Partial<{
		uri: string;
		usn: string;
		version: string;
		firstVersion: string; // date
		versionCreated: string; // date
		dateTimeSent: string; //date
		headline: string;
		subhead: string;
		byline: string;
		keywords: string;
		usage: string;
		location: string;
		body_text: string;
	}>;
};
