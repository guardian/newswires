import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import './icons';
import { stage } from './configuration.ts';
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
