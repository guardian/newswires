import { EuiListGroup } from '@elastic/eui';
import { useSearch } from '../context/SearchContext';
import { presets, sportPresets } from '../presets';
import { getActivePreset } from '../queryHelpers';
import { defaultConfig } from '../urlState';
import type { PanelProps } from './PanelProps';
import { SideNavListItem } from './SideNavListItem';

export const TopLevelListPresetPanel = ({
	activePreset,
	swapActivePanel,
	togglePreset,
}: PanelProps) => {
	const { config, openTicker } = useSearch();
	const maybeActiveSportPreset = sportPresets.find(
		(_) => _.id === activePreset,
	);
	return (
		<EuiListGroup flush={true} gutterSize="none">
			{presets.map((item) => (
				<SideNavListItem
					label={item.name}
					key={item.id}
					isActive={
						activePreset === item.id ||
						(item.id === 'all-presets' && !activePreset)
					}
					isTopLevel={true}
					handleButtonClick={() => {
						togglePreset(item.id);
						if (item.child) {
							if (getActivePreset(activePreset, item.id)) {
								swapActivePanel('sportPresets', 'forward');
							} else {
								swapActivePanel('presets', 'back');
							}
						}
					}}
					handleSecondaryActionClick={() =>
						openTicker({ ...defaultConfig.query, preset: item.id })
					}
					arrowSide={item.child ? 'right' : undefined}
					toggleDraw={() => swapActivePanel('sportPresets', 'forward')}
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
						openTicker({ ...config.query, preset: maybeActiveSportPreset.id })
					}
					toggleDraw={() => alert('toggle!')}
				/>
			)}
		</EuiListGroup>
	);
};
