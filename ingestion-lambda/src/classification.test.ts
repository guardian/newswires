import { classification, matchesPreset, matchesSearchCriteria, ProcessedContent, SearchCriteria, Supplier } from "./classification";

describe('classification', () => {
    it('should correctly classify a content item', () => {
        const content: ProcessedContent = {
            categoryCodes: ['paCat:HHH'],
            supplier: 'PA',
            keywords: []
        };
        expect(classification(content)).toEqual(['all-uk']);
    });
    it('should correctly classify a content item that matches multiple presets', () => {
        const content: ProcessedContent = {
            categoryCodes: ['paCat:HHH', 'paCat:GXX'],
            supplier: 'PA',
            keywords: []
        };
        expect(classification(content)).toEqual(['all-uk', 'all-business']);
    } )
    it('should return an empty array if no classification matches', () => {
        const content: ProcessedContent = {
            categoryCodes: ['paCat:XYZ'],
            supplier: 'PA',
            keywords: []
        };
        expect(classification(content)).toEqual([]);
    });
})
describe('matchesPreset', () => {
    const examplePreset: Record<Supplier, SearchCriteria[]> = {
        'PA': [{
            categoryCodes: ['paCat:HHH', 'paCat:SCN'],
            categoryCodesExclude: [],
            keywords: [],
            keywordsExclude: []
        },
        {
            categoryCodes: ['N2:GB'],
            categoryCodesExclude: [],
            keywords: [],
            keywordsExclude: []
        }
        ],
        MINOR_AGENCIES: [],
        REUTERS: [],
        AP: [],
        AAP: [],
        AFP: []
    }
    it('should return true if the content has matches one of the search criteria', () => {
        const content: ProcessedContent = {
            categoryCodes: ['paCat:HHH'],
            supplier: 'PA',
            keywords: []
        };
        expect(matchesPreset(content, examplePreset)).toEqual(true);
    });
    it('should return true if the content has matches a different search criteria', () => {
        const content: ProcessedContent = {
            categoryCodes: ['N2:GB'],
            supplier: 'PA',
            keywords: []
        };
        expect(matchesPreset(content, examplePreset)).toEqual(true);
    });
    it('should return false if the content has no matches for the search criteria', () => {
        const content: ProcessedContent = {
            categoryCodes: ['paCat:XYZ'],
            supplier: 'PA',
            keywords: []
        };
        expect(matchesPreset(content, examplePreset)).toEqual(false);
    });
    it('should return false if the content has a supplier with no search criteria', () => {
        const content: ProcessedContent = {
            categoryCodes: ['paCat:XYZ'],
            supplier: 'MINOR_AGENCIES',
            keywords: []
        };
        expect(matchesPreset(content, examplePreset)).toEqual(false);
    });
    it('should return false array when no criteria match', () => {
        const content: ProcessedContent = {
            categoryCodes: ['paCat:XYZ'],
            supplier: 'PA',
            keywords: []
        };
        expect(matchesPreset(content, examplePreset)).toEqual(false);
    });
});

describe('matchesSearchCriteria', () => {
    it('should match content against categoryCodes and suppliers when category code is present', () => {
        const content: ProcessedContent = {
            categoryCodes: ['paCat:HHH'],
            supplier: 'PA',
            keywords: []
        };

        const criteria: SearchCriteria = {
            categoryCodes: ['paCat:HHH', 'paCat:SCN'],
            categoryCodesExclude: [],
            keywords: [],
            keywordsExclude: []
        };

        const result = matchesSearchCriteria(content, criteria);
        expect(result).toBe(true);
    });
    it('should not match content against categoryCodes when the category code is in the exclude list', () => {
        const content: ProcessedContent = {
            categoryCodes: ['paCat:HHH', 'paCat:XYZ'],
            supplier: 'PA',
            keywords: []
        };

        const criteria: SearchCriteria = {
            categoryCodes: ['paCat:HHH', 'paCat:SCN'],
            categoryCodesExclude: ['paCat:XYZ'],
            keywords: [],
            keywordsExclude: []
        };

        const result = matchesSearchCriteria(content, criteria);
        expect(result).toBe(false);
    });
    it('should not match content against categoryCodes and suppliers when category code is not present', () => {
        const content: ProcessedContent = {
            categoryCodes: [],
            supplier: 'PA',
            keywords: []
        };

        const criteria: SearchCriteria = {
            categoryCodes: ['paCat:HHH', 'paCat:SCN'],
            categoryCodesExclude: [],
            keywords: [],
            keywordsExclude: []
        };

        const result = matchesSearchCriteria(content, criteria);
        expect(result).toBe(false);
    });
     it('should match content against keywords and suppliers when keyword is present', () => {
        const content: ProcessedContent = {
            categoryCodes: [],
            supplier: 'PA',
            keywords: ['keyword1']
        };

        const criteria: SearchCriteria = {
            categoryCodes: [],
            categoryCodesExclude: [],
            keywords: ['keyword1', 'keyword2'],
            keywordsExclude: []
        };

        const result = matchesSearchCriteria(content, criteria);
        expect(result).toBe(true);
    });
    it('should not match content against keywords and suppliers when keyword is not present', () => {
        const content: ProcessedContent = {
            categoryCodes: [],
            supplier: 'PA',
            keywords: []
        };

        const criteria: SearchCriteria = {
            categoryCodes: [],
            categoryCodesExclude: [],
            keywords: ['keyword1', 'keyword2'],
            keywordsExclude: []
        };

        const result = matchesSearchCriteria(content, criteria);
        expect(result).toBe(false);
    });

});
