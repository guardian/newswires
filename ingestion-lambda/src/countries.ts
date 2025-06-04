import type { CountryData } from './countriesData';
import { countriesData } from './countriesData';

/* 
	Source: https://github.com/fastdatascience/country_named_entity_recognition/blob/main/country_named_entity_recognition/country_finder.py
	nb. this has been used 'as-is' from the original source for development purposes
	and should be properly evaluated before use in production
*/
const countryNameVariants = {
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
};

const countryNameVariantsMap: Record<string, CountryData> = Object.fromEntries(
	Object.entries(countryNameVariants)
		.flatMap(([code, names]) =>
			names.map((name) => [
				name.toLowerCase(),
				countriesData.find((_) => _['alpha-2'] === code),
			]),
		)
		.filter(
			(data): data is [string, CountryData] => data[1] !== undefined,
		) /** @todo we should be able to remove the type predicate after we upgrade TS to 5.6 */,
);

const additional = {
	turkey: countriesData[countriesData.findIndex((_) => _['alpha-2'] === 'TR')],
} as Record<string, CountryData>;

export const countryNamesMap: Record<string, CountryData> = {
	...countryNameVariantsMap,
	...Object.fromEntries(
		countriesData.map((country) => [country.name.toLowerCase(), country]),
	),
	...additional,
};
export const countryNames = Object.keys(countryNamesMap);

export const alpha2CountriesMap: Record<string, CountryData> =
	Object.fromEntries(
		countriesData.map((country) => [country['alpha-2'], country]),
	);
