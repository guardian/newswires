import { EuiProvider } from '@elastic/eui';
import { css } from '@emotion/react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { SearchContextShape } from './context/SearchContext';
import { SearchContext } from './context/SearchContext';
import { TelemetryContextProvider } from './context/TelemetryContext';
import { UserSettingsContext } from './context/UserSettingsContext';
import { convertToLocalDate } from './dateHelpers';
import { setUpIcons } from './icons';
import type { WireData } from './sharedTypes';
import { reutersBrand } from './suppliers';
import { defaultConfig } from './urlState';
import { WireItemList } from './WireItemList';

const now = new Date();

const sampleItemData: WireData = {
	id: 12345,
	content: {
		subhead:
			'Stories sometimes have subheadings. This is a sample subhead that is of medium-ish length to test how the WireItemList component handles subheads in the UI.',
		bodyText:
			'<p>This is a sample news wire story.</p><p>It contains multiple paragraphs.</p>',
		byline: 'By John Doe',
		keywords: ['news', 'sample', 'test'],
		usage: 'No restrictions',
		ednote: 'This is an editorial note',
		subjects: {
			code: ['iptccat:SPO', 'technology'],
		},
		slug: 'SAMPLE-WIRE',
		headline: 'This is a sample headline',
		firstVersion: '2025-02-26T09:56:22.000Z',
		versionCreated: '2025-02-26T09:57:22.000Z',
		version: '2',
	},
	supplier: {
		name: 'REUTERS',
		label: 'Reuters',
		shortLabel: 'Reu',
		colour: reutersBrand,
	},
	guSourceFeed: 'REUTERS',
	externalId: 'RTRS.2021.01.01.12345',
	ingestedAt: now.toISOString(),
	localIngestedAt: convertToLocalDate(now.toISOString()),
	categoryCodes: ['C:US', 'C:CA'],
	isFromRefresh: false,
	hasDataFormatting: false,
	collections: [],
};

const mockSearchContext: SearchContextShape = {
	config: {
		...defaultConfig,
		query: {
			...defaultConfig.query,
			collectionId: 1,
			preset: undefined,
		},
	},
	state: {
		status: 'success',
		queryData: {
			results: [],
			totalCount: 0,
		},
		successfulQueryHistory: [],
		autoUpdate: false,
		loadingMore: false,
		sortBy: { sortByKey: 'ingestedAt' },
		error: undefined,
	},
	handleEnterQuery: () => {},
	handleRetry: () => {},
	handleSelectItem: () => {},
	handleDeselectItem: () => {},
	handleNextItem: async () => {},
	handlePreviousItem: () => {},
	toggleAutoUpdate: () => {},
	loadMoreResults: async () => {},
	viewedItemIds: [],
	previousItemId: undefined,
	activeSuppliers: [],
	toggleSupplier: () => {},
	openTicker: () => {},
	unseenWiresFromTopOfList: 0,
	hasBeenVisibleCallback: () => {},
};

const userSettings = (showSecondaryFeedContent: boolean) => ({
	showSecondaryFeedContent,
	toggleShowSecondaryFeedContent: () => {},
	resizablePanelsDirection: 'horizontal' as const,
	toggleResizablePanelsDirection: () => {},
	showIncopyImport: true,
	toggleShowIncopyImport: () => {},
	showTastedList: true,
	toggleShowTastedList: () => {},
	enableAutoScroll: false,
	toggleEnableAutoScroll: () => {},
});

const meta = {
	title: 'Components/WireItemList/Compressed',
	component: WireItemList,
	parameters: {
		layout: 'padded',
	},
	tags: ['autodocs'],

	decorators: [
		(_Story, context) => {
			const args = context.args as Record<string, unknown>;
			const wires = args.wires as WireData[];
			const totalCount = args.totalCount as number;
			const showCollectionMetadata = args.showCollectionMetadata as boolean;

			return (
				<EuiProvider colorMode="light">
					<TelemetryContextProvider sendTelemetryEvent={console.log}>
						<div
							css={css`
								display: flex;
								flex-direction: column;
								gap: 16px;
								max-width: 800px;
								margin: 0 auto;
							`}
						>
							<div>
								<h3
									style={{
										fontSize: '1.25rem',
										lineHeight: '1.5rem',
										margin: '10px',
									}}
								>
									Compressed
								</h3>
								<UserSettingsContext.Provider value={userSettings(false)}>
									<SearchContext.Provider value={mockSearchContext}>
										<WireItemList
											wires={wires}
											totalCount={totalCount}
											showCollectionMetadata={showCollectionMetadata}
											showSecondaryFeedContent={false}
										/>
									</SearchContext.Provider>
								</UserSettingsContext.Provider>
							</div>
							<div>
								<h3
									style={{
										fontSize: '1.25rem',
										lineHeight: '1.5rem',
										margin: '10px',
									}}
								>
									With subheadings
								</h3>
								<UserSettingsContext.Provider value={userSettings(true)}>
									<SearchContext.Provider value={mockSearchContext}>
										<WireItemList
											wires={wires}
											totalCount={totalCount}
											showCollectionMetadata={showCollectionMetadata}
											showSecondaryFeedContent={true}
										/>
									</SearchContext.Provider>
								</UserSettingsContext.Provider>
							</div>
						</div>
					</TelemetryContextProvider>
				</EuiProvider>
			);
		},
	],
} satisfies Meta<typeof WireItemList>;

