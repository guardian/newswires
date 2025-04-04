import { createContext, useContext } from 'react';
import type { TelemetryEventSender } from '../telemetry';

interface TelemetryContextShape {
	sendTelemetryEvent: TelemetryEventSender;
}
const TelemetryContext = createContext<TelemetryContextShape | null>(null);

export const TelemetryContextProvider = ({
	sendTelemetryEvent,
	children,
}: {
	sendTelemetryEvent: TelemetryEventSender;
	children: React.ReactNode;
}) => {
	return (
		<TelemetryContext.Provider value={{ sendTelemetryEvent }}>
			{children}
		</TelemetryContext.Provider>
	);
};

export const useTelemetry = () => {
	const context = useContext(TelemetryContext);
	if (!context) {
		throw new Error('useTelemetry must be used within a TelemetryProvider');
	}
	return context;
};
