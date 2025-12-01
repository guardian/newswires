import { EuiButtonIcon, EuiIcon, useEuiTheme } from '@elastic/eui';
import { css } from '@emotion/react';

function getGridStyles({
	isTopLevel,
	iconButtonWidth,
}: {
	isTopLevel: boolean;
	iconButtonWidth: string;
}) {
	const gridTemplateColumns = isTopLevel
		? `[primaryButton-start label-start] 1fr [label-end secondaryButton-start] ${iconButtonWidth} [secondaryButton-end rightArrow-start] ${iconButtonWidth} [rightArrow-end primaryButton-end]`
		: `[primaryButton-start leftArrow-start] ${iconButtonWidth} [leftArrow-end label-start] 1fr [label-end secondaryButton-start] ${iconButtonWidth} [secondaryButton-end primaryButton-end]`;

	const liStyle = `
		display: grid;
		grid-template-columns: ${gridTemplateColumns};
		align-items: center;
		position: relative;
		width: 100%;
	`;

	const primaryButtonStyle = `
		grid-column: primaryButton;
		grid-row: 1;
		display: grid;
		grid-template-columns: subgrid;
		align-items: center;
		justify-items: start;
		width: 100%;
	`;

	const secondaryButtonStyle = `
		grid-column: secondaryButton;
		grid-row: 1;
		width: ${iconButtonWidth};
		height: ${iconButtonWidth};
	`;

	return {
		liStyle,
		primaryButtonStyle,
		secondaryButtonStyle,
	};
}

export const SideNavListItem = ({
	label,
	isActive,
	isTopLevel,
	handleButtonClick,
	handleSecondaryActionClick,
	arrowSide = undefined,
	handleArrowClick: handleArrowClick,
	colour = 'rgb(0, 119, 204)',
}: {
	label: string;
	isActive?: boolean;
	isTopLevel: boolean;
	handleButtonClick: () => void;
	handleSecondaryActionClick?: () => void;
	handleArrowClick?: () => void;
	arrowSide?: 'left' | 'right';
	colour?: string;
}) => {
	const { euiTheme } = useEuiTheme();

	const gridStyles = getGridStyles({
		isTopLevel,
		iconButtonWidth: euiTheme.size.l,
	});

	return (
		<li
			aria-current={isActive ? 'true' : undefined}
			css={css`
				${gridStyles.liStyle}
				padding-left: ${euiTheme.size.xs};
				padding-right: ${euiTheme.size.xs};
				margin-bottom: ${euiTheme.size.xs};
				border-radius: ${euiTheme.size.xs};
				transition: background-color 0.2s ease;
				background-color: ${isActive
					? euiTheme.colors.backgroundBasePrimary
					: 'transparent'};

				&:hover .secondary-action-button,
				&:focus-within .secondary-action-button {
					opacity: 1;
				}

				&:hover {
					background-color: ${euiTheme.colors.backgroundBaseSubdued};
					cursor: pointer;
					text-decoration: underline;
				}
			`}
		>
			<button
				type="button"
				onClick={handleButtonClick}
				css={css`
					${gridStyles.primaryButtonStyle}
					padding: ${euiTheme.size.xs};
				`}
			>
				{arrowSide === 'left' && (
					<EuiIcon
						css={css`
							grid-column: leftArrow;
						`}
						type={'arrowLeft'}
						onClick={handleArrowClick}
					/>
				)}

				<div
					css={css`
						grid-column: label;
						display: flex;
						align-items: center;
						gap: ${euiTheme.size.xs};
					`}
				>
					<div
						css={css`
							width: 0.5rem;
							height: 1.5rem;
							background-color: ${isActive ? colour : 'transparent'};
						`}
					/>
					<span
						css={css`
							${arrowSide === 'left' && 'font-weight: bold;'}
						`}
					>
						{label}
					</span>
				</div>

				<span></span>

				{arrowSide === 'right' && (
					<EuiIcon
						css={css`
							grid-column: leftArrow;
						`}
						type={'arrowRight'}
						onClick={handleArrowClick}
					/>
				)}
			</button>
			{!!handleSecondaryActionClick && (
				<EuiButtonIcon
					onClick={() => {
						handleSecondaryActionClick();
					}}
					className="secondary-action-button"
					iconType="popout"
					size="xs"
					aria-label={`open ${label} ticker`}
					css={css`
						${gridStyles.secondaryButtonStyle}
						opacity: 0;

						&:hover,
						&:focus {
							opacity: 1;
						}
					`}
				/>
			)}
		</li>
	);
};
