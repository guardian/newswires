import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import {
	GIT_COMMIT_ID,
	SEND_TELEMETRY_AS_DEV,
	STAGE,
} from './app-configuration.ts';
import { App } from './App.tsx';
import { KeyboardShortcutsProvider } from './context/KeyboardShortcutsContext.tsx';
import { SearchContextProvider } from './context/SearchContext.tsx';
import { TelemetryContextProvider } from './context/TelemetryContext.tsx';
import { UserSettingsContextProvider } from './context/UserSettingsContext.tsx';
import './icons';
import { createTelemetryEventSender } from './telemetry.ts';

const { sendTelemetryEvent } = createTelemetryEventSender({
	stage: STAGE,
	sendTelemetryAsDev: SEND_TELEMETRY_AS_DEV,
	gitCommitId: GIT_COMMIT_ID,
});

const toolsDomain = window.location.hostname.substring(
	window.location.hostname.indexOf('.'),
);
const script = document.createElement('script');
script.src = `https://pinboard${toolsDomain}/pinboard.loader.js`;
document.head.appendChild(script);

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<TelemetryContextProvider sendTelemetryEvent={sendTelemetryEvent}>
			<UserSettingsContextProvider>
				<SearchContextProvider>
					<KeyboardShortcutsProvider>
						<App />
					</KeyboardShortcutsProvider>
				</SearchContextProvider>
			</UserSettingsContextProvider>
		</TelemetryContextProvider>
	</StrictMode>,
);
