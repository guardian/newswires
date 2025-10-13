import { sportPresets } from './presets.ts';
import type { Query } from './sharedTypes.ts';

export const getActivePreset = (
	activePreset: string | undefined,
	presetId: string,
) => {
	if (activePreset === presetId && presetIsAllSport(presetId))
		return 'all-sport';
	if (activePreset === presetId || presetId === 'all-presets') return undefined;
	return presetId;
};
export const presetIsAllSport = (presetId: string): boolean => {
	return (
		sportPresets.map((p) => p.id).includes(presetId) && presetId !== 'all-sport'
	);
};

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
			[key]: presetIsAllSport(value) ? 'all-sport' : undefined,
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
