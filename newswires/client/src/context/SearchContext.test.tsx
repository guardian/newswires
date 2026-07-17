import { act, renderHook } from '@testing-library/react';
import type { Mock } from 'vitest';
import type { Query, WiresQueryResponse } from '../sharedTypes.ts';
import { flushPendingPromises } from '../tests/testHelpers.ts';
import { SearchContextProvider, useSearch } from './SearchContext.tsx';
import { TelemetryContextProvider } from './TelemetryContext.tsx';

const mockResponseData: WiresQueryResponse = {
	results: [],
	totalCount: 0,
	countQueryCap: 100,
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

		const { result } = renderHook(() => useSearch(), {
			wrapper: ({ children }) => (
				<TelemetryContextProvider sendTelemetryEvent={mockSendTelemetryEvent}>
					<SearchContextProvider>{children}</SearchContextProvider>
				</TelemetryContextProvider>
			),
		});

		await flushPendingPromises();

		return result;
	};

	beforeEach(() => {
		vi.clearAllMocks();
		localStorage.clear();
		window.open = vi.fn();
	});

	it('should fetch data and initialise the state', async () => {
		const contextRef = await renderWithContext();

		expect(contextRef.current.state.autoUpdate).toEqual(true);
		expect(contextRef.current.state.status).toEqual('success');
		expect(contextRef.current.state.queryData).toEqual({
			results: [],
			totalCount: 0,
			countQueryCap: 100,
		});
		expect(contextRef.current.state.successfulQueryHistory).toEqual([]);
	});

	it('should handle search query', async () => {
		const contextRef = await renderWithContext();

		const q: Query = {
			q: 'text search term',
			supplier: ['A', 'B'],
			preset: undefined,
			collectionId: undefined,
		};

		act(() => {
			contextRef.current.handleEnterQuery(q);
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
			contextRef.current.openTicker(q);
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

		expect(contextRef.current.state.autoUpdate).toBe(true);

		act(() => {
			contextRef.current.toggleAutoUpdate();
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
			await renderWithContext();

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

		expect(contextRef.current.viewedItemIds).toEqual([]);

		act(() => {
			contextRef.current.handleSelectItem('111');
		});

		expect(contextRef.current.viewedItemIds).toEqual(['111']);
	});

	it('should store the view history in local storage', async () => {
		const contextRef = await renderWithContext();

		expect(contextRef.current.viewedItemIds).toEqual([]);

		act(() => {
			contextRef.current.handleSelectItem('111');
		});

		expect(contextRef.current.viewedItemIds).toEqual(['111']);
		expect(localStorage.getItem('viewedItemIds')).toEqual('["111"]');

		// Re-render the component
		const newContextRef = await renderWithContext();

		expect(newContextRef.current.viewedItemIds).toEqual(['111']);
	});

	it('should deduplicate item ids in the view history', async () => {
		const contextRef = await renderWithContext();

		expect(contextRef.current.viewedItemIds).toEqual([]);

		act(() => {
			contextRef.current.handleSelectItem('1');
		});
		act(() => {
			contextRef.current.handleSelectItem('2');
		});
		act(() => {
			contextRef.current.handleSelectItem('1');
		});

		expect(contextRef.current.viewedItemIds).toEqual(['1', '2']);
	});
});
