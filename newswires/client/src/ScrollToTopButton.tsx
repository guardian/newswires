import { EuiButton, EuiButtonEmpty, useEuiTheme } from '@elastic/eui';
import type { ReactNode, RefObject } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearch } from './context/SearchContext';
import { useUserSettings } from './context/UserSettingsContext';

const offset = 16;

/**
 * Floating Scroll-to-Top Button bounded to a scroll container
 */
export const ScrollToTopButton = ({
	threshold = 200,
	label,
	containerRef,
	children,
}: {
	threshold?: number;
	label?: string;
	containerRef?: RefObject<HTMLElement>;
	direction?: string;
	children: ReactNode | ReactNode[];
}) => {
	const { euiTheme } = useEuiTheme();
	const { state, config } = useSearch();
	const { queryData } = state;
	const { enableAutoScroll } = useUserSettings();
	const userScrollTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

	const [incomingStories, setIncomingStories] = useState(0);
	const [visible, setVisible] = useState(false);

	const isTicker = config.ticker;

	const scrollToTop = useCallback(() => {
		if (containerRef?.current) {
			containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
		} else {
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}, [containerRef]);

	// Accumulate counts of newly loaded stories
	useEffect(() => {
		if (!queryData) {
			return;
		}
		const newCount = queryData.results.filter((r) => r.isFromRefresh).length;
		setIncomingStories((currentCount) => currentCount + newCount);
		if (
			enableAutoScroll &&
			isTicker &&
			newCount > 0 &&
			!userScrollTimerRef.current
		) {
			scrollToTop();
		}
	}, [scrollToTop, enableAutoScroll, isTicker, queryData]);

	// Show/hide based on scroll offset
	useEffect(() => {
		const scrollEl = containerRef?.current ?? window;
		const onScroll = () => {
			if (enableAutoScroll && isTicker) {
				const oldRef = userScrollTimerRef.current;
				userScrollTimerRef.current = setTimeout(() => {
					userScrollTimerRef.current = undefined;
				}, 5000);
				if (oldRef !== undefined) {
					clearTimeout(oldRef);
				}
			}
			const scrollTop =
				scrollEl === window
					? window.scrollY
					: (scrollEl as HTMLElement).scrollTop;
			if (scrollTop > threshold) {
				setVisible(true);
			} else {
				setVisible(false);
				setIncomingStories(0);
			}
		};

		scrollEl.addEventListener('scroll', onScroll, { passive: true });
		return () => scrollEl.removeEventListener('scroll', onScroll);
	}, [threshold, containerRef, enableAutoScroll, isTicker]);

	return (
		<>
			{visible && incomingStories > 0 && (
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
							<span>{incomingStories} new items</span>
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
