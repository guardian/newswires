import type { WiresQueryData } from '../sharedTypes';

export function decideSearchSummaryLabel(
	queryData: WiresQueryData | undefined,
): string {
	if (queryData === undefined || queryData.totalCount === 0) {
		return 'No results found';
	}
	/**
	 * The actual LIMIT in the SQL is `countQueryCap + 1`.
	 * Say that the cap is 500. Having the actual limit be 501 means that we can
	 * differentiate in the UI between there being exactly 500 and there being
	 * '500+'.
	 * */
	if (queryData.totalCount > queryData.countQueryCap) {
		return `Showing ${queryData.countQueryCap}+ results`;
	}
	return `Showing ${Intl.NumberFormat('en-GB').format(queryData.totalCount)} result${queryData.totalCount > 1 ? 's' : ''}`;
}
