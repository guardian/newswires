import type { EuiBasicTableColumn } from '@elastic/eui';
import {
	EuiBadge,
	EuiBasicTable,
	EuiButtonIcon,
	EuiCallOut,
	EuiCodeBlock,
	EuiDescriptionList,
	EuiDescriptionListDescription,
	EuiDescriptionListTitle,
	EuiFlexGroup,
	EuiFlexItem,
	EuiScreenReaderOnly,
	EuiSpacer,
	EuiText,
	EuiTitle,
	useEuiTheme,
} from '@elastic/eui';
import { css } from '@emotion/react';
import { useMemo } from 'react';
import sanitizeHtml from 'sanitize-html';
import { lookupCatCodesWideSearch } from './catcodes-lookup';
import { ComposerConnection } from './ComposerConnection.tsx';
import { useSearch } from './context/SearchContext.tsx';
import { Disclosure } from './Disclosure.tsx';
import type { WireData } from './sharedTypes';

function TitleContentForItem({
	slug,
	headline,
}: {
	slug?: string;
	headline?: string;
}) {
	if (headline && headline.length > 0) {
		return (
			<>
				{slug && <EuiText size={'xs'}>{slug}</EuiText>} {headline}
			</>
		);
	}

	return <>{slug ?? 'No title'}</>;
}

type SubjectTableItem = {
	code: string;
	labels: string;
	isSelected: boolean;
};

function SubjectTable({ subjects }: { subjects: string[] }) {
	const { handleEnterQuery, config } = useSearch();

	const isSubjectInSearch = (subject: string) => {
		const subjects = config.query.subjects ?? [];
		return subjects.includes(subject);
	};

	const nonEmptySubjects = subjects.filter(
		(subject) => subject.trim().length > 0,
	);
	const subjectTableItems: SubjectTableItem[] = nonEmptySubjects.map(
		(subject) => ({
			code: subject,
			labels: lookupCatCodesWideSearch(subject).join('; '),
			isSelected: isSubjectInSearch(subject),
		}),
	);

	const handleSubjectClick = (subject: string) => {
		const subjects = config.query.subjects ?? [];
		console.log('handleSubjectClick', subject, subjects);
		handleEnterQuery({
			...config.query,
			subjects: subjects.includes(subject)
				? subjects.filter((s) => s !== subject)
				: [...subjects, subject],
		});
	};

	const columns: Array<EuiBasicTableColumn<SubjectTableItem>> = [
		{
			field: 'code',
			name: 'Subject code',
		},
		{
			field: 'labels',
			name: 'Subject label(s)',
		},
		{
			field: 'isSelected',
			name: 'Filter by?',
			align: 'right',
			render: (isSelected, item) => (
				<EuiButtonIcon
					color={isSelected ? 'primary' : 'accent'}
					onClick={() => handleSubjectClick(item.code)}
					iconType={isSelected ? 'check' : 'plusInCircle'}
					aria-label="Toggle selection"
				/>
			),
		},
	];

	return (
		<Disclosure title={`Subjects (${subjectTableItems.length})`}>
			{subjectTableItems.length === 0 ? (
				'No subject information available'
			) : (
				<EuiBasicTable
					items={subjectTableItems}
					columns={columns}
					tableLayout="auto"
				/>
			)}
		</Disclosure>
	);
}

export const WireDetail = ({
	wire,
	isShowingJson,
}: {
	wire: WireData;
	isShowingJson: boolean;
}) => {
	const theme = useEuiTheme();
	const { byline, keywords, usage, ednote, subjects, headline, slug } =
		wire.content;

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

	return (
		<>
			<EuiFlexGroup justifyContent="spaceBetween">
				<EuiFlexItem grow={true}>
					<EuiTitle size="xs">
						<h2>
							<TitleContentForItem headline={headline} slug={slug} />
						</h2>
					</EuiTitle>
				</EuiFlexItem>
			</EuiFlexGroup>
			<EuiSpacer size="s" />
			{isShowingJson ? (
				<EuiCodeBlock language="json">
					{JSON.stringify(wire, null, 2)}
				</EuiCodeBlock>
			) : (
				<>
					<EuiSpacer size="xs" />
					<h3
						css={css`
							font-weight: ${theme.euiTheme.font.weight.bold};
						`}
					>
						{wire.content.subhead}
					</h3>
					<EuiSpacer size="s" />
					{ednote && <EuiCallOut size="s" title={ednote} color="success" />}
					<EuiSpacer size="s" />
					<EuiDescriptionList
						css={css`
							& mark {
								background-color: ${theme.euiTheme.colors.highlight};
								font-weight: bold;
								position: relative;
								border: 3px solid ${theme.euiTheme.colors.highlight};
							}
							display: flex;
							flex-direction: column;
							gap: ${theme.euiTheme.size.s};
						`}
					>
						{byline && (
							<>
								<EuiScreenReaderOnly>
									<EuiDescriptionListTitle>Byline</EuiDescriptionListTitle>
								</EuiScreenReaderOnly>
								<EuiDescriptionListDescription>
									<p
										css={css`
											font-style: italic;
										`}
									>
										{byline}
									</p>
								</EuiDescriptionListDescription>
							</>
						)}
						{bodyTextContent && (
							<>
								<EuiScreenReaderOnly>
									<EuiDescriptionListTitle>Body text</EuiDescriptionListTitle>
								</EuiScreenReaderOnly>
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
						<EuiDescriptionListTitle>Composer</EuiDescriptionListTitle>
						<EuiDescriptionListDescription>
							<ComposerConnection itemData={wire} key={wire.id} />
						</EuiDescriptionListDescription>
						<EuiDescriptionListTitle>Metadata</EuiDescriptionListTitle>
						<EuiDescriptionListDescription>
							<SubjectTable subjects={subjects?.code ?? []} />
							<EuiSpacer />
						</EuiDescriptionListDescription>
					</EuiDescriptionList>
				</>
			)}
		</>
	);
};
