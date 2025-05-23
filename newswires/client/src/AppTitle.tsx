import { EuiLink } from '@elastic/eui';
import { css } from '@emotion/react';

export const AppTitle = () => (
	<EuiLink
		href="/feed"
		external={false}
		css={css`
			color: inherit;
			font-weight: inherit;
		`}
	>
		Newswires
	</EuiLink>
);
