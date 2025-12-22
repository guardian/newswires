import {
	EuiButtonIcon,
	EuiContextMenu,
	EuiFormRow,
	EuiPopover,
	EuiSwitch,
	useGeneratedHtmlId,
} from '@elastic/eui';
import { useState } from 'react';
import { StopShortcutPropagationWrapper } from './context/KeyboardShortcutsContext';
import { useUserSettings } from './context/UserSettingsContext';

export const SettingsMenu = () => {
	const {
		resizablePanelsDirection,
		toggleResizablePanelsDirection,
		showSecondaryFeedContent,
		toggleShowSecondaryFeedContent,
		showIncopyImport,
		toggleShowIncopyImport,
	} = useUserSettings();

	const [isPopoverOpen, setPopover] = useState(false);

	const contextMenuPopoverId = useGeneratedHtmlId({
		prefix: 'contextMenuPopover',
	});
	const embeddedCodeSwitchId__1 = useGeneratedHtmlId({
		prefix: 'embeddedCodeSwitchId',
	});
	const embeddedCodeSwitchId__2 = useGeneratedHtmlId({
		prefix: 'embeddedCodeSwitchId',
	});
	const embeddedCodeSwitchId__3 = useGeneratedHtmlId({
		prefix: 'embeddedCodeSwitchId',
	});

	const onButtonClick = () => {
		setPopover(!isPopoverOpen);
	};

	const closePopover = () => {
		setPopover(false);
	};

	const panels = [
		{
			id: 0,
			title: 'Site settings',
			items: [
				{
					renderItem: () => (
						<div style={{ padding: 16 }}>
							<EuiFormRow hasChildLabel={true}>
								<EuiSwitch
									name="switch"
									id={embeddedCodeSwitchId__1}
									label="Show subheadings in feed"
									checked={showSecondaryFeedContent}
									onChange={() => {
										toggleShowSecondaryFeedContent();
									}}
								/>
							</EuiFormRow>
						</div>
					),
				},
				{
					renderItem: () => (
						<div style={{ padding: 16 }}>
							<EuiFormRow hasChildLabel={true}>
								<EuiSwitch
									name="switch"
									id={embeddedCodeSwitchId__2}
									label="Display wire details below feed"
									checked={resizablePanelsDirection === 'vertical'}
									onChange={() => {
										toggleResizablePanelsDirection();
									}}
								/>
							</EuiFormRow>
						</div>
					),
				},
				{
					renderItem: () => (
						<div style={{ padding: 16 }}>
							<EuiFormRow hasChildLabel={true}>
								<EuiSwitch
									name="switch"
									id={embeddedCodeSwitchId__3}
									label="Show button to send wire to InCopy"
									checked={showIncopyImport}
									onChange={() => {
										toggleShowIncopyImport();
									}}
								/>
							</EuiFormRow>
						</div>
					),
				},
				{ name: 'Close', icon: 'cross', onClick: closePopover },
			],
		},
	];

	const button = (
		<EuiButtonIcon
			aria-label="Settings"
			display="base"
			size="s"
			iconType={'gear'}
			onClick={onButtonClick}
		/>
	);

	return (
		<StopShortcutPropagationWrapper>
			<EuiPopover
				id={contextMenuPopoverId}
				button={button}
				isOpen={isPopoverOpen}
				closePopover={closePopover}
				panelPaddingSize="none"
				anchorPosition="downLeft"
				repositionOnScroll={true}
			>
				<EuiContextMenu initialPanelId={0} panels={panels} />
			</EuiPopover>
		</StopShortcutPropagationWrapper>
	);
};
