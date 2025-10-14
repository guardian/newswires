import { EuiListGroup } from '@elastic/eui';
import { useSearch } from '../context/SearchContext';
import { sportPresets, topLevelPresetId, topLevelSportId } from '../presets';
import { defaultConfig } from '../urlState';
import type { PanelProps } from './PanelProps';
import { SideNavListItem } from './SideNavListItem';

export const SecondaryLevelListPresetPanel = ({
	activePreset,
	closeDrawer,
	togglePreset,
}: PanelProps) => {
	const { openTicker } = useSearch();
	return (
		<EuiListGroup flush={true} gutterSize="none">
			<SideNavListItem
				label="Sport"
				key="sports-parent-backlink"
				isTopLevel={false}
				isActive={activePreset === topLevelSportId}
				handleButtonClick={() => closeDrawer()}
				arrowSide="left"
				handleArrowClick={() => closeDrawer()}
				handleSecondaryActionClick={() =>
					openTicker({ ...defaultConfig.query, preset: topLevelSportId })
				}
			/>
			{sportPresets.map((item) => (
				<SideNavListItem
					label={item.name}
					key={item.id}
					isActive={
						activePreset === item.id ||
						(item.id === topLevelPresetId && !activePreset)
					}
					isTopLevel={false}
					handleButtonClick={() => {
						togglePreset(item.id);
					}}
					handleSecondaryActionClick={() =>
						openTicker({ ...defaultConfig.query, preset: item.id })
					}
				/>
			))}
		</EuiListGroup>
	);
};
