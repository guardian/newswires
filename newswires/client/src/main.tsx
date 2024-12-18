import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import './icons';
import { SavedItemsListContextProvider } from './useSavedItemsList.tsx';
import { SearchContextProvider } from './useSearch.tsx';

const toolsDomain = window.location.hostname.substring(
	window.location.hostname.indexOf('.'),
);
const script = document.createElement('script');
script.src = `https://pinboard${toolsDomain}/pinboard.loader.js`;
document.head.appendChild(script);

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<SearchContextProvider>
			<SavedItemsListContextProvider>
				<App />
			</SavedItemsListContextProvider>
		</SearchContextProvider>
	</StrictMode>,
);
