import {lexicon, ukPlaces} from "./ukPlaces";

interface CategoryCode {
	prefix: string;
	code: string;
}

/**
 * Many subject/category codes are received from Fingerpost in the format `prefix:code1+code2+code3:code4+code5`.
 * We want to turn these into individual category codes: `prefix:code1`, `prefix:code2`, etc.
 */
function unpackCategoryCodes(
	categoryCodes: string,
	defaultPrefix: string,
): CategoryCode[] {
	const [maybePrefix, ...codes] = categoryCodes.split(':');
	const flattenedCodes = codes
		.flatMap((_) => _.split('+'))
		.map((_) => _.trim())
		.filter((_) => _.length > 0);

	const prefix = maybePrefix?.trim() ?? defaultPrefix;

	if (flattenedCodes.length === 0) {
		return [];
	}

	return flattenedCodes.map((code) => ({ prefix: prefix.trim(), code }));
}

function categoryCodeToString({ prefix, code }: CategoryCode): string {
	return `${prefix}:${code}`;
}

function replacePrefixesFromLookup(
	{ prefix, code }: CategoryCode,
	lookup: Record<string, string>,
): CategoryCode {
	const newPrefix = lookup[prefix] ?? prefix;
	return { prefix: newPrefix, code };
}

export function processReutersCategoryCodes(original: string[]): string[] {
	const supportedDestinations: string[] = ['RWS', 'RNA', 'RWSA', 'REULB', 'RBN'];

	return original
		.filter((_) => supportedDestinations.includes(_))
		.map((_) => `REUTERS:${_}`);
}

export function processFingerpostAPCategoryCodes(original: string[]): string[] {
	const notServiceCodes = original.filter((_) => !_.includes('service:')); // we aren't interested in keeping the service codes here
	const transformedCategoryCodes = notServiceCodes
		.flatMap((_) => unpackCategoryCodes(_, 'apCat'))
		.map((_) => replacePrefixesFromLookup(_, { iptccat: 'apCat' })) // AP codes are arriving mislabelled as IPTC codes
		.map(categoryCodeToString);

	const deduped = [...new Set(transformedCategoryCodes)];
	return deduped;
}

export function processFingerpostAAPCategoryCodes(
	categoryCodes: string[],
): string[] {
	const allCategoryCodes = categoryCodes.flatMap((categoryCode) =>
		categoryCode.split('|'),
	);

	const mediaTopics = allCategoryCodes.filter((_) => _.split(':').length > 1);

	const legacySubjectCodes = allCategoryCodes
		.filter((_) => _.split('+').length > 1)
		.map((categoryCode) => {
			const [code, _label] = categoryCode.split('+');
			return `subj:${code}`;
		});

	return [...mediaTopics, ...legacySubjectCodes];
}

// example input: "iptccat:HUM+SCI"
export function processFingerpostAFPCategoryCodes(
	original: string[],
): string[] {
	const notServiceCodes = original.filter((_) => !_.includes('service:'));

	const transformedCategoryCodes = notServiceCodes
		.flatMap((_) => unpackCategoryCodes(_, 'afpCat'))
		.map((_) => replacePrefixesFromLookup(_, { iptccat: 'afpCat' }))
		.map(categoryCodeToString);

	const deduped = [...new Set(transformedCategoryCodes)];

	return deduped;
}

export function processFingerpostPACategoryCodes(original: string[]) {
	const notServiceCodes = original.filter((_) => !_.includes('service:'));

	const transformedCategoryCodes = notServiceCodes
		.flatMap((_) => unpackCategoryCodes(_, 'paCat'))
		.map((_) => replacePrefixesFromLookup(_, { iptccat: 'paCat' }))
		.map(categoryCodeToString);

	const deduped = [...new Set(transformedCategoryCodes)];

	return deduped;
}

export function processUnknownFingerpostCategoryCodes(
	original: string[],
	supplier: string,
): string[] {
	const notServiceCodes = original.filter((_) => !_.includes('service:'));

	const transformedCategoryCodes = notServiceCodes
		.flatMap((_) => unpackCategoryCodes(_, `${supplier.toLowerCase()}Cat`))
		.map(categoryCodeToString);

	const deduped = [...new Set(transformedCategoryCodes)];

	return deduped;
}

export async function inferRegionCategoryFromText(content: string | undefined): Promise<string | undefined> {
	if (!content) {
		return undefined;
	}

	const { default: nlp } = await import('compromise');

	const doc = nlp(content, lexicon) as {
		places: () => { out: (format: string) => unknown };
	};

	const rawPlaces = doc.places().out('array');

	if (!Array.isArray(rawPlaces)) {
		return undefined;
	}

	const places = (rawPlaces as string[])
		.flatMap((place) => place.split(/[,\n]/))
		.map((place) => place.trim().toLowerCase())
		.filter((place) => !!place && place.length > 0);

	const isUk = places.some((place) =>
		ukPlaces.some((ukPlace) => place.includes(ukPlace)),
	);

	return isUk ? 'N2:GB' : undefined;
}
