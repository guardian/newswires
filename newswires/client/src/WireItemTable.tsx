import {
	EuiFlexGroup,
	EuiFlexItem,
	EuiText,
	useEuiBackgroundColor,
	useEuiTheme,
} from '@elastic/eui';
import { css } from '@emotion/react';
import { formatTimestamp } from './formatTimestamp';
import type { WireData } from './sharedTypes';
import { useSearch } from './useSearch';

const fadeOutBackground = (from: string, to: string = 'inherit') => css`
	animation: fadeOut ease-out 7s;
	@keyframes fadeOut {
		from {
			background-color: ${from};
		}
		to {
			background-color: ${to};
		}
	}
`;

export const WireItemTable = ({ wires }: { wires: WireData[] }) => {
	const { config } = useSearch();

	const selectedWireId = config.itemId;

	return (
		<ul>
			{wires.map(({ id, content, isFromRefresh }) => (
				<li key={id}>
					<WirePreviewCard
						id={id}
						content={content}
						isFromRefresh={isFromRefresh}
						selected={selectedWireId == id.toString()}
					/>
				</li>
			))}
		</ul>
	);
};

const WirePreviewCard = ({
	id,
	content,
	selected,
	isFromRefresh,
}: {
	id: number;
	content: WireData['content'];
	selected: boolean;
	isFromRefresh?: boolean;
}) => {
	const { config, Link } = useSearch();
	const theme = useEuiTheme();
	const accentBgColor = useEuiBackgroundColor('accent');
	const primaryBgColor = useEuiBackgroundColor('primary');

	const hasSlug = content.slug && content.slug.length > 0;

	return (
		<Link to={{ ...config, view: 'item', itemId: id.toString() }}>
			<EuiFlexGroup
				direction={'column'}
				gutterSize="xs"
				wrap={true}
				color={selected ? accentBgColor : 'inherit'}
				css={css`
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
					${isFromRefresh ? fadeOutBackground(primaryBgColor) : ''}
				`}
			>
				<EuiFlexItem grow={true}>
					<EuiFlexGroup gutterSize="m" alignItems="baseline">
						<EuiText
							size="s"
							css={css`
								font-weight: ${theme.euiTheme.font.weight.medium};
							`}
						>
							{hasSlug ? content.slug : (content.headline ?? 'No headline')}
						</EuiText>
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
					</EuiFlexGroup>
				</EuiFlexItem>
				<EuiFlexItem>
					{hasSlug && (
						<EuiText size="s" color={'subdued'}>
							<p>{content.headline}</p>
						</EuiText>
					)}
				</EuiFlexItem>
			</EuiFlexGroup>
		</Link>
	);
};
