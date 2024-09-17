import {
	EuiBadge,
	EuiButton,
	EuiCard,
	EuiDescriptionList,
	EuiFlexGroup,
	EuiFlexItem,
	EuiFlyout,
	EuiFlyoutBody,
	EuiFlyoutFooter,
	EuiPanel,
	EuiSpacer,
	EuiText,
	EuiTitle,
	useGeneratedHtmlId,
} from '@elastic/eui';
import { css } from '@emotion/react';
import { useMemo, useState } from 'react';
import sanitizeHtml from 'sanitize-html';
import type { WireData } from './sharedTypes';

export const WireCardList = ({ wires }: { wires: WireData[] }) => {
	const [isFlyoutVisible, setIsFlyoutVisible] = useState(false);
	const [selectedWireId, setSelectedWireId] = useState<number | undefined>(
		undefined,
	);
	const selectedWire = useMemo(
		() => wires.find((wire) => wire.id == selectedWireId),
		[wires, selectedWireId],
	);
	const safeBodyText = useMemo(() => {
		return selectedWire?.content.body_text
			? sanitizeHtml(selectedWire.content.body_text)
			: undefined;
	}, [selectedWire]);
	const pushedFlyoutTitleId = useGeneratedHtmlId({
		prefix: 'pushedFlyoutTitle',
	});

	let flyout;

	const toggleVisibilityFor = (id: number) => {
		if (id == selectedWireId) {
			setIsFlyoutVisible(!isFlyoutVisible);
		} else {
			setIsFlyoutVisible(true);
		}
		setSelectedWireId(id);
	};

	if (isFlyoutVisible && !!selectedWire) {
		const { byline, keywords, usage } = selectedWire.content;
		const listItems = [
			{
				title: 'Byline',
				description: byline ?? 'Not found',
			},
			{
				title: 'Keywords',
				description: (
					<EuiFlexGroup wrap responsive={false} gutterSize="xs">
						{keywords?.split('+').map((keyword) => (
							<EuiFlexItem key={keyword} grow={false}>
								<EuiBadge color="primary">{keyword}</EuiBadge>
							</EuiFlexItem>
						))}
					</EuiFlexGroup>
				),
			},
			{
				title: 'Usage restrictions',
				description: usage ?? 'Not found',
			},
			{
				title: 'Body text',
				description: safeBodyText ? (
					<article dangerouslySetInnerHTML={{ __html: safeBodyText }} />
				) : (
					'Not found'
				),
			},
		];

		flyout = (
			<EuiFlyout
				type="push"
				size="s"
				onClose={() => setIsFlyoutVisible(false)}
				aria-labelledby={pushedFlyoutTitleId}
			>
				<EuiFlyoutBody>
					<EuiTitle size="s">
						<h2 id={pushedFlyoutTitleId}>{selectedWire.content.headline}</h2>
					</EuiTitle>
					<EuiSpacer size="xs" />

					<h3
						css={css`
							font-weight: 300;
						`}
					>
						{selectedWire.content.subhead}
					</h3>

					<EuiSpacer size="m" />

					<EuiDescriptionList listItems={listItems} />
				</EuiFlyoutBody>
				<EuiFlyoutFooter>
					<EuiButton onClick={() => setIsFlyoutVisible(false)}>Close</EuiButton>
				</EuiFlyoutFooter>
			</EuiFlyout>
		);
	}

	return (
		<div>
			<EuiFlexGroup gutterSize="s" direction="column">
				{wires.map((wire) => (
					<WirePanel
						wire={wire}
						key={wire.id}
						onClick={() => toggleVisibilityFor(wire.id)}
						selected={selectedWireId == wire.id}
					/>
				))}
			</EuiFlexGroup>
			{flyout}
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
