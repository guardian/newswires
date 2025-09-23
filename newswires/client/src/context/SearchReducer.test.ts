import dateMath from '@elastic/datemath';
import moment from 'moment';
import { register } from 'timezone-mock';
import { sampleWireData } from '../tests/fixtures/wireData.ts';
import { defaultQuery } from '../urlState.ts';
import type { Action, State } from './SearchContext.tsx';
import { SearchReducer } from './SearchReducer';

register('Etc/GMT');

jest.mock('@elastic/datemath', () => ({
	__esModule: true,
	default: {
		parse: jest.fn(),
	},
}));

describe('SearchReducer', () => {
	const initialState: State = {
		status: 'loading',
		successfulQueryHistory: [],
		autoUpdate: true,
		loadingMore: false,
	};

	const successState: State = {
		...initialState,
		status: 'success',
		queryData: {
			results: [{ ...sampleWireData, ingestedAt: '2025-01-01T00:00:00+00:00' }],
			totalCount: 1,
		},
	};

	const offlineState: State = {
		status: 'offline',
		queryData: {
			results: [{ ...sampleWireData, ingestedAt: '2025-01-01T00:00:00+00:00' }],
			totalCount: 1,
		},
		successfulQueryHistory: [],
		error: 'Network error',
		autoUpdate: true,
		loadingMore: false,
	};

	const errorState: State = {
		status: 'error',
		queryData: {
			results: [{ ...sampleWireData, ingestedAt: '2025-01-01T00:00:00+00:00' }],
			totalCount: 1,
		},
		successfulQueryHistory: [],
		error: 'Fetch error',
		autoUpdate: true,
		loadingMore: false,
	};

	it('should handle FETCH_SUCCESS action in loading state', () => {
		const action: Action = {
			type: 'FETCH_SUCCESS',
			data: { results: [sampleWireData], totalCount: 1 },
			query: { ...defaultQuery, q: 'test' },
		};

		const newState = SearchReducer(initialState, action);

		expect(newState.status).toBe('success');
		expect(newState.queryData?.results).toHaveLength(1);
		expect(newState.queryData?.totalCount).toBe(1);
		expect(newState.queryData?.results).toContainEqual({
			...sampleWireData,
			id: 1,
			ingestedAt: '2025-01-01T00:00:00+00:00',
		});
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
				data: {
					results: [
						{
							...sampleWireData,
							id: 2,
						},
					],
					totalCount: 1,
				},
				query: { ...defaultQuery, q: 'test', dateRange: undefined },
			};

			const newState = SearchReducer(state, action);

			expect(newState.status).toBe('success');
			expect(newState.queryData?.results).toHaveLength(2);
			expect(newState.queryData?.totalCount).toBe(2);
			expect(newState.queryData?.results).toContainEqual({
				...sampleWireData,
				id: 2,
				isFromRefresh: true,
				ingestedAt: '2025-01-01T00:00:00+00:00',
			});
			expect(newState.queryData?.results).toContainEqual({
				...sampleWireData,
				id: 1,
				ingestedAt: '2025-01-01T00:00:00+00:00',
			});
		});
	});

	it(`should filter stories when handling UPDATE_RESULTS action in success state`, () => {
		const state: State = {
			...successState,
			queryData: {
				results: [
					{ ...sampleWireData, id: 1, ingestedAt: '2025-01-01T02:00:00+00:00' },
					{ ...sampleWireData, id: 2, ingestedAt: '2025-01-01T02:05:00+00:00' },
				],
				totalCount: 2,
			},
		};

		(dateMath.parse as jest.Mock).mockImplementation(() =>
			moment('2025-01-01T02:04:00Z'),
		);

		const action: Action = {
			type: 'UPDATE_RESULTS',
			data: {
				results: [
					{
						...sampleWireData,
						id: 4,
						ingestedAt: '2025-01-01T02:07:00+00:00',
					},
					{
						...sampleWireData,
						id: 3,
						ingestedAt: '2025-01-01T02:06:00+00:00',
					},
				],
				totalCount: 2,
			},
			query: {
				...defaultQuery,
				q: 'test',
				dateRange: { start: 'now-30', end: 'now' },
			},
		};

		expect(state.queryData.results).toContainEqual({
			...sampleWireData,
			id: 2,
			ingestedAt: '2025-01-01T02:05:00+00:00',
		});

		expect(state.queryData.results).toContainEqual({
			...sampleWireData,
			id: 1,
			ingestedAt: '2025-01-01T02:00:00+00:00',
		});

		const newState = SearchReducer(state, action);

		expect(newState.status).toBe('success');
		expect(newState.queryData?.results).toHaveLength(3);
		expect(newState.queryData?.totalCount).toBe(3);

		expect(newState.queryData?.results).toContainEqual({
			...sampleWireData,
			id: 4,
			ingestedAt: '2025-01-01T02:07:00+00:00',
			isFromRefresh: true,
		});

		expect(newState.queryData?.results).toContainEqual({
			...sampleWireData,
			id: 3,
			ingestedAt: '2025-01-01T02:06:00+00:00',
			isFromRefresh: true,
		});

		expect(newState.queryData?.results).toContainEqual({
			...sampleWireData,
			id: 2,
			ingestedAt: '2025-01-01T02:05:00+00:00',
		});

		expect(newState.queryData?.results).not.toContainEqual({
			...sampleWireData,
			id: 1,
			ingestedAt: '2025-01-01T02:00:00+00:00',
		});
	});

	it(`should handle APPEND_RESULTS action in success state`, () => {
		const state: State = {
			...successState,
			queryData: {
				results: [
					{ ...sampleWireData, id: 2, ingestedAt: '2025-01-01T00:00:00+00:00' },
				],
				totalCount: 2,
			},
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
			ingestedAt: '2025-01-01T00:00:00+00:00',
		});
		expect(newState.queryData?.results).toContainEqual({
			...sampleWireData,
			id: 2,
			ingestedAt: '2025-01-01T00:00:00+00:00',
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
