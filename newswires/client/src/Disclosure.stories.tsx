import { EuiProvider, EuiText } from '@elastic/eui';
import type { Meta, StoryObj } from '@storybook/react';
import { Disclosure } from './Disclosure';
import { setUpIcons } from './icons';

export default { component: Disclosure };
const meta = {
	title: 'Components/Disclosure',
	component: Disclosure,
	parameters: {
		layout: 'padded',
	},
	tags: ['autodocs'],
	decorators: [
		(Story) => (
			<EuiProvider colorMode="light">
				<div style={{ maxWidth: '400px', margin: '10px auto' }}>
					<Story />
				</div>
			</EuiProvider>
		),
	],
} satisfies Meta<typeof Disclosure>;

type Story = StoryObj<typeof meta>;

setUpIcons();

export const Default: Story = {
	args: {
		title: 'Click to expand',
		children: (
			<EuiText>
				<p>This is the content that appears when expanded.</p>
				<p>It can contain multiple paragraphs or any other content.</p>
			</EuiText>
		),
	},
};

export const WithLongContent: Story = {
	args: {
		title: 'Long content example',
		children: (
			<EuiText>
				<p>
					This is the content that appears when expanded. It can contain
					multiple paragraphs or any other content. This is the content that
					appears when expanded. It can contain multiple paragraphs or any other
					content. This is the content that appears when expanded. It can
					contain multiple paragraphs or any other content. This is the content
					that appears when expanded. It can contain multiple paragraphs or any
					other content.
				</p>
				<p>
					This is the content that appears when expanded. It can contain
					multiple paragraphs or any other content. This is the content that
					appears when expanded. It can contain multiple paragraphs or any other
					content. This is the content that appears when expanded. It can
					contain multiple paragraphs or any other content. This is the content
					that appears when expanded. It can contain multiple paragraphs or any
					other content.
				</p>
			</EuiText>
		),
	},
};
