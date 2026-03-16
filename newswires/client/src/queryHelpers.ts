import {
	presetIsInSports,
	topLevelPresetId,
	topLevelSportId,
} from './presets.ts';
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

export const queryAfterDeselection = (
	{ key, value }: DeselectableQueryKeyValue,
	query: Query,
): Query => {
	if (key === 'q') {
		return { ...query, q: '' };
	}
	if (key === 'preset') {
		return {
			...query,
			preset: presetIsInSports(value) ? topLevelSportId : topLevelPresetId,
			collectionId: undefined,
		};
	}
	if (key === 'dateRange') {
		return {
			...query,
			start: undefined,
			end: undefined,
		};
	}
	if (['hasDataFormatting', 'start', 'end', 'collectionId'].includes(key)) {
		return { ...query, [key]: undefined };
	}
	if (
		[
			'categoryCode',
			'categoryCodeExcl',
			'keyword',
			'keywordExcl',
			'guSourceFeed',
			'guSourceFeedExcl',
			'previewPaApi',
		].includes(key)
	) {
		const current = query[key] as string[] | undefined;
		return { ...query, [key]: (current ?? []).filter((s) => s !== value) };
	}
	return { ...query };
};
