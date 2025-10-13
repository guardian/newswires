import { EuiButtonIcon, EuiIcon, useEuiTheme } from '@elastic/eui';
import { css } from '@emotion/react';

export const SideNavListItem = ({
	label,
	isActive,
	isTopLevel,
	handleButtonClick,
	handleSecondaryActionClick,
	arrowSide = undefined,
	toggleDraw,
	colour = 'rgb(0, 119, 204)',
}: {
	label: string;
	isActive?: boolean;
	isTopLevel: boolean;
	handleButtonClick: () => void;
	handleSecondaryActionClick?: () => void;
	toggleDraw: () => void;
	arrowSide?: 'left' | 'right';
	colour?: string;
}) => {
	const { euiTheme } = useEuiTheme();

	return (
		<li
			aria-current={isActive ? 'true' : undefined}
			css={css`
				display: flex;
				gap: ${euiTheme.size.xs};
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
			{arrowSide === 'left' && (
				<EuiIcon type={'arrowLeft'} onClick={toggleDraw}></EuiIcon>
			)}
			<button
				type="button"
				onClick={handleButtonClick}
				css={css`
					padding: ${euiTheme.size.xs} ${euiTheme.size.xs};
					display: flex;
					align-items: center;

					${!isTopLevel &&
					arrowSide !== 'left' &&
					`margin-left: ${euiTheme.size.l};`}
					flex-grow: 1;
				`}
			>
				<div
					css={css`
						flex-grow: 1;
						display: flex;
						align-items: center;
						gap: 5px;
						${arrowSide === 'left' && 'font-weight: bold;'}
					`}
				>
					<div
						css={css`
							width: 0.5rem;
							height: 1.5rem;
							background-color: ${isActive ? colour : 'transparent'};
						`}
					/>
					<span>{label}</span>
				</div>
			</button>
			{!!handleSecondaryActionClick && (
				<button
					type="button"
					className="secondary-action-button"
					onClick={() => {
						handleSecondaryActionClick();
					}}
					css={css`
						opacity: 0;

						&:hover,
						&:focus {
							opacity: 1;
						}
					`}
				>
					<EuiButtonIcon iconType="popout" size="xs" />
				</button>
			)}
			{arrowSide === 'right' && (
				<EuiIcon type={'arrowRight'} onClick={toggleDraw}></EuiIcon>
			)}
		</li>
	);
};
