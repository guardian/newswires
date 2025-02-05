import { act, render } from '@testing-library/react';
import type { FC } from 'react';
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

		const TestComponent: FC = () => {
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
});
