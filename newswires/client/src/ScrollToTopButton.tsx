import { EuiButton, EuiButtonEmpty, useEuiTheme } from '@elastic/eui';
import type { ReactNode, RefObject } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearch } from './context/SearchContext';
import { useUserSettings } from './context/UserSettingsContext';
import { useEventCallback } from './useEventCallback';

const offset = 16;
const scrollThreshold = 100;

/**
 * Floating Scroll-to-Top Button bounded to a scroll container
 */
export const ScrollToTopButton = ({
	label,
	containerRef,
	children,
}: {
	label?: string;
	containerRef: RefObject<HTMLElement>;
	direction?: string;
	children: ReactNode | ReactNode[];
}) => {
	const { euiTheme } = useEuiTheme();
	const { state, config, unseenWiresFromTopOfList } = useSearch();
	const { queryData } = state;
	const { enableAutoScroll } = useUserSettings();
	const userScrollTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

	const [visible, setVisible] = useState(false);

	const isTicker = config.ticker;

	const scrollToTop = useCallback(() => {
		if (containerRef.current) {
			containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
		} else {
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}, [containerRef]);

	/**
	 * Using `useEventCallback` custom hook here allow our effect to get the current
	 * values of `enableAutoScroll`, `isTicker` and `scrollToTop` without having to add them as dependencies
	 * and thus avoiding to trigger the effect every time those values change, which would cause unwanted auto-scrolls.
	 * @todo: once we're on React 19, we should be able to replace this with `useEffectEvent` and avoid the need for a custom hook
	 * @see: https://react.dev/reference/react/useEffectEvent
	 */
	const autoScrollIfEnabled = useEventCallback(() => {
		if (enableAutoScroll && isTicker && !userScrollTimerRef.current) {
			scrollToTop();
		}
	});

	useEffect(() => {
		if (queryData?.results.some((r) => r.isFromRefresh)) {
			autoScrollIfEnabled();
		}
	}, [autoScrollIfEnabled, queryData?.results]);

	// Show/hide based on scroll offset
	useEffect(() => {
		const scrollEl = containerRef.current;
		const onScroll = () => {
			const scrollTop = scrollEl?.scrollTop;
			if (scrollTop !== undefined && scrollTop > scrollThreshold) {
				if (enableAutoScroll && isTicker) {
					const oldRefVal = userScrollTimerRef.current;
					userScrollTimerRef.current = setTimeout(() => {
						userScrollTimerRef.current = undefined;
					}, 5000);
					if (oldRefVal !== undefined) {
						clearTimeout(oldRefVal);
					}
				}
				setVisible(true);
			} else {
				setVisible(false);
			}
		};

		scrollEl?.addEventListener('scroll', onScroll, { passive: true });
		return () => scrollEl?.removeEventListener('scroll', onScroll);
	}, [containerRef, enableAutoScroll, isTicker]);

	return (
		<>
			{visible && unseenWiresFromTopOfList > 0 && (
				<div
					style={{
						position: 'sticky',
						top: 0,
						zIndex: 2,
					}}
				>
					<div
						style={{
							padding: euiTheme.size.xxs,
							color: euiTheme.colors.textAccentSecondary,
							background: euiTheme.colors.backgroundBaseAccentSecondary,
						}}
					>
						<EuiButtonEmpty
							size="xs"
							iconType="dot"
							color="accentSecondary"
							onClick={scrollToTop}
							css={{
								width: '100%',
							}}
						>
							<span>{unseenWiresFromTopOfList} new items</span>
						</EuiButtonEmpty>
					</div>
				</div>
			)}

			{children}

			{visible && (
				<EuiButton
					iconType="arrowUp"
					onClick={scrollToTop}
					size="m"
					color="primary"
					css={{
						position: 'sticky',
						bottom: offset,
						marginRight: euiTheme.size.s,
						marginLeft: 'auto',
						display: 'block',
						zIndex: 1000,
					}}
				>
					{label ?? 'Back to Top'}
				</EuiButton>
			)}
		</>
	);
};
