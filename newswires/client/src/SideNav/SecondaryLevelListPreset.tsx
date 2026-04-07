import { EuiListGroup } from '@elastic/eui';
import { useSearch } from '../context/SearchContext';
import { sportPresets, topLevelPresetId, topLevelSportId } from '../presets';
import type { PanelProps } from './PanelProps';
import { SideNavListItem } from './SideNavListItem';

export const SecondaryLevelListPresetPanel = ({
	activePreset,
	togglePreset,
}: PanelProps) => {
	const { config, openTicker } = useSearch();
	return (
		<EuiListGroup flush={true} gutterSize="none">
			<SideNavListItem
				label="Sport"
				key="sports-parent-backlink"
				isTopLevel={false}
				isActive={activePreset === topLevelSportId}
				handleButtonClick={() => togglePreset(topLevelSportId)}
				arrowSide="left"
				handleArrowClick={(e) => {
					e.stopPropagation();
					togglePreset(topLevelPresetId);
				}}
				handleSecondaryActionClick={() =>
					openTicker({
						...config.query,
						preset: topLevelSportId,
						collectionId: undefined,
					})
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
						openTicker({
							...config.query,
							preset: item.id,
							collectionId: undefined,
						})
					}
				/>
			))}
		</EuiListGroup>
	);
};
