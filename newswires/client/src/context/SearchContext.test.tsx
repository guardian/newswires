import { act, render } from '@testing-library/react';
import type { Mock } from 'vitest';
import type { Query, WiresQueryResponse } from '../sharedTypes.ts';
import { sampleWireResponse } from '../tests/fixtures/wireData.ts';
import { flushPendingPromises } from '../tests/testHelpers.ts';
import type { SearchContextShape } from './SearchContext.tsx';
import { SearchContextProvider, useSearch } from './SearchContext.tsx';
import { TelemetryContextProvider } from './TelemetryContext.tsx';

const mockResponseData: WiresQueryResponse = {
	results: [],
	totalCount: 0,
	countQueryCap: 100,
	queryTimestamp: '2024-01-01T00:00:00.000Z',
};

global.fetch = vi.fn(() =>
	Promise.resolve({
		json: () => Promise.resolve(mockResponseData),
		ok: true,
	}),
) as Mock;

describe('SearchContext', () => {
	let mockSendTelemetryEvent: Mock;

	const renderWithContext = async () => {
		mockSendTelemetryEvent = vi.fn();

		const contextRef = { current: null as SearchContextShape | null };

		const TestComponent: React.FC = () => {
			// eslint-disable-next-line react-hooks/immutability -- this isn't a 'real' component or ref, we're just using this to get access to the context value in our tests
			contextRef.current = useSearch();
			return null;
		};

		act(() => {
			render(
				<TelemetryContextProvider sendTelemetryEvent={mockSendTelemetryEvent}>
					<SearchContextProvider>
						<TestComponent />
					</SearchContextProvider>
				</TelemetryContextProvider>,
			);
		});

		await flushPendingPromises();

		return contextRef;
	};

	beforeEach(() => {
		vi.clearAllMocks();
		localStorage.clear();
		window.open = vi.fn();
	});

	it('should fetch data and initialise the state', async () => {
		const contextRef = await renderWithContext();

		if (!contextRef.current) {
			throw new Error('Context ref was null after render.');
		}

		expect(contextRef.current.state.autoUpdate).toEqual(true);
		expect(contextRef.current.state.status).toEqual('success');
		expect(contextRef.current.state.queryData).toEqual({
			results: [],
			totalCount: 0,
			countQueryCap: 100,
			queryTimestamp: '2024-01-01T00:00:00.000Z',
		});
		expect(contextRef.current.state.successfulQueryHistory).toEqual([]);
	});

	it('should handle search query', async () => {
		const contextRef = await renderWithContext();
		if (!contextRef.current) {
			throw new Error('Context ref was null after render.');
		}

		const q: Query = {
			q: 'text search term',
			supplier: ['A', 'B'],
			preset: undefined,
			collectionId: undefined,
		};

		act(() => {
			contextRef.current?.handleEnterQuery(q);
		});

		await flushPendingPromises();

		expect(mockSendTelemetryEvent).toHaveBeenCalledWith(
			'NEWSWIRES_ENTER_SEARCH',
			expect.objectContaining({
				'search-query_q': '"text search term"',
				'search-query_supplier': '["A","B"]',
			}),
		);
		expect(contextRef.current.config.query).toBe(q);
	});

	it('should handle ticker', async () => {
		const contextRef = await renderWithContext();
		if (!contextRef.current) {
			throw new Error('Context ref was null after render.');
		}

		const expectedUrl = '/ticker/feed?q=text+search+term&supplier=A&supplier=B';
		const expectedWindowFeatures =
			'popout=true,width=400,height=800,top=200,location=no,menubar=no,toolbar=no';

		const q: Query = {
			q: 'text search term',
			supplier: ['A', 'B'],
			preset: undefined,
			collectionId: undefined,
		};

		act(() => {
			contextRef.current?.openTicker(q);
		});

		expect(mockSendTelemetryEvent).toHaveBeenCalledWith(
			'NEWSWIRES_OPEN_TICKER',
			expect.objectContaining({
				'search-query_q': '"text search term"',
				'search-query_supplier': '["A","B"]',
			}),
		);
		expect(window.open).toHaveBeenCalledTimes(1);
		expect(window.open).toHaveBeenCalledWith(
			expectedUrl,
			'_blank',
			expectedWindowFeatures,
		);
	});

	it('should toggle the auto update flag', async () => {
		const contextRef = await renderWithContext();

		if (!contextRef.current) {
			throw new Error('Context ref was null after render.');
		}

		expect(contextRef.current.state.autoUpdate).toBe(true);

		act(() => {
			contextRef.current?.toggleAutoUpdate();
		});

		expect(mockSendTelemetryEvent).toHaveBeenCalledWith(
			'NEWSWIRES_TOGGLE_AUTO_UPDATE',
			expect.any(Object),
		);
		expect(contextRef.current.state.autoUpdate).toBe(false);
	});

	it('should trigger periodic fetch calls', async () => {
		vi.useFakeTimers();
		try {
			const contextRef = await renderWithContext();

			if (!contextRef.current) {
				throw new Error('Context ref was null after render.');
			}

			expect(global.fetch).toHaveBeenCalledTimes(1);

			await act(async () => {
				await vi.advanceTimersByTimeAsync(6000);
			});

			expect(global.fetch).toHaveBeenCalledTimes(2);
		} finally {
			vi.useRealTimers();
		}
	});

	it('should add item ids to the view history on item navigation', async () => {
		const contextRef = await renderWithContext();

		if (!contextRef.current) {
			throw new Error('Context ref was null after render.');
		}

		expect(contextRef.current.viewedItemIds).toEqual([]);

		act(() => {
			contextRef.current?.handleSelectItem('111');
		});

		expect(contextRef.current.viewedItemIds).toEqual(['111']);
	});

	it('should store the view history in local storage', async () => {
		const contextRef = await renderWithContext();

		if (!contextRef.current) {
			throw new Error('Context ref was null after render.');
		}

		expect(contextRef.current.viewedItemIds).toEqual([]);

		act(() => {
			contextRef.current?.handleSelectItem('111');
		});

		expect(contextRef.current.viewedItemIds).toEqual(['111']);
		expect(localStorage.getItem('viewedItemIds')).toEqual('["111"]');

		// Re-render the component
		const newContextRef = await renderWithContext();

		if (!newContextRef.current) {
			throw new Error('Context ref was null after render.');
		}

		expect(newContextRef.current.viewedItemIds).toEqual(['111']);
	});

	it('should deduplicate item ids in the view history', async () => {
		const contextRef = await renderWithContext();

		if (!contextRef.current) {
			throw new Error('Context ref was null after render.');
		}

		expect(contextRef.current.viewedItemIds).toEqual([]);

		act(() => {
			contextRef.current?.handleSelectItem('1');
		});
		act(() => {
			contextRef.current?.handleSelectItem('2');
		});
		act(() => {
			contextRef.current?.handleSelectItem('1');
		});

		expect(contextRef.current.viewedItemIds).toEqual(['1', '2']);
	});

	it('should not let loadMoreResults change the afterTimeStamp used by the next poll', async () => {
		const initialQueryTimestamp = '2025-06-01T00:00:00.000Z';
		const loadMoreQueryTimestamp = '2025-06-02T00:00:00.000Z';

		const originalFetch = global.fetch;

		global.fetch = vi.fn((url: string) => {
			const body: WiresQueryResponse = url.includes('beforeTimeStamp')
				? {
						results: [
							{
								...sampleWireResponse,
								id: 2,
								ingestedAt: '2024-12-31T00:00:00Z',
							},
						],
						totalCount: 2,
						countQueryCap: 100,
						queryTimestamp: loadMoreQueryTimestamp,
					}
				: {
						results: [
							{
								...sampleWireResponse,
								id: 1,
								ingestedAt: '2025-01-01T00:00:00Z',
							},
						],
						totalCount: 1,
						countQueryCap: 100,
						queryTimestamp: initialQueryTimestamp,
					};
			return Promise.resolve({
				json: () => Promise.resolve(body),
				ok: true,
			});
		}) as Mock;

		vi.useFakeTimers();
		try {
			const contextRef = await renderWithContext();
			if (!contextRef.current) {
				throw new Error('Context ref was null after render.');
			}
			await flushPendingPromises();

			// the poll cursor is seeded from the initial fetch's queryTimestamp
			expect(contextRef.current.state.queryData?.queryTimestamp).toBe(
				initialQueryTimestamp,
			);

			// load more (older) results in between polls
			await act(async () => {
				await contextRef.current?.loadMoreResults();
			});

			// loading older results must not move the poll cursor forward
			expect(contextRef.current.state.queryData?.queryTimestamp).toBe(
				initialQueryTimestamp,
			);

			// trigger the next poll
			await act(async () => {
				await vi.advanceTimersByTimeAsync(6000);
			});

			const pollAfterTimeStamps = (global.fetch as Mock).mock.calls
				.map((call: unknown[]) => call[0] as string)
				.filter((url: string) => url.includes('afterTimeStamp'))
				.map((url: string) =>
					new URL(url, 'http://localhost').searchParams.get('afterTimeStamp'),
				);

			expect(pollAfterTimeStamps.length).toBeGreaterThan(0);
			pollAfterTimeStamps.forEach((afterTimeStamp: string | null) => {
				expect(afterTimeStamp).toBe(initialQueryTimestamp);
			});
		} finally {
			vi.useRealTimers();
			global.fetch = originalFetch;
		}
	});
});
