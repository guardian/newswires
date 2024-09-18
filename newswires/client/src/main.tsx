import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import './icons';
import { HistoryContextProvider } from './urlState.tsx';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<HistoryContextProvider>
			<App />
		</HistoryContextProvider>
	</StrictMode>,
);
