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
import type { Moment } from 'moment';
import { useMemo } from 'react';
import sanitizeHtml from 'sanitize-html';
import { lookupCatCodesWideSearch } from './catcodes-lookup';
import { ComposerConnection } from './ComposerConnection.tsx';
import { useSearch } from './context/SearchContext.tsx';
import { convertToLocalDate, convertToLocalDateString } from './dateHelpers.ts';
import { Disclosure } from './Disclosure.tsx';
import type { WireData } from './sharedTypes';
import { AP, getSupplierInfo } from './suppliers.ts';

function TitleContentForItem({
	slug,
	headline,
	ingestedAt,
	supplierDetails,
}: {
	slug?: string;
	headline?: string;
	ingestedAt: Moment;
	supplierDetails?: {
		label: string;
		colour: string;
	};
}) {
	return (
		<>
			<EuiText size={'xs'}>
				{slug && <>{slug} &#183; </>}
				<span title={ingestedAt.format()}>{ingestedAt.fromNow()}</span>
			</EuiText>{' '}
			{supplierDetails && (
				<>
					<EuiBadge color={supplierDetails.colour}>
						{supplierDetails.label}
					</EuiBadge>{' '}
				</>
			)}
			{headline && headline.length > 0 ? headline : (slug ?? 'No title')}
		</>
	);
}

type CategoryCodeTableItem = {
	code: string;
	labels: string;
	isSelected: boolean;
};

function CategoryCodeTable({ categoryCodes }: { categoryCodes: string[] }) {
	const { handleEnterQuery, config } = useSearch();

	const isCodeInSearch = (code: string) => {
		const categoryCodesInSearch = config.query.categoryCode ?? [];
		return categoryCodesInSearch.includes(code);
	};

	const categoryCodeTableItems: CategoryCodeTableItem[] = categoryCodes.map(
		(code) => ({
			code: code,
			labels: lookupCatCodesWideSearch(code).join('; '),
			isSelected: isCodeInSearch(code),
		}),
	);

	const handleCategoryClick = (categoryCode: string) => {
		const codes = config.query.categoryCode ?? [];
		handleEnterQuery({
			...config.query,
			categoryCode: codes.includes(categoryCode)
				? codes.filter((s) => s !== categoryCode)
				: [...codes, categoryCode],
		});
	};

	const columns: Array<EuiBasicTableColumn<CategoryCodeTableItem>> = [
		{
			field: 'code',
			name: 'Category code',
		},
		{
			field: 'labels',
			name: 'Category label(s)*',
		},
		{
			field: 'isSelected',
			name: 'Filter by?',
			align: 'right',
			render: (isSelected, item) => (
				<EuiButtonIcon
					color={isSelected ? 'primary' : 'accent'}
					onClick={() => handleCategoryClick(item.code)}
					iconType={isSelected ? 'check' : 'plusInCircle'}
					aria-label="Toggle selection"
				/>
			),
		},
	];

	return (
		<Disclosure title={`Category Codes (${categoryCodeTableItems.length})`}>
			{categoryCodeTableItems.length === 0 ? (
				'No category code information available'
			) : (
				<figure>
					<EuiBasicTable
						items={categoryCodeTableItems}
						columns={columns}
						tableLayout="auto"
					/>
					<EuiSpacer size={'s'} />
					<figcaption>
						<EuiText size={'xs'}>
							<p>
								Category codes associated with this item. Many of these are
								agency-specific.
							</p>
							<p>
								* nb. Category labels are a best approximation, please let us
								know if you spot any that don&apos;t look right!
							</p>
						</EuiText>
					</figcaption>
				</figure>
			)}
		</Disclosure>
	);
}

function MetaTable({ wire }: { wire: WireData }) {
	const { externalId, ingestedAt } = wire;
	const { firstVersion, status, versionCreated, version } = wire.content;

	const metaItems = [
		{
			title: 'Status',
			description: status ?? 'N/A',
		},
		{
			title: 'External ID',
			description: externalId,
		},
		{
			title: 'Ingested at',
			description: convertToLocalDateString(ingestedAt),
		},
		{
			title: 'First version',
			description: firstVersion
				? convertToLocalDateString(firstVersion)
				: 'N/A',
		},
		{
			title: 'This version created',
			description: versionCreated
				? convertToLocalDateString(versionCreated)
				: 'N/A',
		},
		{
			title: 'Version',
			description: version ?? 'N/A',
		},
	];

	return (
		<Disclosure title="General" defaultOpen={true}>
			<EuiBasicTable
				columns={[
					{ field: 'title', name: '' },
					{ field: 'description', name: 'Description' },
				]}
				items={metaItems.map(({ title, description }) => ({
					title,
					description,
				}))}
				tableLayout="auto"
			/>
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
	const { categoryCodes } = wire;
	const { byline, keywords, usage, ednote, headline, slug, abstract } =
		wire.content;

	const safeAbstract = useMemo(() => {
		return abstract ? sanitizeHtml(abstract) : undefined;
	}, [abstract]);

	const safeBodyText = useMemo(() => {
		return wire.content.bodyText
			? sanitizeHtml(wire.content.bodyText)
			: undefined;
	}, [wire]);

	const safeHighlightText = useMemo(() => {
		return wire.highlight && wire.highlight.trim().length > 0
			? sanitizeHtml(wire.highlight)
			: undefined;
	}, [wire]);

	const bodyTextContent = safeHighlightText ?? safeBodyText;

	const nonEmptyKeywords = useMemo(
		() => keywords?.filter((keyword) => keyword.trim().length > 0) ?? [],
		[keywords],
	);

	const supplierInfo = getSupplierInfo(wire.supplier);

	const supplierLabel = supplierInfo?.label ?? wire.supplier;
	const supplierColour = supplierInfo?.colour ?? theme.euiTheme.colors.text;

	return (
		<>
			<EuiFlexGroup justifyContent="spaceBetween">
				<EuiFlexItem grow={true}>
					<EuiTitle size="xs">
						<h2>
							<TitleContentForItem
								headline={headline}
								slug={slug}
								ingestedAt={convertToLocalDate(wire.ingestedAt)}
								supplierDetails={{
									label: supplierLabel,
									colour: supplierColour,
								}}
							/>
						</h2>
					</EuiTitle>
				</EuiFlexItem>
			</EuiFlexGroup>
			<EuiSpacer size="s" />

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
						{safeAbstract && wire.supplier === AP && (
							<>
								<EuiScreenReaderOnly>
									<EuiDescriptionListTitle>Abstract</EuiDescriptionListTitle>
								</EuiScreenReaderOnly>
								<EuiDescriptionListDescription>
									<p>(abstract) {safeAbstract}</p>
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
							<MetaTable wire={wire} />
							<EuiSpacer />
							<CategoryCodeTable categoryCodes={categoryCodes} />
							<EuiSpacer />
						</EuiDescriptionListDescription>
					</EuiDescriptionList>
				</>
			)}
		</>
	);
};
