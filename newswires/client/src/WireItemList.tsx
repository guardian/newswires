import {
	EuiBadge,
	EuiButton,
	EuiText,
	useEuiBackgroundColor,
	useEuiTheme,
} from '@elastic/eui';
import { css } from '@emotion/react';
import { useEffect, useRef, useState } from 'react';
import sanitizeHtml from 'sanitize-html';
import { useSearch } from './context/SearchContext.tsx';
import { formatTimestamp } from './formatTimestamp.ts';
import { Link } from './Link.tsx';
import type { WireData } from './sharedTypes.ts';
import { getSupplierInfo } from './suppliers.ts';

const fadeOutBackground = css`
	animation: fadeOut ease-out 15s;
	@keyframes fadeOut {
		from {
			background-color: aliceblue;
		}
		to {
			background-color: white;
		}
	}
`;

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
				{wires.map(({ id, content, supplier, highlight, isFromRefresh }) => (
					<li key={id}>
						<WirePreviewCard
							id={id}
							supplier={supplier}
							content={content}
							isFromRefresh={isFromRefresh}
							highlight={highlight}
							selected={selectedWireId == id.toString()}
						/>
					</li>
				))}
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

function decideMainHeadingContent({
	headline,
	slug,
}: WireData['content']): string {
	if (headline && headline.length > 0) {
		return headline;
	}
	if (slug && slug.length > 0) {
		return slug;
	}
	return 'No headline';
}

function decideSecondaryCardContent({
	headline,
	subhead,
	bodyText,
}: WireData['content']): string | undefined {
	if (subhead && subhead !== headline) {
		return subhead;
	}
	const maybeBodyTextPreview = bodyText
		? sanitizeHtml(bodyText, { allowedTags: [], allowedAttributes: {} }).slice(
				0,
				100,
			)
		: undefined;
	if (maybeBodyTextPreview && maybeBodyTextPreview !== headline) {
		return maybeBodyTextPreview;
	}
}

const WirePreviewCard = ({
	id,
	supplier,
	content,
	highlight,
	selected,
	isFromRefresh,
}: {
	id: number;
	supplier: string;
	content: WireData['content'];
	highlight: string;
	selected: boolean;
	isFromRefresh: boolean;
}) => {
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
	const accentBgColor = useEuiBackgroundColor('accent');

	const supplierInfo = getSupplierInfo(supplier);

	const supplierLabel = supplierInfo?.label ?? supplier;
	const supplierColour = supplierInfo?.colour ?? theme.euiTheme.colors.text;

	const mainHeadingContent = decideMainHeadingContent(content);

	const maybeSecondaryCardContent = decideSecondaryCardContent(content);

	const cardGrid = css`
		display: grid;
		gap: 0.5rem;
		align-items: baseline;
		grid-template-areas: 'badge title date' 'content content content';
		grid-template-columns: min-content 1fr auto;
		grid-template-rows: auto auto;
	`;

	return (
		<Link to={id.toString()}>
			<div
				ref={ref}
				css={[
					cardGrid,
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
						background-color: ${selected ? accentBgColor : 'inherit'};
						${isFromRefresh ? fadeOutBackground : ''}
					`,
				]}
			>
				<EuiBadge color={supplierColour}>{supplierLabel}</EuiBadge>
				<h3>
					<p>{mainHeadingContent}</p>
				</h3>
				{content.versionCreated
					? formatTimestamp(content.versionCreated)
							.split(', ')
							.map((part) => (
								<EuiText
									size="xs"
									key={part}
									css={css`
										padding-left: 5px;
									`}
								>
									{part}
								</EuiText>
							))
					: ''}
				<div
					css={css`
						grid-area: content;
					`}
				>
					{maybeSecondaryCardContent && <p>{maybeSecondaryCardContent}</p>}
					{highlight && highlight.trim().length > 0 && (
						<EuiText
							size="xs"
							css={css`
								margin-top: 0.1rem;
								padding: 0.1rem 0.5rem;
								background-color: ${theme.euiTheme.colors.highlight};
								justify-self: start;
							`}
						>
							<p
								dangerouslySetInnerHTML={{ __html: sanitizeHtml(highlight) }}
							/>
						</EuiText>
					)}
				</div>
			</div>
		</Link>
	);
};
