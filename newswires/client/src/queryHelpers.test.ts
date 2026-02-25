import { topLevelSportId } from './presets';
import { keyValueAfterDeselection } from './queryHelpers';

describe('keyValueAfterDeselection', () => {
	it('should return an empty query string when q is the key', () => {
		expect(
			keyValueAfterDeselection({ key: 'q', value: 'hello' }, { q: 'hello' }),
		).toStrictEqual({
			q: '',
		});
	});
	it('should return start : undefined when start is the key', () => {
		expect(
			keyValueAfterDeselection(
				{ key: 'start', value: 'hello' },
				{ q: 'hello' },
			),
		).toStrictEqual({
			start: undefined,
		});
	});
	it('should return end : undefined when end is the key', () => {
		expect(
			keyValueAfterDeselection({ key: 'end', value: 'hello' }, { q: 'hello' }),
		).toStrictEqual({
			end: undefined,
		});
	});
	it('should return categoryCode : [] when categoryCode is key and existing categoryCode is empty', () => {
		expect(
			keyValueAfterDeselection(
				{ key: 'categoryCode', value: 'hello' },
				{ q: 'hello' },
			),
		).toStrictEqual({
			categoryCode: [],
		});
	});
	it('should return categoryCode : [] when categoryCode is key and existing categoryCode has no other code', () => {
		expect(
			keyValueAfterDeselection(
				{ key: 'categoryCode', value: 'code' },
				{
					q: 'hello',
					categoryCode: ['code'],
				},
			),
		).toStrictEqual({ categoryCode: [] });
	});
	it('should only remove input categoryCode when categoryCode is key and there are existing categoryCode', () => {
		expect(
			keyValueAfterDeselection(
				{ key: 'categoryCode', value: 'code' },
				{
					q: 'hello',
					categoryCode: ['code', 'sheep'],
				},
			),
		).toStrictEqual({ categoryCode: ['sheep'] });
	});
	it('should remove keywordExcl value correctly', () => {
		expect(
			keyValueAfterDeselection(
				{ key: 'keywordExcl', value: 'bar' },
				{
					q: '',
					keywordExcl: ['foo', 'bar'],
				},
			),
		).toStrictEqual({ keywordExcl: ['foo'] });
	});
	it('should return preset : undefined for a top level preset', () => {
		expect(
			keyValueAfterDeselection(
				{ key: 'preset', value: 'all-world' },
				{ q: '' },
			),
		).toStrictEqual({
			preset: undefined,
		});
	});
	it('should return preset : all-sports for a secondary level preset', () => {
		expect(
			keyValueAfterDeselection(
				{ key: 'preset', value: 'no-soccer' },
				{ q: '' },
			),
		).toStrictEqual({
			preset: topLevelSportId,
		});
	});
});
