import { EuiProvider } from '@elastic/eui';
import type { Meta, StoryObj } from '@storybook/react';
import { setUpIcons } from './icons';
import { SupplierBadge } from './SupplierBadge';
import { supplierData } from './suppliers';

const SupplierBadgeList = ({
	isPrimary,
	isCondensed,
}: {
	isPrimary: boolean;
	isCondensed: boolean;
}) => {
	return (
		<div>
			{supplierData.map((supplier) => (
				<SupplierBadge
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
	title: 'Components/SupplierBadge',
	component: SupplierBadgeList,
	parameters: {
		layout: 'padded',
	},
	tags: ['autodocs'],
	decorators: [
		(Story) => (
			<EuiProvider colorMode="light">
				<div
					style={{
						display: 'flex',
						flexWrap: 'wrap',
						gap: '10px',
						padding: '10px',
					}}
				>
					<Story />
				</div>
			</EuiProvider>
		),
	],
} satisfies Meta<typeof SupplierBadgeList>;

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
