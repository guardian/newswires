import { computePresetCategories } from "./presetCategories";

describe('presetCategories', () => { 
    it('should return an array with all-sports if there is a relevant category code', () => {
        const categoryCodes = ['N2:SOCC'];
        const result = computePresetCategories(categoryCodes);
        expect(result).toEqual(['all-sports']);
    });
    it('should return an array with all-sports and no-soccer if there are relevant category codes', () => {
        const categoryCodes = ['apCat:s'];
        const result = computePresetCategories(categoryCodes);
        expect(result).toEqual(['all-sports', 'no-soccer']);
    });
    it('should return an empty array if there are no relevant category codes', () => {
        const categoryCodes = ['code'];
        const result = computePresetCategories(categoryCodes);
        expect(result).toEqual([]);
    });
    it('should return an array with all-world if there is a relevant category code', () => {
        const categoryCodes = ['REUTERS:WORLD'];
        const result = computePresetCategories(categoryCodes);
        expect(result).toEqual(['all-world']);
    });
    it('should return an array with all-business if there is a relevant category code', () => {
        const categoryCodes = ['paCat:FFF'];
        const result = computePresetCategories(categoryCodes);
        expect(result).toEqual(['all-business']);
    });
});