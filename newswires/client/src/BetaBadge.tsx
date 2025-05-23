import { EuiBetaBadge } from '@elastic/eui';
import { css } from '@emotion/react';

export const BetaBadge = ({ size }: { size: 'small' | 'medium' }) => {
	if (size === 'small') {
		return (
			<EuiBetaBadge
				iconType={'beaker'}
				label="Currently under construction"
				aria-label="(Under construction)"
				color={'accent'}
				size="m"
				css={css`
					margin-left: 8px;
				`}
			/>
		);
	} else {
		return (
			<EuiBetaBadge
				label="Under construction"
				aria-label="(Under construction)"
				title="Currently under construction"
				color={'accent'}
				size="s"
				css={css`
					margin-left: 8px;
				`}
			/>
		);
	}
};
