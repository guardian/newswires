import { useEuiTheme } from '@elastic/eui';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearch } from '../context/SearchContext';
import { usePrevious } from '../hooks/usePrevious';
import { getNextActivePreset, getPresetPanel } from '../presetHelpers';
import type { PresetGroupName } from '../presets';
import { SecondaryLevelListPresetPanel } from './SecondaryLevelListPreset';
import { createAnimationStyles, SlidingPanels } from './SlidingPanels';
import { TopLevelListPresetPanel } from './TopLevelListPreset';

type AnimationState = {
	isAnimating: boolean;
	direction: 'forward' | 'back' | null;
};

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

	const containerRef = useRef<HTMLDivElement>(null);
	const { euiTheme } = useEuiTheme();
	const animationStyles = createAnimationStyles(
		euiTheme.animation.normal,
		euiTheme.animation.resistance,
	);

	const { config, handleEnterQuery } = useSearch();
	const activePreset = config.query.preset;
	const previousPreset = usePrevious(activePreset);

	const [activePanelId, setActivePanelId] = useState<PresetGroupName>(
		getPresetPanel(activePreset),
	);

	const openDrawer = () => {
		setActivePanelId('sportPresets');
		setAnimationState({
			isAnimating: true,
			direction: 'forward',
		});
	};

	const closeDrawer = () => {
		setActivePanelId('presets');
		setAnimationState({
			isAnimating: true,
			direction: 'back',
		});
	};

	useEffect(() => {
		const nextPanel = getPresetPanel(activePreset);
		if (nextPanel !== activePanelId && previousPreset !== activePreset) {
			setActivePanelId(nextPanel);
			setAnimationState({
				isAnimating: true,
				direction: nextPanel === 'presets' ? 'back' : 'forward',
			});
		}
	}, [activePreset, previousPreset, activePanelId]);

	useEffect(() => {
		const container = containerRef.current;
		if (!container || !animationState.isAnimating) return;

		const handleAnimationEnd = () => {
			setAnimationState({
				isAnimating: false,
				direction: null,
			});
		};

		container.addEventListener('animationend', handleAnimationEnd);
		return () =>
			container.removeEventListener('animationend', handleAnimationEnd);
	}, [animationState.isAnimating]);

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
		<div ref={containerRef} css={animationStyles.container}>
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
			/>
		</div>
	);
};
