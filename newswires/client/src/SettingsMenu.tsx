import {
	EuiButtonIcon,
	EuiContextMenu,
	EuiFormRow,
	EuiPopover,
	EuiSwitch,
	useGeneratedHtmlId,
} from '@elastic/eui';
import { useState } from 'react';
import { useUserSettings } from './context/UserSettingsContext';

export const SettingsMenu = () => {
	const { showSecondaryFeedContent, toggleShowSecondaryFeedContent } =
		useUserSettings();

	const [isPopoverOpen, setPopover] = useState(false);

	const contextMenuPopoverId = useGeneratedHtmlId({
		prefix: 'contextMenuPopover',
	});
	const embeddedCodeSwitchId__1 = useGeneratedHtmlId({
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
		<EuiPopover
			id={contextMenuPopoverId}
			button={button}
			isOpen={isPopoverOpen}
			closePopover={closePopover}
			panelPaddingSize="none"
			anchorPosition="downLeft"
		>
			<EuiContextMenu initialPanelId={0} panels={panels} />
		</EuiPopover>
	);
};
