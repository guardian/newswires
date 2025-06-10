import type { Alpha2Code } from './countriesData';

/* 
	Source: https://github.com/fastdatascience/country_named_entity_recognition/blob/main/country_named_entity_recognition/country_finder.py
	nb. this has been used 'as-is' from the original source for development purposes
	and should be properly evaluated before use in production
*/
export const countryNameVariants: Partial<Record<Alpha2Code, string[]>> = {
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
