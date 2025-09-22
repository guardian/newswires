import { EuiListGroup } from '@elastic/eui';
import { useSearch } from '../context/SearchContext';
import type { PresetGroupName } from '../presets';
import { sportPresets } from '../presets';
import { defaultConfig } from '../urlState';
import { SideNavListItem } from './SideNavListItem';

export const SecondaryLevelListPresetPanel = ({
	activePreset,
	setActivePanel,
	togglePreset,
}: {
	activePreset: string | undefined;
	setActivePanel: (
		panel: PresetGroupName,
		direction: 'forward' | 'back',
	) => void;
	togglePreset: (preset: string) => void;
}) => {
	const { openTicker } = useSearch();
	return (
		<EuiListGroup flush={true} gutterSize="none">
			<SideNavListItem
				label="Sport"
				key="sports-parent-backlink"
				isTopLevel={false}
				handleButtonClick={() => setActivePanel('presets', 'back')}
				arrowSide="left"
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
				/>
			))}
		</EuiListGroup>
	);
};
