import { classification, matchesSearchCriteria, ProcessedContent, SearchCriteria } from "./classification";

describe('classification', () => {
    it('should return the first matching criteria', () => {
        const content: ProcessedContent = {
            categoryCodes: ['paCat:HHH'],
            supplier: 'PA',
            keywords: []
        };
        const result = classification(content);
        expect(result).toEqual(['all-uk']);
    });
    it('should return an empty array when no criteria match', () => {
        const content: ProcessedContent = {
            categoryCodes: ['paCat:XYZ'],
            supplier: 'PA',
            keywords: []
        };
        const result = classification(content);
        expect(result).toEqual([]);
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
