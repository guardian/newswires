import {
	EuiCard,
	EuiFlexGroup,
	EuiFlexItem,
	EuiPanel,
	EuiText,
	EuiTitle,
} from '@elastic/eui';
import { css } from '@emotion/react';
import { useMemo } from 'react';
import type { WireData } from './sharedTypes';
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
	return (
		<EuiFlexItem key={wire.id}>
			<EuiCard
				paddingSize="xs"
				title={
					<EuiTitle size="xxs">
						<h2>{wire.content.headline ?? '<missing headline>'}</h2>
					</EuiTitle>
				}
				icon={
					<EuiPanel
						css={css`
							background-color: rgba(255, 0, 0, 0.5);
							font-size: 0.75rem;
						`}
						paddingSize="s"
					>
						PA
					</EuiPanel>
				}
				layout="horizontal"
				display={selected ? 'primary' : 'plain'}
				onClick={onClick}
			>
				<EuiText size="xs">{wire.content.subhead ?? ''}</EuiText>
			</EuiCard>
		</EuiFlexItem>
	);
};
