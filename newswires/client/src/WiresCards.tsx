import {
	EuiCard,
	EuiFlexGroup,
	EuiFlexItem,
	EuiText,
	EuiThemeProvider,
	EuiTitle,
	useEuiBackgroundColor,
	useEuiTheme,
} from '@elastic/eui';
import { css } from '@emotion/react';
import { useMemo } from 'react';
import type { WireData } from './sharedTypes';
import { formatTimestamp } from './timestamp';
import { isItemPath, useHistory } from './urlState';

export const WireCardList = ({ wires }: { wires: WireData[] }) => {
	const { currentState, pushState } = useHistory();
	const selectedWireId = useMemo(
		() =>
			isItemPath(currentState.location)
				? currentState.location.replace('item/', '')
				: undefined,
		[currentState.location],
	);

	return (
		<div>
			<EuiFlexGroup gutterSize="s" direction="column">
				{wires.map((wire) => (
					<WirePanel
						wire={wire}
						key={wire.id}
						onClick={() =>
							pushState({
								location: `item/${wire.id}`,
								params: currentState.params,
							})
						}
						selected={selectedWireId == wire.id.toString()}
					/>
				))}
			</EuiFlexGroup>
		</div>
	);
};

const WirePanel = ({
	wire,
	onClick,
	selected,
}: {
	wire: WireData;
	onClick: () => void;
	selected?: boolean;
}) => {
	const { euiTheme } = useEuiTheme();
	const primaryBgColor = useEuiBackgroundColor('primary');
	const accentBgColor = useEuiBackgroundColor('accent');

	return (
		<EuiThemeProvider>
			<EuiFlexItem key={wire.id}>
				<EuiCard
					title={
						<EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
							<EuiFlexItem grow={false}>
								<EuiTitle size="xxs">
									<h2>{wire.content.headline ?? '<missing headline>'}</h2>
								</EuiTitle>
							</EuiFlexItem>
							{wire.content.versionCreated && (
								<EuiFlexItem grow={false}>
									<EuiText size="xs">
										{formatTimestamp(wire.content.versionCreated)}
									</EuiText>
								</EuiFlexItem>
							)}
						</EuiFlexGroup>
					}
					layout="horizontal"
					display={'primary'}
					onClick={onClick}
					css={css`
						padding: ${euiTheme.size.xs} ${euiTheme.size.s};
						background-color: ${selected ? primaryBgColor : 'inherit'};
						&:hover {
							box-shadow: none;
							transform: none;
							background-color: ${accentBgColor};
						}
					`}
				>
					<EuiText size="xs">{wire.content.subhead ?? ''}</EuiText>
				</EuiCard>
			</EuiFlexItem>
		</EuiThemeProvider>
	);
};
