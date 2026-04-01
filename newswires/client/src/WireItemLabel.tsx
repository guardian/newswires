import type { EuiIconProps } from '@elastic/eui';
import { EuiIcon, useEuiTheme } from '@elastic/eui';
import { css } from '@emotion/react';

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

export const WireItemLabel = ({
	label,
	theme: { borderColour, backgroundColour, textColour },
	outlined,
	hoverParentClassName,
	iconType,
}: {
	label: string;
	theme: LabelTheme;
	outlined: boolean;
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
					border-radius: 18px;
					padding: 0 ${euiTheme.size.s};
					// border colour might be overridden by the parent, via the 'className' that's been passed in.
					border: 1px solid ${outlined ? borderColour : 'transparent'};
					color: ${textColour};
					background-color: ${backgroundColour};
					line-height: 18px;
					font-size: ${euiTheme.font.scale.s}rem;
					display: inline-flex;
					align-items: center;
					gap: ${euiTheme.size.xs};

					&:hover,
					&:focus {
						cursor: default;
					}
				`,
			]}
		>
			{iconType && <EuiIcon size="s" type={iconType} />}
			{label}
		</div>
	);
};
