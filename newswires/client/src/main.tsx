import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import './icons';
import { SearchContextProvider } from './context/SearchContext.tsx';
import './global.css';

const toolsDomain = window.location.hostname.substring(
	window.location.hostname.indexOf('.'),
);
const script = document.createElement('script');
script.src = `https://pinboard${toolsDomain}/pinboard.loader.js`;
document.head.appendChild(script);

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<SearchContextProvider>
			<App />
		</SearchContextProvider>
	</StrictMode>,
);
