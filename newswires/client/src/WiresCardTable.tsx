import {
	EuiFlexGroup,
	euiScreenReaderOnly,
	EuiTable,
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
import { useCallback, useMemo, useRef } from 'react';
import type { WireData } from './sharedTypes';
import { formatTimestamp } from './timestamp';
import { isItemPath, useHistory } from './urlState';

export const WireCardTable = ({ wires }: { wires: WireData[] }) => {
	const { currentState, pushState } = useHistory();

	const selectedWireId = useMemo(
		() =>
			isItemPath(currentState.location)
				? currentState.location.replace('item/', '')
				: undefined,
		[currentState.location],
	);

	const handleSelect = useCallback(
		(id: number, ref: React.RefObject<HTMLTableRowElement>) => {
			ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
			console.log(ref.current);
			pushState({ location: `item/${id}`, params: currentState.params });
		},
		[currentState.params, pushState],
	);

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
				{wires.map(({ id, content }) => (
					<WireDataRow
						key={id}
						id={id}
						content={content}
						selected={selectedWireId == id.toString()}
						handleSelect={handleSelect}
					/>
				))}
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
	handleSelect: (id: number, ref: React.RefObject<HTMLTableRowElement>) => void;
}) => {
	// ref that can be used to scroll into view
	const rowRef = useRef<HTMLTableRowElement>(null);
	const theme = useEuiTheme();
	const primaryBgColor = useEuiBackgroundColor('primary');
	const accentBgColor = useEuiBackgroundColor('accent');
	return (
		<EuiTableRow
			key={id}
			onClick={() => {
				handleSelect(id, rowRef);
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
			isSelectable={false}
		>
			<EuiTableRowCell valign="baseline">
				<EuiFlexGroup direction="column" gutterSize="xs">
					<EuiTitle size="xxs">
						<h3 ref={rowRef}>{content.headline ?? '<no headline>'}</h3>
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
