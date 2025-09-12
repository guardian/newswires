import { EuiListGroup, useEuiTheme } from '@elastic/eui';
import { css, keyframes } from '@emotion/react';
import type { CSSProperties } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
	loadOrSetInLocalStorage,
	saveToLocalStorage,
} from '../context/localStorage';
import { useSearch } from '../context/SearchContext';
import type { PresetGroupName } from '../presets';
import { PresetGroupNameSchema, presets, sportPresets } from '../presets';
import { defaultConfig } from '../urlState';
import { SideNavListItem } from './SideNavListItem';

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
	previousPanel?: PresetGroupName;
};

/**
 * Component modelled after EuiContextMenu, but remade in order to allow
 * us more control over how the items inside the menu lists are rendered.
 * Currently there's a certain level of hard-coding in this implementation,
 * because we don't anticipate needing much reuse. But there are patterns
 * that could be extracted if needed in future.
 */
export const PresetsContextMenu = () => {
	const [panelKey, setPanelKey] = useState<PresetGroupName>(() =>
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

	const { config, handleEnterQuery, openTicker } = useSearch();
	const activePreset = config.query.preset;

	const setActivePanel = useCallback(
		(newPanelKey: PresetGroupName, direction?: 'forward' | 'back') => {
			if (newPanelKey === panelKey || animationState.isAnimating) return;

			setAnimationState({
				direction: direction ?? 'forward',
				isAnimating: true,
				previousPanel: panelKey,
			});

			setPanelKey(newPanelKey);
			saveToLocalStorage('presetsMenuActivePanel', newPanelKey);
		},
		[panelKey, animationState.isAnimating],
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
			if (activePreset === presetId || presetId === 'all-presets') {
				handleEnterQuery({
					...config.query,
					preset: undefined,
					hasDataFormatting: undefined,
				});
			} else {
				handleEnterQuery({
					...config.query,
					preset: presetId,
					hasDataFormatting: undefined,
				});
			}
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

	const topLevelListPanel = useMemo(() => {
		const maybeActiveSportPreset = sportPresets.find(
			(_) => _.id === activePreset,
		);

		return (
			<EuiListGroup flush={true} gutterSize="none">
				{presets.map((item) => (
					<SideNavListItem
						label={item.name}
						key={item.id}
						isActive={
							activePreset === item.id ||
							(item.id === 'all-presets' && !activePreset)
						}
						isTopLevel={true}
						handleButtonClick={() => {
							if (item.child) {
								setActivePanel(item.child, 'forward');
							} else {
								togglePreset(item.id);
							}
						}}
						handleSecondaryActionClick={
							item.child
								? undefined
								: () => openTicker({ ...defaultConfig.query, preset: item.id })
						}
						arrowSide={item.child ? 'right' : undefined}
					/>
				))}
				{maybeActiveSportPreset && (
					<SideNavListItem
						label={maybeActiveSportPreset.name}
						key={maybeActiveSportPreset.id}
						isActive={true}
						isTopLevel={false}
						handleButtonClick={() => togglePreset(maybeActiveSportPreset.id)}
						handleSecondaryActionClick={() =>
							openTicker({ ...config.query, preset: maybeActiveSportPreset.id })
						}
					/>
				)}
			</EuiListGroup>
		);
	}, [activePreset, config.query, openTicker, setActivePanel, togglePreset]);

	const sportsPresetsListPanel = useMemo(() => {
		return (
			<EuiListGroup flush={true} gutterSize="none">
				<SideNavListItem
					label="Sport"
					key="sports-parent-backlink"
					isTopLevel={false}
					handleButtonClick={() => setActivePanel('presets', 'back')}
					arrowSide="left"
				/>
				{sportPresets.map((item) => (
					<SideNavListItem
						label={item.name}
						key={item.id}
						isActive={
							activePreset === item.id ||
							(item.id === 'all-presets' && !activePreset)
						}
						isTopLevel={false}
						handleButtonClick={() => {
							togglePreset(item.id);
						}}
						handleSecondaryActionClick={() =>
							openTicker({ ...defaultConfig.query, preset: item.id })
						}
					/>
				))}
			</EuiListGroup>
		);
	}, [activePreset, openTicker, setActivePanel, togglePreset]);

	const panels = {
		presets: topLevelListPanel,
		sportPresets: sportsPresetsListPanel,
	} as const;

	return (
		<div ref={containerRef} css={animationStyles.container}>
			<div css={getPanelStyles(true)}>{panels[panelKey]}</div>
			{animationState.isAnimating && animationState.previousPanel && (
				<div css={getPanelStyles(false)}>
					{panels[animationState.previousPanel]}
				</div>
			)}
		</div>
	);
};
