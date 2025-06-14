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

describe('fetchResults', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should call pandaFetch with correct URL and headers', async () => {
		const mockQuery = { q: 'value' };
		await fetchResults(mockQuery);

		expect(paramsToQuerystring).toHaveBeenCalledWith(mockQuery, true, {});
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

		await expect(fetchResults({ q: 'value' })).rejects.toThrow(
			'Error occurred',
		);
	});

	it('should throw an error if response data is invalid', async () => {
		(pandaFetch as jest.Mock).mockResolvedValueOnce({
			json: jest.fn().mockResolvedValue({ invalidData: true }),
			ok: true,
		});

		await expect(fetchResults({ q: 'value' })).rejects.toThrow(
			'Received invalid data from server',
		);
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

		const result = await fetchResults({ q: 'value' });
		expect(result).toEqual(mockResponseData);
	});

	it('should append sinceId to the query if provided', async () => {
		const mockQuery = { q: 'value' };
		await fetchResults(mockQuery, { sinceId: '123' });

		expect(paramsToQuerystring).toHaveBeenCalledWith(
			{
				...mockQuery,
			},
			true,
			{ sinceId: '123' },
		);
	});

	it('should append beforeId to the query if provided', async () => {
		const mockQuery = { q: 'value' };
		await fetchResults(mockQuery, { beforeId: '123' });

		expect(paramsToQuerystring).toHaveBeenCalledWith(
			{
				...mockQuery,
			},
			true,
			{ beforeId: '123' },
		);
	});

	it('should transform the results using transformWireItemQueryResult', async () => {
		const mockQuery = { q: 'value' };
		const results = await fetchResults(mockQuery);
		expect(results.results).toHaveLength(1);
		expect(results.results[0]).toEqual(
			transformWireItemQueryResult(sampleWireResponse),
		);
	});
});
