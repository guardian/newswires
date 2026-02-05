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
	EuiHorizontalRule,
	EuiIcon,
	EuiLoadingSpinner,
	EuiSpacer,
	EuiText,
	EuiTitle,
	useEuiTheme,
	useIsWithinBreakpoints,
} from '@elastic/eui';
import { css } from '@emotion/react';
import type { Moment } from 'moment';
import { useEffect, useMemo, useState } from 'react';
import sanitizeHtml from 'sanitize-html';
import { lookupCatCodesWideSearch } from './catcodes-lookup';
import { useSearch } from './context/SearchContext.tsx';
import { useTelemetry } from './context/TelemetryContext.tsx';
import { convertToLocalDateString } from './dateHelpers.ts';
import { Disclosure } from './Disclosure.tsx';
import { htmlFormatBody } from './htmlFormatHelpers.ts';
import type { SupplierInfo, ToolLink, WireData } from './sharedTypes';
import { SupplierBadge } from './SupplierBadge.tsx';
import { AP } from './suppliers.ts';
import { ToolsConnection, ToolSendReport } from './ToolsConnection.tsx';
import { Tooltip } from './Tooltip.tsx';
import { configToUrl } from './urlState.ts';

function TitleContentForItem({
	slug,
	subhead,
	headline,
	localIngestedAt,
	supplier,
	wordCount,
}: {
	slug?: string;
	subhead?: string;
	headline?: string;
	localIngestedAt: Moment;
	supplier: SupplierInfo;
	wordCount: number;
}) {
	const theme = useEuiTheme();

	const headlineText =
		headline && headline.length > 0 ? headline : (slug ?? 'No title');

	return (
		<div
			css={css`
				display: flex;
				flex-direction: column-reverse;
				justify-content: start;
			`}
		>
			{subhead && subhead.length > 1 && (
				<h3
					css={css`
						font-weight: ${theme.euiTheme.font.weight.bold};
					`}
				>
					{subhead}
				</h3>
			)}
			<div
				css={css`
					display: flex;
					align-items: center;
					margin-top: ${theme.euiTheme.size.xs};
					gap: ${theme.euiTheme.size.s};
				`}
			>
				<EuiTitle size="xs">
					<h2>{headlineText}</h2>
				</EuiTitle>
			</div>
			<h3>
				<SupplierBadge supplier={supplier} /> {slug && <>{slug} &#183; </>}
				<span>{wordCount} words &#183; </span>
				<Tooltip tooltipContent={localIngestedAt.format()}>
					{localIngestedAt.fromNow()}
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

	// Track Alt key state
	const [isAltPressed, setIsAltPressed] = useState(false);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.altKey) setIsAltPressed(true);
		};
		const handleKeyUp = (e: KeyboardEvent) => {
			if (!e.altKey) setIsAltPressed(false);
		};
		// Reset state when window loses focus (e.g., Alt+Tab)
		const handleBlur = () => {
			setIsAltPressed(false);
		};

		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);
		window.addEventListener('blur', handleBlur);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('keyup', handleKeyUp);
			window.removeEventListener('blur', handleBlur);
		};
	}, []);

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

	// Alt-click support for exclusion filter
	const handleCategoryClick = (
		categoryCode: string,
		event?: React.MouseEvent,
	) => {
		const isAlt = event?.altKey;
		if (isAlt) {
			const codesExcl = config.query.categoryCodeExcl ?? [];
			handleEnterQuery({
				...config.query,
				categoryCodeExcl: codesExcl.includes(categoryCode)
					? codesExcl.filter((s) => s !== categoryCode)
					: [...codesExcl, categoryCode],
			});
		} else {
			const codes = config.query.categoryCode ?? [];
			handleEnterQuery({
				...config.query,
				categoryCode: codes.includes(categoryCode)
					? codes.filter((s) => s !== categoryCode)
					: [...codes, categoryCode],
			});
		}
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
					onClick={(e: React.MouseEvent) => handleCategoryClick(item.code, e)}
					iconType={
						isSelected
							? 'check'
							: isAltPressed
								? 'minusInCircle'
								: 'plusInCircle'
					}
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

			const htmlLink = document.createElement('a');
			htmlLink.href = fullUrl;
			htmlLink.innerText = headlineText;

			const htmlLinkBlob = htmlLink.outerHTML;
			htmlLink.remove();

			await navigator.clipboard.write([
				new ClipboardItem({
					'text/plain': new Blob([`${headlineText}\n${fullUrl}`], {
						type: 'text/plain',
					}),
					'text/html': new Blob([htmlLinkBlob], {
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
		<Tooltip tooltipContent={copied ? 'Copied!' : 'Copy headline and URL'}>
			<EuiButtonIcon
				aria-label="Copy headline and URL"
				size="s"
				iconType={copied ? 'check' : 'link'}
				onClick={() => void handleCopy()}
			/>
		</Tooltip>
	);
}

function decideEdNote({
	ednote,
	supplier,
}: {
	ednote?: string;
	supplier: SupplierInfo;
}): string | undefined {
	if (ednote) {
		return ednote;
	}
	if (supplier.name === 'UNAUTHED_EMAIL_FEED') {
		return "NOTE: This item has been ingested via email, and hasn't been authenticated. Please check carefully before use, and treat it as you would a regular email.";
	}
	return undefined;
}

export const WireDetail = ({
	wire,
	isShowingJson,
	addToolLink,
}: {
	wire: WireData;
	isShowingJson: boolean;
	addToolLink: (toolLink: ToolLink) => void;
}) => {
	const { state, handleDeselectItem, handlePreviousItem, handleNextItem } =
		useSearch();
	const isSmallScreen = useIsWithinBreakpoints(['xs', 's']);

	const isFirst = state.queryData?.results[0]?.id === wire.id;
	const isLast =
		state.queryData?.results[state.queryData.totalCount - 1]?.id === wire.id;

	const theme = useEuiTheme();
	const { categoryCodes } = wire;
	const { byline, keywords, usage, ednote, headline, slug, abstract } =
		wire.content;

	const safeAbstract = useMemo(() => {
		return abstract ? sanitizeHtml(abstract) : undefined;
	}, [abstract]);

	const safeBodyText = useMemo(() => {
		return wire.content.bodyText
			? htmlFormatBody(wire.content.bodyText)
			: undefined;
	}, [wire]);

	const safeHighlightText = useMemo(() => {
		return wire.highlight && wire.highlight.trim().length > 0
			? sanitizeHtml(wire.highlight)
			: undefined;
	}, [wire]);

	const bodyTextContent = safeHighlightText ?? safeBodyText;

	const headlineText =
		headline && headline.length > 0 ? headline : (slug ?? 'No title');

	const nonEmptyKeywords = useMemo(
		() => keywords?.filter((keyword) => keyword.trim().length > 0) ?? [],
		[keywords],
	);

	const wordCount = useMemo(() => {
		return wire.content.bodyText
			? sanitizeHtml(wire.content.bodyText, {
					allowedTags: [],
					allowedAttributes: {},
				})
					.trim()
					.split(/\s+/)
					.filter((word) => word.length > 0).length
			: 0;
	}, [wire]);

	const ednoteToRender = decideEdNote({ ednote, supplier: wire.supplier });

	// const images: Array<{ thumbnailUrl: string; gridUrl: string }> = [
	// 	{
	// 		thumbnailUrl:
	// 			'https://d1qpjh3m4a30cs.cloudfront.net/2/2/a/b/1/0/22ab10b1476cb381507a83adc79182b618173a3d?Expires=1770218400&Signature=iofeCiFDHFBWi407W0yNySZ-aJGITx9Dz4yQnXSPG2F6J2VGbwBq~ZWA83oMeR3r8a2fySuDqphrWKj89uF5zfnm9Dcc6kZ81By86kdZp3SRHb37NSJ7OqNyzrffHYYe8Ffb71daQiJg6JeBOdQsmtswi~f~BIl~iSYu6DYgeiAYxwhWOx8Zq-dSRgHzAy-~AeXbygs1O9KrsW006n7lY0qIipR9907iVcj-Jka2uze60xSFOj-VyJFUGMStjxQdoLb7sVUa~YZtHeNFGs9sW~Po~UirmdfMsH7aS4cpF~CQWY~55ATSYq2cQgCuuO30kxKzyP~2gO8MMxeNhJMjDw__&Key-Pair-Id=APKAJPTTPZNNPHQSSUAQ',
	// 		gridUrl:
	// 			'https://media.gutools.co.uk/images/22ab10b1476cb381507a83adc79182b618173a3d',
	// 	},
	// 	{
	// 		gridUrl:
	// 			'https://media.gutools.co.uk/images/3c17d0369884c2feaa2a0206160e08d41749d9b2',
	// 		thumbnailUrl:
	// 			'https://d1qpjh3m4a30cs.cloudfront.net/3/c/1/7/d/0/3c17d0369884c2feaa2a0206160e08d41749d9b2?Expires=1770218400&Signature=eqLEy6RvkaYYYW46amOLa2B0vLMgWgigF1KyEzXGTo8NiO8c9Abf50wbxlFbBePlUDALzKs9vkj2o8GhcvSc40KqW~iSN52RxlTOz5BlKmhDliLSmglDcLPuWgqGA7TIk2ZK0LJhwaRXmvQ5m8l6EFFsg3xWXkOJnbNi-pbDAfzn6VF8UdtYV0nch958jUJRY69DJvhUMJy146TFI0WTwA~mOjI4xcnfNLdHl88NxjLebXFiWn68th59tD9BCAsvt5vBgVVZB4i0nLIrKl~m57ntuo0H2h49Y9TqwiCbmIFuSNlVgngM1YgrOWtiA-gz4cPY392W1UoEkGz0cDteSw__&Key-Pair-Id=APKAJPTTPZNNPHQSSUAQ',
	// 	},
	// 	{
	// 		thumbnailUrl:
	// 			'https://d1qpjh3m4a30cs.cloudfront.net/3/c/6/7/4/9/3c67491983c1ffe5f532d2f92b78c5c178ec708c?Expires=1770220200&Signature=GAxG5R2IsmpqjMnaJku-L9Ue2gzOe0MupMGv1S7CBt0d1cT6-tVVoOBnEjn1GjtSqjW9I~SJMk6xmdJGf0qHUoaiSY3ePW1uya-4Rz-GVOAkOn2uzv9WLwWdt-hwE8xHWoneCKca4htBRkjy72rS1VAjzIFHjPWmxg8nYgDAvhzzxIt3H1-BOpOHIVhe51RaSt-epyqLe8SpKaLkVi8V1dwnqC0oO8NVtKt2xdtuhOYmZoO~DzMZrb6OXH0lCx0nr8ymE8GqVhcdn8mtdMzlMhq~F3BiFmBBDjtFkQlDCTXrAX3rbMmjwhv8bPNlLeYlWhde7p4t1CfF1XSFyx~c4w__&Key-Pair-Id=APKAJPTTPZNNPHQSSUAQ',
	// 		gridUrl:
	// 			'https://media.gutools.co.uk/images/3c67491983c1ffe5f532d2f92b78c5c178ec708c',
	// 	},
	// 	{
	// 		gridUrl:
	// 			'https://media.gutools.co.uk/images/d2f713a20c2ac33301d735cf904d5a08060304cf',
	// 		thumbnailUrl:
	// 			'https://d1qpjh3m4a30cs.cloudfront.net/d/2/f/7/1/3/d2f713a20c2ac33301d735cf904d5a08060304cf?Expires=1770220200&Signature=io5FajRjnvv4piYsX5GKjSHsk1yLIJdF2nEnthBW0CT~VGNpZ~6U8PQObFSw9bTLFjEImOVZ~jSXvQsZ1kWLi9gJZDaD7FM50KbsLP~PkUBOnujRz5kac9-h7eAzCEXLVinxc-dI24ffjICMPucQJRsnbz1QzjUUxY21ZjT6oJcN5zyXeT9yHdiaO~7Yxu~iCIOIJsQV15heo2poAFDVqdedIPJEhOe3VT0QwKqYehT0t0FTdRev8k2W-rfKojlp3oyiim~kPvVyje5Au-KTY6lgnBLuBOziT~9c6dfJIe0GdCMDG247aJn-wFw-My2svcN8OXbBZ967zNGsLQZaHw__&Key-Pair-Id=APKAJPTTPZNNPHQSSUAQ',
	// 	},
	// 	{
	// 		gridUrl:
	// 			'https://media.gutools.co.uk/images/3c17d0369884c2feaa2a0206160e08d41749d9b2',
	// 		thumbnailUrl:
	// 			'https://d1qpjh3m4a30cs.cloudfront.net/3/c/1/7/d/0/3c17d0369884c2feaa2a0206160e08d41749d9b2?Expires=1770218400&Signature=eqLEy6RvkaYYYW46amOLa2B0vLMgWgigF1KyEzXGTo8NiO8c9Abf50wbxlFbBePlUDALzKs9vkj2o8GhcvSc40KqW~iSN52RxlTOz5BlKmhDliLSmglDcLPuWgqGA7TIk2ZK0LJhwaRXmvQ5m8l6EFFsg3xWXkOJnbNi-pbDAfzn6VF8UdtYV0nch958jUJRY69DJvhUMJy146TFI0WTwA~mOjI4xcnfNLdHl88NxjLebXFiWn68th59tD9BCAsvt5vBgVVZB4i0nLIrKl~m57ntuo0H2h49Y9TqwiCbmIFuSNlVgngM1YgrOWtiA-gz4cPY392W1UoEkGz0cDteSw__&Key-Pair-Id=APKAJPTTPZNNPHQSSUAQ',
	// 	},
	// 	{
	// 		thumbnailUrl:
	// 			'https://d1qpjh3m4a30cs.cloudfront.net/3/c/6/7/4/9/3c67491983c1ffe5f532d2f92b78c5c178ec708c?Expires=1770220200&Signature=GAxG5R2IsmpqjMnaJku-L9Ue2gzOe0MupMGv1S7CBt0d1cT6-tVVoOBnEjn1GjtSqjW9I~SJMk6xmdJGf0qHUoaiSY3ePW1uya-4Rz-GVOAkOn2uzv9WLwWdt-hwE8xHWoneCKca4htBRkjy72rS1VAjzIFHjPWmxg8nYgDAvhzzxIt3H1-BOpOHIVhe51RaSt-epyqLe8SpKaLkVi8V1dwnqC0oO8NVtKt2xdtuhOYmZoO~DzMZrb6OXH0lCx0nr8ymE8GqVhcdn8mtdMzlMhq~F3BiFmBBDjtFkQlDCTXrAX3rbMmjwhv8bPNlLeYlWhde7p4t1CfF1XSFyx~c4w__&Key-Pair-Id=APKAJPTTPZNNPHQSSUAQ',
	// 		gridUrl:
	// 			'https://media.gutools.co.uk/images/3c67491983c1ffe5f532d2f92b78c5c178ec708c',
	// 	},
	// 	{
	// 		gridUrl:
	// 			'https://media.gutools.co.uk/images/d2f713a20c2ac33301d735cf904d5a08060304cf',
	// 		thumbnailUrl:
	// 			'https://d1qpjh3m4a30cs.cloudfront.net/d/2/f/7/1/3/d2f713a20c2ac33301d735cf904d5a08060304cf?Expires=1770220200&Signature=io5FajRjnvv4piYsX5GKjSHsk1yLIJdF2nEnthBW0CT~VGNpZ~6U8PQObFSw9bTLFjEImOVZ~jSXvQsZ1kWLi9gJZDaD7FM50KbsLP~PkUBOnujRz5kac9-h7eAzCEXLVinxc-dI24ffjICMPucQJRsnbz1QzjUUxY21ZjT6oJcN5zyXeT9yHdiaO~7Yxu~iCIOIJsQV15heo2poAFDVqdedIPJEhOe3VT0QwKqYehT0t0FTdRev8k2W-rfKojlp3oyiim~kPvVyje5Au-KTY6lgnBLuBOziT~9c6dfJIe0GdCMDG247aJn-wFw-My2svcN8OXbBZ967zNGsLQZaHw__&Key-Pair-Id=APKAJPTTPZNNPHQSSUAQ',
	// 	},
	// 	{
	// 		thumbnailUrl:
	// 			'https://d1qpjh3m4a30cs.cloudfront.net/2/2/a/b/1/0/22ab10b1476cb381507a83adc79182b618173a3d?Expires=1770218400&Signature=iofeCiFDHFBWi407W0yNySZ-aJGITx9Dz4yQnXSPG2F6J2VGbwBq~ZWA83oMeR3r8a2fySuDqphrWKj89uF5zfnm9Dcc6kZ81By86kdZp3SRHb37NSJ7OqNyzrffHYYe8Ffb71daQiJg6JeBOdQsmtswi~f~BIl~iSYu6DYgeiAYxwhWOx8Zq-dSRgHzAy-~AeXbygs1O9KrsW006n7lY0qIipR9907iVcj-Jka2uze60xSFOj-VyJFUGMStjxQdoLb7sVUa~YZtHeNFGs9sW~Po~UirmdfMsH7aS4cpF~CQWY~55ATSYq2cQgCuuO30kxKzyP~2gO8MMxeNhJMjDw__&Key-Pair-Id=APKAJPTTPZNNPHQSSUAQ',
	// 		gridUrl:
	// 			'https://media.gutools.co.uk/images/22ab10b1476cb381507a83adc79182b618173a3d',
	// 	},
	// ];

	const images = wire.imageUrls ?? [];

	return (
		<div
			css={css`
				container-type: inline-size;
			`}
		>
			<div
				css={css`
					display: flex;
					align-items: center;
					justify-content: flex-end;
					gap: ${theme.euiTheme.size.s};
				`}
			></div>
			<EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
				<Tooltip
					tooltipContent="Previous story"
					position={isSmallScreen ? 'right' : 'top'}
				>
					<EuiButtonIcon
						iconType="arrowLeft"
						onClick={handlePreviousItem}
						aria-label="Previous story"
						disabled={isFirst}
					/>
				</Tooltip>
				{state.loadingMore ? (
					<EuiLoadingSpinner size="m" />
				) : (
					<Tooltip tooltipContent="Next story">
						<EuiButtonIcon
							iconType="arrowRight"
							onClick={() => {
								void handleNextItem();
							}}
							aria-label="Next story"
							disabled={isLast}
						/>
					</Tooltip>
				)}
				<div
					css={css`
						display: flex;
						align-items: center;
						gap: ${theme.euiTheme.size.s};
					`}
				>
					<CopyButton id={wire.id} headlineText={headlineText} />
					<ToolsConnection
						itemData={wire}
						key={wire.id}
						addToolLink={addToolLink}
						headline={headline}
					/>
				</div>
				<EuiFlexGroup justifyContent="flexEnd" alignItems="center">
					<Tooltip tooltipContent="Close story" position="left">
						<EuiButtonIcon
							iconType="cross"
							onClick={handleDeselectItem}
							aria-label="Close story"
						/>
					</Tooltip>
				</EuiFlexGroup>
			</EuiFlexGroup>
			<EuiHorizontalRule margin="xs" />
			<div
				css={css`
					display: flex;
					flex-direction: column;
					justify-content: space-between;
					gap: ${theme.euiTheme.size.s};

					@container (width >= 700px) {
						flex-direction: row;
					}
				`}
			>
				<div>
					<TitleContentForItem
						headline={headline}
						subhead={wire.content.subhead}
						slug={slug}
						localIngestedAt={wire.localIngestedAt}
						supplier={wire.supplier}
						wordCount={wordCount}
					/>
				</div>
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
						container-type: inline-size;
					`}
				>
					<EuiSpacer size="xs" />
					{wire.toolLinks?.length ? (
						<>
							<EuiCallOut>
								<ul
									css={css`
										display: grid;
										grid-template-columns: min-content 1fr;
										gap: 0.5rem;
									`}
								>
									{wire.toolLinks.map((toolLink) => (
										<li
											key={toolLink.id}
											css={css`
												display: contents;
											`}
										>
											<ToolSendReport
												toolLink={toolLink}
												key={toolLink.id}
												showIcon={true}
											/>
										</li>
									))}
								</ul>
							</EuiCallOut>
							<EuiSpacer size="s" />
						</>
					) : (
						<></>
					)}
					{ednoteToRender && (
						<>
							<EuiCallOut size="s" title={ednoteToRender} color="success" />
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
									table {
										border-collapse: collapse;
										width: 80%;
										outline: 1px solid #a9a9a9;
									}
									tr,
									th,
									td {
										border: 1px solid #ddd;
									}
									th,
									td {
										padding: 10px;
									}
								`}
								data-pinboard-selection-target
							/>
							<EuiSpacer size="m" />
						</>
					)}
					{images.length > 0 && (
						<>
							<EuiDescriptionListTitle>
								Associated agency images
							</EuiDescriptionListTitle>
							<EuiDescriptionListDescription>
								<a
									href={`https://media.gutools.co.uk/search?ids=${images.map((image) => image.gridId).join(',')}&nonFree=true`}
								>
									{' '}
									View all on Grid
								</a>
								<ul
									aria-labelledby="associated-images-heading"
									css={css`
										padding: ${theme.euiTheme.size.m};
										list-style-type: none;
										display: grid;
										gap: ${theme.euiTheme.size.s};
										grid-template-rows: auto;
										@container (width >= 400px) {
											grid-template-columns: repeat(2, 1fr);
										}
										@container (width >= 800px) {
											grid-template-columns: repeat(3, 1fr);
										}

										& img {
											width: 100%;
											display: block;
										}
										& a {
											line-height: 0; /* Remove extra space below images */
										}
									`}
								>
									{images.map((image) => (
										<li
											key={image.thumbnailUrl}
											css={css`
												display: flex;
												align-items: center;
												justify-content: center;
											`}
										>
											<a
												href={`https://media.gutools.co.uk/images/${image.gridId}`}
												target="_blank"
												rel="noreferrer"
											>
												<img src={image.thumbnailUrl} alt="thumbnail" />
											</a>
										</li>
									))}
								</ul>
							</EuiDescriptionListDescription>
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
		</div>
	);
};
