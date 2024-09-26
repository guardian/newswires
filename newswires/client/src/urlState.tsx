import type { Context, MouseEventHandler, PropsWithChildren } from 'react';
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from 'react';

export const simplePaths = ['', 'feed'] as const;
type ItemPath = `item/${string}`;
type Path = (typeof simplePaths)[number] | ItemPath;

export function isItemPath(p: string): p is ItemPath {
	return p.startsWith('item/');
}

function isPath(p: string): p is Path {
	// @ts-expect-error - this is a type guard
	return simplePaths.includes(p) || isItemPath(p);
}

export type HistoryState = Readonly<{
	location: Path;
	params?: Partial<Record<string, string>>;
}>;

const defaultState = Object.freeze({
	location: '' as const,
	params: {},
});

const isHistoryState = (s: unknown): s is HistoryState => {
	if (typeof s !== 'object') return false;
	if (s === null) return false;

	if (!('location' in s) || typeof s.location !== 'string') return false;
	const location = s.location as (typeof simplePaths)[number];
	if (!isPath(location)) return false;

	if ('params' in s) {
		if (typeof s.params !== 'object' || s.params === null) return false;
		for (const [k, v] of Object.entries(s.params)) {
			if (typeof k !== 'string' || typeof v !== 'string') return false;
		}
	}

	return true;
};

const readUrl = (locationString?: string): HistoryState => {
	const location = locationString
		? new URL(locationString, window.location.href)
		: window.location;
	const page = location.pathname.slice(1);
	if (page === 'feed') {
		const urlSearchParams = new URLSearchParams(location.search);
		const queryString = urlSearchParams.get('q');
		const params: Record<string, string> = {};
		if (typeof queryString === 'string') {
			params['q'] = queryString;
		}
		return { location: page, params };
	} else if (isItemPath(page)) {
		return { location: page, params: {} };
	} else {
		return defaultState;
	}
};

const paramsToQuerystring = (p: HistoryState['params']): string => {
	const params = Object.fromEntries(
		Object.entries(p ?? {}).reduce<Array<[string, string]>>((acc, [k, v]) => {
			if (typeof v === 'string') {
				return [...acc, [k, v]];
			} else {
				return acc;
			}
		}, []),
	);
	const querystring = new URLSearchParams(params).toString();
	return querystring;
};

const location = (state: HistoryState): string => {
	const querystring = paramsToQuerystring(state.params);
	return `/${state.location}${
		querystring.length !== 0 ? '?' : ''
	}${querystring}`;
};

type HistoryContextShape = {
	currentState: HistoryState;
	pushState: (state: HistoryState) => void;
	replaceState: (state: HistoryState) => void;
};
const HistoryContext: Context<HistoryContextShape | null> =
	createContext<HistoryContextShape | null>(null);

export const HistoryContextProvider = ({ children }: PropsWithChildren) => {
	const [currentState, setState] = useState<HistoryState>(readUrl());

	const pushState = useCallback(
		(state: HistoryState) => {
			history.pushState(state, '', location(state));
			setState(state);
		},
		[setState],
	);

	const replaceState = useCallback(
		(state: HistoryState) => {
			history.replaceState(state, '', location(state));
			setState(state);
		},
		[setState],
	);

	const popStateCallback = useCallback(
		(e: PopStateEvent) => {
			if (isHistoryState(e.state)) {
				setState(e.state);
			} else {
				setState(defaultState);
			}
		},
		[setState],
	);

	useEffect(() => {
		if (window.history.state === null) {
			window.history.replaceState(currentState, '', location(currentState));
		}
	}, [currentState]);

	useEffect(() => {
		window.addEventListener('popstate', popStateCallback);
		return () => window.removeEventListener('popstate', popStateCallback);
	}, [popStateCallback]);

	return (
		<HistoryContext.Provider value={{ currentState, pushState, replaceState }}>
			{children}
		</HistoryContext.Provider>
	);
};

export const useHistory = () => {
	const historyContext = useContext(HistoryContext);
	if (historyContext === null) {
		throw new Error('useHistory must be used within a HistoryContextProvider');
	}
	return historyContext;
};

export const Link = ({
	children,
	href,
}: PropsWithChildren<{ href: string }>) => {
	const { pushState } = useHistory();

	const onClick: MouseEventHandler<HTMLAnchorElement> = useCallback(
		(e) => {
			if (!(e.getModifierState('Meta') || e.getModifierState('Control'))) {
				e.preventDefault();
				pushState(readUrl(href));
			}
		},
		[href, pushState],
	);

	return (
		<a href={href} onClick={onClick}>
			{children}
		</a>
	);
};
