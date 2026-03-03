import { EuiButtonEmpty } from '@elastic/eui';
import { css } from '@emotion/react';

const ALERT = '#FCE8E8';
const ALERT_TEXT = '#B81F1F';

export const Alert = () => {
	return (
		<EuiButtonEmpty
			title={`Alert`}
			css={css`
				&.alert {
					border-radius: 18px;
					margin: 5px;
					padding: 10px;
				}
				&.alert:hover,
				&.alert:focus {
					background-color: ${ALERT};
					color: ${ALERT_TEXT};
					cursor: default;
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
