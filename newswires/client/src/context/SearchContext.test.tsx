import { act, render } from '@testing-library/react';
import type { Query } from '../sharedTypes.ts';
import { disableLogs, flushPendingPromises } from '../tests/testHelpers.ts';
import type { SearchContextShape } from './SearchContext.tsx';
import { SearchContextProvider, useSearch } from './SearchContext.tsx';
import { TelemetryContextProvider } from './TelemetryContext.tsx';

jest.useFakeTimers();

global.fetch = jest.fn(() =>
	Promise.resolve({
		json: () =>
			Promise.resolve({
				results: [],
				totalCount: 0,
			}),
		ok: () => true,
	}),
) as jest.Mock;

describe('SearchContext', () => {
	let mockSendTelemetryEvent: jest.Mock;

	const renderWithContext = async () => {
		mockSendTelemetryEvent = jest.fn();

		const contextRef = { current: null as SearchContextShape | null };

		const TestComponent: React.FC = () => {
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
		jest.clearAllMocks();
		localStorage.clear();
		disableLogs();
		window.open = jest.fn();
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
		};

		act(() => {
			contextRef.current?.handleEnterQuery(q);
		});

		expect(mockSendTelemetryEvent).toHaveBeenCalledTimes(1);
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
		};

		act(() => {
			contextRef.current?.openTicker(q);
		});

		expect(mockSendTelemetryEvent).toHaveBeenCalledTimes(1);
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

	it('should load more stories', async () => {
		const contextRef = await renderWithContext();
		if (!contextRef.current) {
			throw new Error('Context ref was null after render.');
		}

		await act(async () => {
			await contextRef.current?.loadMoreResults('1');
		});

		expect(mockSendTelemetryEvent).toHaveBeenCalledTimes(1);
		expect(mockSendTelemetryEvent).toHaveBeenCalledWith(
			'NEWSWIRES_LOAD_MORE',
			expect.objectContaining({
				beforeId: '1',
			}),
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

		expect(mockSendTelemetryEvent).toHaveBeenCalledTimes(1);
		expect(mockSendTelemetryEvent).toHaveBeenCalledWith(
			'NEWSWIRES_TOGGLE_AUTO_UPDATE',
			expect.any(Object),
		);
		expect(contextRef.current.state.autoUpdate).toBe(false);
	});

	it('should trigger periodic fetch calls', async () => {
		const contextRef = await renderWithContext();

		if (!contextRef.current) {
			throw new Error('Context ref was null after render.');
		}

		expect(global.fetch).toHaveBeenCalledTimes(1);

		act(() => {
			jest.advanceTimersByTime(6000);
		});

		await flushPendingPromises();

		expect(global.fetch).toHaveBeenCalledTimes(2);
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
});
