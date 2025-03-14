import { EuiProvider } from '@elastic/eui';
import type { Meta, StoryObj } from '@storybook/react';
import { SearchContextProvider } from './context/SearchContext';
import { setUpIcons } from './icons';
import { Item } from './Item';

const sampleItemData = {
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
	supplier: 'Reuters',
	externalId: 'RTRS.2021.01.01.12345',
	ingestedAt: '2025-02-26T09:58:22.000Z',
	categoryCodes: ['C:US', 'C:CA'],
	isFromRefresh: false,
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
				<SearchContextProvider>
					<div style={{ maxWidth: '800px', margin: '0 auto' }}>
						<Story />
					</div>
				</SearchContextProvider>
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
		handleNextItem: () => console.log('next item clicked'),
	},
};

export const WithError: Story = {
	args: {
		itemData: undefined,
		error: 'Failed to load item',
		handleDeselectItem: () => console.log('deselect clicked'),
		handlePreviousItem: () => console.log('previous item clicked'),
		handleNextItem: () => console.log('next item clicked'),
	},
};

setUpIcons();

export default meta;
