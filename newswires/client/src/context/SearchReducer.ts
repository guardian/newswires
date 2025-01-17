import { isEqual as deepIsEqual } from 'lodash';
import type { Query, WiresQueryResponse } from '../sharedTypes.ts';
import { defaultQuery } from '../urlState.ts';
import type { Action, SearchHistory, State } from './SearchContext.tsx';

function mergeQueryData(
	existing: WiresQueryResponse | undefined,
	newData: WiresQueryResponse,
): WiresQueryResponse {
	if (existing) {
		const existingIds = new Set(existing.results.map((item) => item.id));

		const mergedResults = [
			...newData.results
				.filter((newItem) => !existingIds.has(newItem.id))
				.map((newItem) => ({ ...newItem, isFromRefresh: true })),
			...existing.results,
		];

		return {
			...newData,
			results: mergedResults,
		};
	} else {
		return {
			...newData,
			results: newData.results,
		};
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
				queryData: action.data,
				successfulQueryHistory: getUpdatedHistory(
					state.successfulQueryHistory,
					action.query,
					action.data.results.length,
				),
				status: 'success',
				error: undefined,
			};
		case 'TOGGLE_AUTO_UPDATE':
			return {
				...state,
				autoUpdate: !state.autoUpdate,
			};
		case 'UPDATE_RESULTS':
			switch (state.status) {
				case 'success':
					return {
						...state,
						queryData: mergeQueryData(state.queryData, action.data),
					};
				case 'offline':
				case 'error':
					return {
						...state,
						status: 'success',
						queryData: mergeQueryData(state.queryData, action.data),
					};
				default:
					return state;
			}
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
