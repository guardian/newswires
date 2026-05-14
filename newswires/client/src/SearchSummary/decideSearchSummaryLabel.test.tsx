import { decideSearchSummaryLabel } from './decideSearchSummaryLabel';

describe('decideSearchSummaryLabel', () => {
	it('should return "No results found" when queryData is undefined', () => {
		expect(decideSearchSummaryLabel(undefined)).toContain('No results');
	});
	it('should return "1 result" when totalCount is 1', () => {
		expect(
			decideSearchSummaryLabel({
				totalCount: 1,
				countQueryCap: 100,
				results: [],
			}),
		).toContain('1 result');
	});
	it('should return "0 results" when totalCount is 0', () => {
		expect(
			decideSearchSummaryLabel({
				totalCount: 0,
				countQueryCap: 100,
				results: [],
			}),
		).toContain('No results');
	});
	it('should return "100+ results" when totalCount is greater than 100', () => {
		expect(
			decideSearchSummaryLabel({
				totalCount: 150,
				countQueryCap: 100,
				results: [],
			}),
		).toContain('100+ results');
	});
	it('should return "50 results" when totalCount is 50', () => {
		expect(
			decideSearchSummaryLabel({
				totalCount: 50,
				countQueryCap: 100,
				results: [],
			}),
		).toContain('50 results');
	});
});
