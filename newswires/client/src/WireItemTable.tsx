import {
	EuiButtonIcon,
	EuiFlexGroup,
	euiScreenReaderOnly,
	EuiTable,
	EuiTableBody,
	EuiTableHeader,
	EuiTableHeaderCell,
	EuiTableRow,
	EuiTableRowCell,
	EuiText,
	EuiTitle,
	useEuiBackgroundColor,
	useEuiTheme,
} from '@elastic/eui';
import { css } from '@emotion/react';
import { useMemo } from 'react';
import sanitizeHtml from 'sanitize-html';
import { formatTimestamp } from './formatTimestamp';
import type { WireData } from './sharedTypes';
import { useSavedItems } from './useSavedItemsList';
import { useSearch } from './useSearch';

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

export const WireItemTable = ({ wires }: { wires: WireData[] }) => {
	const { config, handleSelectItem } = useSearch();

	const selectedWireId = config.itemId;

	return (
		<EuiTable
			tableLayout="auto"
			responsiveBreakpoint={config.view === 'item' ? true : 'm'}
		>
			<EuiTableHeader
				css={css`
					${euiScreenReaderOnly()}
				`}
			>
				<EuiTableHeaderCell>Headline</EuiTableHeaderCell>
				<EuiTableHeaderCell>Version Created</EuiTableHeaderCell>
			</EuiTableHeader>
			<EuiTableBody>
				{wires.map(({ id, content, isFromRefresh, highlight }) => (
					<WireDataRow
						key={id}
						id={id}
						content={content}
						isFromRefresh={isFromRefresh}
						highlight={highlight}
						selected={selectedWireId == id.toString()}
						handleSelect={handleSelectItem}
					/>
				))}
			</EuiTableBody>
		</EuiTable>
	);
};

const WireDataRow = ({
	id,
	content,
	highlight,
	selected,
	isFromRefresh,
	handleSelect,
}: {
	id: number;
	content: WireData['content'];
	highlight: string;
	selected: boolean;
	isFromRefresh: boolean;
	handleSelect: (id: string) => void;
}) => {
	const theme = useEuiTheme();
	const { savedItems: saved, addSaved, removeSaved } = useSavedItems();

	const primaryBgColor = useEuiBackgroundColor('primary');
	const accentBgColor = useEuiBackgroundColor('accent');

	const hasSlug = content.slug && content.slug.length > 0;
	const isSaved = useMemo(
		() => saved.map((s) => s.id).includes(id.toString()),
		[saved, id],
	);

	return (
		<EuiTableRow
			key={id}
			onClick={() => {
				handleSelect(id.toString());
			}}
			color={selected ? accentBgColor : 'inherit'}
			css={css`
				&:hover {
					background-color: ${primaryBgColor};
					border-left: 4px solid ${theme.euiTheme.colors.accent};
				}
				border-left: 4px solid
					${selected ? theme.euiTheme.colors.primary : 'transparent'};
				${isFromRefresh ? fadeOutBackground : ''}
			`}
		>
			<EuiTableRowCell valign="baseline">
				<EuiFlexGroup direction="column" gutterSize="xs">
					<EuiTitle size="xxs">
						<h3>
							{hasSlug ? content.slug : (content.headline ?? 'No headline')}
						</h3>
					</EuiTitle>
					{hasSlug && (
						<EuiText size="s">
							<p>{content.headline}</p>
						</EuiText>
					)}
					{highlight.trim().length > 0 && (
						<EuiText
							size="xs"
							css={css`
								padding-left: 5px;
								background-color: ${theme.euiTheme.colors.highlight};
							`}
						>
							<p
								dangerouslySetInnerHTML={{ __html: sanitizeHtml(highlight) }}
							/>
						</EuiText>
					)}
				</EuiFlexGroup>
			</EuiTableRowCell>
			<EuiTableRowCell align="right" valign="baseline">
				{content.versionCreated
					? formatTimestamp(content.versionCreated)
							.split(', ')
							.map((part) => (
								<EuiText
									size="xs"
									css={css`
										white-space: pre;
									`}
									key={part}
								>
									{part}
								</EuiText>
							))
					: ''}
			</EuiTableRowCell>
			<EuiTableRowCell align="right" valign="baseline" hasActions={true}>
				{isSaved ? (
					<EuiButtonIcon
						aria-label="Remove from favourites"
						iconType="starFilled"
						onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
							e.stopPropagation();
							removeSaved({
								id: id.toString(),
								headline: content.slug ?? content.headline ?? '',
							});
						}}
					/>
				) : (
					<EuiButtonIcon
						aria-label="Add to favourites"
						iconType="starEmpty"
						onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
							e.stopPropagation();
							addSaved({
								id: id.toString(),
								headline: content.slug ?? content.headline ?? '',
							});
						}}
					/>
				)}
			</EuiTableRowCell>
		</EuiTableRow>
	);
};
