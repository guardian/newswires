import { topLevelPresetId, topLevelSportId } from './presets';
import { queryAfterDeselection } from './queryHelpers';

describe('keyValueAfterDeselection', () => {
	it('should return an empty query string when q is the key', () => {
		expect(
			queryAfterDeselection(
				{ key: 'q', value: 'hello' },
				{ q: 'hello', collectionId: undefined, preset: undefined },
			),
		).toStrictEqual({
			q: '',
			collectionId: undefined,
			preset: undefined,
		});
	});
	it('should return start : undefined when start is the key', () => {
		expect(
			queryAfterDeselection(
				{ key: 'start', value: 'hello' },
				{ q: 'hello', collectionId: undefined, preset: undefined },
			),
		).toStrictEqual({
			q: 'hello',
			collectionId: undefined,
			preset: undefined,
			start: undefined,
		});
	});
	it('should return end : undefined when end is the key', () => {
		expect(
			queryAfterDeselection(
				{ key: 'end', value: 'hello' },
				{ q: 'hello', collectionId: undefined, preset: undefined },
			),
		).toStrictEqual({
			q: 'hello',
			collectionId: undefined,
			preset: undefined,
			end: undefined,
		});
	});
	it('should return categoryCode : [] when categoryCode is key and existing categoryCode is empty', () => {
		expect(
			queryAfterDeselection(
				{ key: 'categoryCode', value: 'hello' },
				{ q: 'hello', collectionId: undefined, preset: undefined },
			),
		).toStrictEqual({
			q: 'hello',
			collectionId: undefined,
			preset: undefined,
			categoryCode: [],
		});
	});
	it('should return categoryCode : [] when categoryCode is key and existing categoryCode has no other code', () => {
		expect(
			queryAfterDeselection(
				{ key: 'categoryCode', value: 'code' },
				{
					q: 'hello',
					collectionId: undefined,
					preset: undefined,
					categoryCode: ['code'],
				},
			),
		).toStrictEqual({
			q: 'hello',
			collectionId: undefined,
			preset: undefined,
			categoryCode: [],
		});
	});
	it('should only remove input categoryCode when categoryCode is key and there are existing categoryCode', () => {
		expect(
			queryAfterDeselection(
				{ key: 'categoryCode', value: 'code' },
				{
					q: 'hello',
					collectionId: undefined,
					preset: undefined,
					categoryCode: ['code', 'sheep'],
				},
			),
		).toStrictEqual({
			q: 'hello',
			collectionId: undefined,
			preset: undefined,
			categoryCode: ['sheep'],
		});
	});
	it('should remove keywordExcl value correctly', () => {
		expect(
			queryAfterDeselection(
				{ key: 'keywordExcl', value: 'bar' },
				{
					q: '',
					collectionId: undefined,
					preset: undefined,
					keywordExcl: ['foo', 'bar'],
				},
			),
		).toStrictEqual({
			q: '',
			collectionId: undefined,
			preset: undefined,
			keywordExcl: ['foo'],
		});
	});
	it('should return preset : undefined for a top level preset', () => {
		expect(
			queryAfterDeselection(
				{ key: 'preset', value: 'all-world' },
				{ q: '', collectionId: undefined, preset: 'all-world' },
			),
		).toStrictEqual({
			q: '',
			collectionId: undefined,
			preset: topLevelPresetId,
		});
	});
	it('should return preset : all-sports for a secondary level preset', () => {
		expect(
			queryAfterDeselection(
				{ key: 'preset', value: 'no-soccer' },
				{ q: '', collectionId: undefined, preset: 'no-soccer' },
			),
		).toStrictEqual({
			q: '',
			collectionId: undefined,
			preset: topLevelSportId,
		});
	});
});
