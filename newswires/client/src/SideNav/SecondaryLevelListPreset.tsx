import { EuiListGroup } from '@elastic/eui';
import { useSearch } from '../context/SearchContext';
import { sportPresets } from '../presets';
import { defaultConfig } from '../urlState';
import type { PanelProps } from './PanelProps';
import { SideNavListItem } from './SideNavListItem';

export const SecondaryLevelListPresetPanel = ({
	activePreset,
	swapActivePanel,
	togglePreset,
}: PanelProps) => {
	const { openTicker } = useSearch();
	return (
		<EuiListGroup flush={true} gutterSize="none">
			<SideNavListItem
				label="Sport"
				key="sports-parent-backlink"
				isTopLevel={false}
				isActive={activePreset === 'all-sport'}
				handleButtonClick={() => swapActivePanel('presets', 'back')}
				arrowSide="left"
				toggleDraw={() => swapActivePanel('presets', 'back')}
				handleSecondaryActionClick={() =>
					openTicker({ ...defaultConfig.query, preset: 'all-sport' })
				}
			/>
			{sportPresets.map((item) => (
				<SideNavListItem
					label={item.name}
					key={item.id}
					isActive={
						activePreset === item.id ||
						(item.id === 'all-presets' && !activePreset)
					}
					isTopLevel={false}
					handleButtonClick={() => {
						togglePreset(item.id);
					}}
					handleSecondaryActionClick={() =>
						openTicker({ ...defaultConfig.query, preset: item.id })
					}
					toggleDraw={() => swapActivePanel('presets', 'back')}
				/>
			))}
		</EuiListGroup>
	);
};
