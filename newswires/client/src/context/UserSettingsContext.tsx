import { createContext, useContext, useState } from 'react';
import { z } from 'zod/v4';
import { loadOrSetInLocalStorage, saveToLocalStorage } from './localStorage';
import { useTelemetry } from './TelemetryContext';

interface UserSettingsContextShape {
	showSecondaryFeedContent: boolean;
	toggleShowSecondaryFeedContent: () => void;
	resizablePanelsDirection: 'vertical' | 'horizontal';
	toggleResizablePanelsDirection: () => void;
	showIncopyImport: boolean;
	toggleShowIncopyImport: () => void;
}

export const UserSettingsContext =
	createContext<UserSettingsContextShape | null>(null);

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
	const [showIncopyImport, setShowIncopyImport] = useState<boolean>(
		loadOrSetInLocalStorage<boolean>('showIncopyImport', z.boolean(), false),
	);

	const toggleShowIncopyImport = () => {
		setShowIncopyImport(!showIncopyImport);
		saveToLocalStorage<boolean>('showIncopyImport', !showIncopyImport);
		sendTelemetryEvent('showIncopyImport', {
			showIncopyImport: !showIncopyImport ? 'on' : 'off',
		});
	};

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

	return (
		<UserSettingsContext.Provider
			value={{
				showSecondaryFeedContent,
				toggleShowSecondaryFeedContent,
				resizablePanelsDirection,
				toggleResizablePanelsDirection,
				showIncopyImport,
				toggleShowIncopyImport,
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
