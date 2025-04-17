import { createContext, useContext, useState } from 'react';
import { z } from 'zod';
import { loadOrSetInLocalStorage, saveToLocalStorage } from './localStorage';
import { useTelemetry } from './TelemetryContext';

interface UserSettingsContextShape {
	showSecondaryFeedContent: boolean;
	toggleShowSecondaryFeedContent: () => void;
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

	const toggleShowSecondaryFeedContent = () => {
		setShowSecondaryFeedContent(!showSecondaryFeedContent);
		saveToLocalStorage<boolean>(
			'showSecondaryFeedContent',
			!showSecondaryFeedContent,
		);
		sendTelemetryEvent('toggleShowSecondaryFeedContent', {
			compactView: !showSecondaryFeedContent ? 'on' : 'off',
		});
	};

	return (
		<UserSettingsContext.Provider
			value={{ showSecondaryFeedContent, toggleShowSecondaryFeedContent }}
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
