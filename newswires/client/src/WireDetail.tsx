import {
	EuiBadge,
	EuiDescriptionList,
	EuiFlexGroup,
	EuiFlexItem,
	EuiSpacer,
} from '@elastic/eui';
import { css } from '@emotion/react';
import { Fragment, useMemo } from 'react';
import sanitizeHtml from 'sanitize-html';
import type { WireData } from './sharedTypes';

export const WireDetail = ({ wire }: { wire: WireData }) => {
	const { byline, keywords, usage } = wire.content;

	const safeBodyText = useMemo(() => {
		return wire.content.body_text
			? sanitizeHtml(wire.content.body_text)
			: undefined;
	}, [wire]);

	const listItems = [
		{
			title: 'Byline',
			description: byline ?? 'Not found',
		},
		{
			title: 'Keywords',
			description: (
				<EuiFlexGroup wrap responsive={false} gutterSize="xs">
					{keywords?.map((keyword) => (
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

	return (
		<Fragment>
			<h3
				css={css`
					font-weight: 300;
				`}
			>
				{wire.content.subhead}
			</h3>

			<EuiSpacer size="m" />

			<EuiDescriptionList listItems={listItems} />
		</Fragment>
	);
};
