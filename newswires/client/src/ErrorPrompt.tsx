import { EuiButton, EuiEmptyPrompt } from '@elastic/eui';
import { css } from '@emotion/react';
import { useSearch } from './context/SearchContext';
import { defaultQuery } from './urlState';

export function ErrorPrompt({ errorMessage }: { errorMessage: string }) {
	const { handleEnterQuery, handleRetry } = useSearch();
	return (
		<EuiEmptyPrompt
			css={css`
				background: white;
			`}
			actions={[
				<EuiButton onClick={handleRetry} key="retry" iconType={'refresh'}>
					Retry
				</EuiButton>,
				<EuiButton
					onClick={() => handleEnterQuery(defaultQuery)}
					key="clear"
					iconType={'cross'}
				>
					Clear
				</EuiButton>,
			]}
			body={<p>Sorry, failed to load because of {errorMessage}</p>}
			hasBorder={true}
		/>
	);
}
