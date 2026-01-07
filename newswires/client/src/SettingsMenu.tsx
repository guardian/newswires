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
import { useSettingsSwitches } from './SetttingsSwitches';

export const SettingsMenu = () => {
	const [isPopoverOpen, setPopover] = useState(false);

	const contextMenuPopoverId = useGeneratedHtmlId({
		prefix: 'contextMenuPopover',
	});

	const onButtonClick = () => {
		setPopover(!isPopoverOpen);
	};

	const closePopover = () => {
		setPopover(false);
	};
	const switches = useSettingsSwitches().map(
		({ id, label, checked, onChange, helpText }) => {
			return {
				renderItem: () => (
					<div style={{ padding: 16 }} key={id}>
						<EuiFormRow hasChildLabel={true} helpText={helpText}>
							<EuiSwitch
								name="switch"
								id={id}
								label={label}
								checked={checked}
								onChange={onChange}
							/>
						</EuiFormRow>
					</div>
				),
			};
		},
	);
	const panels = [
		{
			id: 0,
			title: 'Site settings',
			items: [
				...switches,
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
