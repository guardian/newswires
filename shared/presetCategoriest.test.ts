import { computePresetCategories } from "./presetCategories";

describe('presetCategories', () => { 
    it('should return an array with all-sports if there is a relevant category code', () => {
        const categoryCodes = ['N2:SOCC'];
        const result = computePresetCategories(categoryCodes);
        expect(result).toEqual(['all-sports']);
    });
    it('should return an array with all-sports and no-soccer if there are relevant category codes', () => {
        const categoryCodes = ['afpCat:SPO', 'N2:SYNCS'];
        const result = computePresetCategories(categoryCodes);
        expect(result).toEqual(['all-sports', 'no-soccer']);
    });
    it('should return an empty array if there are no relevant category codes', () => {
        const categoryCodes = ['N2:TECH'];
        const result = computePresetCategories(categoryCodes);
        expect(result).toEqual([]);
    });
});