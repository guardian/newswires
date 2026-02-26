import { EuiProvider } from '@elastic/eui';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SearchContextProvider } from './context/SearchContext';
import { TelemetryContextProvider } from './context/TelemetryContext';
import { UserSettingsContext } from './context/UserSettingsContext';
import { convertToLocalDate } from './dateHelpers';
import { setUpIcons } from './icons';
import { Item } from './Item';
import type { WireData } from './sharedTypes';
import { reutersBrand } from './suppliers';

const sampleItemData: WireData = {
	id: 12345,
	content: {
		subhead: 'Sample Wire Story',
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
	highlight:
		'<p>This is a sample news wire story.</p><p>It contains multiple paragraphs, <a href="#">a link</a>, and some <mark>highlighted</mark> text.</p>',
	supplier: {
		name: 'REUTERS',
		label: 'Reuters',
		shortLabel: 'Reu',
		colour: reutersBrand,
	},
	externalId: 'RTRS.2021.01.01.12345',
	ingestedAt: '2025-02-26T09:58:22.000Z',
	localIngestedAt: convertToLocalDate('2025-02-26T09:58:22.000Z'),
	categoryCodes: ['C:US', 'C:CA'],
	isFromRefresh: false,
	hasDataFormatting: false,
};

const meta = {
	title: 'Components/Item',
	component: Item,
	parameters: {
		layout: 'padded',
	},
	tags: ['autodocs'],
	decorators: [
		(Story) => (
			<EuiProvider colorMode="light">
				<TelemetryContextProvider sendTelemetryEvent={console.log}>
					<UserSettingsContext.Provider
						value={{
							showSecondaryFeedContent: false,
							toggleShowSecondaryFeedContent: () => {},
							resizablePanelsDirection: 'horizontal',
							toggleResizablePanelsDirection: () => {},
							showIncopyImport: true,
							toggleShowIncopyImport: () => {},
						}}
					>
						<SearchContextProvider>
							<div style={{ maxWidth: '800px', margin: '0 auto' }}>
								<Story />
							</div>
						</SearchContextProvider>
					</UserSettingsContext.Provider>
				</TelemetryContextProvider>
			</EuiProvider>
		),
	],
} satisfies Meta<typeof Item>;

type Story = StoryObj<typeof meta>;

export const LoadedItem: Story = {
	args: {
		itemData: sampleItemData,
		error: undefined,
		handleDeselectItem: () => console.log('deselect clicked'),
		handlePreviousItem: () => console.log('previous item clicked'),
		handleNextItem: () => Promise.resolve(console.log('next item clicked')),
		addToolLink: () => console.log('add tool link'),
	},
};

export const WithLongTitleSlugAndSubheading: Story = {
	args: {
		itemData: {
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
		error: undefined,
		handleDeselectItem: () => console.log('deselect clicked'),
		handlePreviousItem: () => console.log('previous item clicked'),
		handleNextItem: () => Promise.resolve(console.log('next item clicked')),
		addToolLink: () => console.log('add tool link'),
	},
};

export const WithToolLinks: Story = {
	args: {
		itemData: {
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
		error: undefined,
		handleDeselectItem: () => console.log('deselect clicked'),
		handlePreviousItem: () => console.log('previous item clicked'),
		handleNextItem: () => Promise.resolve(console.log('next item clicked')),
		addToolLink: () => console.log('add tool link'),
	},
};

export const WithEmbargoAndEdNote: Story = {
	args: {
		itemData: {
			...sampleItemData,
			content: {
				...sampleItemData.content,
				status: 'withheld',
				embargo: '2025-03-01T12:00:00.000Z',
				ednote: 'This is an editorial note from the "ednote" field.',
			},
		},
		error: undefined,
		handleDeselectItem: () => console.log('deselect clicked'),
		handlePreviousItem: () => console.log('previous item clicked'),
		handleNextItem: () => Promise.resolve(console.log('next item clicked')),
		addToolLink: () => console.log('add tool link'),
	},
};

export const WithError: Story = {
	args: {
		itemData: undefined,
		error: 'Failed to load item',
		handleDeselectItem: () => console.log('deselect clicked'),
		handlePreviousItem: () => console.log('previous item clicked'),
		handleNextItem: () => Promise.resolve(console.log('next item clicked')),
		addToolLink: () => console.log('add tool link'),
	},
};

setUpIcons();

export default meta;
