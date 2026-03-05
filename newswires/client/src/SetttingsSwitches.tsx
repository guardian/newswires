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
		showTastedList,
		toggleShowTastedList,
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
	const embeddedCodeSwitchId__4 = useGeneratedHtmlId({
		prefix: 'embeddedCodeSwitchId',
	});

	return [
		{
			id: embeddedCodeSwitchId__1,
			label: 'Show subheadings in feed',
			checked: showSecondaryFeedContent,
			onChange: () => toggleShowSecondaryFeedContent(),
			helpText: 'Show a preview of the wire text under each headline',
		},
		{
			id: embeddedCodeSwitchId__2,
			label: 'Use vertical layout',
			checked: resizablePanelsDirection === 'vertical',
			onChange: () => toggleResizablePanelsDirection(),
			helpText:
				'Display open item below the main feed rather than to the right',
		},
		{
			id: embeddedCodeSwitchId__3,
			label: 'Show button to send wire to InCopy',
			checked: showIncopyImport,
			onChange: () => toggleShowIncopyImport(),
			helpText: '',
		},
		{
			id: embeddedCodeSwitchId__4,
			label: 'Show Collections',
			checked: showTastedList,
			onChange: () => toggleShowTastedList(),
			helpText:
				"Show option to add wires to the Tasted collection (only for Australian desk while we're testing)",
		},
	];
};
