import type { PresetGroupName } from '../presets';

export type PanelProps = {
	activePreset: string | undefined;
	swapActivePanel: (
		panel: PresetGroupName,
		direction: 'forward' | 'back',
	) => void;
	togglePreset: (preset: string) => void;
};
