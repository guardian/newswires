import {
	inferGBCategoryFromText,
	inferGeographicalCategoriesFromText,
	processFingerpostAAPCategoryCodes,
	processFingerpostAFPCategoryCodes,
	processFingerpostAPCategoryCodes,
	processFingerpostPACategoryCodes,
	processReutersDestinationCodes,
	processUnknownFingerpostCategoryCodes,
	remapReutersCountryCodes,
} from './categoryCodes';
import { processCategoryCodes } from './handler';

describe('processReutersDestinationCodes', () => {
	it('should return formatted custom cat codes for known destinations and ignores the rest', () => {
		expect(processReutersDestinationCodes(['RWSA', 'RNP'])).toEqual([
			'REUTERS:RWSA',
		]);
		expect(processReutersDestinationCodes(['RWSA', 'RNP'])).toEqual([
			'REUTERS:RWSA',
		]);
	});
});

describe('remapReutersCountryCodes', () => {
	it('should return an empty array if provided no ISO Alpha-2 country codes', () => {
		expect(
			remapReutersCountryCodes(['N2:football', 'N2:Paris', 'N2:France']),
		).toEqual([]);
	});
	it('should return an empty array if provided with an empty array', () => {
		expect(remapReutersCountryCodes([])).toEqual([]);
	});
	it('should return an array of remapped Reuters country codes, plus region codes for those countries', () => {
		const remapped = remapReutersCountryCodes(['N2:GB', 'N2:FR']);
		[
			'experimentalCountryCode:GB',
			'experimentalRegionName:Europe',
			'experimentalSubRegionName:Northern Europe',
			'experimentalCountryCode:FR',
			'experimentalSubRegionName:Western Europe',
		].forEach((code) => {
			expect(remapped).toContain(code);
		});
		expect(remapped).toHaveLength(5);
	});
});

describe('processFingerpostAPCategoryCodes', () => {
	it('should return an empty array if provided with an empty array', () => {
		expect(processFingerpostAPCategoryCodes([])).toEqual([]);
	});

	it('should strip out service codes', () => {
		expect(processFingerpostAPCategoryCodes(['service:news'])).toEqual([]);
	});

	it('should strip out empty iptccat entries', () => {
		expect(processFingerpostAPCategoryCodes(['iptccat:', 'iptccat:a'])).toEqual(
			['apCat:a'],
		);
	});

	it('should return simple codes labelled "iptccat" as simple "apCat" codes', () => {
		expect(
			processFingerpostAPCategoryCodes(['iptccat:a', 'iptccat:b']),
		).toEqual(['apCat:a', 'apCat:b']);
	});

	it('should expand category codes with multiple subcodes', () => {
		expect(processFingerpostAPCategoryCodes(['iptccat:c+d'])).toEqual([
			'apCat:c',
			'apCat:d',
		]);
	});

	it('should remove empty strings', () => {
		expect(
			processFingerpostAPCategoryCodes(['iptccat:a', '', 'iptccat:c']),
		).toEqual(['apCat:a', 'apCat:c']);
	});

	it('should remove trailing and leading whitespace', () => {
		expect(
			processFingerpostAPCategoryCodes([
				'iptccat:a ',
				' iptccat:c',
				' service:news ',
				'qCode:value ',
				'iptccat: ',
			]),
		).toEqual(['apCat:a', 'apCat:c', 'qCode:value']);
	});

	it('should deduplicate category codes after stripping whitespace', () => {
		expect(
			processFingerpostAPCategoryCodes([
				'iptccat:a ',
				' iptccat:a',
				'iptccat:c',
			]),
		).toEqual(['apCat:a', 'apCat:c']);
	});
});

describe('processFingerpostAAPCategoryCodes', () => {
	it('should return an empty array if provided with an empty array', () => {
		expect(processFingerpostAAPCategoryCodes([])).toEqual([]);
	});

	it('should strip out non-valid news codes', () => {
		expect(processFingerpostAAPCategoryCodes(['and'])).toEqual([]);
	});

	it('should process valid news codes', () => {
		expect(
			processFingerpostAAPCategoryCodes([
				'04007003+food',
				'goods|04013002+food',
				'and',
				'medtop:20000049',
			]),
		).toEqual(['medtop:20000049', 'subj:04007003', 'subj:04013002']);
	});

	it('should flatten embedded news codes', () => {
		expect(
			processFingerpostAAPCategoryCodes([
				'11001000+defence|11001005+military',
				'equipment|11002000+diplomacy|04015001+air',
			]),
		).toEqual([
			'subj:11001000',
			'subj:11001005',
			'subj:11002000',
			'subj:04015001',
		]);
	});
});

