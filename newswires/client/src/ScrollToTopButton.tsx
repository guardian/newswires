import { EuiButton, EuiButtonEmpty, useEuiTheme } from '@elastic/eui';
import type { RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useSearch } from './context/SearchContext';
/**
 * Floating Scroll-to-Top Button bounded to a scroll container
 */
export const ScrollToTopButton = ({
	threshold = 200,
	label,
	containerRef,
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
					zIndex: 2,
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
