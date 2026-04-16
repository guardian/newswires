import {
	EuiButton,
	EuiIcon,
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
import { convertToLocalDate } from './dateHelpers.ts';
import { CollectionsIcon } from './icons/CollectionsIcon.tsx';
import { Link } from './Link.tsx';
import type { WireData } from './sharedTypes.ts';
import { SupplierBadge } from './SupplierBadge.tsx';
import { ToolSendReport } from './ToolsConnection.tsx';
import { AlertLabel, LeadLabel } from './WireItemLabel.tsx';

export const WireItemList = ({
	wires,
	totalCount,
	showCollectionMetadata,
	showSecondaryFeedContent,
	scrollContainerRef,
}: {
	wires: WireData[];
	totalCount: number;
	showCollectionMetadata: boolean;
	showSecondaryFeedContent: boolean;
	scrollContainerRef?: React.RefObject<HTMLDivElement>;
}) => {
	const { config, loadMoreResults, previousItemId, state } = useSearch();

	const selectedWireId = config.itemId;

	return (
		<>
			<ul>
				{wires.map((wire) => (
					<li key={wire.id}>
						<WirePreviewCard
							wire={wire}
							selected={selectedWireId == wire.id.toString()}
							view={config.view}
							previousItemId={previousItemId}
							showCollectionMetadata={showCollectionMetadata}
							showSecondaryFeedContent={showSecondaryFeedContent}
							scrollContainerRef={scrollContainerRef}
						/>
					</li>
				))}
			</ul>
			{wires.length < totalCount && (
				<EuiButton
					isLoading={state.loadingMore}
					css={css`
						margin-top: 12px;
					`}
					onClick={() => void loadMoreResults()}
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
		const shouldShowPrefix =
			(supplier === 'AAP' || supplier === 'PA' || supplier === 'PAAPI') &&
			!hasDataFormatting;
		const prefix = shouldShowPrefix && hasNonEmptySlug ? `${slug} - ` : '';

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
		return (
			<EuiTextBlockTruncate lines={3}>
				<p>{subhead}</p>
			</EuiTextBlockTruncate>
		);
	}
	const maybeBodyTextPreview = bodyText
		? sanitizeHtml(bodyText.replace(/(<br \/>|<\/p>|<\/td>)/g, ' '), {
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
	wire,
	selected,
	view,
	previousItemId,
	showCollectionMetadata,
	showSecondaryFeedContent,
	scrollContainerRef,
}: {
	wire: WireData;
	selected: boolean;
	view: string;
	previousItemId: string | undefined;
	showCollectionMetadata: boolean;
	showSecondaryFeedContent: boolean;
	scrollContainerRef?: React.RefObject<HTMLDivElement>;
}) => {
	const { viewedItemIds, config, hasBeenVisibleCallback } = useSearch();

	const {
		id,
		content,
		supplier,
		ingestedAtMoment,
		highlight,
		collections,
		toolLinks,
		hasDataFormatting,
		isAlert,
		isLead,
	} = wire;

	const ref = useRef<HTMLDivElement>(null);
	const isSmallScreen = useIsWithinBreakpoints(['xs', 's']);
	const isPoppedOut = config.ticker;
	const { selectedTimezone } = useUserSettings();

	const maybeTastedCollectionMetadata = collections.filter(
		(collection) => collection.collectionId === config.query.collectionId,
	);

	const hasMetadataToDisplay =
		(showCollectionMetadata && maybeTastedCollectionMetadata.length > 0) ||
		(toolLinks && toolLinks.length > 0);

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

	// Mark item as viewed once it's been visible in the viewport
	useEffect(() => {
		const el = ref.current;
		if (!el) return;

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						hasBeenVisibleCallback(id);
					}
				}
			},
			{
				root: scrollContainerRef?.current ?? null, // Use the scroll container if provided, otherwise default to viewport
				threshold: 0.7, // Consider it viewed when 70% of the item is visible
			},
		);

		observer.observe(el);
		return () => observer.unobserve(el);
	}, [scrollContainerRef, hasBeenVisibleCallback, id]);

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
		grid-column-gap: 0.3rem;
		grid-row-gap: 0.5rem;
		align-items: baseline;
		grid-template-areas: 'title time time' 'title badges supplier' 'content badges supplier';
		grid-template-columns: 1fr min-content min-content;
		grid-template-rows: auto auto auto;
	`;

	const compactCardGrid = css`
		display: grid;
		grid-column-gap: 0.3rem;
		grid-template-areas: 'title badges supplier time' 'content content content content';
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

	const classNameForStylingLabelsOnCardHover = 'wire-item-card';

	const zonedMoment = ingestedAtMoment.toZonedMoment(selectedTimezone);

	return (
		<Link to={id.toString()}>
			<div
				ref={ref}
				css={[
					showSecondaryFeedContent ? cardGrid : compactCardGrid,
					css`
						transition:
							background-color 0.3s,
							border-color 0.3s;
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
						background-color: ${hasBeenViewed ? accentBgColor : 'white'};
						hyphens: auto;
						hyphenate-limit-chars: 5 3 3;

						& h3 {
							grid-area: title;
						}
					`,
				]}
				className={classNameForStylingLabelsOnCardHover}
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
					{zonedMoment
						.formatListView()
						.split(', ')
						.map((part) => (
							<EuiText size="xs" key={part}>
								{part}
							</EuiText>
						))}
				</div>
				<div
					css={css`
						grid-area: badges;
						justify-self: end;
						align-self: flex-start;
					`}
				>
					{hasDataFormatting && (
						<EuiIcon type="visTable" size="m" title="Has data formatting" />
					)}
					{isAlert && (
						<AlertLabel
							outlined={hasBeenViewed}
							hoverParentClassName={classNameForStylingLabelsOnCardHover}
						/>
					)}
					{isLead && (
						<LeadLabel
							outlined={hasBeenViewed}
							hoverParentClassName={classNameForStylingLabelsOnCardHover}
						/>
					)}
				</div>

				<div
					css={css`
						grid-area: supplier;
						justify-self: end;
						align-self: flex-start;
					`}
				>
					<SupplierBadge
						supplier={supplier}
						isPrimary={!hasBeenViewed}
						isCondensed={!showSecondaryFeedContent}
					/>{' '}
				</div>
				<div
					css={css`
						grid-area: content;
						align-self: start;
					`}
				>
					{showSecondaryFeedContent && (
						<div
							css={css`
								${hasBeenViewed ? 'color:rgba(29, 42, 62,.8)' : ''};
								font-weight: ${hasBeenViewed
									? theme.euiTheme.font.weight.light
									: theme.euiTheme.font.weight.regular};
							`}
						>
							<MaybeSecondaryCardContent {...content} highlight={highlight} />
						</div>
					)}
					{hasMetadataToDisplay && (
						<ul
							css={css`
								color: ${theme.euiTheme.colors.textAccent};
								margin-top: ${theme.euiTheme.size.s};
								display: grid;
								grid-template-columns: min-content 1fr;
								gap: 0.2rem;
							`}
						>
							{showCollectionMetadata &&
								maybeTastedCollectionMetadata.map((metadata) => (
									<li
										css={css`
											display: contents;
										`}
										key={metadata.addedAt}
									>
										<span
											css={css`
												color: ${theme.euiTheme.colors.backgroundFilledAccent};
											`}
										>
											<EuiIcon type={CollectionsIcon} size="original" />
										</span>
										<EuiText size="xs">
											Added to collection
											{' • '}
											{convertToLocalDate(metadata.addedAt).fromNow()},
										</EuiText>
									</li>
								))}
							{toolLinks &&
								toolLinks.length > 0 &&
								toolLinks.map((link) => (
									<li
										key={link.id}
										css={css`
											display: contents;
										`}
									>
										<ToolSendReport toolLink={link} showIcon={true} />
									</li>
								))}
						</ul>
					)}
				</div>
			</div>
		</Link>
	);
};
