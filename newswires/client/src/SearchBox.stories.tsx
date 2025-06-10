import { EuiProvider } from '@elastic/eui';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SearchContextProvider } from './context/SearchContext';
import { TelemetryContextProvider } from './context/TelemetryContext';
import { setUpIcons } from './icons';
import { SearchBox } from './SearchBox';

const meta = {
	title: 'Components/SearchBox',
	component: SearchBox,
	parameters: {
		layout: 'padded',
	},
	tags: ['autodocs'],
	decorators: [
		(Story) => (
			<EuiProvider colorMode="light">
				<TelemetryContextProvider sendTelemetryEvent={console.log}>
					<SearchContextProvider>
						<Story />
					</SearchContextProvider>
				</TelemetryContextProvider>
			</EuiProvider>
		),
	],
} satisfies Meta<typeof SearchBox>;

type Story = StoryObj<typeof meta>;

export const DefaultView: Story = {
	args: {},
};

setUpIcons();

export default meta;
