import { topLevelSportId } from './presets';
import { keyValueAfterDeselection } from './queryHelpers';

describe('keyValueAfterDeselection', () => {
	it('should return an empty query string when q is the key', () => {
		expect(
			keyValueAfterDeselection('q', 'hello', { q: 'hello' }),
		).toStrictEqual({
			q: '',
		});
	});
	it('should return dateRange : undefined when dateRange is the key', () => {
		expect(
			keyValueAfterDeselection('dateRange', 'hello', { q: 'hello' }),
		).toStrictEqual({
			dateRange: undefined,
		});
	});
	it('should return categoryCode : [] when categoryCode is key and existing categoryCode is empty', () => {
		expect(
			keyValueAfterDeselection('categoryCode', 'hello', { q: 'hello' }),
		).toStrictEqual({
			categoryCode: [],
		});
	});
	it('should return categoryCode : [] when categoryCode is key and existing categoryCode has no other code', () => {
		expect(
			keyValueAfterDeselection('categoryCode', 'code', {
				q: 'hello',
				categoryCode: ['code'],
			}),
		).toStrictEqual({ categoryCode: [] });
	});
	it('should only remove input categoryCode when categoryCode is key and there are existing categoryCode', () => {
		expect(
			keyValueAfterDeselection('categoryCode', 'code', {
				q: 'hello',
				categoryCode: ['code', 'sheep'],
			}),
		).toStrictEqual({ categoryCode: ['sheep'] });
	});
	it('should remove keywordExcl value correctly', () => {
		expect(
			keyValueAfterDeselection('keywordExcl', 'bar', {
				q: '',
				keywordExcl: ['foo', 'bar'],
			}),
		).toStrictEqual({ keywordExcl: ['foo'] });
	});
	it('should return preset : undefined for a top level preset', () => {
		expect(
			keyValueAfterDeselection('preset', 'all-world', { q: '' }),
		).toStrictEqual({
			preset: undefined,
		});
	});
	it('should return preset : all-sports for a secondary level preset', () => {
		expect(
			keyValueAfterDeselection('preset', 'no-soccer', { q: '' }),
		).toStrictEqual({
			preset: topLevelSportId,
		});
	});
});
