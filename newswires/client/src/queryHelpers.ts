import { presetIsInSports, topLevelSportId } from './presets.ts';
import type { Query } from './sharedTypes.ts';

export type QueryKeyValuePair = {
	key: keyof Query;
	value: string;
};

type DateRangeKeyValuePair = {
	key: 'dateRange';
	value: undefined;
};

export type DeselectableQueryKeyValue =
	| QueryKeyValuePair
	| DateRangeKeyValuePair;

export type DeselectableQueryKey = DeselectableQueryKeyValue['key'];

export const keyValueAfterDeselection = (
	{ key, value }: DeselectableQueryKeyValue,
	query: Query,
): Partial<Query> => {
	if (key === 'q') {
		return { q: '' };
	}
	if (key === 'preset') {
		return {
			[key]: presetIsInSports(value) ? topLevelSportId : undefined,
		};
	}
	if (key === 'dateRange') {
		return {
			start: undefined,
			end: undefined,
		};
	}
	if (['hasDataFormatting', 'start', 'end'].includes(key)) {
		return { [key]: undefined };
	}
	if (
		['categoryCode', 'categoryCodeExcl', 'keyword', 'keywordExcl'].includes(key)
	) {
		const current = query[key] as string[] | undefined;
		return { [key]: (current ?? []).filter((s) => s !== value) };
	}
	return {};
};
