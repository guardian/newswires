import { act, render } from '@testing-library/react';
import type React from 'react';
import { flushPendingPromises } from '../tests/testHelpers.ts';
import type { SearchContextShape } from './SearchContext.tsx';
import { SearchContextProvider, useSearch } from './SearchContext.tsx';

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
	const renderWithContext = async () => {
		const contextRef = { current: null as SearchContextShape | null };

		const TestComponent: React.FC = () => {
			contextRef.current = useSearch();
			return null;
		};

		act(() => {
			render(
				<SearchContextProvider>
					<TestComponent />
				</SearchContextProvider>,
			);
		});

		await flushPendingPromises();

		return contextRef;
	};

	beforeEach(() => {
		jest.clearAllMocks();
		localStorage.clear();
	});

	it('should fetch data and initialise the state', async () => {
		const contextRef = await renderWithContext();

		if (!contextRef.current) {
			throw new Error('Context ref was null after render.');
		}

		expect(contextRef.current.state).toEqual({
			autoUpdate: true,
			status: 'success',
			queryData: {
				results: [],
				totalCount: 0,
			},
			successfulQueryHistory: [],
		});
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
