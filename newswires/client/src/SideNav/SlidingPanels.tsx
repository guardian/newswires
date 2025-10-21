import { useEuiTheme } from '@elastic/eui';
import { css, keyframes } from '@emotion/react';
import type { CSSProperties } from 'react';
import type React from 'react';

type SlidingPanelsProps = {
	direction: Direction;
	isAnimating: boolean;
	current: JSX.Element;
	previous: JSX.Element;
};
export const createAnimationStyles = (
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
		overLay: css`
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
		`,
	};
};

type Slide = 'in' | 'out';
export type Direction = 'forward' | 'back' | null;

export const SlidingPanels: React.FC<SlidingPanelsProps> = ({
	direction,
	isAnimating,
	current,
	previous,
}) => {
	const { euiTheme } = useEuiTheme();
	const animationStyles = createAnimationStyles(
		euiTheme.animation.normal,
		euiTheme.animation.resistance,
	);

	const transitionStyles = (slide: Slide) => {
		if (!isAnimating) return css``;

		const isForward = direction === 'forward';
		const map = {
			in: isForward ? animationStyles.forwardIn : animationStyles.backIn,
			out: isForward ? animationStyles.forwardOut : animationStyles.backOut,
		};
		return map[slide];
	};
	return (
		<>
			<div key="current" css={[animationStyles.panel, transitionStyles('in')]}>
				{current}
			</div>
			{isAnimating && (
				<div
					key="previous"
					css={[
						animationStyles.panel,
						animationStyles.overLay,
						transitionStyles('out'),
					]}
				>
					{previous}
				</div>
			)}
		</>
	);
};
