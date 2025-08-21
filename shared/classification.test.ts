import type { ProcessedObject } from './types';
import type { SearchCriteria } from './classification';
import {
	classification,
	matchesPreset,
	matchesSearchCriteria,
} from './classification';

const emptyObject: ProcessedObject = {
	categoryCodes: [],
	supplier: 'Unknown',
	content: {
		keywords: [],
		imageIds: [],
	},
};
const ukObject: ProcessedObject = {
	...emptyObject,
	categoryCodes: ['paCat:HHH'],
	supplier: 'PA',
};
describe('test suite', () => {
	describe('classification', () => {
		it('should correctly classify a content item', () => {
			expect(classification(ukObject)).toEqual(['all-uk']);
		});
		it('should correctly classify a content item that matches multiple presets', () => {
			const ukAndBusiness: ProcessedObject = {
				...emptyObject,
				categoryCodes: ['paCat:HHH', 'paCat:GXX'],
				supplier: 'PA',
			};
			expect(classification(ukAndBusiness)).toEqual(['all-uk', 'all-business']);
		});
		it('should return an empty array if no classification matches', () => {
			const noClassification: ProcessedObject = {
				...emptyObject,
				categoryCodes: ['paCat:XYZ'],
				supplier: 'PA',
			};
			expect(classification(noClassification)).toEqual([]);
		});
	});
	describe('matchesPreset', () => {
		const examplePreset: Record<Supplier, SearchCriteria[]> = {
			PA: [
				{
					categoryCodes: ['paCat:HHH', 'paCat:SCN'],
					categoryCodesExclude: [],
					keywords: [],
					keywordsExclude: [],
				},
				{
					categoryCodes: ['N2:GB'],
					categoryCodesExclude: [],
					keywords: [],
					keywordsExclude: [],
				},
			],
			MINOR_AGENCIES: [],
			REUTERS: [],
			AP: [],
			AAP: [],
			AFP: [],
		};
		it('should return true if the content has matches one of the search criteria', () => {
			expect(matchesPreset(ukObject, examplePreset)).toEqual(true);
		});
		it('should return true if the content has matches a different search criteria', () => {
			const content: ProcessedObject = {
				...emptyObject,
				categoryCodes: ['N2:GB'],
				supplier: 'PA',
			};
			expect(matchesPreset(content, examplePreset)).toEqual(true);
		});
		it('should return false if the content has no matches for the search criteria', () => {
			const content: ProcessedObject = {
				...emptyObject,
				categoryCodes: ['paCat:XYZ'],
				supplier: 'PA',
			};
			expect(matchesPreset(content, examplePreset)).toEqual(false);
		});
		it('should return false if the content has a supplier with no search criteria', () => {
			const content: ProcessedObject = {
				...emptyObject,
				categoryCodes: ['paCat:XYZ'],
				supplier: 'MINOR_AGENCIES',
			};
			expect(matchesPreset(content, examplePreset)).toEqual(false);
		});
		it('should return false array when no criteria match', () => {
			const content: ProcessedObject = {
				...emptyObject,
				categoryCodes: ['paCat:XYZ'],
				supplier: 'PA',
			};
			expect(matchesPreset(content, examplePreset)).toEqual(false);
		});
	});

	describe('matchesSearchCriteria', () => {
		it('should match content against categoryCodes and suppliers when category code is present', () => {
			const content: ProcessedObject = {
				...emptyObject,
				categoryCodes: ['paCat:HHH'],
				supplier: 'PA',
			};

			const criteria: SearchCriteria = {
				categoryCodes: ['paCat:HHH', 'paCat:SCN'],
				categoryCodesExclude: [],
				keywords: [],
				keywordsExclude: [],
			};

			const result = matchesSearchCriteria(content, criteria);
			expect(result).toBe(true);
		});
		it('should not match content against categoryCodes when the category code is in the exclude list', () => {
			const content: ProcessedObject = {
				...emptyObject,
				categoryCodes: ['paCat:HHH', 'paCat:XYZ'],
				supplier: 'PA',
			};

			const criteria: SearchCriteria = {
				categoryCodes: ['paCat:HHH', 'paCat:SCN'],
				categoryCodesExclude: ['paCat:XYZ'],
				keywords: [],
				keywordsExclude: [],
			};

			const result = matchesSearchCriteria(content, criteria);
			expect(result).toBe(false);
		});
		it('should not match content against categoryCodes and suppliers when category code is not present', () => {
			const content: ProcessedObject = {
				...emptyObject,
				categoryCodes: [],
				supplier: 'PA',
			};

			const criteria: SearchCriteria = {
				categoryCodes: ['paCat:HHH', 'paCat:SCN'],
				categoryCodesExclude: [],
				keywords: [],
				keywordsExclude: [],
			};

			const result = matchesSearchCriteria(content, criteria);
			expect(result).toBe(false);
		});
		it('should match content against keywords and suppliers when keyword is present', () => {
			const content: ProcessedObject = {
				...emptyObject,
				categoryCodes: [],
				supplier: 'PA',
				content: {
					...emptyObject.content,
					keywords: ['keyword1'],
				},
			};

			const criteria: SearchCriteria = {
				categoryCodes: [],
				categoryCodesExclude: [],
				keywords: ['keyword1', 'keyword2'],
				keywordsExclude: [],
			};

			const result = matchesSearchCriteria(content, criteria);
			expect(result).toBe(true);
		});
		it('should not match content against keywords and suppliers when keyword is not present', () => {
			const content: ProcessedObject = {
				...emptyObject,
				categoryCodes: [],
				supplier: 'PA',
			};

			const criteria: SearchCriteria = {
				categoryCodes: [],
				categoryCodesExclude: [],
				keywords: ['keyword1', 'keyword2'],
				keywordsExclude: [],
			};

			const result = matchesSearchCriteria(content, criteria);
			expect(result).toBe(false);
		});
		it('should match content when a search term is present', () => {
			const content: ProcessedObject = {
				...emptyObject,
				categoryCodes: [],
				content: {
					...emptyObject.content,
					headline: 'This is a News Summary',
				},
			};

			const criteria: SearchCriteria = {
				categoryCodes: [],
				categoryCodesExclude: [],
				keywords: [],
				keywordsExclude: [],
				searchTerm: {
					type: 'Simple',
					value: 'News Summary',
					field: 'Headline',
				},
			};

			const result = matchesSearchCriteria(content, criteria);
			expect(result).toBe(true);
		});

		it('should not match content when a search term is present and the headline does not match', () => {
			const content: ProcessedObject = {
				...emptyObject,
				categoryCodes: [],
				content: {
					...emptyObject.content,
					headline: 'This is a different headline',
				},
			};

			const criteria: SearchCriteria = {
				categoryCodes: [],
				categoryCodesExclude: [],
				keywords: [],
				keywordsExclude: [],
				searchTerm: {
					type: 'Simple',
					value: 'News Summary',
					field: 'Headline',
				},
			};

			const result = matchesSearchCriteria(content, criteria);
			expect(result).toBe(false);
		});
	});
});
