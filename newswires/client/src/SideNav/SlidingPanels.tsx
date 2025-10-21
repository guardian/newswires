
import React from 'react';

type SlidingPanelsProps = {
    direction: 'forward' | 'back' | null;
    isAnimating: boolean;
    current: JSX.Element
    previous: JSX.Element,
};

export const SlidingPanels: React.FC<SlidingPanelsProps> = ({ direction, isAnimating, current, previous }) => {
    return (
        	
			<div css={getPanelStyles(true)}>
				{ current }
				
			</div>

			{isAnimating&& (
				<div css={getPanelStyles(false)}>
					{activePanelId === 'presets' ? (
						<SecondaryLevelListPresetPanel
							activePreset={activePreset}
							openDrawer={openDrawer}
							closeDrawer={closeDrawer}
							togglePreset={togglePreset}
						/>
					) : (
						<TopLevelListPresetPanel
							activePreset={activePreset}
							openDrawer={openDrawer}
							closeDrawer={closeDrawer}
							togglePreset={togglePreset}
						/>
					)}
				</div>
			)}
    );
};