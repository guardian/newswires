import { useEuiTheme } from '@elastic/eui';
import { css, keyframes } from '@emotion/react';
import type { CSSProperties } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
	loadOrSetInLocalStorage,
	saveToLocalStorage,
} from '../context/localStorage';
import { useSearch } from '../context/SearchContext';
import type { PresetGroupName } from '../presets';
import { PresetGroupNameSchema } from '../presets';
import { getActivePreset } from '../queryHelpers';
import { SecondaryLevelListPresetPanel } from './SecondaryLevelListPreset';
import { TopLevelListPresetPanel } from './TopLevelListPreset';

const createAnimationStyles = (
	animationDuration: CSSProperties['animationDuration'],
	animationTimingFunction: CSSProperties['animationTimingFunction'],
) => {
	/**
	 * Animation styles are based on EUI's styles for EuiContextMenu, so
	 * will hopefully feel consistent with other animations we're getting
	 * from EUI components.
	 * https://github.com/elastic/eui/blob/0d84a92d3367cf969264d1274a0c9719b15c1479/packages/eui/src/components/context_menu/context_menu_panel.styles.ts#L21
	 */

	const slideInFromRight = keyframes`
		from { transform: translateX(100%); }
		to { transform: translateX(0); }
	`;

	const slideOutToLeft = keyframes`
		from { transform: translateX(0); }
		to { transform: translateX(-100%); }
	`;

	const slideInFromLeft = keyframes`
		from { transform: translateX(-100%); }
		to { transform: translateX(0); }
	`;

	const slideOutToRight = keyframes`
		from { transform: translateX(0); }
		to { transform: translateX(100%); }
	`;

	const baseTransition = css`
		pointer-events: none;
		animation-fill-mode: forwards;
		animation-duration: ${animationDuration};
		animation-timing-function: ${animationTimingFunction};
	`;

	return {
		container: css`
			position: relative;
			overflow: hidden;
			width: 100%;
		`,
		panel: css`
			width: 100%;
		`,
		// Forward animations (going to child panel)
		forwardIn: css`
			${baseTransition}
			animation-name: ${slideInFromRight};
		`,
		forwardOut: css`
			${baseTransition}
			animation-name: ${slideOutToLeft};
		`,
		// Back animations (going to parent panel)
		backIn: css`
			${baseTransition}
			animation-name: ${slideInFromLeft};
		`,
		backOut: css`
			${baseTransition}
			animation-name: ${slideOutToRight};
		`,
	};
};

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
	const [activePanelId, setActivePanelId] = useState<PresetGroupName>(() =>
		loadOrSetInLocalStorage<PresetGroupName>(
			'presetsMenuActivePanel',
			PresetGroupNameSchema,
			'presets',
		),
	);

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

	const swapActivePanel = useCallback(
		(newPanelKey: PresetGroupName, direction?: 'forward' | 'back') => {
			if (newPanelKey === activePanelId || animationState.isAnimating) return;

			setAnimationState({
				direction: direction ?? 'forward',
				isAnimating: true,
			});

			setActivePanelId(newPanelKey);
			saveToLocalStorage('presetsMenuActivePanel', newPanelKey);
		},
		[activePanelId, animationState.isAnimating],
	);

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
				preset: getActivePreset(activePreset, presetId),
				hasDataFormatting: undefined,
			});
		},
		[activePreset, config.query, handleEnterQuery],
	);

	const getPanelStyles = (isCurrentPanel: boolean) => {
		if (!animationState.isAnimating) {
			return animationStyles.panel;
		}

		const isForward = animationState.direction === 'forward';

		if (isCurrentPanel) {
			// Current panel sliding in
			return css`
				${animationStyles.panel}
				${isForward ? animationStyles.forwardIn : animationStyles.backIn}
			`;
		} else {
			// Previous panel sliding out
			return css`
				${animationStyles.panel}
				position: absolute;
				top: 0;
				left: 0;
				${isForward ? animationStyles.forwardOut : animationStyles.backOut}
			`;
		}
	};

	return (
		<div ref={containerRef} css={animationStyles.container}>
			{/* 
				This is the main panel that is in view depending on what the user has selected.
			 */}
			<div css={getPanelStyles(true)}>
				{' '}
				{activePanelId === 'presets' ? (
					<TopLevelListPresetPanel
						activePreset={activePreset}
						swapActivePanel={swapActivePanel}
						togglePreset={togglePreset}
					/>
				) : (
					<SecondaryLevelListPresetPanel
						activePreset={activePreset}
						swapActivePanel={swapActivePanel}
						togglePreset={togglePreset}
					/>
				)}
			</div>
			{/*
				This is the panel that is animating out of view when the user has selected
				to go to a different panel.
			 */}
			{animationState.isAnimating && (
				<div css={getPanelStyles(false)}>
					{activePanelId === 'presets' ? (
						<SecondaryLevelListPresetPanel
							activePreset={activePreset}
							swapActivePanel={swapActivePanel}
							togglePreset={togglePreset}
						/>
					) : (
						<TopLevelListPresetPanel
							activePreset={activePreset}
							swapActivePanel={swapActivePanel}
							togglePreset={togglePreset}
						/>
					)}
				</div>
			)}
		</div>
	);
};
