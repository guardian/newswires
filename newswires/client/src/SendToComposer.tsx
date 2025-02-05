import {
	EuiButton,
	EuiButtonIcon,
	EuiFlexGroup,
	EuiFlexItem,
    EuiLoadingSpinner
} from '@elastic/eui';
import { useCallback, useState } from 'react';
import { sendToComposer } from './send-to-composer.ts';
import { WireData } from './sharedTypes.ts';

type SendState = 'sending' | 'sent' | 'failed' | 'unsent';

const sendButtonText = (state: SendState): string => {
	if (state === 'sending') return 'Sending to Composer...';
	if (state === 'sent') return 'Open in Composer';
	if (state === 'failed') return 'Retry send to Composer';

	return 'Send to Composer';
};

export const SendToComposer = ({ itemData }: { itemData: WireData }) => {
	const [sendState, setSendState] = useState<SendState>('unsent');

	const send = useCallback(() => {
		setSendState('sending');
		sendToComposer(itemData)
			.then((res) => {
				console.log(`sent item, got ${res.status}`);
				if (res.ok) {
					setSendState('sent');
				} else {
					setSendState('failed');
				}
				return res.json();
			})
			.then((txt) => console.log(`full resp was ${txt}`));
	}, [itemData]);

	return (
		<>
			<EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
				<EuiFlexItem>
					{sendState === 'sent' ? 'Sent to Composer by: ME' : 'Not in Composer'}
				</EuiFlexItem>
				<EuiButton onClick={send}>
                    {sendState === 'sending' ? <EuiLoadingSpinner /> : <EuiButtonIcon
						iconType={'launch'}
						aria-label="send to composer"
						size="s"
					/>}
					{sendButtonText(sendState)}
				</EuiButton>
			</EuiFlexGroup>
		</>
	);
};
