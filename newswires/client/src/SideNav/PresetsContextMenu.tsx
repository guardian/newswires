import { useCallback, useEffect, useState } from 'react';
import { useSearch } from '../context/SearchContext';
import { usePrevious } from '../hooks/usePrevious';
import { getNextActivePreset, getPresetPanel } from '../presetHelpers';
import type { PresetGroupName } from '../presets';
import { SecondaryLevelListPresetPanel } from './SecondaryLevelListPreset';
import type { Direction } from './SlidingPanels';
import { SlidingPanels } from './SlidingPanels';
import { TopLevelListPresetPanel } from './TopLevelListPreset';

type AnimationState = {
	isAnimating: boolean;
	direction: Direction;
};

const directionMap = {
	presets: 'back',
	sportPresets: 'forward',
} as const satisfies Record<PresetGroupName, Exclude<Direction, null>>;

/**
 * Component modelled after EuiContextMenu, but remade in order to allow
 * us more control over how the items inside the menu lists are rendered.
 * Currently there's a certain level of hard-coding in this implementation,
 * because we don't anticipate needing much reuse. But there are patterns
 * that could be extracted if needed in future.
 */

export const PresetsContextMenu = () => {
	const [animationState, setAnimationState] = useState<AnimationState>({
		isAnimating: false,
		direction: null,
	});

	const { config, handleEnterQuery } = useSearch();
	const activePreset = config.query.preset;
	const previousPreset = usePrevious(activePreset);

	const [activePanelId, setActivePanelId] = useState<PresetGroupName>(
		getPresetPanel(activePreset),
	);

	const startAnimation = (nextPanel: keyof typeof directionMap) => {
		setActivePanelId(nextPanel);
		setAnimationState({
			isAnimating: true,
			direction: directionMap[nextPanel],
		});
	};

	const openDrawer = () => startAnimation('sportPresets');
	const closeDrawer = () => startAnimation('presets');

	useEffect(() => {
		const nextPanel = getPresetPanel(activePreset);
		if (nextPanel !== activePanelId && previousPreset !== activePreset) {
			startAnimation(nextPanel);
		}
	}, [activePreset, previousPreset, activePanelId]);

	const togglePreset = useCallback(
		(presetId: string) => {
			handleEnterQuery({
				...config.query,
				preset: getNextActivePreset(activePreset, presetId),
				hasDataFormatting: undefined,
			});
		},
		[activePreset, config.query, handleEnterQuery],
	);

	return (
		<SlidingPanels
			direction={animationState.direction}
			isAnimating={animationState.isAnimating}
			current={
				activePanelId === 'presets' ? (
					<TopLevelListPresetPanel
						activePreset={activePreset}
						openDrawer={openDrawer}
						closeDrawer={closeDrawer}
						togglePreset={togglePreset}
					/>
				) : (
					<SecondaryLevelListPresetPanel
						activePreset={activePreset}
						openDrawer={openDrawer}
						closeDrawer={closeDrawer}
						togglePreset={togglePreset}
					/>
				)
			}
			previous={
				activePanelId === 'presets' ? (
					<SecondaryLevelListPresetPanel
						activePreset={activePreset}
						openDrawer={openDrawer}
						closeDrawer={closeDrawer}
						togglePreset={togglePreset}
					/>
				) : (
					<TopLevelListPresetPanel
						activePreset={activePreset}
						openDrawer={openDrawer}
						closeDrawer={closeDrawer}
						togglePreset={togglePreset}
					/>
				)
			}
			onAnimationEnd={() =>
				setAnimationState({
					isAnimating: false,
					direction: null,
				})
			}
		/>
	);
};
