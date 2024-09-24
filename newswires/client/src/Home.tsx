import { EuiEmptyPrompt } from '@elastic/eui';
import { SearchBox } from './SearchBox';
import { useHistory } from './urlState';

export function Home({
	updateQuery,
}: {
	updateQuery: (newQuery: string) => void;
}) {
	const { currentState } = useHistory();
	return (
		<EuiEmptyPrompt
			title={<h2>Search wires</h2>}
			body={
				<SearchBox
					initialQuery={currentState.params?.q ?? ''}
					update={updateQuery}
				/>
			}
		/>
	);
}
