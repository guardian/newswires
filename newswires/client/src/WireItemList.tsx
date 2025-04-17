import {
	EuiBadge,
	EuiButton,
	EuiScreenReaderOnly,
	EuiText,
	EuiTextBlockTruncate,
	useEuiBackgroundColor,
	useEuiTheme,
} from '@elastic/eui';
import { css } from '@emotion/react';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import sanitizeHtml from 'sanitize-html';
import { lightShadeOf } from './colour-utils.ts';
import { useSearch } from './context/SearchContext.tsx';
import { useUserSettings } from './context/UserSettingsContext.tsx';
import { formatTimestamp } from './formatTimestamp.ts';
import { Link } from './Link.tsx';
import type { WireData } from './sharedTypes.ts';
import { getSupplierInfo } from './suppliers.ts';

export const WireItemList = ({
	wires,
	totalCount,
}: {
	wires: WireData[];
	totalCount: number;
}) => {
	const { config, loadMoreResults } = useSearch();

	const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

	const selectedWireId = config.itemId;

	const handleLoadMoreResults = () => {
		if (wires.length > 0) {
			setIsLoadingMore(true);

			const beforeId = Math.min(...wires.map((wire) => wire.id)).toString();

			void loadMoreResults(beforeId).finally(() => {
				setIsLoadingMore(false);
			});
		}
	};

	return (
		<>
			<ul>
				{wires.map(
					({ id, content, supplier, highlight, isFromRefresh, ingestedAt }) => (
						<li key={id}>
							<WirePreviewCard
								id={id}
								ingestedAt={ingestedAt}
								supplier={supplier}
								content={content}
								isFromRefresh={isFromRefresh}
								highlight={highlight}
								selected={selectedWireId == id.toString()}
							/>
						</li>
					),
				)}
			</ul>
			{wires.length < totalCount && (
				<EuiButton
					isLoading={isLoadingMore}
					css={css`
						margin-top: 12px;
					`}
					onClick={handleLoadMoreResults}
				>
					{isLoadingMore ? 'Loading' : 'Load more'}
				</EuiButton>
			)}
		</>
	);
};

function decideMainHeadingContent(
	supplier: string,
	{ headline, slug }: WireData['content'],
): string {
	const prefix =
		supplier === 'AAP' && slug && slug.length > 0 ? `${slug} - ` : '';

	if (headline && headline.length > 0) {
		return `${prefix}${headline}`;
	}

	if (slug && slug.length > 0) {
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
		? sanitizeHtml(bodyText, { allowedTags: [], allowedAttributes: {} }).slice(
				0,
				300,
			)
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

const WirePreviewCard = ({
	id,
	supplier,
	ingestedAt,
	content,
	highlight,
	selected,
}: {
	id: number;
	supplier: string;
	ingestedAt: string;
	content: WireData['content'];
	highlight: string | undefined;
	selected: boolean;
	isFromRefresh: boolean;
}) => {
	const { viewedItemIds } = useSearch();
	const { showSecondaryFeedContent } = useUserSettings();

	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (selected && ref.current) {
			ref.current.scrollIntoView({
				behavior: 'smooth',
				block: 'nearest',
			});
		}
	}, [selected]);

	const theme = useEuiTheme();
	const accentBgColor = useEuiBackgroundColor('subdued', {
		method: 'transparent',
	});

	const supplierInfo = getSupplierInfo(supplier);

	const supplierLabel =
		(showSecondaryFeedContent
			? supplierInfo?.label
			: supplierInfo?.shortLabel) ?? supplier;
	const supplierColour = supplierInfo?.colour ?? theme.euiTheme.colors.text;

	const mainHeadingContent = decideMainHeadingContent(supplier, content);

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
						padding: 0.5rem;
						box-sizing: content-box;
						color: ${theme.euiTheme.colors.text};
						background-color: ${hasBeenViewed ? accentBgColor : 'inherit'};

						& h3 {
							grid-area: title;
						}
					`,
				]}
			>
				<h3
					css={css`
						font-weight: ${hasBeenViewed
							? theme.euiTheme.font.weight.regular
							: theme.euiTheme.font.weight.medium};
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
							? theme.euiTheme.font.weight.regular
							: theme.euiTheme.font.weight.medium};
						justify-self: end;
						text-align: right;
						font-variant-numeric: tabular-nums;
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
				<EuiBadge
					title={`${supplierLabel} supplier`}
					css={css`
						grid-area: supplier;
						justify-self: end;
						margin-top: ${showSecondaryFeedContent ? '0.5rem' : '0'};
					`}
					color={hasBeenViewed ? lightShadeOf(supplierColour) : supplierColour}
				>
					{supplierLabel}
				</EuiBadge>
				{showSecondaryFeedContent && (
					<div
						css={css`
							margin-top: 0.5rem;
							grid-area: content;
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
