import { sampleWireData } from '../tests/fixtures/wireData.ts';
import type { Action, State } from './SearchContext.tsx';
import { SearchReducer } from './SearchReducer';

describe('SearchReducer', () => {
	const initialState: State = {
		status: 'loading',
		successfulQueryHistory: [],
		autoUpdate: true,
	};

	it('should handle FETCH_SUCCESS action in loading state', () => {
		const action: Action = {
			type: 'FETCH_SUCCESS',
			data: { results: [sampleWireData] },
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

	it('should handle FETCH_ERROR action in loading state', () => {
		const action: Action = {
			type: 'FETCH_ERROR',
			error: 'Fetch failed',
		};

		const newState = SearchReducer(initialState, action);

		expect(newState.status).toBe('error');
		expect(newState.error).toEqual(action.error);
	});

	it('should handle UPDATE_RESULTS action in success state', () => {
		const state: State = {
			...initialState,
			status: 'success',
			queryData: { results: [{ ...sampleWireData, id: 1 }] },
		};

		const action: Action = {
			type: 'UPDATE_RESULTS',
			data: { results: [{ ...sampleWireData, id: 2 }] },
		};

		const newState = SearchReducer(state, action);

		expect(newState.status).toBe('success');
		expect(newState.queryData?.results).toHaveLength(2);
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

	it('should handle ENTER_QUERY action in success state', () => {
		const state: State = {
			...initialState,
			status: 'success',
			queryData: { results: [sampleWireData] },
		};

		const action: Action = {
			type: 'ENTER_QUERY',
		};

		const newState = SearchReducer(state, action);

		expect(newState.status).toBe('loading');
	});

	it('should handle TOGGLE_AUTO_UPDATE action in success state', () => {
		const state: State = {
			...initialState,
			status: 'success',
			queryData: { results: [sampleWireData] },
		};

		const action: Action = {
			type: 'TOGGLE_AUTO_UPDATE',
		};

		const newState = SearchReducer(state, action);

		expect(newState.autoUpdate).toBe(false);
	});

	it('should handle FETCH_ERROR action in success state', () => {
		const state: State = {
			...initialState,
			status: 'success',
			queryData: { results: [sampleWireData] },
		};

		const action: Action = {
			type: 'FETCH_ERROR',
			error: 'Fetch failed',
		};

		const newState = SearchReducer(state, action);

		expect(newState.status).toBe('offline');
		expect(newState.error).toEqual(action.error);
	});

	it('should handle UPDATE_RESULTS action in offline state', () => {
		const state: State = {
			status: 'offline',
			queryData: { results: [{ ...sampleWireData, id: 1 }] },
			successfulQueryHistory: [],
			error: 'Network error',
			autoUpdate: true,
		};

		const action: Action = {
			type: 'UPDATE_RESULTS',
			data: { results: [{ ...sampleWireData, id: 2 }] },
		};

		const newState = SearchReducer(state, action);

		expect(newState.status).toBe('success');
		expect(newState.queryData?.results).toHaveLength(2);
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

	it('should handle UPDATE_RESULTS action in error state', () => {
		const state: State = {
			status: 'error',
			queryData: { results: [{ ...sampleWireData, id: 1 }] },
			successfulQueryHistory: [],
			error: 'Fetch error',
			autoUpdate: true,
		};

		const action: Action = {
			type: 'UPDATE_RESULTS',
			data: { results: [{ ...sampleWireData, id: 2 }] },
		};

		const newState = SearchReducer(state, action);

		expect(newState.status).toBe('success');
		expect(newState.queryData?.results).toHaveLength(2);
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

	it('should handle RETRY action in error state', () => {
		const state: State = {
			status: 'error',
			successfulQueryHistory: [],
			error: 'Fetch error',
			autoUpdate: true,
		};

		const action: Action = {
			type: 'RETRY',
		};

		const newState = SearchReducer(state, action);

		expect(newState.status).toBe('loading');
	});

	it('should handle ENTER_QUERY action in error state', () => {
		const state: State = {
			status: 'error',
			queryData: undefined,
			successfulQueryHistory: [],
			error: 'Fetch error',
			autoUpdate: true,
		};

		const action: Action = {
			type: 'ENTER_QUERY',
		};

		const newState = SearchReducer(state, action);

		expect(newState.status).toBe('loading');
	});
});
