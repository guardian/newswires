import { getActivePreset, removeValueFromQuery } from './queryHelpers';

describe('updateQuery', () => {
	it('should return an empty query string when q is the key', () => {
		expect(removeValueFromQuery('q', 'hello', { q: 'hello' })).toStrictEqual({
			q: '',
		});
	});
	it('should return dateRange : undefined when dateRange is the key', () => {
		expect(
			removeValueFromQuery('dateRange', 'hello', { q: 'hello' }),
		).toStrictEqual({
			dateRange: undefined,
		});
	});
	it('should return categoryCode : [] when categoryCode is key and existing categoryCode is empty', () => {
		expect(
			removeValueFromQuery('categoryCode', 'hello', { q: 'hello' }),
		).toStrictEqual({
			categoryCode: [],
		});
	});
	it('should return categoryCode : [] when categoryCode is key and existing categoryCode has no other code', () => {
		expect(
			removeValueFromQuery('categoryCode', 'code', {
				q: 'hello',
				categoryCode: ['code'],
			}),
		).toStrictEqual({ categoryCode: [] });
	});
	it('should only remove input categoryCode when categoryCode is key and there are existing categoryCode', () => {
		expect(
			removeValueFromQuery('categoryCode', 'code', {
				q: 'hello',
				categoryCode: ['code', 'sheep'],
			}),
		).toStrictEqual({ categoryCode: ['sheep'] });
	});
	it('should remove keywordExcl value correctly', () => {
		expect(
			removeValueFromQuery('keywordExcl', 'bar', {
				q: '',
				keywordExcl: ['foo', 'bar'],
			}),
		).toStrictEqual({ keywordExcl: ['foo'] });
	});
	it('should return preset : undefined for a top level preset', () => {
		expect(
			removeValueFromQuery('preset', 'all-world', { q: '' }),
		).toStrictEqual({
			preset: undefined,
		});
	});
	it('should return preset : all-sports for a secondary level preset', () => {
		expect(
			removeValueFromQuery('preset', 'no-soccer', { q: '' }),
		).toStrictEqual({
			preset: 'all-sport',
		});
	});
});

describe('getActivePreset', () => {
	it('should return undefined when the preset id matches the active preset', () => {
		expect(getActivePreset('all-world', 'all-world')).toBe(undefined);
	});
	it('should return undefined when the preset id is all-presets', () => {
		expect(getActivePreset('blah', 'all-presets')).toBe(undefined);
	});
	it('should return the preset id otherwise', () => {
		expect(getActivePreset('all-world', 'all-business')).toBe('all-business');
	});
	it('should return all-sports when preset id matches the active preset and the preset is in the all sports list', () => {
		expect(getActivePreset('soccer-tables', 'soccer-tables')).toBe('all-sport');
	});
});
