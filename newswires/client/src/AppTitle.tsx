import { EuiLink } from '@elastic/eui';
import { css } from '@emotion/react';
import { STAGE } from './app-configuration';

export const AppTitle = () => (
	<EuiLink
		href="/feed"
		external={false}
		css={css`
			color: inherit;
			font-weight: inherit;
		`}
	>
		Newswires {STAGE !== 'PROD' ? STAGE : ''}
	</EuiLink>
);
