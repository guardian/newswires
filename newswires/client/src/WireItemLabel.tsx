import type { EuiIconProps } from '@elastic/eui';
import { EuiIcon, useEuiTheme } from '@elastic/eui';
import { css } from '@emotion/react';
import { lightShadeOf } from './colour-utils';
import type { SupplierInfo } from './sharedTypes';

interface LabelTheme {
	backgroundColour: string;
	textColour: string;
	borderColour: string;
}

export const LeadLabel = ({
	outlined,
	hoverParentClassName,
}: {
	outlined: boolean;
	hoverParentClassName?: string;
}) => {
	const { euiTheme } = useEuiTheme();
	const leadLabelTheme = {
		backgroundColour: euiTheme.colors.backgroundBasePrimary,
		textColour: euiTheme.colors.textPrimary,
		borderColour: euiTheme.colors.textPrimary,
	};
	return (
		<WireItemLabel
			label={'Lead'}
			hoverParentClassName={hoverParentClassName}
			theme={leadLabelTheme}
			outlined={outlined}
		/>
	);
};

export const AlertLabel = ({
	outlined,
	hoverParentClassName,
}: {
	outlined: boolean;
	hoverParentClassName?: string;
}) => {
	const alertLabelTheme = {
		backgroundColour: '#FCE8E8',
		textColour: '#B81F1F',
		borderColour: '#B81F1F',
	};
	return (
		<WireItemLabel
			label={'Alert'}
			hoverParentClassName={hoverParentClassName}
			theme={alertLabelTheme}
			outlined={outlined}
			iconType="warning"
		/>
	);
};

export const SupplierLabel = ({
	supplier,
	isPrimary,
	isCondensed,
}: {
	supplier: SupplierInfo;
	isPrimary: boolean;
	isCondensed: boolean;
}) => {
	const { colour, label, shortLabel } = supplier;

	return (
		<WireItemLabel
			label={isCondensed ? shortLabel : label}
			theme={{
				backgroundColour: isPrimary ? colour : lightShadeOf(colour),
				textColour: isPrimary ? 'white' : 'black',
				borderColour: colour,
			}}
			outlined={!isPrimary}
			rounded={'slightly'}
		/>
	);
};

export const WireItemLabel = ({
	label,
	theme: { borderColour, backgroundColour, textColour },
	outlined,
	rounded = 'very',
	hoverParentClassName,
	iconType,
}: {
	label: string;
	theme: LabelTheme;
	outlined: boolean;
	rounded?: 'very' | 'slightly';
	hoverParentClassName?: string;
	iconType?: EuiIconProps['type'];
}) => {
	const { euiTheme } = useEuiTheme();

	const hoverParentStyles =
		hoverParentClassName && hoverParentClassName.length > 0
			? css`
					.${hoverParentClassName}:hover & {
						border-color: ${borderColour};
					}
				`
			: null;

	return (
		<div
			css={[
				hoverParentStyles,
				css`
					border-radius: ${rounded === 'very'
						? euiTheme.size.m
						: euiTheme.size.xxs};
					padding: 0 ${euiTheme.size.s};
					border: 1px solid ${outlined ? borderColour : 'transparent'};
					color: ${textColour};
					background-color: ${backgroundColour};
					font-size: ${euiTheme.font.scale.s}rem;
					white-space: nowrap;
					display: inline-flex;
					align-items: center;
					gap: ${euiTheme.size.xs};
				`,
			]}
		>
			{iconType && <EuiIcon size="s" type={iconType} />}
			{label}
		</div>
	);
};
