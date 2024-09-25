import {
	EuiBadge,
	EuiButton,
	EuiEmptyPrompt,
	EuiFlexGroup,
	EuiFlexItem,
	EuiListGroup,
} from '@elastic/eui';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { SearchBox } from './SearchBox';
import type { KeywordCounts } from './sharedTypes';
import { KeywordCountsSchema } from './sharedTypes';
import { useHistory } from './urlState';

export function Home({
	updateQuery,
}: {
	updateQuery: (newQuery: string) => void;
}) {
	const { currentState } = useHistory();
	const [keywords, setKeywords] = useState<KeywordCounts>([]);
	const [trendingKeywords, setTrendingKeywords] = useState<KeywordCounts>([]);

	useEffect(() => {
		fetch('api/keywords?limit=5')
			.then((response) => {
				if (response.ok) {
					return response.json();
				}
			})
			.then((data) => {
				const maybeKeywords = KeywordCountsSchema.safeParse(data);
				if (maybeKeywords.success) {
					setKeywords(maybeKeywords.data);
				} else {
					console.error('Error parsing keywords:', maybeKeywords.error);
				}
			})
			.catch((error) => {
				console.error('Error fetching keywords:', error);
			});
		fetch('api/keywords/trending?limit=5')
			.then((response) => {
				if (response.ok) {
					return response.json();
				}
			})
			.then((data) => {
				const maybeKeywords = KeywordCountsSchema.safeParse(data);
				if (maybeKeywords.success) {
					setTrendingKeywords(maybeKeywords.data);
				} else {
					console.error(
						'Error parsing trending keywords:',
						maybeKeywords.error,
					);
				}
			})
			.catch((error) => {
				console.error('Error fetching trending keywords:', error);
			});
	});

	const body = (
		<EuiFlexGroup direction="column" justifyContent="center">
			<SearchBox
				initialQuery={currentState.params?.q ?? ''}
				update={updateQuery}
			/>
			<EuiFlexGroup>
				{keywords.length > 0 && (
					<EuiFlexItem>
						<h3>Top keywords</h3>
						<KeywordsList keywords={keywords} />
					</EuiFlexItem>
				)}
				{trendingKeywords.length > 0 && (
					<EuiFlexItem>
						<h3>Trending keywords</h3>
						<KeywordsList keywords={trendingKeywords} />
					</EuiFlexItem>
				)}
			</EuiFlexGroup>
		</EuiFlexGroup>
	);

	return <EuiEmptyPrompt title={<h2>Search wires</h2>} body={body} />;
}

const KeywordsList = ({ keywords }: { keywords: KeywordCounts }) => {
	const sortedKeywords = useMemo(() => {
		return keywords.sort((a, b) => b.count - a.count);
	}, [keywords]);

	return (
		<EuiFlexGroup>
			<EuiListGroup flush={true}>
				{sortedKeywords.map(({ keyword, count }) => (
					// TODO: fix query when keyword support added to search:
					//     - specify as keyword rather than 'q'
					//     - make sure keyword text is properly encoded
					//     - handle quote marks if still present in response
					<EuiButton key={keyword} color="text" href={`/feed?q=${keyword}`}>
						{keyword.replaceAll('"', '')}{' '}
						<EuiBadge color={'subdued'}>{count}</EuiBadge>
					</EuiButton>
				))}
			</EuiListGroup>
		</EuiFlexGroup>
	);
};
