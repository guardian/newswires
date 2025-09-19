import { EuiEmptyPrompt, EuiResizableContainer } from '@elastic/eui';
import { css } from '@emotion/react';
import { useRef, useState } from 'react';
import { z } from 'zod/v4';
import {
	loadOrSetInLocalStorage,
	saveToLocalStorage,
} from './context/localStorage.tsx';
import { useUserSettings } from './context/UserSettingsContext.tsx';
import type { FeedProps } from './Feed.tsx';

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
	directionOverride,
	setSideNavIsOpen,
}: {
	Feed: React.ComponentType<FeedProps>;
	Item?: React.ReactNode;
	directionOverride?: PanelDirections;
	setSideNavIsOpen: (isOpen: boolean) => void;
}) => {
	const leftPanelRef = useRef<HTMLDivElement>(null);

	const { resizablePanelsDirection: directionFromSettings } = useUserSettings();

	const direction = directionOverride ?? directionFromSettings;

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
						initialSize={Item ? sizes[direction][firstPanelId] : 100}
						className="eui-yScroll"
						style={{ padding: 0 }}
						panelRef={leftPanelRef}
					>
						<Feed
							containerRef={leftPanelRef}
							direction={direction}
							setSideNavIsOpen={setSideNavIsOpen}
						/>
					</EuiResizablePanel>
					<EuiResizableButton
						accountForScrollbars={'both'}
						css={css`
							${Item ? '' : 'display: none;'}
						`}
					/>
					<EuiResizablePanel
						id={secondPanelId}
						minSize={Item ? '20%' : '0%'}
						initialSize={Item ? sizes[direction][secondPanelId] : 0}
						className="eui-yScroll"
						paddingSize="none"
					>
						{Item ?? <EuiEmptyPrompt title={<h2>No item selected</h2>} />}
					</EuiResizablePanel>
				</>
			)}
		</EuiResizableContainer>
	);
};
