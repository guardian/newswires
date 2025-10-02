import { computePresetCategories } from "./presetCategories";

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
    it('should return an empty array if there are no relevant category codes', () => {
        const categoryCodes = ['code'];
        const result = computePresetCategories(categoryCodes);
        expect(result).toEqual([]);
    });
   
});