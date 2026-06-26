import { EuiProvider } from '@elastic/eui';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { setUpIcons } from './icons';
import { supplierData } from './suppliers';
import { SupplierLabel } from './WireItemLabel';

const SupplierLabelList = ({
	isPrimary,
	isCondensed,
}: {
	isPrimary: boolean;
	isCondensed: boolean;
}) => {
	return (
		<div
			style={{
				display: 'flex',
				flexWrap: 'wrap',
				gap: '10px',
				padding: '10px',
			}}
		>
			{supplierData.map((supplier) => (
				<SupplierLabel
					key={supplier.name}
					supplier={supplier}
					isPrimary={isPrimary}
					isCondensed={isCondensed}
				/>
			))}
		</div>
	);
};

const _meta = {
	title: 'Components/WireItemLabel/SupplierLabel',
	component: SupplierLabelList,
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
} satisfies Meta<typeof SupplierLabelList>;

type Story = StoryObj<typeof _meta>;

setUpIcons();

export const Default: Story = {
	args: {
		isPrimary: true,
		isCondensed: false,
	},
};

export const SecondaryStyle: Story = {
	args: {
		isPrimary: false,
		isCondensed: false,
	},
};

export const Condensed: Story = {
	args: {
		isPrimary: true,
		isCondensed: true,
	},
};

export default _meta;
