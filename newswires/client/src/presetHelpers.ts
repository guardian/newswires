import type { PresetGroupName } from './presets';
import { presetIsInSports, topLevelPresetId, topLevelSportId } from './presets';

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

export const getPresetPanal = (
	presetId: string | undefined,
): PresetGroupName => {
	if (presetId === undefined) return 'presets';
	if (presetIsInSports(presetId) || presetId === topLevelSportId)
		return 'sportPresets';
	return 'presets';
};
