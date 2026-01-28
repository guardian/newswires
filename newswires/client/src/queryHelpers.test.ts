import { topLevelPresetId, topLevelSportId } from './presets';
import { queryAfterDeselection } from './queryHelpers';

describe('queryAfterDeselection', () => {
	it('should return an empty query string when q is the key', () => {
		expect(
			queryAfterDeselection('q', 'hello', {
				q: 'value',
				collectionId: undefined,
				preset: undefined,
			}),
		).toStrictEqual({
			q: '',
			collectionId: undefined,
			preset: undefined,
		});
	});
	it('should return dateRange : undefined when dateRange is the key', () => {
		expect(
			queryAfterDeselection('dateRange', 'hello', {
				q: 'value',
				collectionId: undefined,
				preset: undefined,
			}),
		).toStrictEqual({
			q: 'value',
			collectionId: undefined,
			preset: undefined,
			dateRange: undefined,
		});
	});
	it('should return categoryCode : [] when categoryCode is key and existing categoryCode is empty', () => {
		expect(
			queryAfterDeselection('categoryCode', 'hello', {
				q: 'value',
				collectionId: undefined,
				preset: undefined,
			}),
		).toStrictEqual({
			q: 'value',
			collectionId: undefined,
			preset: undefined,
			categoryCode: [],
		});
	});
	it('should return categoryCode : [] when categoryCode is key and existing categoryCode has no other code', () => {
		expect(
			queryAfterDeselection('categoryCode', 'code', {
				q: 'value',
				collectionId: undefined,
				preset: undefined,
				categoryCode: ['code'],
			}),
		).toStrictEqual({
			q: 'value',
			collectionId: undefined,
			preset: undefined,
			categoryCode: [],
		});
	});
	it('should only remove input categoryCode when categoryCode is key and there are existing categoryCode', () => {
		expect(
			queryAfterDeselection('categoryCode', 'code', {
				q: 'value',
				collectionId: undefined,
				preset: undefined,
				categoryCode: ['code', 'sheep'],
			}),
		).toStrictEqual({
			q: 'value',
			collectionId: undefined,
			preset: undefined,
			categoryCode: ['sheep'],
		});
	});
	it('should remove keywordExcl value correctly', () => {
		expect(
			queryAfterDeselection('keywordExcl', 'bar', {
				q: 'value',
				collectionId: undefined,
				preset: undefined,
				keywordExcl: ['foo', 'bar'],
			}),
		).toStrictEqual({
			q: 'value',
			collectionId: undefined,
			preset: undefined,
			keywordExcl: ['foo'],
		});
	});
	it('should return preset : undefined for a top level preset', () => {
		expect(
			queryAfterDeselection('preset', 'all-world', {
				q: 'value',
				collectionId: undefined,
				preset: 'all-world',
			}),
		).toStrictEqual({
			q: 'value',
			collectionId: undefined,
			preset: topLevelPresetId,
		});
	});
	it('should return preset : all-sports for a secondary level preset', () => {
		expect(
			queryAfterDeselection('preset', 'no-soccer', {
				q: 'value',
				collectionId: undefined,
				preset: 'no-soccer',
			}),
		).toStrictEqual({
			q: 'value',
			collectionId: undefined,
			preset: topLevelSportId,
		});
	});
});
