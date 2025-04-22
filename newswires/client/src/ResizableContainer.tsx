import { EuiResizableContainer } from '@elastic/eui';
import { useState } from 'react';
import { z } from 'zod';
import {
	loadOrSetInLocalStorage,
	saveToLocalStorage,
} from './context/localStorage.tsx';
import { useUserSettings } from './context/UserSettingsContext.tsx';

export type PanelDirections = 'vertical' | 'horizontal';

const firstPanelId = 'firstResizablePanel';
const secondPanelId = 'secondResizablePanel';

const panelsSizeSchema = z.object({
	[firstPanelId]: z.number(),
	[secondPanelId]: z.number(),
});

const ResizablePanelSizesDataSchema = z.object({
	horizontal: panelsSizeSchema,
	vertical: panelsSizeSchema,
});

type ResizablePanelSizesData = z.infer<typeof ResizablePanelSizesDataSchema>;

const defaultPanelSizes: ResizablePanelSizesData = {
	horizontal: {
		[firstPanelId]: 50,
		[secondPanelId]: 50,
	},
	vertical: {
		[firstPanelId]: 50,
		[secondPanelId]: 50,
	},
};

export const ResizableContainer = ({
	Feed,
	Item,
}: {
	Feed: React.ReactNode;
	Item: React.ReactNode;
}) => {
	const { resizablePanelsDirection: direction } = useUserSettings();

	const [sizes, setSizes] = useState<ResizablePanelSizesData>(() =>
		loadOrSetInLocalStorage(
			'resizablePanelSizes',
			ResizablePanelSizesDataSchema,
			defaultPanelSizes,
		),
	);

	return (
		<EuiResizableContainer
			className="eui-fullHeight"
			direction={direction}
			onPanelWidthChange={(newSizes) => {
				console.log('newSizes', JSON.stringify(newSizes));
				saveToLocalStorage('resizablePanelSizes', {
					...sizes,
					[direction]: { ...newSizes },
				});
				setSizes((prevSizes) => ({ ...prevSizes, ...newSizes }));
			}}
		>
			{(EuiResizablePanel, EuiResizableButton) => (
				<>
					<EuiResizablePanel
						id={firstPanelId}
						minSize="20%"
						initialSize={sizes[direction][firstPanelId]}
						className="eui-yScroll"
						style={{ padding: 0 }}
					>
						{Feed}
					</EuiResizablePanel>
					<EuiResizableButton accountForScrollbars={'both'} />
					<EuiResizablePanel
						id={secondPanelId}
						minSize="20%"
						initialSize={sizes[direction][secondPanelId]}
						className="eui-yScroll"
						paddingSize="none"
					>
						{Item}
					</EuiResizablePanel>
				</>
			)}
		</EuiResizableContainer>
	);
};
