import type { Alpha2Code, CountryData } from './countriesData';
import { countriesData, isAlpha2Code } from './countriesData';

/* 
	Source: https://github.com/fastdatascience/country_named_entity_recognition/blob/main/country_named_entity_recognition/country_finder.py
	nb. this has been used 'as-is' from the original source for development purposes
	and should be properly evaluated before use in production
*/
const countryNameVariants: Partial<Record<Alpha2Code, string[]>> = {
	VN: ['Vietnam'],
	US: ['USA', 'the US', 'U.S', 'U.S.'],
	CZ: ['Czech Rep', 'Czech Republic'],
	AE: ['UAE', 'U.A.E.'],
	KR: ['Korea', 'Republic of Korea'],
	KP: ['North Korea', "Democratic People's Republic of Korea"],
	CI: ['Ivory Coast'],
	CD: [
		'Congo, The Democratic Republic',
		'Congo, Democratic Republic',
		'Democratic Republic of the Congo',
		'Democratic Republic of Congo',
		'DR Congo',
		'DRC',
	],
	CV: ['Cape Verde'],
	SH: ['St. Helena', 'St Helena'],
	GB: ['Britain', 'United Kingdom', 'UK', 'U.K', 'U.K.'],
	RU: ['Russia'],
	VA: ['Holy See'],
	BN: ['Brunei'],
	LA: ['Laos'],
	VG: [
		'British Virgin Islands',
		'Virgin Islands (British)',
		'Virgin Islands, British',
	],
	VI: [
		'Virgin Islands (US)',
		'Virgin Islands (U.S.)',
		'Virgin Islands, US',
		'Virgin Islands, U.S.',
	],
	SY: ['Syria'],
	GE: ['Republic of Georgia'],
	GM: [
		'gambia, republic of',
		'gambia republic',
		'republic of gambia',
		'republic of the gambia',
	],
	NL: ['Nerlands'],
	IR: ['Iran'],
	MK: [
		'Macedonia, The Former Yugoslav Republic of',
		'Macedonia, Former',
		'FYROM',
		'Macedonia, Yugoslav Republic of',
	],
	RS: ['Kosovo', 'Former Yugoslavia', 'Former Serbia and Montenegro'],
	// Kosovo currently mapped to Serbia for technical reasons because Kosovo is not currently its own 2 letter code in Debian or Pycountry (the dependencies of this library)
	SZ: ['Swaziland', 'eswatini', 'eSwatini'],
	LY: ['Libyan Arab Jamahiriya'],
	PS: [
		'Palestinian Territories, Occupied',
		'Palestinian Territory, occupied',
		'Palestine, Occupied',
		'Occupied Palestine',
	],
	CN: ['Macau'],
} as const;

export const alpha2CountriesMap: Record<string, CountryData> =
	Object.fromEntries(
		countriesData.map((country) => [country['alpha-2'], country]),
	);

export function stripDiacriticsAndQuoteMarks(str: string) {
	return str
		.normalize('NFD')
		.replace(/\p{Diacritic}/gu, '')
		.replace(/['"`“‘”’]/g, '');
	// remove diacritics and quote marks
}

export function createRegexFromCountryName(name: string): RegExp {
	const normalised = stripDiacriticsAndQuoteMarks(name).replace(/\s+/g, '\\s?');
	return new RegExp(`\\b${normalised}\\b`, 'i');
}

function createRegexMap(
	countriesData: readonly CountryData[],
	variants: Partial<Record<Alpha2Code, string[]>>,
): Record<Alpha2Code, RegExp[]> {
	const countryRegexesMap = Object.fromEntries(
		countriesData.map((data) => [
			data['alpha-2'],
			[createRegexFromCountryName(data.name)],
		]),
	) as Record<Alpha2Code, RegExp[]>;
	/*
	Add some overrides that don't fit the pattern used for the rest.
	*/
	countryRegexesMap['JE'] = [/(?<!\bnew\s+)jersey/i]; // count 'jersey' as the name of a country, but not 'new jersey'
	countryRegexesMap['TR'].push(/\bTurkey\b/); // we don't want to match `turkey` in *lowercase* because that's more likely to be the bird
	countryRegexesMap['US'].push(/\bthe\s+united\s+states\b/i); // match 'the united states' (i.e. missing the 'of america' part)

	for (const country of countriesData) {
		const variantNames = variants[country['alpha-2']] ?? [];
		variantNames.forEach((name) =>
			countryRegexesMap[country['alpha-2']].push(
				createRegexFromCountryName(name),
			),
		);
	}
	return countryRegexesMap;
}

export function findCountriesInText(text: string): Alpha2Code[] {
	const countryRegexesMap = createRegexMap(countriesData, countryNameVariants);

	return Object.entries(countryRegexesMap)
		.filter(([_countryCode, regexes]) =>
			regexes.some((regex) => regex.test(text)),
		)
		.map(([countryCode, _]) => countryCode)
		.filter(isAlpha2Code);
}
