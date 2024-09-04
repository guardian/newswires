import { css } from '@emotion/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import sanitizeHtml from 'sanitize-html';
import './App.css';

type WireData = {
	id: number;
	sqsMessageId: string;
	wire: Partial<{
		uri: string;
		usn: string;
		version: string;
		firstVersion: string; // date
		versionCreated: string; // date
		dateTimeSent: string; //date
		headline: string;
		subhead: string;
		byline: string;
		keywords: string;
		usage: string;
		location: string;
		body_text: string;
	}>;
};

type PageStage = { loading: true } | { error: string } | WireData[];

const querify = (query: string): string => {
	if (query.trim().length <= 0) return '';
	const params = new URLSearchParams();
	params.set('q', query.trim());
	return '?' + params.toString();
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- suitably generic function
const debounce = <F extends (...args: any[]) => void>(
	f: F,
	delay: number,
): ((...args: Parameters<F>) => void) => {
	let waiting: ReturnType<typeof setTimeout> | undefined;

	return (...args: Parameters<F>) => {
		if (waiting !== undefined) {
			clearTimeout(waiting);
		}
		waiting = setTimeout(() => f(...args), delay);
	};
};

export function App() {
	const [pageState, setPageState] = useState<PageStage>({ loading: true });

	const [query, setQuery] = useState<string>('');

	const [selected, setSelected] = useState<WireData | undefined>(undefined);

	const safeBodyText = useMemo(() => {
		return selected?.wire.body_text
			? sanitizeHtml(selected.wire.body_text)
			: undefined;
	}, [selected]);

	const updateQuery = useMemo(() => debounce(setQuery, 750), []);

	useEffect(() => {
		const quer = querify(query);
		fetch('/api/search' + quer)
			.then((res) => res.json())
			.then((j) => setPageState(j as WireData[]))
			.catch((e) =>
				setPageState({
					error:
						e instanceof Error
							? e.message
							: typeof e === 'string'
								? e
								: 'unknown error',
				}),
			);
	}, [query]);

	return (
		<div
			css={css`
				display: flex;
				flex-direction: column;
				height: 100%;
			`}
		>
			<div
				css={css`
					display: flex;
					flex-direction: row;
					justify-content: space-between;
				`}
			>
				<h1
					css={css`
						height: fit-content;
						margin: 0;
						border: 1px solid black;
					`}
				>
					Newswires
				</h1>
				<span
					css={css`
						display: flex;
						flex-direction: row;
						gap: 4px;
					`}
				>
					<label>Search</label>
					<input type="text" onChange={(e) => updateQuery(e.target.value)} />
				</span>
			</div>
			<div
				css={css`
					border: 1px solid black;
					min-height: 25vh;
					flex-grow: 1;
					overflow-y: scroll;
				`}
			>
				{'error' in pageState && (
					<p>Sorry, failed to load because of {pageState.error}</p>
				)}
				{'loading' in pageState && <p>Loading, please wait...</p>}
				{Array.isArray(pageState) && (
					<ul
						css={css`
							padding: 0;
							margin: 0;
						`}
					>
						{pageState.map((item) => (
							<li
								css={css`
									list-style: none;
									user-select: none;
									cursor: pointer;
									margin: 10px;
									padding: 10px;
									border-radius: 5px;
									background-color: #dcdcdc;
									&:nth-child(even) {
										background-color: #c0c0c0;
									}
								`}
								key={item.id}
								onClick={() => setSelected(item)}
							>
								{item.wire.headline ?? '<missing headline>'}
							</li>
						))}
					</ul>
				)}
			</div>
			{selected && (
				<div
					css={css`
						border: 1px solid black;
						flex-grow: 1;
						overflow-y: scroll;
						padding: 10px;
					`}
				>
					<button onClick={() => setSelected(undefined)}>X</button>
					<article>
						{selected.wire.headline && <h2>{selected.wire.headline}</h2>}
						{selected.wire.subhead &&
							selected.wire.subhead !== selected.wire.headline && (
								<h3>{selected.wire.subhead}</h3>
							)}
						{selected.wire.byline && (
							<p>
								By: <address>{selected.wire.byline}</address>
							</p>
						)}
						{selected.wire.keywords && (
							<p>
								<span
									css={css`
										font-style: italic;
									`}
								>
									Keywords:{' '}
								</span>
								{selected.wire.keywords}
							</p>
						)}
						{selected.wire.usage && (
							<p>
								<span
									css={css`
										font-style: italic;
									`}
								>
									Usage restrictions:
								</span>{' '}
								<span
									css={css`
										font-weight: bold;
									`}
								>
									{selected.wire.usage}
								</span>
							</p>
						)}
						<hr />
						{selected.wire.location && (
							<p
								css={css`
									font-weight: bold;
								`}
							>
								{selected.wire.location}
							</p>
						)}
						{safeBodyText && (
							<article dangerouslySetInnerHTML={{ __html: safeBodyText }} />
						)}
					</article>
				</div>
			)}
		</div>
	);
}
