import { createContext, useContext, useState } from 'react';
import { z } from 'zod';
import { loadOrSetInLocalStorage, saveToLocalStorage } from './localStorage';
import { useTelemetry } from './TelemetryContext';

interface UserSettingsContextShape {
	showSecondaryFeedContent: boolean;
	toggleShowSecondaryFeedContent: () => void;
	resizablePanelsDirection: 'vertical' | 'horizontal';
	toggleResizablePanelsDirection: () => void;
	isDarkMode: boolean;
	toggleDarkMode: () => void;
}

const UserSettingsContext = createContext<UserSettingsContextShape | null>(
	null,
);

export const UserSettingsContextProvider = ({
	children,
}: {
	children: React.ReactNode;
}) => {
	const { sendTelemetryEvent } = useTelemetry();
	const [showSecondaryFeedContent, setShowSecondaryFeedContent] =
		useState<boolean>(
			loadOrSetInLocalStorage<boolean>(
				'showSecondaryFeedContent',
				z.boolean(),
				true,
			),
		);
	const [resizablePanelsDirection, setResizablePanelsDirection] = useState<
		'vertical' | 'horizontal'
	>(
		loadOrSetInLocalStorage(
			'resizablePanelDirection',
			z.enum(['vertical', 'horizontal']),
			'horizontal',
		),
	);
	const [isDarkMode, setIsDarkMode] = useState<boolean>(
		loadOrSetInLocalStorage<boolean>('isDarkMode', z.boolean(), false),
	);

	const toggleShowSecondaryFeedContent = () => {
		setShowSecondaryFeedContent(!showSecondaryFeedContent);
		saveToLocalStorage<boolean>(
			'showSecondaryFeedContent',
			!showSecondaryFeedContent,
		);
		sendTelemetryEvent('toggleShowSecondaryFeedContent', {
			showSecondaryFeedContent: !showSecondaryFeedContent ? 'on' : 'off',
		});
	};

	const toggleResizablePanelsDirection = () => {
		const newDirection =
			resizablePanelsDirection === 'horizontal' ? 'vertical' : 'horizontal';
		setResizablePanelsDirection(newDirection);
		saveToLocalStorage('resizablePanelDirection', newDirection);
		sendTelemetryEvent('toggleResizablePanelsDirection', {
			resizablePanelsDirection: newDirection,
		});
	};

	const toggleDarkMode = () => {
		setIsDarkMode(!isDarkMode);
		saveToLocalStorage<boolean>('isDarkMode', !isDarkMode);
		sendTelemetryEvent('toggleDarkMode', {
			isDarkMode: !isDarkMode ? 'on' : 'off',
		});
	};

	return (
		<UserSettingsContext.Provider
			value={{
				showSecondaryFeedContent,
				toggleShowSecondaryFeedContent,
				resizablePanelsDirection,
				toggleResizablePanelsDirection,
				isDarkMode,
				toggleDarkMode,
			}}
		>
			{children}
		</UserSettingsContext.Provider>
	);
};

export const useUserSettings = () => {
	const context = useContext(UserSettingsContext);
	if (!context) {
		throw new Error(
			'useUserSettings must be used within a UserSettingsProvider',
		);
	}
	return context;
};
