import {
	EuiBadge,
	EuiCodeBlock,
	EuiDescriptionList,
	EuiDescriptionListDescription,
	EuiDescriptionListTitle,
	EuiFlexGroup,
	EuiFlexItem,
	EuiListGroupItem,
	EuiPanel,
	EuiScreenReaderLive,
	EuiSpacer,
	EuiText,
	useEuiTheme,
} from '@elastic/eui';
import { css } from '@emotion/react';
import { Fragment, useMemo } from 'react';
import sanitizeHtml from 'sanitize-html';
import { lookupCatCodesWideSearch } from './catcodes-lookup';
import { useSearch } from './context/SearchContext.tsx';
import type { WireData } from './sharedTypes';

export const WireDetail = ({
	wire,
	isShowingJson,
}: {
	wire: WireData;
	isShowingJson: boolean;
}) => {
	const { handleEnterQuery, config } = useSearch();
	const theme = useEuiTheme();
	const { byline, keywords, usage, ednote, subjects } = wire.content;

	const handleSubjectClick = (subject: string) => {
		const subjects = config.query.subjects ?? [];
		handleEnterQuery({
			...config.query,
			subjects: subjects.includes(subject)
				? subjects.filter((s) => s !== subject)
				: [...subjects, subject],
		});
	};

	const isSubjectInSearch = (subject: string) => {
		const subjects = config.query.subjects ?? [];
		return subjects.includes(subject);
	};

	const safeBodyText = useMemo(() => {
		return wire.content.bodyText
			? sanitizeHtml(wire.content.bodyText)
			: undefined;
	}, [wire]);

	const safeHighlightText = useMemo(() => {
		return wire.highlight.trim().length > 0
			? sanitizeHtml(wire.highlight)
			: undefined;
	}, [wire]);

	const bodyTextContent = safeHighlightText ?? safeBodyText;

	const nonEmptyKeywords = useMemo(
		() => keywords?.filter((keyword) => keyword.trim().length > 0) ?? [],
		[keywords],
	);

	const nonEmptySubjects = useMemo(
		() => subjects?.code.filter((subject) => subject.trim().length > 0) ?? [],
		[subjects],
	);

	return (
		<Fragment>
			{isShowingJson ? (
				<EuiCodeBlock language="json">
					{JSON.stringify(wire, null, 2)}
				</EuiCodeBlock>
			) : (
				<>
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

					<EuiDescriptionList
						css={css`
							& mark {
								background-color: ${theme.euiTheme.colors.highlight};
								font-weight: bold;
								position: relative;
								border: 3px solid ${theme.euiTheme.colors.highlight};
							}
						`}
					>
						{ednote && (
							<p
								css={css`
									border: 1px solid;
									padding: ${theme.euiTheme.size.s};
									margin-bottom: ${theme.euiTheme.size.s};
									font-weight: ${theme.euiTheme.font.weight.bold};
								`}
							>
								{ednote}
							</p>
						)}
						{byline && (
							<>
								<EuiDescriptionListTitle>Byline</EuiDescriptionListTitle>
								<EuiDescriptionListDescription>
									{byline}
								</EuiDescriptionListDescription>
							</>
						)}
						{nonEmptySubjects.length > 0 && (
							<>
								<EuiDescriptionListTitle>Subjects</EuiDescriptionListTitle>
								<EuiDescriptionListDescription>
									<EuiPanel>
										<section
											css={css`
												max-height: 200px;
												overflow-y: auto;
											`}
										>
											<EuiDescriptionList>
												{nonEmptySubjects.map((subject) => (
													<>
														<EuiDescriptionListTitle>
															<EuiText size="s">
																<EuiBadge
																	iconType={
																		isSubjectInSearch(subject)
																			? 'cross'
																			: undefined
																	}
																	color={
																		!isSubjectInSearch(subject)
																			? 'hollow'
																			: undefined
																	}
																	iconSide="right"
																	onClickAriaLabel={`Filter search by "${subject}" subjects`}
																	onClick={() => handleSubjectClick(subject)}
																>
																	{subject}
																</EuiBadge>
															</EuiText>
														</EuiDescriptionListTitle>
														<EuiDescriptionListDescription key={subject}>
															{lookupCatCodesWideSearch(subject).length > 0 ? (
																<>
																	{lookupCatCodesWideSearch(subject).map(
																		(category) => (
																			<EuiListGroupItem
																				key={category}
																				label={category}
																				size="xs"
																				iconType={'dot'}
																				wrapText={true}
																			></EuiListGroupItem>
																		),
																	)}
																</>
															) : (
																<EuiText color="danger" key={subject} size="xs">
																	No category label found
																</EuiText>
															)}
														</EuiDescriptionListDescription>
													</>
												))}
											</EuiDescriptionList>
										</section>
									</EuiPanel>
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
						{bodyTextContent && (
							<>
								<EuiDescriptionListTitle>Body text</EuiDescriptionListTitle>
								<EuiDescriptionListDescription>
									<article
										dangerouslySetInnerHTML={{ __html: bodyTextContent }}
										css={css`
											& p {
												margin-bottom: ${theme.euiTheme.size.s};
											}
										`}
										data-pinboard-selection-target
									/>
								</EuiDescriptionListDescription>
							</>
						)}
					</EuiDescriptionList>
				</>
			)}
		</Fragment>
	);
};
