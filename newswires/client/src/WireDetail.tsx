import {
	EuiBadge,
	EuiDescriptionList,
	EuiDescriptionListDescription,
	EuiDescriptionListTitle,
	EuiFlexGroup,
	EuiFlexItem,
	EuiScreenReaderLive,
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

	const nonEmptyKeywords = useMemo(
		() => keywords?.filter((keyword) => keyword.trim().length > 0) ?? [],
		[keywords],
	);

	return (
		<Fragment>
			<EuiScreenReaderLive focusRegionOnTextChange>
				<h3
					css={css`
						font-weight: 300;
					`}
				>
					{wire.content.subhead}
				</h3>
			</EuiScreenReaderLive>

			<EuiSpacer size="m" />

			<EuiDescriptionList>
				{byline && (
					<>
						<EuiDescriptionListTitle>Byline</EuiDescriptionListTitle>
						<EuiDescriptionListDescription>
							{byline}
						</EuiDescriptionListDescription>
					</>
				)}
				{nonEmptyKeywords.length > 0 && (
					<>
						<EuiDescriptionListTitle>Keywords</EuiDescriptionListTitle>
						<EuiDescriptionListDescription>
							<EuiFlexGroup wrap responsive={false} gutterSize="xs">
								{nonEmptyKeywords.map((keyword) => (
									<EuiFlexItem key={keyword} grow={false}>
										<EuiBadge color="primary">{keyword}</EuiBadge>
									</EuiFlexItem>
								))}
							</EuiFlexGroup>
						</EuiDescriptionListDescription>
					</>
				)}
				{usage && (
					<>
						<EuiDescriptionListTitle>
							Usage restrictions
						</EuiDescriptionListTitle>
						<EuiDescriptionListDescription>
							{usage}
						</EuiDescriptionListDescription>
					</>
				)}
				{safeBodyText && (
					<>
						<EuiDescriptionListTitle>Body text</EuiDescriptionListTitle>
						<EuiDescriptionListDescription>
							<article dangerouslySetInnerHTML={{ __html: safeBodyText }} />
						</EuiDescriptionListDescription>
					</>
				)}
			</EuiDescriptionList>
		</Fragment>
	);
};
