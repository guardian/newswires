import { presetIsInSports, topLevelSportId } from './presets.ts';
import type { Query } from './sharedTypes.ts';

export const removeValueFromQuery = (
	key: keyof Query,
	value: string,
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
	if (['dateRange', 'hasDataFormatting'].includes(key)) {
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
