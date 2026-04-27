import { pandaFetch } from '../panda-session';
import type { WiresQueryResponse } from '../sharedTypes.ts';
import { EuiDateStringSchema } from '../sharedTypes.ts';
import { sampleWireResponse } from '../tests/fixtures/wireData.ts';
import { paramsToQuerystring } from '../urlState.ts';
import { fetchResults } from './fetchResults.ts';
import { transformWireItemQueryResult } from './transformQueryResponse.ts';

// mock Date.now to ensure consistent test results when processing relative date ranges
jest
	.spyOn(Date, 'now')
	.mockReturnValue(new Date('2024-02-24T16:15:00.000Z').getTime());

const mockResponseData: WiresQueryResponse = {
	results: [sampleWireResponse],
	totalCount: 0,
	countQueryCap: 100,
};

jest.mock('../panda-session', () => ({
	pandaFetch: jest.fn(() =>
		Promise.resolve({
			json: jest.fn().mockResolvedValue(mockResponseData),
			ok: true,
		}),
	),
}));

describe('fetchResults', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should call pandaFetch with correct URL and headers', async () => {
		const mockQuery = {
			q: 'value',
			start: EuiDateStringSchema.parse('now-15m'),
			collectionId: undefined,
			preset: undefined,
		};
		await fetchResults({ query: mockQuery, view: 'feed' });

		expect(pandaFetch).toHaveBeenCalledWith(
			`/api/search${paramsToQuerystring({ query: mockQuery, useAbsoluteDateTimeValues: true })}`,
			{
				headers: { Accept: 'application/json' },
			},
		);
	});

	it('should throw an error if response is not ok', async () => {
		(pandaFetch as jest.Mock).mockResolvedValueOnce({
			json: jest.fn().mockResolvedValue({
				error: { exception: { description: 'Error occurred' } },
			}),
			ok: false,
		});

		await expect(
			fetchResults({
				query: { q: 'value', collectionId: undefined, preset: undefined },
				view: 'feed',
			}),
		).rejects.toThrow('Error occurred');
	});

	it('should throw an error if response data is invalid', async () => {
		(pandaFetch as jest.Mock).mockResolvedValueOnce({
			json: jest.fn().mockResolvedValue({ invalidData: true }),
			ok: true,
		});

		await expect(
			fetchResults({
				query: { q: 'value', collectionId: undefined, preset: undefined },
				view: 'feed',
			}),
		).rejects.toThrow('Received invalid data from server');
	});

	it('should return parsed data if response is valid', async () => {
		const result = await fetchResults({
			query: { q: 'value', collectionId: undefined, preset: undefined },
			view: 'feed',
		});
		expect(result).toEqual({
			...mockResponseData,
			results: [...mockResponseData.results.map(transformWireItemQueryResult)],
		});
	});

	it('should append afterTimeStamp to the query if provided', async () => {
		const mockQuery = {
			q: 'value',
			collectionId: undefined,
			preset: undefined,
		};
		await fetchResults({
			query: mockQuery,
			view: 'feed',
			afterTimeStamp: '2026-01-07T15:37:15Z',
		});
		expect(pandaFetch).toHaveBeenCalledWith(
			`/api/search${paramsToQuerystring({ query: mockQuery, useAbsoluteDateTimeValues: true })}&afterTimeStamp=${encodeURIComponent('2026-01-07T15:37:15Z')}`,
			expect.objectContaining({
				headers: { Accept: 'application/json' },
			}),
		);
	});

	it('should append beforeTimeStamp to the query if provided', async () => {
		const mockQuery = {
			q: 'value',
			collectionId: undefined,
			preset: undefined,
		};
		await fetchResults({
			query: mockQuery,
			view: 'feed',
			beforeTimeStamp: '2026-01-07T15:37:15Z',
		});
		expect(pandaFetch).toHaveBeenCalledWith(
			`/api/search${paramsToQuerystring({ query: mockQuery, useAbsoluteDateTimeValues: true })}&beforeTimeStamp=${encodeURIComponent('2026-01-07T15:37:15Z')}`,
			expect.objectContaining({
				headers: { Accept: 'application/json' },
			}),
		);
	});

	it('should transform the results using transformWireItemQueryResult', async () => {
		const mockQuery = {
			q: 'value',
			collectionId: undefined,
			preset: undefined,
		};
		const results = await fetchResults({ query: mockQuery, view: 'feed' });
		expect(results.results).toHaveLength(1);
		expect(results.results[0]).toEqual(
			transformWireItemQueryResult(sampleWireResponse),
		);
	});
});
