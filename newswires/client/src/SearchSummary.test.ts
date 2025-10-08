import { updateQuery } from './SearchSummary';

describe('updateQuery', () => {
	it('should return an empty query string when q is the key', () => {
		expect(updateQuery('q', 'hello', { q: 'hello' })).toStrictEqual({ q: '' });
	});
	it('should return dateRange : undefined when dateRange is the key', () => {
		expect(updateQuery('dateRange', 'hello', { q: 'hello' })).toStrictEqual({
			dateRange: undefined,
		});
	});
	it('should return categoryCode : [] when categoryCode is key and existing categoryCode is empty', () => {
		expect(updateQuery('categoryCode', 'hello', { q: 'hello' })).toStrictEqual({
			categoryCode: [],
		});
	});
	it('should return categoryCode : [] when categoryCode is key and existing categoryCode has no other code', () => {
		expect(
			updateQuery('categoryCode', 'code', {
				q: 'hello',
				categoryCode: ['code'],
			}),
		).toStrictEqual({ categoryCode: [] });
	});
	it('should only remove input categoryCode when categoryCode is key and there are existing categoryCode', () => {
		expect(
			updateQuery('categoryCode', 'code', {
				q: 'hello',
				categoryCode: ['code', 'sheep'],
			}),
		).toStrictEqual({ categoryCode: ['sheep'] });
	});
	it('should remove keywordExcl value correctly', () => {
		expect(
			updateQuery('keywordExcl', 'bar', { q: '', keywordExcl: ['foo', 'bar'] }),
		).toStrictEqual({ keywordExcl: ['foo'] });
	});
});
