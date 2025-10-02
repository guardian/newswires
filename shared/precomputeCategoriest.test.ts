import { computePresetCategories } from "./precomputeCategories";

describe('presetCategories', () => { 
    it('should return an array with all-sports if there is a relevant category code', () => {
        const categoryCodes = ['N2:SOCC'];
        const result = computePresetCategories(categoryCodes);
        expect(result).toEqual(['all-sports', 'sports-related-topic-codes']);
    });
    it('should return an array with all-sports and no-soccer if there are relevant category codes', () => {
        const categoryCodes = ['apCat:s'];
        const result = computePresetCategories(categoryCodes);
        expect(result).toEqual(['all-sports', 'no-soccer']);
    });
    it('should return an array with sports-related-topic-codes if there is a relevant category code', () => {
        const categoryCodes = ['subj:15000000'];
        const result = computePresetCategories(categoryCodes);
        expect(result).toEqual(['all-sports', 'no-soccer', 'sports-related-news-codes']);
    });
    it('should return an array with business-related-news-codes if there is a relevant category code', () => {
        const categoryCodes = ['subj:04004002'];
        const result = computePresetCategories(categoryCodes);
        expect(result).toEqual(['business-related-news-codes']);
    });
    it('should return an array with business-related-topic-codes if there is a relevant category code', () => {
        const categoryCodes = ['N2:ABS'];
        const result = computePresetCategories(categoryCodes);
        expect(result).toEqual(['business-related-topic-codes']);
    });
    it('should return an array with other-news-codes if there is a relevant category code', () => {
        const categoryCodes = ['N2:ART'];
        const result = computePresetCategories(categoryCodes);
        expect(result).toEqual(['other-topic-codes']);
    });
    it('should return an empty array if there are no relevant category codes', () => {
        const categoryCodes = ['code'];
        const result = computePresetCategories(categoryCodes);
        expect(result).toEqual([]);
    });
    
   
});