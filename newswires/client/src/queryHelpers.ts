import {
	presetIsInSports,
	topLevelPresetId,
	topLevelSportId,
} from './presets.ts';
import type { Query } from './sharedTypes.ts';

export const queryAfterDeselection = (
	key: keyof Query,
	value: string,
	query: Query,
): Query => {
	if (key === 'q') {
		return { ...query, q: '' };
	}
	if (key === 'preset') {
		return {
			...query,
			preset: presetIsInSports(value) ? topLevelSportId : topLevelPresetId,
			collection: undefined,
		};
	}
	if (['dateRange', 'hasDataFormatting'].includes(key)) {
		return { ...query, [key]: undefined };
	}
	if (
		['categoryCode', 'categoryCodeExcl', 'keyword', 'keywordExcl'].includes(key)
	) {
		const current = query[key] as string[] | undefined;
		return { ...query, [key]: (current ?? []).filter((s) => s !== value) };
	}
	return { ...query };
};
