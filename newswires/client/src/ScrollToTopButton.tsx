import { EuiButton, EuiButtonEmpty, useEuiTheme } from '@elastic/eui';
import type { RefObject } from 'react';
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from 'react';
import { useSearch } from './context/SearchContext';
/**
 * Floating Scroll-to-Top Button bounded to a scroll container
 */
export const ScrollToTopButton = ({
	threshold = 200,
	label,
	containerRef,
	direction,
}: {
	threshold?: number;
	label?: string;
	containerRef?: RefObject<HTMLElement>;
	direction?: string;
}) => {
	const buttonRef = useRef<HTMLDivElement>(null);
	const bannerRef = useRef<HTMLDivElement>(null);
	const { euiTheme } = useEuiTheme();
	const { state } = useSearch();
	const { queryData } = state;

	const [incomingStories, setIncomingStories] = useState(0);
	const [visible, setVisible] = useState(false);
	const offset = 16;

	const updatePosition = useCallback(() => {
		console.log('update');
	}, []);

	// Accumulate counts of newly loaded stories
	useEffect(() => {
		if (!queryData) {
			return;
		}
		const newCount = queryData.results.filter((r) => r.isFromRefresh).length;
		setIncomingStories((currentCount) => currentCount + newCount);
	}, [queryData, queryData?.results]);

	// Show/hide based on scroll offset
	useEffect(() => {
		const scrollEl = containerRef?.current ?? window;
		const onScroll = () => {
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
	}, [threshold, containerRef]);

	// Recalculate position on show, scroll, or resize
	useEffect(() => {
		if (!visible) {
			return;
		}

		window.addEventListener('resize', updatePosition);

		const scrollEl = containerRef?.current ?? window;
		scrollEl.addEventListener('scroll', updatePosition, { passive: true });

		// Observe container size changes
		let resizeObs: ResizeObserver | null = null;
		if (containerRef?.current) {
			resizeObs = new ResizeObserver(updatePosition);
			resizeObs.observe(containerRef.current);
		}

		updatePosition();

		return () => {
			window.removeEventListener('resize', updatePosition);
			scrollEl.removeEventListener('scroll', updatePosition);
			if (resizeObs) {
				resizeObs.disconnect();
			}
		};
	}, [visible, containerRef, euiTheme.size.s, updatePosition]);

	useLayoutEffect(() => {
		updatePosition();
	}, [direction, updatePosition]);

	const handleClick = () => {
		if (containerRef?.current) {
			containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
		} else {
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	};

	if (!visible) {
		return null;
	}

	return (
		<>
			<div
				ref={buttonRef}
				style={{
					position: 'fixed',
					bottom: offset,
					right: euiTheme.size.s,
					zIndex: 1000,
				}}
			>
				<EuiButton
					iconType="arrowUp"
					onClick={handleClick}
					size="m"
					color="primary"
				>
					{label ?? 'Back to Top'}
				</EuiButton>
			</div>
			<div
				ref={bannerRef}
				style={{
					position: 'sticky',
					top: 0,
				}}
			>
				{incomingStories > 0 && (
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
							onClick={handleClick}
							css={{
								width: '100%',
							}}
						>
							<span>{incomingStories} new items</span>
						</EuiButtonEmpty>
					</div>
				)}
			</div>
		</>
	);
};
