import { sampleWireData } from '../tests/fixtures/wireData.ts';
import type { Action, State } from './SearchContext.tsx';
import { SearchReducer } from './SearchReducer';

describe('SearchReducer', () => {
	const initialState: State = {
		status: 'loading',
		successfulQueryHistory: [],
		autoUpdate: true,
	};

	const successState: State = {
		...initialState,
		status: 'success',
		queryData: { results: [sampleWireData], totalCount: 1 },
	};

	const offlineState: State = {
		status: 'offline',
		queryData: { results: [sampleWireData], totalCount: 1 },
		successfulQueryHistory: [],
		error: 'Network error',
		autoUpdate: true,
	};

	const errorState: State = {
		status: 'error',
		queryData: { results: [sampleWireData], totalCount: 1 },
		successfulQueryHistory: [],
		error: 'Fetch error',
		autoUpdate: true,
	};

	it('should handle FETCH_SUCCESS action in loading state', () => {
		const action: Action = {
			type: 'FETCH_SUCCESS',
			data: { results: [sampleWireData], totalCount: 1 },
			query: { q: 'test' },
		};

		const newState = SearchReducer(initialState, action);

		expect(newState.status).toBe('success');
		expect(newState.queryData).toEqual(action.data);
		expect(newState.successfulQueryHistory).toEqual([
			{ query: action.query, resultsCount: 1 },
		]);
		expect(newState.error).toBeUndefined();
	});

	[
		{
			state: {
				...initialState,
				autoUpdate: true,
			},
			expectedAutoUpdateValue: false,
		},
		{
			state: {
				...successState,
				autoUpdate: true,
			},
			expectedAutoUpdateValue: false,
		},
	].forEach(({ state, expectedAutoUpdateValue }) => {
		it(`should handle TOGGLE_AUTO_UPDATE action in ${state.status} state`, () => {
			const action: Action = {
				type: 'TOGGLE_AUTO_UPDATE',
			};

			const newState = SearchReducer(state, action);

			expect(newState.autoUpdate).toBe(expectedAutoUpdateValue);
		});
	});

	[successState, offlineState, errorState].forEach((state) => {
		it(`should handle UPDATE_RESULTS action in ${state.status} state`, () => {
			const action: Action = {
				type: 'UPDATE_RESULTS',
				data: { results: [{ ...sampleWireData, id: 2 }], totalCount: 1 },
			};

			const newState = SearchReducer(state, action);

			expect(newState.status).toBe('success');
			expect(newState.queryData?.results).toHaveLength(2);
			expect(newState.queryData?.totalCount).toBe(2);
			expect(newState.queryData?.results).toContainEqual({
				...sampleWireData,
				id: 2,
				isFromRefresh: true,
			});
			expect(newState.queryData?.results).toContainEqual({
				...sampleWireData,
				id: 1,
			});
		});
	});

	it(`should handle APPEND_RESULTS action in success state`, () => {
		const state: State = {
			...successState,
			queryData: { results: [{ ...sampleWireData, id: 2 }], totalCount: 2 },
		};

		const action: Action = {
			type: 'APPEND_RESULTS',
			data: { results: [{ ...sampleWireData, id: 1 }], totalCount: 1 },
		};

		const newState = SearchReducer(state, action);

		expect(newState.status).toBe('success');
		expect(newState.queryData?.totalCount).toBe(2);
		expect(newState.queryData?.results).toHaveLength(2);
		expect(newState.queryData?.results).toContainEqual({
			...sampleWireData,
			id: 1,
		});
		expect(newState.queryData?.results).toContainEqual({
			...sampleWireData,
			id: 2,
		});
	});

	[
		{ state: initialState, expectedStatus: 'error' },
		{ state: successState, expectedStatus: 'offline' },
	].forEach(({ state, expectedStatus }) => {
		it(`should handle FETCH_ERROR action in ${state.status} state`, () => {
			const action: Action = {
				type: 'FETCH_ERROR',
				error: 'Fetch failed',
			};

			const newState = SearchReducer(state, action);

			expect(newState.status).toBe(expectedStatus);
			expect(newState.error).toEqual(action.error);
		});
	});

	it('should handle RETRY action in error state', () => {
		const action: Action = {
			type: 'RETRY',
		};

		const newState = SearchReducer(errorState, action);

		expect(newState.status).toBe('loading');
	});

	[successState, offlineState, errorState].forEach((state) => {
		it(`should handle ENTER_QUERY action in ${state.status} state`, () => {
			const action: Action = {
				type: 'ENTER_QUERY',
			};

			const newState = SearchReducer(state, action);

			expect(newState.status).toBe('loading');
		});
	});
});
