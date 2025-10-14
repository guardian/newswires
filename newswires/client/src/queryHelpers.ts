import type { PresetGroupName } from './presets.ts';
import { sportPresets, topLevelPresetId, topLevelSportId } from './presets.ts';
import type { Query } from './sharedTypes.ts';

export const getNextActivePreset = (
	activePreset: string | undefined,
	presetId: string,
) => {
	if (activePreset === presetId && presetIsInSports(presetId))
		return topLevelSportId;
	if (activePreset === presetId || presetId === topLevelPresetId)
		return undefined;
	return presetId;
};

export const shouldTogglePreset = (
	activePreset: string | undefined,
	presetId: string,
) => {
	if (activePreset === undefined) return true;
	if (presetIsInSports(activePreset)) return false;
	if (activePreset === presetId) return false;
	return true;
};
const presetIsInSports = (presetId: string): boolean => {
	return sportPresets.map((p) => p.id).includes(presetId);
};

export const getPresetPanal = (
	presetId: string | undefined,
): PresetGroupName => {
	if (presetId === undefined) return 'presets';
	if (presetIsInSports(presetId) || presetId === topLevelSportId)
		return 'sportPresets';
	return 'presets';
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
