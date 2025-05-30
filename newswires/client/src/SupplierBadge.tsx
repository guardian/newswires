import { EuiBadge, useEuiTheme } from '@elastic/eui';
import { css } from '@emotion/react';
import { lightShadeOf } from './colour-utils';
import type { SupplierInfo } from './sharedTypes';

export const SupplierBadge = ({
	supplier,
	isPrimary = true,
	isCondensed = false,
}: {
	supplier: SupplierInfo;
	isPrimary?: boolean;
	isCondensed?: boolean;
}) => {
	const { colour, label, shortLabel } = supplier;
	const theme = useEuiTheme();

	return (
		<EuiBadge
			title={`${supplier.label} supplier`}
			css={css`
				color: ${isPrimary ? 'white' : theme.euiTheme.colors.textInverse};
			`}
			color={isPrimary ? colour : lightShadeOf(colour)}
		>
			{isCondensed ? shortLabel : label}
		</EuiBadge>
	);
};
