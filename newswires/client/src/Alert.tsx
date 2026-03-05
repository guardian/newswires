import { EuiButtonEmpty } from '@elastic/eui';
import { css } from '@emotion/react';

const ALERT = '#FCE8E8';
export const ALERT_TEXT = '#B81F1F';

export const Alert = ({ isPrimary }: { isPrimary: boolean }) => {
	return (
		<EuiButtonEmpty
			title={`Alert`}
			css={css`
				&.alert {
					border-radius: 18px;
					margin: 5px;
					padding: 8px;
					border: 1px solid ${isPrimary ? 'white' : ALERT_TEXT};
				}
				&.alert:hover,
				&.alert:focus {
					background-color: ${ALERT};
					color: ${ALERT_TEXT};
					cursor: default;
					border: 1px solid ${ALERT_TEXT};
				}
				&.alert::before {
					display: none;
				}
				color: ${ALERT_TEXT};
				background-color: ${ALERT};
			`}
			size={'xs'}
			className={'alert'}
			iconType={'warning'}
		>
			Alert
		</EuiButtonEmpty>
	);
};
