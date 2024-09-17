import {
	EuiFieldSearch,
	EuiHeader,
	EuiHeaderSectionItem,
	EuiLoadingLogo,
	EuiPageTemplate,
	EuiProvider,
	EuiTitle,
} from '@elastic/eui';
import { useEffect, useMemo, useState } from 'react';
import '@elastic/eui/dist/eui_theme_light.css';
import { debounce } from './debounce';
import { querify } from './querify';
import type { WireData } from './sharedTypes';
import { WireCardList } from './WiresCards';

type PageStage = { loading: true } | { error: string } | WireData[];

export function App() {
	const [pageState, setPageState] = useState<PageStage>({ loading: true });

	const [query, setQuery] = useState<string>('');

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
		<EuiProvider colorMode="light">
			<EuiPageTemplate>
				<EuiHeader position="fixed">
					<EuiHeaderSectionItem>
						<EuiTitle size={'s'}>
							<h1>Newswires</h1>
						</EuiTitle>
					</EuiHeaderSectionItem>
					<EuiHeaderSectionItem>
						<EuiFieldSearch onChange={(e) => updateQuery(e.target.value)} />
					</EuiHeaderSectionItem>
				</EuiHeader>
				<EuiPageTemplate.Section>
					{'error' in pageState && (
						<EuiPageTemplate.EmptyPrompt>
							<p>Sorry, failed to load because of {pageState.error}</p>
						</EuiPageTemplate.EmptyPrompt>
					)}
					{'loading' in pageState && (
						<EuiPageTemplate.EmptyPrompt
							icon={<EuiLoadingLogo logo="clock" size="xl" />}
							title={<h2>Loading Wires</h2>}
						/>
					)}
					{Array.isArray(pageState) && <WireCardList wires={pageState} />}
				</EuiPageTemplate.Section>
			</EuiPageTemplate>
		</EuiProvider>
	);
}