type Story = StoryObj<typeof meta>;

export const LoadedItem: Story = {
	args: {
		wires: [sampleItemData],
		totalCount: 1,
		showCollectionMetadata: false,
		showSecondaryFeedContent: false,
	},
};

export const WithDateOlderThan24Hours: Story = {
	args: {
		wires: [
			{
				...sampleItemData,
				ingestedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 48 hours ago
				localIngestedAt: convertToLocalDate(
					new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
				),
			},
		],
		totalCount: 1,
		showCollectionMetadata: false,
		showSecondaryFeedContent: false,
	},
};

export const WithAlert: Story = {
	args: {
		wires: [
			{
				...sampleItemData,
				content: {
					...sampleItemData.content,
					type: 'text',
					profile: 'alert',
				},
			},
		],
		totalCount: 1,
		showCollectionMetadata: false,
		showSecondaryFeedContent: false,
	},
};

export const WithDataFormatting: Story = {
	args: {
		wires: [
			{
				...sampleItemData,
				hasDataFormatting: true,
			},
		],
		totalCount: 1,
		showCollectionMetadata: false,
		showSecondaryFeedContent: false,
	},
};

export const WithLongTitleSlugAndSubheading: Story = {
	args: {
		wires: [
			{
				...sampleItemData,
				content: {
					...sampleItemData.content,
					slug: 'SAMPLE-WIRE-WITH-EXTRA-LONG-HEADLINE-AND-SUBHEAD-With-no-breaks-to-test-overflow-handling-in-the-UI',
					headline:
						'This is a sample headline that is intentionally made extra long to test how the Item component handles long headlines in the UI. It should wrap correctly and not overflow the container.',
					subhead:
						'Stories sometimes have quite long subheadings. This is a sample subhead that is intentionally made extra long to test how the Item component handles long subheads in the UI. It should wrap correctly and not overflow the container. Stories sometimes have quite long subheadings. This is a sample subhead that is intentionally made extra long to test how the Item component handles long subheads in the UI. It should wrap correctly and not overflow the container.',
					keywords: [
						'news',
						'sample',
						'test',
						'long keyword 1',
						'long keyword 2',
						'long keyword 3',
					],
				},
			},
		],
		totalCount: 1,
		showCollectionMetadata: false,
		showSecondaryFeedContent: false,
	},
};

export const WithToolLinks: Story = {
	args: {
		wires: [
			{
				...sampleItemData,
				toolLinks: [
					{
						id: 1,
						wireId: sampleItemData.id,
						tool: 'incopy',
						sentBy: 'Curlew',
						sentAt: '2025-02-26T10:00:00.000Z',
					},
					{
						id: 2,
						wireId: sampleItemData.id,
						tool: 'composer',
						sentBy: 'Chaffinch',
						sentAt: '2025-02-26T10:05:00.000Z',
					},
				],
			},
		],
		totalCount: 1,
		showCollectionMetadata: false,
		showSecondaryFeedContent: false,
	},
};

export const WithToolLinksAndCollectionMetadata: Story = {
	args: {
		wires: [
			{
				...sampleItemData,
				toolLinks: [
					{
						id: 1,
						wireId: sampleItemData.id,
						tool: 'incopy',
						sentBy: 'Curlew',
						sentAt: '2025-02-26T10:00:00.000Z',
					},
					{
						id: 2,
						wireId: sampleItemData.id,
						tool: 'composer',
						sentBy: 'Chaffinch',
						sentAt: '2025-02-26T10:05:00.000Z',
					},
				],
				collections: [
					{
						collectionId: 1,
						wireEntryId: 1,
						addedAt: '2025-02-26T11:00:00.000Z',
					},
				],
			},
		],
		totalCount: 1,
		showCollectionMetadata: true,
		showSecondaryFeedContent: false,
	},
};

export const WithCollectionMetaDataOnly: Story = {
	args: {
		wires: [
			{
				...sampleItemData,
				collections: [
					{
						collectionId: 1,
						wireEntryId: 1,
						addedAt: '2025-02-26T11:00:00.000Z',
					},
				],
			},
		],
		totalCount: 1,
		showCollectionMetadata: true,
		showSecondaryFeedContent: false,
	},
};

setUpIcons();

export default meta;
