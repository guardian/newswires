import {
	EuiButton,
	EuiScreenReaderOnly,
	EuiText,
	EuiTextBlockTruncate,
	useEuiBackgroundColor,
	useEuiTheme,
	useIsWithinBreakpoints,
} from '@elastic/eui';
import { css, keyframes } from '@emotion/react';
import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import sanitizeHtml from 'sanitize-html';
import { useSearch } from './context/SearchContext.tsx';
import { useUserSettings } from './context/UserSettingsContext.tsx';
import { formatTimestamp } from './formatTimestamp.ts';
import { Link } from './Link.tsx';
import type { SupplierInfo, WireData } from './sharedTypes.ts';
import { SupplierBadge } from './SupplierBadge.tsx';

export const WireItemList = ({
	wires,
	totalCount,
}: {
	wires: WireData[];
	totalCount: number;
}) => {
	const { config, loadMoreResults, previousItemId, state } = useSearch();

	const selectedWireId = config.itemId;

	const handleLoadMoreResults = () => {
		if (wires.length > 0) {
			const beforeId = Math.min(...wires.map((wire) => wire.id)).toString();
			void loadMoreResults(beforeId);
		}
	};

	return (
		<>
			<ul>
				{wires.map(
					({
						id,
						content,
						supplier,
						highlight,
						isFromRefresh,
						ingestedAt,
						hasDataFormatting,
					}) => (
						<li key={id}>
							<WirePreviewCard
								id={id}
								ingestedAt={ingestedAt}
								supplier={supplier}
								content={content}
								hasDataFormatting={hasDataFormatting}
								isFromRefresh={isFromRefresh}
								highlight={highlight}
								selected={selectedWireId == id.toString()}
								view={config.view}
								previousItemId={previousItemId}
							/>
						</li>
					),
				)}
			</ul>
			{wires.length < totalCount && (
				<EuiButton
					isLoading={state.loadingMore}
					css={css`
						margin-top: 12px;
					`}
					onClick={handleLoadMoreResults}
				>
					{state.loadingMore ? 'Loading' : 'Load more'}
				</EuiButton>
			)}
		</>
	);
};

function decideMainHeadingContent(
	supplier: string,
	{ headline, slug }: WireData['content'],
	hasDataFormatting: boolean,
): string {
	const hasNonEmptySlug = slug && slug.length > 0;

	if (headline && headline.length > 0) {
		/**
		 * AAP and PA stories have useful slugs. But stories with 'data formatting' have
		 * their slugs added to their headlines when we get them, so we don't need to add them again.
		 */
		const prefix =
			(supplier === 'AAP' || supplier === 'PA') &&
			!hasDataFormatting &&
			hasNonEmptySlug
				? `${slug} - `
				: '';

		return `${prefix}${headline}`;
	}

	if (hasNonEmptySlug) {
		return slug;
	}

	return 'No headline';
}

function MaybeSecondaryCardContent({
	headline,
	subhead,
	bodyText,
	highlight,
}: WireData['content'] & {
	highlight: string | undefined;
}): string | ReactNode | undefined {
	const theme = useEuiTheme();

	if (highlight && highlight.trim().length > 0) {
		return (
			<EuiText
				size="xs"
				css={css`
					margin-top: 0.1rem;
					padding: 0.1rem 0.5rem;
					background-color: ${theme.euiTheme.colors.highlight};
					justify-self: start;

					& mark {
						background-color: ${theme.euiTheme.colors.highlight};
						font-weight: bold;
						position: relative;
						border: 3px solid ${theme.euiTheme.colors.highlight};
					}
				`}
			>
				<p dangerouslySetInnerHTML={{ __html: sanitizeHtml(highlight) }} />
			</EuiText>
		);
	}
	if (subhead && subhead !== headline) {
		return <p>{subhead}</p>;
	}
	const maybeBodyTextPreview = bodyText
		? sanitizeHtml(bodyText.replace(/(<br \/>|<\/p>)/g, '&nbsp;'), {
				allowedTags: [],
				allowedAttributes: {},
			}).slice(0, 300)
		: undefined;
	if (maybeBodyTextPreview && maybeBodyTextPreview !== headline) {
		return (
			<EuiTextBlockTruncate lines={2}>
				<p>{maybeBodyTextPreview}</p>
			</EuiTextBlockTruncate>
		);
	}
	return null;
}

function scrollElementIntoView(
	el: HTMLElement,
	{
		scrollPosition = 'nearest',
		behavior,
	}: {
		scrollPosition?: ScrollLogicalPosition;
		behavior?: ScrollBehavior;
	} = {},
) {
	el.scrollIntoView({
		behavior,
		block: scrollPosition,
		inline: scrollPosition,
	});
}

