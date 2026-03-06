import { register } from 'timezone-mock';
import { EuiDateStringSchema } from '../sharedTypes.ts';
import { sampleWireData } from '../tests/fixtures/wireData.ts';
import type { Action, State } from './SearchContext.tsx';
import { SearchReducer } from './SearchReducer';

register('Etc/GMT');

// mock date.now to return a fixed timestamp for consistent test results
const FIXED_TIMESTAMP = new Date('2025-01-01T02:04:00Z').getTime();
jest.spyOn(Date, 'now').mockImplementation(() => FIXED_TIMESTAMP);

describe('SearchReducer', () => {
	const initialState: State = {
		status: 'loading',
		successfulQueryHistory: [],
		autoUpdate: true,
		loadingMore: false,
		sortBy: { sortByKey: 'ingestedAt' },
	};

	const successState: State = {
		...initialState,
		status: 'success',
		queryData: {
			results: [{ ...sampleWireData }],
			totalCount: 1,
		},
	};

	const offlineState: State = {
		status: 'offline',
		queryData: {
			results: [{ ...sampleWireData }],
			totalCount: 1,
		},
		successfulQueryHistory: [],
		error: 'Network error',
		autoUpdate: true,
		loadingMore: false,
		sortBy: { sortByKey: 'ingestedAt' },
	};

	const errorState: State = {
		status: 'error',
		queryData: {
			results: [{ ...sampleWireData }],
			totalCount: 1,
		},
		successfulQueryHistory: [],
		error: 'Fetch error',
		autoUpdate: true,
		loadingMore: false,
		sortBy: { sortByKey: 'ingestedAt' },
	};

	it('should handle FETCH_SUCCESS action in loading state', () => {
		const action: Action = {
			type: 'FETCH_SUCCESS',
			data: { results: [sampleWireData], totalCount: 1 },
			query: { q: 'test', collectionId: undefined, preset: undefined },
		};

		const newState = SearchReducer(initialState, action);

		expect(newState.status).toBe('success');
		expect(newState.queryData?.results).toHaveLength(1);
		expect(newState.queryData?.totalCount).toBe(1);
		expect(newState.queryData?.results).toContainEqual({
			...sampleWireData,
			id: 1,
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
				query: { q: 'test', collectionId: undefined, preset: undefined },
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

	describe('handling of UPDATE_RESULTS action in success state', () => {
		describe('filtering out results which have fallen outside of the query date window since they were loaded', () => {
			it(`should remove old results based on ingested_at, by default`, () => {
				const state: State = {
					...successState,
					queryData: {
						results: [
							{ ...sampleWireData, id: 1, ingestedAt: '2025-01-01T00:00:00Z' },
							{ ...sampleWireData, id: 2, ingestedAt: '2025-01-01T02:04:00Z' },
						],
						totalCount: 2,
					},
				};

				const action: Action = {
					type: 'UPDATE_RESULTS',
					data: {
						results: [
							{
								...sampleWireData,
								id: 4,
								ingestedAt: '2025-01-01T02:05:00Z',
							},
							{
								...sampleWireData,
								id: 3,
								ingestedAt: '2025-01-01T02:05:00Z',
							},
						],
						totalCount: 2,
					},
					query: {
						q: 'test',
						start: EuiDateStringSchema.parse('now-30m'),
						end: EuiDateStringSchema.parse('now'),
						collectionId: undefined,
						preset: undefined,
					},
				};

				expect(state.queryData.results.map((_) => _.id)).toEqual([1, 2]);

				const newState = SearchReducer(state, action);

				expect(newState.status).toBe('success');
				expect(newState.queryData?.results).toHaveLength(3);
				expect(newState.queryData?.totalCount).toBe(3);

				expect(newState.queryData?.results.map((_) => _.id)).toEqual([4, 3, 2]);
			});

			it(`should remove old results based on 'added to collection at' time if an collectionId filter is active`, () => {
				const state: State = {
					...successState,
					sortBy: { sortByKey: 'addedToCollectionAt', collectionId: 1 },
					queryData: {
						results: [
							{
								...sampleWireData,
								id: 1,
								collections: [
									{
										collectionId: 1,
										wireEntryId: 1,
										addedAt: '2025-01-01T00:00:00Z',
									},
									{
										collectionId: 2,
										wireEntryId: 1,
										addedAt: '2025-01-01T02:04:00Z', // added to another collection later, but should still be filtered out as the collectionId filter is for collection 1
									},
								],
							},
							{
								...sampleWireData,
								id: 2,
								collections: [
									{
										collectionId: 1,
										wireEntryId: 2,
										addedAt: '2025-01-01T02:04:00Z',
									},
								],
							},
						],
						totalCount: 2,
					},
				};

				const action: Action = {
					type: 'UPDATE_RESULTS',
					data: {
						results: [
							{
								...sampleWireData,
								id: 4,
								collections: [
									{
										collectionId: 1,
										wireEntryId: 4,
										addedAt: '2025-01-01T02:05:00Z',
									},
								],
							},
							{
								...sampleWireData,
								id: 3,
								collections: [
									{
										collectionId: 1,
										wireEntryId: 3,
										addedAt: '2025-01-01T02:05:00Z',
									},
								],
							},
						],
						totalCount: 2,
					},
					query: {
						q: 'test',
						start: EuiDateStringSchema.parse('now-30m'),
						end: EuiDateStringSchema.parse('now'),
						collectionId: 1,
						preset: undefined,
					},
				};

				expect(state.queryData.results.map((_) => _.id)).toEqual([1, 2]);

				const newState = SearchReducer(state, action);

				expect(newState.status).toBe('success');
				expect(newState.queryData?.results.map((_) => _.id)).toEqual([4, 3, 2]);
			});
		});

		it('should deduplicate items based on id when adding new results as part of the UPDATE_RESULTS action', () => {
			const itemOne = {
				...sampleWireData,
				id: 1,
				ingestedAt: '2025-01-01T02:04:00Z',
			};
			const itemTwo = {
				...sampleWireData,
				id: 2,
				ingestedAt: '2025-01-01T02:04:00Z',
			};

			const state: State = {
				...successState,
				queryData: {
					results: [itemOne],
					totalCount: 1,
				},
			};

			const action: Action = {
				type: 'UPDATE_RESULTS',
				data: {
					results: [itemOne, itemTwo],
					totalCount: 2,
				},
				query: {
					q: 'test',
					start: EuiDateStringSchema.parse('now-30m'),
					end: EuiDateStringSchema.parse('now'),
					preset: undefined,
					collectionId: undefined,
				},
			};

			expect(state.queryData.results).toContainEqual(itemOne);

			const newState = SearchReducer(state, action);

			expect(newState.status).toBe('success');
			expect(newState.queryData?.results).toHaveLength(2);
			expect(newState.queryData?.totalCount).toBe(2);

			expect(newState.queryData?.results).toContainEqual(itemOne);

			expect(newState.queryData?.results).not.toContainEqual(itemTwo);
		});
	});

	it(`should handle APPEND_RESULTS action in success state`, () => {
		const state: State = {
			...successState,
			queryData: {
				results: [{ ...sampleWireData, id: 2 }],
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
		});
		expect(newState.queryData?.results).toContainEqual({
			...sampleWireData,
			id: 2,
		});
	});

	it(`should deduplicate results by id when handling APPEND_RESULTS`, () => {
		const state: State = {
			...successState,
			queryData: {
				results: [{ ...sampleWireData, id: 2 }],
				totalCount: 2,
			},
		};

		const action: Action = {
			type: 'APPEND_RESULTS',
			data: {
				results: [
					{ ...sampleWireData, id: 1 },
					{ ...sampleWireData, id: 2 },
				],
				totalCount: 2,
			},
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
				query: { q: 'new query', collectionId: undefined, preset: undefined },
			};

			const newState = SearchReducer(state, action);

			expect(newState.status).toBe('loading');
		});
	});
});
