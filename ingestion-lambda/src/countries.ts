import type { Alpha2Code, CountryData } from './data/countriesData';
import { countriesData, isAlpha2Code } from './data/countriesData';
import { countryNameVariants } from './data/countryNameVariants';

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
