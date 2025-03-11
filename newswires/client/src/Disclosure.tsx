import { EuiIcon } from '@elastic/eui';
import { css } from '@emotion/react';

export const Disclosure = ({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) => {
	return (
		<div
			css={css`
				summary::-webkit-details-marker {
					display: none;
				}
				summary {
					list-style: none;
				}
				details summary {
					display: flex;
					align-items: center;
					gap: 0.5rem;
					cursor: pointer;

					& svg {
						transition: transform 0.3s;
					}
				}
				details[open] summary svg {
					/* rotate 90 degrees */
					transform: rotate(90deg);
				}
			`}
		>
			<details>
				<summary>
					<EuiIcon type="arrowRight" />
					<span>{title}</span>
				</summary>
				<div
					css={css`
						margin-top: 1rem;
						padding-left: 1rem;
					`}
				>
					{children}
				</div>
			</details>
		</div>
	);
};
