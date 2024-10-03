import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import './icons';
import { SearchContextProvider } from './useSearch.tsx';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<SearchContextProvider>
			<App />
		</SearchContextProvider>
	</StrictMode>,
);
