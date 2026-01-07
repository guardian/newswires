import { useGeneratedHtmlId } from '@elastic/eui';
import { useUserSettings } from './context/UserSettingsContext';

export const useSettingsSwitches = () => {
	const {
		resizablePanelsDirection,
		toggleResizablePanelsDirection,
		showSecondaryFeedContent,
		toggleShowSecondaryFeedContent,
		showIncopyImport,
		toggleShowIncopyImport,
	} = useUserSettings();

	const embeddedCodeSwitchId__1 = useGeneratedHtmlId({
		prefix: 'embeddedCodeSwitchId',
	});
	const embeddedCodeSwitchId__2 = useGeneratedHtmlId({
		prefix: 'embeddedCodeSwitchId',
	});
	const embeddedCodeSwitchId__3 = useGeneratedHtmlId({
		prefix: 'embeddedCodeSwitchId',
	});
	return [
		{
			id: embeddedCodeSwitchId__1,
			label: 'Show subheadings in feed',
			checked: showSecondaryFeedContent,
			onChange: () => toggleShowSecondaryFeedContent(),
		},
		{
			id: embeddedCodeSwitchId__2,
			label: 'Use vertical layout',
			checked: resizablePanelsDirection === 'vertical',
			onChange: () => toggleResizablePanelsDirection(),
		},
		{
			id: embeddedCodeSwitchId__3,
			label: 'Show button to send wire to InCopy',
			checked: showIncopyImport,
			onChange: () => toggleShowIncopyImport(),
		},
	];
};
