import { countriesData } from './countriesData';

export const countryNamesMap = Object.fromEntries(
	countriesData.map((country) => [country.name.toLowerCase(), country]),
);
export const countryNames = Array.from(
	new Set(countriesData.map((country) => country.name.toLowerCase())),
);
