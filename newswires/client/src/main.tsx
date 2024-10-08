import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import './icons';
import { HistoryContextProvider } from './urlState.tsx';

const toolsDomain = window.location.hostname.substring(
	window.location.hostname.indexOf('.'),
);
const script = document.createElement('script');
script.src = `https://pinboard${toolsDomain}/pinboard.loader.js`;
document.head.appendChild(script);

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<HistoryContextProvider>
			<App />
		</HistoryContextProvider>
	</StrictMode>,
);
