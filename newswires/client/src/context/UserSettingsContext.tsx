import { createContext, useContext, useState } from 'react';
import { z } from 'zod/v4';
import type { TimezoneId } from '../officeTimezones';
import { timezoneIds } from '../officeTimezones';
import { loadOrSetInLocalStorage, saveToLocalStorage } from './localStorage';
import { useTelemetry } from './TelemetryContext';

interface UserSettingsContextShape {
	showSecondaryFeedContent: boolean;
	toggleShowSecondaryFeedContent: () => void;
	resizablePanelsDirection: 'vertical' | 'horizontal';
	toggleResizablePanelsDirection: () => void;
	showIncopyImport: boolean;
	toggleShowIncopyImport: () => void;
	showTastedList: boolean;
	toggleShowTastedList: () => void;
	enableAutoScroll: boolean;
	toggleEnableAutoScroll: () => void;
	selectedTimezone: TimezoneId;
	changeTimezoneSelection: (tz: TimezoneId) => void;
}

export const UserSettingsContext =
	createContext<UserSettingsContextShape | null>(null);

const useBooleanUserSetting = (
	settingId: string,
	{ defaultVal }: { defaultVal: boolean },
): [boolean, () => void] => {
	const { sendTelemetryEvent } = useTelemetry();

	const [currentVal, setVal] = useState<boolean>(
		loadOrSetInLocalStorage<boolean>(settingId, z.boolean(), defaultVal),
	);

	const telemetryName =
		'toggle' + settingId.charAt(0).toUpperCase() + settingId.slice(1);

	const toggle = () => {
		setVal(!currentVal);
		saveToLocalStorage<boolean>(settingId, !currentVal);
		sendTelemetryEvent(telemetryName, {
			[settingId]: !currentVal ? 'on' : 'off',
		});
	};

	return [currentVal, toggle];
};

export const UserSettingsContextProvider = ({
	children,
}: {
	children: React.ReactNode;
}) => {
	const { sendTelemetryEvent } = useTelemetry();

	const [showSecondaryFeedContent, toggleShowSecondaryFeedContent] =
		useBooleanUserSetting('showSecondaryFeedContent', { defaultVal: true });

	const [showIncopyImport, toggleShowIncopyImport] = useBooleanUserSetting(
		'showIncopyImport',
		{ defaultVal: false },
	);

	const [showTastedList, toggleShowTastedList] = useBooleanUserSetting(
		'showTastedList',
		{ defaultVal: false },
	);

	const [enableAutoScroll, toggleEnableAutoScroll] = useBooleanUserSetting(
		'enableAutoScroll',
		{ defaultVal: false },
	);

	const [selectedTimezone, setSelectedTimezone] = useState<TimezoneId>(
		loadOrSetInLocalStorage<TimezoneId>(
			'selectedTimezone',
			z.enum(timezoneIds),
			'Europe/London',
		),
	);

	const changeTimezoneSelection = (tz: TimezoneId) => {
		setSelectedTimezone(tz);
		saveToLocalStorage<TimezoneId>('selectedTimezone', tz);
	};

	const [resizablePanelsDirection, setResizablePanelsDirection] = useState<
		'vertical' | 'horizontal'
	>(
		loadOrSetInLocalStorage(
			'resizablePanelDirection',
			z.enum(['vertical', 'horizontal']),
			'horizontal',
		),
	);

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
				showTastedList,
				toggleShowTastedList,
				enableAutoScroll,
				toggleEnableAutoScroll,
				selectedTimezone,
				changeTimezoneSelection,
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
