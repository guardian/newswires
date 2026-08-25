import { asAtIdentifierString, xrpc } from '@atproto/lex';
import type { PropsWithChildren } from 'react';
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from 'react';
import type { PostView } from '../../../../src/lexicons/app/bsky/feed/defs.js';
import getAuthorFeed from '../../../../src/lexicons/app/bsky/feed/getAuthorFeed.js';

const PUBLIC_BSKY_API = 'https://public.api.bsky.app';
const DEFAULT_POLL_INTERVAL_MS = 30_000;

export type BlueskyFeedStatus = 'loading' | 'success' | 'error';

export interface BlueskyFeedState {
	posts: PostView[];
	status: BlueskyFeedStatus;
	error?: string;
	lastUpdated?: Date;
	refresh: () => void;
}

async function fetchAuthorFeed(
	username: string,
	signal: AbortSignal,
): Promise<PostView[]> {
	// The public Bluesky API is unauthenticated, so we hit it directly rather
	// than via `pandaFetch` (which is for the session-authenticated Newswires API).
	const response = await xrpc(PUBLIC_BSKY_API, getAuthorFeed, {
		params: { actor: asAtIdentifierString(username) },
		signal,
	});
	return response.body.feed.map((item) => item.post);
}

export function useBlueskyFeed(
	username: string,
	pollIntervalMs: number = DEFAULT_POLL_INTERVAL_MS,
): BlueskyFeedState {
	const [posts, setPosts] = useState<PostView[]>([]);
	const [status, setStatus] = useState<BlueskyFeedStatus>('loading');
	const [error, setError] = useState<string | undefined>(undefined);
	const [lastUpdated, setLastUpdated] = useState<Date | undefined>(undefined);
	const [refreshCounter, setRefreshCounter] = useState(0);

	const refresh = useCallback(
		() => setRefreshCounter((count) => count + 1),
		[],
	);

	useEffect(() => {
		if (username.trim() === '') {
			return;
		}

		const abortController = new AbortController();

		const load = async (isInitial: boolean) => {
			if (isInitial) {
				setStatus('loading');
			}
			try {
				const nextPosts = await fetchAuthorFeed(
					username,
					abortController.signal,
				);
				if (abortController.signal.aborted) {
					return;
				}
				setPosts(nextPosts);
				setLastUpdated(new Date());
				setError(undefined);
				setStatus('success');
			} catch (err) {
				if (
					abortController.signal.aborted ||
					(err instanceof Error && err.name === 'AbortError')
				) {
					// we don't want to treat aborts as errors
					return;
				}
				setError(err instanceof Error ? err.message : String(err));
				setStatus('error');
			}
		};

		void load(true);
		const pollingInterval = setInterval(() => void load(false), pollIntervalMs);

		return () => {
			abortController.abort();
			clearInterval(pollingInterval);
		};
	}, [username, pollIntervalMs, refreshCounter]);

	return { posts, status, error, lastUpdated, refresh };
}

export const BlueskyFeedContext = createContext<BlueskyFeedState | null>(null);

export function BlueskyFeedProvider({
	username,
	pollIntervalMs,
	children,
}: PropsWithChildren<{ username: string; pollIntervalMs?: number }>) {
	const feed = useBlueskyFeed(username, pollIntervalMs);
	return (
		<BlueskyFeedContext.Provider value={feed}>
			{children}
		</BlueskyFeedContext.Provider>
	);
}

export const useBlueskyFeedContext = () => {
	const feed = useContext(BlueskyFeedContext);
	if (feed === null) {
		throw new Error(
			'useBlueskyFeedContext must be used within a BlueskyFeedProvider',
		);
	}
	return feed;
};
