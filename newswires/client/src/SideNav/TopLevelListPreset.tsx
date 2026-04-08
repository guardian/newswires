import { EuiListGroup } from '@elastic/eui';
import { useSearch } from '../context/SearchContext';
import { useUserSettings } from '../context/UserSettingsContext.tsx';
import { shouldTogglePreset } from '../presetHelpers';
import {
	presets,
	presetsWithUS,
	sportPresets,
	topLevelPresetId,
} from '../presets';
import { defaultConfig } from '../urlState';
import type { PanelProps } from './PanelProps';
import { SideNavListItem } from './SideNavListItem';

export const TopLevelListPresetPanel = ({
	activePreset,
	openDrawer,
	togglePreset,
}: PanelProps) => {
	const { config, openTicker } = useSearch();
	const maybeActiveSportPreset = sportPresets.find(
		(_) => _.id === activePreset,
	);

	const { previewUSDomestic } = useUserSettings();

	const joinedPresets = previewUSDomestic ? presetsWithUS : presets;

	return (
		<EuiListGroup flush={true} gutterSize="none">
			{joinedPresets.map((item) => (
				<SideNavListItem
					label={item.name}
					key={item.id}
					isActive={
						activePreset === item.id ||
						(item.id === topLevelPresetId && !activePreset)
					}
					isTopLevel={true}
					handleButtonClick={() => {
						togglePreset(item.id);
					}}
					handleSecondaryActionClick={() =>
						openTicker({
							...defaultConfig.query,
							preset: item.id,
							collectionId: undefined,
						})
					}
					arrowSide={item.child ? 'right' : undefined}
					handleArrowClick={
						item.child
							? () => {
									if (shouldTogglePreset(activePreset, item.id)) {
										togglePreset(item.id);
									}
									openDrawer();
								}
							: undefined
					}
				/>
			))}
			{maybeActiveSportPreset && (
				<SideNavListItem
					label={maybeActiveSportPreset.name}
					key={maybeActiveSportPreset.id}
					isActive={true}
					isTopLevel={false}
					handleButtonClick={() => togglePreset(maybeActiveSportPreset.id)}
					handleSecondaryActionClick={() =>
						openTicker({
							...config.query,
							preset: maybeActiveSportPreset.id,
							collectionId: undefined,
						})
					}
				/>
			)}
		</EuiListGroup>
	);
};
