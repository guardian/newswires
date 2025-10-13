export type PanelProps = {
	activePreset: string | undefined;
	openDrawer: () => void;
	closeDrawer: () => void;
	togglePreset: (preset: string) => void;
};
