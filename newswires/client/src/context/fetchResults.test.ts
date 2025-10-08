import { pandaFetch } from '../panda-session';
import { sampleWireResponse } from '../tests/fixtures/wireData.ts';
import { defaultQuery, paramsToQuerystring } from '../urlState';
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

describe('fetchResults', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should call pandaFetch with correct URL and headers', async () => {
		const mockQuery = { ...defaultQuery, q: 'value' };
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
			fetchResults({ query: { ...defaultQuery, q: 'value' }, view: 'feed' }),
		).rejects.toThrow('Error occurred');
	});

	it('should throw an error if response data is invalid', async () => {
		(pandaFetch as jest.Mock).mockResolvedValueOnce({
			json: jest.fn().mockResolvedValue({ invalidData: true }),
			ok: true,
		});

		await expect(
			fetchResults({ query: { ...defaultQuery, q: 'value' }, view: 'feed' }),
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

		const result = await fetchResults({
			query: { ...defaultQuery, q: 'value' },
			view: 'feed',
		});
		expect(result).toEqual(mockResponseData);
	});

	it('should append sinceId to the query if provided', async () => {
		const mockQuery = { ...defaultQuery, q: 'value' };
		await fetchResults({ query: mockQuery, view: 'feed', sinceId: '123' });

		expect(paramsToQuerystring).toHaveBeenCalledWith({
			query: mockQuery,
			useAbsoluteDateTimeValues: true,
			sinceId: '123',
		});
	});

	it('should append beforeId to the query if provided', async () => {
		const mockQuery = { ...defaultQuery, q: 'value' };
		await fetchResults({
			query: mockQuery,
			view: 'feed',
			beforeId: '123',
		});

		expect(paramsToQuerystring).toHaveBeenCalledWith({
			query: mockQuery,
			useAbsoluteDateTimeValues: true,
			beforeId: '123',
		});
	});

	it('should transform the results using transformWireItemQueryResult', async () => {
		const mockQuery = { ...defaultQuery, q: 'value' };
		const results = await fetchResults({ query: mockQuery, view: 'feed' });
		expect(results.results).toHaveLength(1);
		expect(results.results[0]).toEqual(
			transformWireItemQueryResult(sampleWireResponse),
		);
	});
});
