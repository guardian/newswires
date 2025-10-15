import {
	getNextActivePreset,
	getPresetPanal,
	shouldTogglePreset,
} from './presetHelpers';
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

describe('shouldTogglePreset', () => {
	it('should return true if the active preset is undefined', () => {
		expect(shouldTogglePreset(undefined, 'blah')).toBe(true);
	});
	it('should return false if the active preset is a sports preset', () => {
		expect(shouldTogglePreset('soccer-tables', 'blah')).toBe(false);
	});
	it('should return false if the active preset and preset id are the same', () => {
		expect(shouldTogglePreset('all-sport', 'all-sport')).toBe(false);
	});
});

describe('getPresetPanal', () => {
	it('should return presets if presetId is undefined', () => {
		expect(getPresetPanal(undefined)).toBe('presets');
	});
	it('should return presets if its a top level preset', () => {
		expect(getPresetPanal('all-world')).toBe('presets');
	});
	it('should return sportsPresets if it is all-sport', () => {
		expect(getPresetPanal(topLevelSportId)).toBe('sportPresets');
	});
	it('should return sportsPresets if it is a secondary level preset', () => {
		expect(getPresetPanal('no-soccer')).toBe('sportPresets');
	});
});
