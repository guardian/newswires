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
	EuiIcon,
	EuiSpacer,
	EuiText,
	EuiTitle,
	useEuiTheme,
} from '@elastic/eui';
import { css } from '@emotion/react';
import type { Moment } from 'moment';
import { useMemo, useState } from 'react';
import sanitizeHtml from 'sanitize-html';
import { lookupCatCodesWideSearch } from './catcodes-lookup';
import { ComposerConnection } from './ComposerConnection.tsx';
import { useSearch } from './context/SearchContext.tsx';
import { useTelemetry } from './context/TelemetryContext.tsx';
import { convertToLocalDate, convertToLocalDateString } from './dateHelpers.ts';
import { Disclosure } from './Disclosure.tsx';
import type { SupplierInfo, WireData } from './sharedTypes';
import { SupplierBadge } from './SupplierBadge.tsx';
import { AP } from './suppliers.ts';
import { Tooltip } from './Tooltip.tsx';
import { configToUrl } from './urlState.ts';

function TitleContentForItem({
	id,
	slug,
	headline,
	ingestedAt,
	supplier,
}: {
	id: number;
	slug?: string;
	headline?: string;
	ingestedAt: Moment;
	supplier: SupplierInfo;
}) {
	const headlineText =
		headline && headline.length > 0 ? headline : (slug ?? 'No title');

	return (
		<div
			css={css`
				display: flex;
				flex-direction: column-reverse;
			`}
		>
			<div
				css={css`
					display: flex;
					align-items: center;
					gap: 0.5rem;
				`}
			>
				<EuiTitle size="xs">
					<h2>
						<EuiText size={'xs'}></EuiText>
						{headlineText}
					</h2>
				</EuiTitle>
				<CopyButton id={id} headlineText={headlineText} />
			</div>
			<h3>
				<SupplierBadge supplier={supplier} /> {slug && <>{slug} &#183; </>}
				<Tooltip tooltipContent={ingestedAt.format()}>
					{ingestedAt.fromNow()}
				</Tooltip>
			</h3>
		</div>
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

function GeographyCodeTable({ categoryCodes }: { categoryCodes: string[] }) {
	const { handleEnterQuery, config } = useSearch();

	const isCodeInSearch = (code: string) => {
		const categoryCodesInSearch = config.query.categoryCode ?? [];
		return categoryCodesInSearch.includes(code);
	};

	const categoryCodeTableItems: CategoryCodeTableItem[] = categoryCodes.map(
		(code) => ({
			code: code,
			labels: code.split(':')[1] ?? '',
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
			field: 'labels',
			name: 'Geographical category*',
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
		<Disclosure
			title={
				<span
					css={css`
						display: flex;
						align-items: center;
						gap: 0.5rem;
					`}
				>
					<EuiIcon type={'flask'} color="accent" />
					Experimental geographical categories ({categoryCodeTableItems.length})
				</span>
			}
		>
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
								<strong>nb.</strong> Geographical tagging is totally
								experimental at the moment! Please let us know if you have any
								feedback.
							</p>
							<p>
								The two letter country codes are using the{' '}
								<a
									href="https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2"
									target="_blank"
									rel="noopener noreferrer"
								>
									ISO alpha-2 scheme
								</a>{' '}
								.
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

function CopyButton({
	id,
	headlineText,
}: {
	id: number;
	headlineText: string;
}) {
	const { sendTelemetryEvent } = useTelemetry();
	const { config } = useSearch();
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		try {
			const wireUrl = configToUrl({
				...config,
				view: 'item',
				itemId: id.toString(),
			});
			const fullUrl = `${window.location.origin}${wireUrl}`;

			await navigator.clipboard.write([
				new ClipboardItem({
					'text/plain': new Blob([`${headlineText}\n${fullUrl}`], {
						type: 'text/plain',
					}),
					'text/html': new Blob([`<a href="${fullUrl}">${headlineText}</a>`], {
						type: 'text/html',
					}),
				}),
			]);
			sendTelemetryEvent('NEWSWIRES_COPY_ITEM_BUTTON', {
				itemId: id,
				status: 'success',
			});
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error('Failed to copy to clipboard:', err);
		}
	};

	return (
		<Tooltip
			tooltipContent={copied ? 'Copied!' : 'Copy headline and URL'}
			position="left"
		>
			<EuiButtonIcon
				aria-label="Copy headline and URL"
				size="xs"
				iconType={copied ? 'check' : 'link'}
				onClick={() => void handleCopy()}
			/>
		</Tooltip>
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

	return (
		<>
			<div
				css={css`
					display: flex;
					align-items: end;
				`}
			>
				<TitleContentForItem
					id={wire.id}
					headline={headline}
					slug={slug}
					ingestedAt={convertToLocalDate(wire.ingestedAt)}
					supplier={wire.supplier}
				/>
			</div>
			<EuiSpacer size="s" />
			{isShowingJson ? (
				<EuiCodeBlock language="json">
					{JSON.stringify(wire, null, 2)}
				</EuiCodeBlock>
			) : (
				<div
					css={css`
						& mark {
							background-color: ${theme.euiTheme.colors.highlight};
							font-weight: bold;
							position: relative;
							border: 3px solid ${theme.euiTheme.colors.highlight};
						}
					`}
				>
					<EuiSpacer size="xs" />
					{wire.content.subhead && wire.content.subhead.length > 1 && (
						<h3
							css={css`
								font-weight: ${theme.euiTheme.font.weight.bold};
							`}
						>
							{wire.content.subhead}
						</h3>
					)}
					<EuiSpacer size="m" />
					{ednote && (
						<>
							<EuiCallOut size="s" title={ednote} color="success" />
							<EuiSpacer size="m" />
						</>
					)}
					{byline && (
						<>
							<p
								css={css`
									font-style: italic;
								`}
							>
								Byline: {byline}
							</p>
							<EuiSpacer size="m" />
						</>
					)}
					{safeAbstract && wire.supplier.name === AP && (
						<>
							<p>(abstract) {safeAbstract}</p>
							<EuiSpacer size="m" />
						</>
					)}
					{bodyTextContent && (
						<>
							<article
								dangerouslySetInnerHTML={{ __html: bodyTextContent }}
								css={css`
									& p {
										margin-bottom: ${theme.euiTheme.size.s};
									}
								`}
								data-pinboard-selection-target
							/>
							<EuiSpacer size="m" />
						</>
					)}
					<EuiDescriptionList
						css={css`
							display: flex;
							flex-direction: column;
							gap: ${theme.euiTheme.size.s};
						`}
					>
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
							<CategoryCodeTable
								categoryCodes={categoryCodes.filter(
									(code) => !code.startsWith('experimental'),
								)}
							/>
							<EuiSpacer />
							<GeographyCodeTable
								categoryCodes={categoryCodes.filter((code) =>
									code.startsWith('experimental'),
								)}
							/>
						</EuiDescriptionListDescription>
					</EuiDescriptionList>
				</div>
			)}
		</>
	);
};
