import type { SerializedStyles } from '@emotion/react';
import { css, keyframes } from '@emotion/react';
import type React from 'react';
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type TooltipPosition = 'top' | 'right' | 'bottom' | 'left';

interface TooltipProps {
	children: React.ReactNode;
	tooltipContent: React.ReactNode;
	position?: TooltipPosition;
}

const tooltipWrapperStyle = css`
	position: relative;
	display: inline-block;
`;

const tooltipBaseStyle = css`
	position: absolute;
	background-color: #333;
	color: #fff;
	padding: 5px 8px;
	border-radius: 4px;
	font-size: 12px;
	white-space: nowrap;
	z-index: 9999; /* Ensures the tooltip appears above everything */
`;

/*
  Define the final transforms for centering the tooltip relative to the computed coordinates.
*/
const finalTransform: Record<TooltipPosition, string> = {
	top: 'translateX(-50%) translateY(-100%)',
	bottom: 'translateX(-50%) translateY(0)',
	left: 'translateX(-100%) translateY(-50%)',
	right: 'translateX(0) translateY(-50%)',
};

/*
  Define the initial transform values for a slight offset in the fade/slide animation.
*/
const initialTransform: Record<TooltipPosition, string> = {
	top: 'translateX(-50%) translateY(calc(-100% + 2px))',
	bottom: 'translateX(-50%) translateY(calc(0% - 2px))',
	left: 'translateX(calc(-100% + 2px)) translateY(-50%)',
	right: 'translateX(calc(0% - 2px)) translateY(-50%)',
};

const getFadeInAnimation = (position: TooltipPosition) =>
	keyframes`
        from {
            opacity: 0;
            transform: ${initialTransform[position]};
        }
        to {
            opacity: 0.9;
            transform: ${finalTransform[position]};
        }
    `;

const arrowStyles: Record<TooltipPosition, SerializedStyles> = {
	top: css`
		position: absolute;
		top: 100%;
		left: 50%;
		margin-left: -5px;
		width: 0;
		height: 0;
		border-left: 5px solid transparent;
		border-right: 5px solid transparent;
		border-top: 5px solid #333;
	`,
	right: css`
		position: absolute;
		left: -5px;
		top: 50%;
		margin-top: -5px;
		width: 0;
		height: 0;
		border-top: 5px solid transparent;
		border-bottom: 5px solid transparent;
		border-right: 5px solid #333;
	`,
	bottom: css`
		position: absolute;
		bottom: 100%;
		left: 50%;
		margin-left: -5px;
		width: 0;
		height: 0;
		border-left: 5px solid transparent;
		border-right: 5px solid transparent;
		border-bottom: 5px solid #333;
	`,
	left: css`
		position: absolute;
		right: -5px;
		top: 50%;
		margin-top: -5px;
		width: 0;
		height: 0;
		border-top: 5px solid transparent;
		border-bottom: 5px solid transparent;
		border-left: 5px solid #333;
	`,
};

export const Tooltip: React.FC<TooltipProps> = ({
	children,
	tooltipContent,
	position = 'top',
}) => {
	const [visible, setVisible] = useState<boolean>(false);
	const [coords, setCoords] = useState<{ top: number; left: number }>({
		top: 0,
		left: 0,
	});
	const wrapperRef = useRef<HTMLDivElement>(null);
	const tooltipId = useId();

	useEffect(() => {
		if (visible && wrapperRef.current) {
			const rect = wrapperRef.current.getBoundingClientRect();
			const margin = 6; // margin between the element and tooltip
			let newCoords = { top: 0, left: 0 };

			switch (position) {
				case 'top':
					newCoords = {
						left: rect.left + rect.width / 2,
						top: rect.top - margin,
					};
					break;
				case 'bottom':
					newCoords = {
						left: rect.left + rect.width / 2,
						top: rect.bottom + margin,
					};
					break;
				case 'left':
					newCoords = {
						left: rect.left - margin,
						top: rect.top + rect.height / 2,
					};
					break;
				case 'right':
					newCoords = {
						left: rect.right + margin,
						top: rect.top + rect.height / 2,
					};
					break;
				default:
					break;
			}
			setCoords(newCoords);
		}
	}, [visible, position]);

	useEffect(() => {
		if (!visible) return;

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				setVisible(false);
			}
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => {
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [visible]);

	return (
		<div
			ref={wrapperRef}
			css={tooltipWrapperStyle}
			aria-describedby={visible ? tooltipId : undefined}
			onMouseEnter={() => setVisible(true)}
			onMouseLeave={() => setVisible(false)}
			onFocus={() => setVisible(true)}
			onBlur={() => setVisible(false)}
		>
			{children}
			{visible &&
				createPortal(
					<div
						id={tooltipId}
						role="tooltip"
						css={[
							tooltipBaseStyle,
							css`
								animation: ${getFadeInAnimation(position)} 0.6s ease-in-out
									forwards;
							`,
						]}
						style={{
							left: coords.left,
							top: coords.top,
						}}
					>
						{tooltipContent}
						<span css={arrowStyles[position]} />
					</div>,
					document.body,
				)}
		</div>
	);
};
