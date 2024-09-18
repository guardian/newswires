import { EuiEmptyPrompt, EuiLoadingLogo, EuiPageTemplate } from '@elastic/eui';
import { useEffect, useState } from 'react';
import { querify } from './querify';
import type { WireData } from './sharedTypes';
import { WireCardList } from './WiresCards';

type SearchState = { loading: true } | { error: string } | WireData[];

export const Feed = ({ searchQuery }: { searchQuery: string }) => {
	const [searchState, setSearchState] = useState<SearchState>({
		loading: true,
	});

	useEffect(() => {
		const quer = querify(searchQuery);
		fetch('/api/search' + quer)
			.then((res) => res.json())
			.then((j) => setSearchState(j as WireData[]))
			.catch((e) =>
				setSearchState({
					error:
						e instanceof Error
							? e.message
							: typeof e === 'string'
								? e
								: 'unknown error',
				}),
			);
	}, [searchQuery]);

	return (
		<EuiPageTemplate.Section>
			{'error' in searchState && (
				<EuiPageTemplate.EmptyPrompt>
					<p>Sorry, failed to load because of {searchState.error}</p>
				</EuiPageTemplate.EmptyPrompt>
			)}
			{'loading' in searchState && (
				<EuiPageTemplate.EmptyPrompt
					icon={<EuiLoadingLogo logo="clock" size="xl" />}
					title={<h2>Loading Wires</h2>}
				/>
			)}
			{Array.isArray(searchState) && searchState.length === 0 && (
				<EuiEmptyPrompt
					body={<p>Try a different search term</p>}
					color="subdued"
					layout="horizontal"
					title={<h2>No results match your search criteria</h2>}
					titleSize="s"
				/>
			)}
			{Array.isArray(searchState) && searchState.length > 0 && (
				<WireCardList wires={searchState} />
			)}
		</EuiPageTemplate.Section>
	);
};
