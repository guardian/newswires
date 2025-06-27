import dateMath from '@elastic/datemath';
import { isEqual as deepIsEqual } from 'lodash';
import moment from 'moment-timezone';
import { getErrorMessage } from '../../../../shared/getErrorMessage.ts';
import type { Query, WiresQueryData } from '../sharedTypes.ts';
import { defaultQuery } from '../urlState.ts';
import type { Action, SearchHistory, State } from './SearchContext.tsx';

export const safeReducer = (
	reducer: (state: State, action: Action) => State,
) => {
	return (state: State, action: Action): State => {
		try {
			return reducer(state, action);
		} catch (error: unknown) {
			return {
				...state,
				status: 'error',
				error: `Error processing action (${action.type}) ${getErrorMessage(error)}`,
			};
		}
	};
};

function mergeQueryData(
	existing: WiresQueryData | undefined,
	newData: WiresQueryData,
	{ dateRange }: Query,
): WiresQueryData {
	if (existing) {
		const existingIds = new Set(existing.results.map((item) => item.id));

		const filteredExistingResults =
			dateRange !== undefined
				? existing.results.filter((existingItem) => {
						return moment(existingItem.ingestedAt).isSameOrAfter(
							dateMath.parse(dateRange.start),
						);
					})
				: existing.results;

		return {
			...newData,
			results: [
				...newData.results
					.filter((newItem) => !existingIds.has(newItem.id))
					.map((newItem) => ({ ...newItem, isFromRefresh: true })),
				...filteredExistingResults.map((item) => ({
					...item,
					isFromRefresh: false,
				})),
			],
		};
	} else {
		return {
			...newData,
			results: newData.results,
		};
	}
}

function appendQueryData(
	existing: WiresQueryData | undefined,
	newData: WiresQueryData,
): WiresQueryData {
	if (existing) {
		return {
			...newData,
			results: [...existing.results, ...newData.results],
		};
	} else {
		return newData;
	}
}

function getUpdatedHistory(
	previousHistory: SearchHistory,
	newQuery: Query,
	newResultsCount: number,
): SearchHistory {
	if (deepIsEqual(newQuery, defaultQuery)) {
		return previousHistory;
	}
	if (Object.keys(newQuery).length === 1 && newQuery.q.length === 0) {
		return previousHistory;
	}
	const previousHistoryWithoutMatchingQueries = previousHistory.filter(
		({ query }) => !deepIsEqual(query, newQuery),
	);
	return [
		{ query: newQuery, resultsCount: newResultsCount },
		...previousHistoryWithoutMatchingQueries,
	];
}

export const SearchReducer = (state: State, action: Action): State => {
	switch (action.type) {
		case 'FETCH_SUCCESS':
			return {
				...state,
				queryData: {
					...action.data,
					results: action.data.results,
				},
				successfulQueryHistory: getUpdatedHistory(
					state.successfulQueryHistory,
					action.query,
					action.data.results.length,
				),
				status: 'success',
				error: undefined,
				lastUpdate: moment().format(),
			};
		case 'TOGGLE_AUTO_UPDATE':
			return {
				...state,
				autoUpdate: !state.autoUpdate,
			};
		case 'UPDATE_RESULTS':
			switch (state.status) {
				case 'success':
				case 'offline':
				case 'error':
					return {
						...state,
						status: 'success',
						queryData: mergeQueryData(
							state.queryData,
							{
								...action.data,
								results: action.data.results,
							},
							action.query,
						),
						lastUpdate: moment().format(),
					};
				default:
					return state;
			}
		case 'APPEND_RESULTS':
			return {
				...state,
				status: 'success',
				queryData: appendQueryData(state.queryData, {
					...action.data,
					results: action.data.results,
				}),
			};
		case 'FETCH_ERROR':
			switch (state.status) {
				case 'loading':
					return {
						...state,
						error: action.error,
						status: 'error',
					};
				case 'success':
					return {
						...state,
						error: action.error,
						status: 'offline',
					};
				default:
					return state;
			}
		case 'RETRY':
			switch (state.status) {
				case 'error':
					return {
						...state,
						status: 'loading',
					};
				default:
					return state;
			}
		case 'ENTER_QUERY':
			return {
				...state,
				status: 'loading',
			};
		default:
			return state;
	}
};
