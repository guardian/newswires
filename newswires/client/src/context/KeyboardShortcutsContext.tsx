import type { KeyboardEventHandler } from 'react';
import { createContext, useCallback, useContext } from 'react';
import { useSearch } from './SearchContext';

const keysWithShortcuts = ['ArrowLeft', 'ArrowRight', 'Escape'] as const;

type KeyWithShortcut = (typeof keysWithShortcuts)[number];

function isKeyWithShortcut(key: string): key is KeyWithShortcut {
	return keysWithShortcuts.includes(key as KeyWithShortcut);
}

const stopShortcutPropagation: KeyboardEventHandler<HTMLElement> = (event) => {
	if (isKeyWithShortcut(event.key)) {
		if (event.target instanceof HTMLElement) {
			console.log(
				`Stopping propagation for key: ${event.key} above ${event.target.tagName} (${event.target.className})`,
			);
		} else {
			console.log(
				`Stopping propagation for key: ${event.key} above ${JSON.stringify(event.target)}`,
			);
		}
		event.stopPropagation();
	}
};

type KeyboardShortcutsContextShape = {
	handleShortcutKeyUp: (event: KeyboardEvent) => void;
	stopShortcutPropagation: KeyboardEventHandler<HTMLElement>;
};

export const KeyboardShortcutsContext =
	createContext<KeyboardShortcutsContextShape | null>(null);

export function KeyboardShortcutsProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const { config, handleDeselectItem, handleNextItem, handlePreviousItem } =
		useSearch();

	const { view } = config;

	const handleShortcutKeyUp = useCallback(
		(event: KeyboardEvent): void => {
			const key = event.key;

			if (!isKeyWithShortcut(key)) {return;}

			if (!(event.target instanceof HTMLElement)) {return;}
			const target = event.target;
			const isTextInput =
				target instanceof HTMLTextAreaElement ||
				target instanceof HTMLInputElement ||
				target.isContentEditable;

			if (isTextInput) {return;}

			if (view == 'item') {
				switch (key) {
					case 'Escape':
						handleDeselectItem();
						break;
					case 'ArrowLeft':
						handlePreviousItem();
						break;
					case 'ArrowRight':
						handleNextItem();
						break;
				}
			}
		},
		[handleDeselectItem, handleNextItem, handlePreviousItem, view],
	);

	return (
		<KeyboardShortcutsContext.Provider
			value={{ handleShortcutKeyUp, stopShortcutPropagation }}
		>
			{children}
		</KeyboardShortcutsContext.Provider>
	);
}

export function useKeyboardShortcuts() {
	const context = useContext(KeyboardShortcutsContext);
	if (context === null) {
		throw new Error(
			'useKeyboardShortcuts must be used within a KeyboardShortcutsProvider',
		);
	}
	return context;
}

export const StopShortcutPropagationWrapper = ({
	children,
}: {
	children: React.ReactNode;
}) => {
	return <div onKeyUp={stopShortcutPropagation}>{children}</div>;
};
