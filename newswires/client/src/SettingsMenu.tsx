import {
	EuiButtonIcon,
	EuiContextMenu,
	EuiFormRow,
	EuiPopover,
	EuiRadioGroup,
	EuiSwitch,
	useGeneratedHtmlId,
} from '@elastic/eui';
import { useState } from 'react';
import { SHOW_GU_SUPPLIERS, SHOW_PAAPI } from './app-configuration';
import { StopShortcutPropagationWrapper } from './context/KeyboardShortcutsContext';
import { officeNameByTimezone } from './officeTimezones.ts';
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

	const timezoneOptions = Object.entries(officeNameByTimezone).map(
		([id, label]) => ({
			id,
			label,
		}),
	);

	const panels = [
		{
			id: 0,
			title: 'Site settings',
			items: [
				...switches,
				{
					isSeparator: true as const,
					key: 'separator-1',
				},
				{
					panel: 1,
					name: 'Developer information',
					icon: 'bug',
				},
				{
					panel: 2,
					name: 'Office timezone',
					icon: 'clock',
				},
				{
					isSeparator: true as const,
					key: 'separator-2',
				},
				{ name: 'Close', icon: 'cross', onClick: closePopover },
			],
		},
		{
			id: 1,
			title: 'Developer information',
			items: [
				{
					name: `Show Gu suppliers: ${SHOW_GU_SUPPLIERS ? 'On' : 'Off'}`,
				},
				{
					name: `Show PAAPI: ${SHOW_PAAPI ? 'On' : 'Off'}`,
				},
			],
		},
		{
			id: 2,
			title: 'Office timezone',
			items: [
				{
					renderItem: () => (
						<EuiRadioGroup
							options={timezoneOptions}
							idSelected="Europe/London"
							onChange={(id) => console.log(id)}
							name="timezone radio group"
						/>
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
