import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { stage } from './app-configuration.ts';
import { App } from './App.tsx';
import './icons';
import { SearchContextProvider } from './context/SearchContext.tsx';
import { TelemetryContextProvider } from './context/TelemetryContext.tsx';
import { createTelemetryEventSender } from './telemetry.ts';

const { sendTelemetryEvent } = createTelemetryEventSender(stage);

const toolsDomain = window.location.hostname.substring(
	window.location.hostname.indexOf('.'),
);
const script = document.createElement('script');
script.src = `https://pinboard${toolsDomain}/pinboard.loader.js`;
document.head.appendChild(script);

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<TelemetryContextProvider sendTelemetryEvent={sendTelemetryEvent}>
			<SearchContextProvider>
				<App />
			</SearchContextProvider>
		</TelemetryContextProvider>
	</StrictMode>,
);
