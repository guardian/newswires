import { getNextActivePreset, getPresetPanel } from './presetHelpers';
import { topLevelSportId } from './presets';

describe('getNextActivePreset', () => {
	it('should return undefined when the preset id matches the active preset', () => {
		expect(getNextActivePreset('all-world', 'all-world')).toBe(undefined);
	});
	it('should return undefined when the preset id is all-presets', () => {
		expect(getNextActivePreset('blah', 'all-presets')).toBe(undefined);
	});
	it('should return the preset id otherwise', () => {
		expect(getNextActivePreset('all-world', 'all-business')).toBe(
			'all-business',
		);
	});
	it('should return all-sports when preset id matches the active preset and the preset is in the all sports list', () => {
		expect(getNextActivePreset('soccer-tables', 'soccer-tables')).toBe(
			topLevelSportId,
		);
	});
});

describe('getPresetPanel', () => {
	it('should return presets if presetId is undefined', () => {
		expect(getPresetPanel(undefined)).toBe('presets');
	});
	it('should return presets if its a top level preset', () => {
		expect(getPresetPanel('all-world')).toBe('presets');
	});
	it('should return sportsPresets if it is all-sport', () => {
		expect(getPresetPanel(topLevelSportId)).toBe('sportPresets');
	});
	it('should return sportsPresets if it is a secondary level preset', () => {
		expect(getPresetPanel('no-soccer')).toBe('sportPresets');
	});
});
