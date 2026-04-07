import { EuiListGroup } from '@elastic/eui';
import { useSearch } from '../context/SearchContext';
import {
	sportPresets,
	topLevelPresetId,
	useDisplayablePresets,
} from '../presets';
import { defaultConfig } from '../urlState';
import type { PanelProps } from './PanelProps';
import { SideNavListItem } from './SideNavListItem';

export const TopLevelListPresetPanel = ({
	activePreset,
	togglePreset,
}: PanelProps) => {
	const { config, openTicker } = useSearch();
	const maybeActiveSportPreset = sportPresets.find(
		(_) => _.id === activePreset,
	);

	const presets = useDisplayablePresets();

	return (
		<EuiListGroup flush={true} gutterSize="none">
			{presets.map((item) => (
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
					handleArrowClick={() => togglePreset(item.id)}
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
