import { isEqual as deepIsEqual } from 'lodash';
import type { Query, WiresQueryResponse } from '../sharedTypes.ts';
import { defaultQuery } from '../urlState.ts';
import type { Action, SearchHistory, State } from './SearchContext.tsx';

function mergeQueryData(
	existing: WiresQueryResponse | undefined,
	newData: WiresQueryResponse,
): WiresQueryResponse {
	const mergedResults = existing
		? [
				...newData.results
					.filter(
						(newItem) =>
							!existing.results
								.map((existing) => existing.id)
								.includes(newItem.id),
					)
					.map((newItem) => ({ ...newItem, isFromRefresh: true })),
				...existing.results.map((existingItem) => ({
					...existingItem,
				})),
			]
		: newData.results;
	return {
		...newData,
		results: mergedResults,
	};
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
	switch (state.status) {
		case 'loading':
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

				case 'FETCH_ERROR':
					return {
						...state,
						error: action.error,
						status: 'error',
					};
				default:
					return state;
			}
		case 'success':
			switch (action.type) {
				case 'UPDATE_RESULTS':
					return {
						...state,
						queryData: mergeQueryData(state.queryData, action.data),
					};
				case 'ENTER_QUERY':
					return {
						...state,
						status: 'loading',
					};
				case 'TOGGLE_AUTO_UPDATE':
					return {
						...state,
						autoUpdate: !state.autoUpdate,
					};
				case 'FETCH_ERROR':
					return {
						...state,
						error: action.error,
						status: 'offline',
					};
				default:
					return state;
			}
		case 'offline':
			switch (action.type) {
				case 'UPDATE_RESULTS':
					return {
						...state,
						status: 'success',
						queryData: mergeQueryData(state.queryData, action.data),
					};
				default:
					return state;
			}
		case 'error':
			switch (action.type) {
				case 'UPDATE_RESULTS':
					return {
						...state,
						status: 'success',
						queryData: mergeQueryData(state.queryData, action.data),
					};
				case 'RETRY':
					return {
						...state,
						status: 'loading',
					};
				case 'ENTER_QUERY':
					return {
						...state,
						status: 'loading',
					};
				default:
					return state;
			}
		default:
			return state;
	}
};
