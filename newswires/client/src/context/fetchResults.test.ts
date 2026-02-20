import { DEFAULT_DATE_RANGE } from '../dateConstants.ts';
import { pandaFetch } from '../panda-session';
import { sampleWireResponse } from '../tests/fixtures/wireData.ts';
import { paramsToQuerystring } from '../urlState';
import { fetchResults } from './fetchResults.ts';
import { transformWireItemQueryResult } from './transformQueryResponse.ts';

jest.mock('../urlState', () => ({
	paramsToQuerystring: jest.fn(() => '?queryString'),
}));

jest.mock('../panda-session', () => ({
	pandaFetch: jest.fn(() =>
		Promise.resolve({
			json: jest
				.fn()
				.mockResolvedValue({ results: [sampleWireResponse], totalCount: 0 }),
			ok: true,
		}),
	),
}));

const mockQuery = { q: 'value', start: DEFAULT_DATE_RANGE.start };

describe('fetchResults', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should call pandaFetch with correct URL and headers', async () => {
		await fetchResults({ query: mockQuery, view: 'feed' });

		expect(paramsToQuerystring).toHaveBeenCalledWith({
			query: mockQuery,
			useAbsoluteDateTimeValues: true,
		});
		expect(pandaFetch).toHaveBeenCalledWith('/api/search?queryString', {
			headers: { Accept: 'application/json' },
		});
	});

	it('should throw an error if response is not ok', async () => {
		(pandaFetch as jest.Mock).mockResolvedValueOnce({
			json: jest.fn().mockResolvedValue({
				error: { exception: { description: 'Error occurred' } },
			}),
			ok: false,
		});

		await expect(
			fetchResults({ query: mockQuery, view: 'feed' }),
		).rejects.toThrow('Error occurred');
	});

	it('should throw an error if response data is invalid', async () => {
		(pandaFetch as jest.Mock).mockResolvedValueOnce({
			json: jest.fn().mockResolvedValue({ invalidData: true }),
			ok: true,
		});

		await expect(
			fetchResults({ query: mockQuery, view: 'feed' }),
		).rejects.toThrow('Received invalid data from server');
	});

	it('should return parsed data if response is valid', async () => {
		const mockResponseData = {
			results: [],
			totalCount: 0,
		};

		(pandaFetch as jest.Mock).mockResolvedValueOnce({
			json: jest.fn().mockResolvedValue(mockResponseData),
			ok: true,
		});

		const result = await fetchResults({ query: mockQuery, view: 'feed' });
		expect(result).toEqual(mockResponseData);
	});

	it('should append sinceId to the query if provided', async () => {
		await fetchResults({
			query: mockQuery,
			view: 'feed',
			afterTimeStamp: '2026-01-07T15:37:15Z',
		});

		expect(paramsToQuerystring).toHaveBeenCalledWith({
			query: mockQuery,
			useAbsoluteDateTimeValues: true,
			afterTimeStamp: '2026-01-07T15:37:15Z',
		});
	});

	it('should append beforeId to the query if provided', async () => {
		await fetchResults({
			query: mockQuery,
			view: 'feed',
			beforeTimeStamp: '2026-01-07T15:37:15Z',
		});

		expect(paramsToQuerystring).toHaveBeenCalledWith({
			query: mockQuery,
			useAbsoluteDateTimeValues: true,
			beforeTimeStamp: '2026-01-07T15:37:15Z',
		});
	});

	it('should transform the results using transformWireItemQueryResult', async () => {
		const results = await fetchResults({ query: mockQuery, view: 'feed' });
		expect(results.results).toHaveLength(1);
		expect(results.results[0]).toEqual(
			transformWireItemQueryResult(sampleWireResponse),
		);
	});
});
