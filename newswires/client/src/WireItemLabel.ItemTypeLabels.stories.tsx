import { EuiProvider } from '@elastic/eui';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { setUpIcons } from './icons';
import { AlertLabel, LeadLabel } from './WireItemLabel';

const ItemTypeLabel = ({ labelType }: { labelType: 'lead' | 'alert' }) => {
	return (
		<div
			style={{
				display: 'flex',
				gap: '10px',
				padding: '10px',
			}}
		>
			{labelType === 'lead' ? (
				<>
					<LeadLabel outlined={false} />
					<LeadLabel outlined={true} />
				</>
			) : (
				<>
					<AlertLabel outlined={false} />
					<AlertLabel outlined={true} />
				</>
			)}
		</div>
	);
};

const _meta = {
	title: 'Components/WireItemLabel/ItemTypeLabels',
	component: ItemTypeLabel,
	parameters: {
		layout: 'padded',
	},
	tags: ['autodocs'],
	decorators: [
		(Story) => (
			<EuiProvider colorMode="light">
				<Story />
			</EuiProvider>
		),
	],
} satisfies Meta<typeof ItemTypeLabel>;

type Story = StoryObj<typeof _meta>;

setUpIcons();

export const Lead: Story = {
	args: {
		labelType: 'lead',
	},
};

export const Alert: Story = {
	args: {
		labelType: 'alert',
	},
};

export default _meta;