describe('processFingerpostAFPCategoryCodes', () => {
	it('should return an empty array if provided with an empty array', () => {
		expect(processFingerpostAFPCategoryCodes([])).toEqual([]);
	});
	it('should strip out service codes', () => {
		expect(processFingerpostAFPCategoryCodes(['service:news'])).toEqual([]);
	});
	it('should strip out empty iptccat entries', () => {
		expect(
			processFingerpostAFPCategoryCodes(['iptccat:', 'iptccat:a']),
		).toEqual(['afpCat:a']);
	});
	it('should return simple codes labelled "iptc" as simple "afp" codes', () => {
		expect(
			processFingerpostAFPCategoryCodes(['iptccat:a', 'iptccat:b']),
		).toEqual(['afpCat:a', 'afpCat:b']);
	});
	it('should expand category codes with multiple subcodes', () => {
		expect(processFingerpostAFPCategoryCodes(['iptccat:c+d'])).toEqual([
			'afpCat:c',
			'afpCat:d',
		]);
	});

	it('should remove empty strings', () => {
		expect(
			processFingerpostAFPCategoryCodes(['iptccat:a', '', 'iptccat:c']),
		).toEqual(['afpCat:a', 'afpCat:c']);
	});

	it('should remove trailing and leading whitespace', () => {
		expect(
			processFingerpostAFPCategoryCodes([
				'iptccat:a ',
				' iptccat:c',
				' service:news ',
				'iptccat: ',
				'qCode:value ',
			]),
		).toEqual(['afpCat:a', 'afpCat:c', 'qCode:value']);
	});

	it('should deduplicate category codes after stripping whitespace', () => {
		expect(
			processFingerpostAFPCategoryCodes([
				'iptccat:ECO+SOC+ECO+SOC+ECO ',
				' iptccat:ECO',
			]),
		).toEqual(['afpCat:ECO', 'afpCat:SOC']);
	});
});

describe('processFingerpostPACategoryCodes', () => {
	describe('processFingerpostPACategoryCodes', () => {
		it('should return an empty array if provided with an empty array', () => {
			expect(processFingerpostPACategoryCodes([])).toEqual([]);
		});

		it('should strip out service codes', () => {
			expect(processFingerpostPACategoryCodes(['service:news'])).toEqual([]);
		});

		it('should strip out empty iptccat entries', () => {
			expect(
				processFingerpostPACategoryCodes(['iptccat:', 'iptccat:a']),
			).toEqual(['paCat:a']);
		});

		it('should return simple codes labelled "iptccat" as simple "paCat" codes', () => {
			expect(
				processFingerpostPACategoryCodes(['iptccat:a', 'iptccat:b']),
			).toEqual(['paCat:a', 'paCat:b']);
		});

		it('should expand category codes with multiple subcodes', () => {
			expect(processFingerpostPACategoryCodes(['iptccat:c+d'])).toEqual([
				'paCat:c',
				'paCat:d',
			]);
		});

		it('should remove empty strings', () => {
			expect(
				processFingerpostPACategoryCodes(['iptccat:a', '', 'iptccat:c']),
			).toEqual(['paCat:a', 'paCat:c']);
		});

		it('should remove trailing and leading whitespace', () => {
			expect(
				processFingerpostPACategoryCodes([
					'iptccat:a ',
					' iptccat:c',
					' service:news ',
					'qCode:value ',
					'iptccat: ',
				]),
			).toEqual(['paCat:a', 'paCat:c', 'qCode:value']);
		});

		it('should deduplicate category codes after stripping whitespace', () => {
			expect(
				processFingerpostPACategoryCodes([
					'iptccat:a ',
					' iptccat:a',
					'iptccat:c',
				]),
			).toEqual(['paCat:a', 'paCat:c']);
		});
	});
});

describe('processUnknownFingerpostCategoryCodes', () => {
	it('should return an empty array if provided with an empty array', () => {
		expect(processUnknownFingerpostCategoryCodes([], 'supplier')).toEqual([]);
	});

	it('should remove service codes', () => {
		expect(
			processUnknownFingerpostCategoryCodes(['service:news'], 'supplier'),
		).toEqual([]);
	});

	it('should remove empty strings', () => {
		expect(
			processUnknownFingerpostCategoryCodes(['', 'qCode:value'], 'supplier'),
		).toEqual(['qCode:value']);
	});

	it('should remove trailing and leading whitespace', () => {
		expect(
			processUnknownFingerpostCategoryCodes(
				['qCode:value ', ' service:news ', 'qCode:value'],
				'supplier',
			),
		).toEqual(['qCode:value']);
	});

	it('should unpack multiple category codes separated by "+"', () => {
		expect(
			processUnknownFingerpostCategoryCodes(['qCode:value+value1'], 'supplier'),
		).toEqual(['qCode:value', 'qCode:value1']);
	});
});