const WirePreviewCard = ({
	id,
	supplier,
	ingestedAt,
	content,
	hasDataFormatting,
	highlight,
	selected,
	view,
	previousItemId,
}: {
	id: number;
	supplier: SupplierInfo;
	ingestedAt: string;
	content: WireData['content'];
	hasDataFormatting: boolean;
	highlight: string | undefined;
	selected: boolean;
	isFromRefresh: boolean;
	view: string;
	previousItemId: string | undefined;
}) => {
	const { viewedItemIds, config } = useSearch();
	const { showSecondaryFeedContent } = useUserSettings();

	const ref = useRef<HTMLDivElement>(null);
	const isSmallScreen = useIsWithinBreakpoints(['xs', 's']);
	const isPoppedOut = config.ticker;

	useEffect(() => {
		if (selected && ref.current) {
			scrollElementIntoView(ref.current);
		}
	}, [selected]);

	/*
	 * In mobile view, the Feed component re‑renders when returning from a story view.
	 * Restores the previous scroll position to maintain continuity.
	 */
	useEffect(() => {
		if (
			!isPoppedOut &&
			isSmallScreen &&
			view === 'feed' &&
			id.toString() === previousItemId &&
			ref.current
		) {
			scrollElementIntoView(ref.current, { scrollPosition: 'center' });
		}
	}, [view, id, previousItemId, isSmallScreen, isPoppedOut]);

	const theme = useEuiTheme();
	const accentBgColor = useEuiBackgroundColor('subdued', {
		method: 'transparent',
	});

	const mainHeadingContent = decideMainHeadingContent(
		supplier.name,
		content,
		hasDataFormatting,
	);

	const hasBeenViewed = viewedItemIds.includes(id.toString());

	const cardGrid = css`
		display: grid;

		align-items: baseline;
		grid-template-areas: 'title time' 'title supplier' 'content supplier' 'content supplier';
		grid-template-columns: 1fr min-content;
		grid-template-rows: auto auto auto auto;
	`;

	const compactCardGrid = css`
		display: grid;
		gap: 0.3rem;
		grid-template-areas: 'title supplier time';
		grid-template-columns: 1fr min-content min-content;
		align-items: baseline;
	`;

	const borderFade = (primaryColor: string) => keyframes`
		from {
			border-left-color: ${primaryColor};
		}
		to {
			border-left-color: transparent;
		}
	`;

	return (
		<Link to={id.toString()}>
			<div
				ref={ref}
				css={[
					showSecondaryFeedContent ? cardGrid : compactCardGrid,
					css`
						&:hover {
							background-color: ${theme.euiTheme.colors.lightestShade};
							border-left: 4px solid ${theme.euiTheme.colors.accent};
						}

						border-left: 4px solid
							${selected ? theme.euiTheme.colors.primary : 'transparent'};
						border-bottom: 1px solid ${theme.euiTheme.colors.mediumShade};
						${id.toString() === previousItemId
							? css`
									animation: ${borderFade(theme.euiTheme.colors.primary)} 0.6s
										ease-out forwards;
								`
							: null}
						padding: 0.5rem;
						box-sizing: content-box;
						color: ${theme.euiTheme.colors.text};
						background-color: ${hasBeenViewed ? accentBgColor : 'inherit'};
						hyphens: auto;
						hyphenate-limit-chars: 5 3 3;

						& h3 {
							grid-area: title;
						}
					`,
				]}
			>
				<h3
					css={css`
						font-weight: ${hasBeenViewed
							? theme.euiTheme.font.weight.medium
							: theme.euiTheme.font.weight.semiBold};
						${hasBeenViewed ? 'color:rgba(29, 42, 62,.8)' : ''};
						font-size: 1.15rem;
					`}
				>
					{mainHeadingContent}
				</h3>
				{hasBeenViewed && (
					<EuiScreenReaderOnly>
						<h4>viewed</h4>
					</EuiScreenReaderOnly>
				)}
				<div
					css={css`
						grid-area: time;
						padding-left: 5px;
						font-weight: ${hasBeenViewed
							? theme.euiTheme.font.weight.light
							: theme.euiTheme.font.weight.regular};
						justify-self: end;
						text-align: right;
						font-variant-numeric: tabular-nums;
						line-break: strict;
					`}
				>
					{formatTimestamp(ingestedAt)
						.split(', ')
						.map((part) => (
							<EuiText size="xs" key={part}>
								{part}
							</EuiText>
						))}
				</div>
				<div
					css={css`
						grid-area: supplier;
						justify-self: end;
						margin-top: ${showSecondaryFeedContent ? '0.5rem' : '0'};
					`}
				>
					<SupplierBadge
						supplier={supplier}
						isPrimary={!hasBeenViewed}
						isCondensed={!showSecondaryFeedContent}
					/>{' '}
				</div>
				{showSecondaryFeedContent && (
					<div
						css={css`
							margin-top: 0.5rem;
							grid-area: content;
							${hasBeenViewed ? 'color:rgba(29, 42, 62,.8)' : ''};
							font-weight: ${hasBeenViewed
								? theme.euiTheme.font.weight.light
								: theme.euiTheme.font.weight.regular};
						`}
					>
						<MaybeSecondaryCardContent {...content} highlight={highlight} />
					</div>
				)}
			</div>
		</Link>
	);
};
