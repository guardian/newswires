import { EuiProvider } from '@elastic/eui';
import type { Meta, StoryObj } from '@storybook/react';
import { SearchContextProvider } from './context/SearchContext';
import { TelemetryContextProvider } from './context/TelemetryContext';
import { setUpIcons } from './icons';
import type { WireData } from './sharedTypes';
import { WireItemList } from './WireItemList';

const sampleWireData: WireData[] = [
	{
		id: 12345,
		content: {
			subhead: 'This story has been read',
			bodyText: '<p>This is a sample news wire story.</p>',
			byline: 'By John Doe',
			slug: 'SAMPLE-WIRE',
			headline: 'This is a sample headline',
		},
		externalId: 'abc12345',
		highlight: '<p>This is a <mark>sample</mark> news wire story.</p>',
		supplier: 'Reuters',
		ingestedAt: '2025-02-26T09:58:22.000Z',
		isFromRefresh: false,
		categoryCodes: [],
	},
	{
		id: 12346,
		content: {
			subhead: 'Another Wire Story',
			bodyText: '<p>This is another sample news wire story.</p>',
			byline: 'By Jane Smith',
			slug: 'ANOTHER-WIRE',
			headline: 'This is another headline',
		},
		externalId: 'abc12345',
		highlight: undefined,
		supplier: 'AAP',
		ingestedAt: '2025-02-26T10:00:22.000Z',
		isFromRefresh: false,
		categoryCodes: [],
	},
];

const meta = {
	title: 'Components/WireItemList',
	component: WireItemList,
	parameters: {
		layout: 'padded',
	},
	tags: ['autodocs'],
	decorators: [
		(Story) => (
			<EuiProvider colorMode="light">
				<TelemetryContextProvider sendTelemetryEvent={console.log}>
					<SearchContextProvider>
						<div style={{ maxWidth: '800px', margin: '0 auto' }}>
							<Story />
						</div>
					</SearchContextProvider>
				</TelemetryContextProvider>
			</EuiProvider>
		),
	],
} satisfies Meta<typeof WireItemList>;

type Story = StoryObj<typeof meta>;

export const DefaultList: Story = {
	args: {
		wires: sampleWireData,
		totalCount: 10,
		viewedItemIds: ['12345'],
	},
};

export const EmptyList: Story = {
	args: {
		wires: [],
		totalCount: 0,
		viewedItemIds: ['12345'],
	},
};

setUpIcons();

export default meta;