describe('inferGBCategoryFromText', () => {
	it('should return undefined if provided with an string', () => {
		expect(inferGBCategoryFromText('')).toHaveLength(0);
	});

	it('should return N2:GB when a UK country is mentioned', () => {
		const content =
			'Prime Minister visits Scotland to address economic concerns in rural areas.';
		expect(inferGBCategoryFromText(content)).toContain('N2:GB');
	});

	it('should return N2:GB for a UK city is mentioned', () => {
		const content =
			'Manchester sees surge in tech sector jobs as new startups attract global investment.';
		expect(inferGBCategoryFromText(content)).toContain('N2:GB');
	});

	it('should return N2:GB for a UK region is mentioned', () => {
		const content =
			'Heavy rainfall causes flooding in the Lake District, prompting emergency response.';
		expect(inferGBCategoryFromText(content)).toContain('N2:GB');
	});

	it('should return N2:GB even with varied casing and punctuation in text', () => {
		const content =
			'BREAKING: london officials respond to transportation delays across the city.';
		expect(inferGBCategoryFromText(content)).toContain('N2:GB');
	});

	it('should return N2:GB when a London borough is mentioned', () => {
		const content =
			'Hackney council launches initiative to support local small businesses amid rising rents.';
		expect(inferGBCategoryFromText(content)).toContain('N2:GB');
	});

	it('should return N2:GB when a UK landmark is mentioned', () => {
		const content =
			'Thousands of tourists expected at Stonehenge for the summer solstice celebrations.';
		expect(inferGBCategoryFromText(content)).toContain('N2:GB');
	});

	it('should return undefined when only non-UK places are mentioned', () => {
		const content =
			'US and EU leaders meet in Paris to discuss international trade agreements.';
		expect(inferGBCategoryFromText(content)).toHaveLength(0);
	});
});

describe('processCategoryCodes', () => {
	it('should filter out empty category codes', () => {
		const content =
			'US and EU leaders meet in Paris to discuss international trade agreements.';
		expect(processCategoryCodes('MINOR_AGENCIES', [''], [], content)).toEqual(
			[],
		);
	});
});

describe('inferGeographicalCategoriesFromText', () => {
	it('should handle diacritics in country names', () => {
		const countryName = 'Côte d’Ivoire';
		const tags = inferGeographicalCategoriesFromText(countryName);
		expect(tags).toContain('experimentalCountryCode:CI');
	});

	it('should handle country names that have been spelled without diacritics', () => {
		const countryName = "Cote d'Ivoire";
		const tags = inferGeographicalCategoriesFromText(countryName);
		expect(tags).toContain('experimentalCountryCode:CI');
	});

	it('should return experimentalCountryCode:TR when Turkey is mentioned', () => {
		const content = 'Ankara has been the capital of Turkey for some time.';
		expect(inferGeographicalCategoriesFromText(content)).toContain(
			'experimentalCountryCode:TR',
		);
	});

	it('should add country codes, region names, sub-region names and intermediate regions when they are available', () => {
		const content = 'Turks and Caicos Islands';
		expect(inferGeographicalCategoriesFromText(content)).toContain(
			'experimentalCountryCode:TC',
		);
		expect(inferGeographicalCategoriesFromText(content)).toContain(
			'experimentalRegionName:Americas',
		);
		expect(inferGeographicalCategoriesFromText(content)).toContain(
			'experimentalSubRegionName:Latin America and the Caribbean',
		);
		expect(inferGeographicalCategoriesFromText(content)).toContain(
			'experimentalIntermediateRegionName:Caribbean',
		);
	});

	it('should not try to add codes (e.g. intermediate regions) when they are unavailable for the relevant country', () => {
		const content = 'The capital of France is Paris.';
		expect(inferGeographicalCategoriesFromText(content)).toContain(
			'experimentalCountryCode:FR',
		);
		expect(inferGeographicalCategoriesFromText(content)).toContain(
			'experimentalRegionName:Europe',
		);
		expect(inferGeographicalCategoriesFromText(content)).toContain(
			'experimentalSubRegionName:Western Europe',
		);
		expect(inferGeographicalCategoriesFromText(content)).toHaveLength(3);
	});

	it('should handle all country names in the text', () => {
		const content =
			'The United States, Canada, and Mexico are all part of North America.';
		const tags = inferGeographicalCategoriesFromText(content);
		expect(tags).toContain('experimentalCountryCode:US');
		expect(tags).toContain('experimentalCountryCode:CA');
		expect(tags).toContain('experimentalCountryCode:MX');
	});

	it("should not treat 'new jersey' as a country", () => {
		const content = 'New Jersey is a state in the USA.';
		expect(inferGeographicalCategoriesFromText(content)).not.toContain(
			'experimentalCountryCode:JE',
		);
	});
});
