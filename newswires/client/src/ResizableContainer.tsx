import { EuiResizableContainer } from '@elastic/eui';
import { useState } from 'react';
import { z } from 'zod';
import {
	loadOrSetInLocalStorage,
	saveToLocalStorage,
} from './context/localStorage.tsx';
import { useUserSettings } from './context/UserSettingsContext.tsx';

export const ResizableContainer = ({
	Feed,
	Item,
}: {
	Feed: React.ReactNode;
	Item: React.ReactNode;
}) => {
	const firstPanelId = 'firstResizablePanel';
	const secondPanelId = 'secondResizablePanel';

	const { resizablePanelsDirection } = useUserSettings();

	const [sizes, setSizes] = useState<{
		[firstPanelId]: number;
		[secondPanelId]: number;
	}>(() =>
		loadOrSetInLocalStorage(
			'resizablePanelSizes',
			z.object({ [firstPanelId]: z.number(), [secondPanelId]: z.number() }),
			{ [firstPanelId]: 50, [secondPanelId]: 50 },
		),
	);

	return (
		<EuiResizableContainer
			className="eui-fullHeight"
			direction={resizablePanelsDirection}
			onPanelWidthChange={(newSizes) => {
				console.log('newSizes', JSON.stringify(newSizes));
				saveToLocalStorage('resizablePanelSizes', newSizes);
				setSizes((prevSizes) => ({ ...prevSizes, ...newSizes }));
			}}
		>
			{(EuiResizablePanel, EuiResizableButton) => (
				<>
					<EuiResizablePanel
						id={firstPanelId}
						minSize="20%"
						initialSize={sizes[firstPanelId]}
						className="eui-yScroll"
						style={{ padding: 0 }}
					>
						{Feed}
					</EuiResizablePanel>
					<EuiResizableButton accountForScrollbars={'both'} />
					<EuiResizablePanel
						id={secondPanelId}
						minSize="20%"
						initialSize={sizes[secondPanelId]}
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
