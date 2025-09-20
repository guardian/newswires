import { EuiListGroup } from '@elastic/eui';
import { useSearch } from '../context/SearchContext';
import { sportPresets } from '../presets';
import { isDotcopyView } from '../sharedTypes';
import { defaultConfig } from '../urlState';
import type { PanelProps } from './PanelProps';
import { SideNavListItem } from './SideNavListItem';

export const SecondaryLevelListPresetPanel = ({
	activePreset,
	swapActivePanel,
	togglePreset,
}: PanelProps) => {
	const { openTicker, toggleDotcopyView, config } = useSearch();
	return (
		<EuiListGroup flush={true} gutterSize="none">
			<SideNavListItem
				label="Sport"
				key="sports-parent-backlink"
				isTopLevel={false}
				handleButtonClick={() => swapActivePanel('presets', 'back')}
				arrowSide="left"
			/>
			{sportPresets.map((item) => (
				<SideNavListItem
					label={item.name}
					key={item.id}
					isActive={activePreset === item.id}
					isTopLevel={false}
					handleButtonClick={() => {
						togglePreset(item.id);
					}}
					handleSecondaryActionClick={() =>
						openTicker({ ...defaultConfig.query, preset: item.id })
					}
				/>
			))}
			<SideNavListItem
				label="Dotcopy"
				key="dotcopy-link"
				isTopLevel={false}
				handleButtonClick={() => toggleDotcopyView()}
				isActive={isDotcopyView(config)}
			/>
		</EuiListGroup>
	);
};
