import {
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
import { formatTimestamp } from './formatTimestamp';
import type { WireData } from './sharedTypes';
import { useSearch } from './useSearch';

export const WireItemTable = ({ wires }: { wires: WireData[] }) => {
	const { config, handleSelectItem } = useSearch();

	const selectedWireId = config.itemId;

	return (
		<div>
			<EuiTable tableLayout="auto">
				<EuiTableHeader
					css={css`
						${euiScreenReaderOnly()}
					`}
				>
					<EuiTableHeaderCell>Headline</EuiTableHeaderCell>
					<EuiTableHeaderCell>Version Created</EuiTableHeaderCell>
				</EuiTableHeader>
				<EuiTableBody>
					{wires.map(({ id, content }) => (
						<WireDataRow
							key={id}
							id={id}
							content={content}
							selected={selectedWireId == id.toString()}
							handleSelect={handleSelectItem}
						/>
					))}
				</EuiTableBody>
			</EuiTable>
		</div>
	);
};

const WireDataRow = ({
	id,
	content,
	selected,
	handleSelect,
}: {
	id: number;
	content: WireData['content'];
	selected: boolean;
	handleSelect: (id: string) => void;
}) => {
	const theme = useEuiTheme();
	const primaryBgColor = useEuiBackgroundColor('primary');
	const accentBgColor = useEuiBackgroundColor('accent');
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
				}
				border-left: 4px solid
					${selected ? theme.euiTheme.colors.primary : 'transparent'};
				&:hover {
					border-left: 4px solid ${theme.euiTheme.colors.accent};
				}
			`}
		>
			<EuiTableRowCell valign="baseline">
				<EuiFlexGroup direction="column" gutterSize="xs">
					<EuiTitle size="xxs">
						<h3>{content.headline ?? '<no headline>'}</h3>
					</EuiTitle>
					<EuiText size="xs">
						<p>{content.subhead}</p>
					</EuiText>
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
										font-family: monospace;
										white-space: pre;
									`}
									key={part}
								>
									{part}
								</EuiText>
							))
					: ''}
			</EuiTableRowCell>
		</EuiTableRow>
	);
};
