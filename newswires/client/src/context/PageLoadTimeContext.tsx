import { createContext, useContext, useState } from 'react';

const PageLoadTimeContext = createContext<number | null>(null);

export const PageLoadTimeProvider = ({
	children,
}: {
	children: React.ReactNode;
}) => {
	const [timeThatPageWasLoaded] = useState(() => Date.now());
	return (
		<PageLoadTimeContext.Provider value={timeThatPageWasLoaded}>
			{children}
		</PageLoadTimeContext.Provider>
	);
};

export const usePageLoadTime = () => {
	const context = useContext(PageLoadTimeContext);
	if (context === null) {
		throw new Error(
			'usePageLoadTime must be used within a PageLoadTimeProvider',
		);
	}
	return context;
};
