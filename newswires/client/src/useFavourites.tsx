import type { ReactNode } from 'react';
import { createContext, useContext, useState } from 'react';
import { z } from 'zod';

const savedItemSchema = z.object({ id: z.string(), headline: z.string() });
type SavedItem = z.infer<typeof savedItemSchema>;
const savedSchema = z.array(savedItemSchema);
type Saved = z.infer<typeof savedSchema>;

const loadSavedFromStorage = () => {
	const storedSaved = localStorage.getItem('saved');
	const parsedSavedResult = savedSchema.safeParse(
		JSON.parse(storedSaved ?? '[]'),
	);
	if (parsedSavedResult.success) {
		return parsedSavedResult.data;
	}
	return [];
};

const SavedContext = createContext<
	| {
			saved: Saved;
			addSaved: (itemToAdd: SavedItem) => void;
			removeSaved: (itemToRemove: SavedItem) => void;
	  }
	| undefined
>(undefined);

export const SavedContextProvider = ({ children }: { children: ReactNode }) => {
	const [saved, setSaved] = useState<Saved>(loadSavedFromStorage());

	const addSaved = (itemToAdd: SavedItem) => {
		setSaved((prev: Saved) => {
			const newSaved = [itemToAdd, ...prev];
			localStorage.setItem('saved', JSON.stringify(newSaved));
			return newSaved;
		});
	};

	const removeSaved = (itemToRemove: SavedItem) => {
		setSaved((prev) => {
			const newSaved = prev.filter((i) => i.id !== itemToRemove.id);
			localStorage.setItem('saved', JSON.stringify(newSaved));
			return newSaved;
		});
	};

	return (
		<SavedContext.Provider value={{ saved, addSaved, removeSaved }}>
			{children}
		</SavedContext.Provider>
	);
};

// Custom hook to use the saved context
export const useSaved = () => {
	const context = useContext(SavedContext);
	if (!context) {
		throw new Error('useSaved must be used within a SavedContextProvider');
	}
	return context;
};
