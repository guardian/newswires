import nlp from 'compromise';
import {
	alpha2CountriesMap,
	findCountriesInText,
	stripDiacriticsAndQuoteMarks,
} from './countries';
import { ukLexicon, ukPlaces } from './ukPlaces';

interface CategoryCode {
	prefix: string;
	code: string;
}

export function dedupeStrings(arr: string[]): string[] {
	return Array.from(new Set(arr));
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

export function processReutersDestinationCodes(original: string[]): string[] {
	const supportedDestinations: string[] = [
		'RWS',
		'RNA',
		'RWSA',
		'REULB',
		'RBN',
	];

	return original
		.filter((_) => supportedDestinations.includes(_))
		.map((_) => `REUTERS:${_}`);
}

export function remapReutersCountryCodes(original: string[]): string[] {
	const codes = original.flatMap((code) => {
		const categoryCodeValue = code.split(':')[1]?.toUpperCase();
		const maybeCountryData = categoryCodeValue
			? generateGeographicalCategoryCodes(categoryCodeValue)
			: [];
		return maybeCountryData;
	});
	return dedupeStrings(codes);
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

export function inferGBCategoryFromText(content: string | undefined): string[] {
	if (!content) {
		return [];
	}

	const doc = nlp(content, ukLexicon) as {
		places: () => { out: (format: string) => unknown };
	};

	const rawPlaces = doc.places().out('array');

	if (!Array.isArray(rawPlaces)) {
		return [];
	}

	const places = dedupeStrings(
		(rawPlaces as string[])
			.flatMap((place) => place.split(/[,\n]/))
			.map((place) =>
				place
					.trim()
					.toLowerCase()
					.replaceAll(/['’]s$/g, '')
					.replaceAll(/\/>/g, ''),
			)
			.filter((place) => !!place && place.length > 0),
	);

	const isUk = places.some((place) =>
		ukPlaces.some((ukPlace) => place.includes(ukPlace)),
	);

	const maybeIsUkTag = isUk ? 'N2:GB' : undefined;

	const maybeAdditionalTags = isUk
		? generateGeographicalCategoryCodes('GB')
		: [];

	return dedupeStrings(
		[maybeIsUkTag, ...maybeAdditionalTags].filter(
			(i): i is string => i !== undefined,
		),
	); /** @todo we should be able to remove the type predicate after we upgrade TS to 5.6 */
}

export function inferGeographicalCategoriesFromText(
	content: string | undefined,
): string[] {
	if (!content) {
		return [];
	}

	const contentToProcess = stripDiacriticsAndQuoteMarks(content);

	/**
	 * Potential outliers in terms of performance, for this function:
	 * AP weather reports: https://newswires.code.dev-gutools.co.uk/item/2550286?q=BC-WEA--Global+Forecast-Fahrenheit&start=now/d
	 */
	const countryTags = findCountriesInText(contentToProcess).flatMap(
		generateGeographicalCategoryCodes,
	);

	return dedupeStrings(countryTags);
}

function generateGeographicalCategoryCodes(
	alpha2CountryCode: string,
): string[] {
	const countryData = alpha2CountriesMap[alpha2CountryCode];
	if (!countryData) {
		return [];
	}

	const codes: string[] = [
		`experimentalCountryCode:${countryData['alpha-2']}`,
		`experimentalRegionName:${countryData.region}`,
	];

	if (countryData['sub-region']) {
		codes.push(`experimentalSubRegionName:${countryData['sub-region']}`);
	}

	if (countryData['intermediate-region']) {
		codes.push(
			`experimentalIntermediateRegionName:${countryData['intermediate-region']}`,
		);
	}

	return codes;
}
