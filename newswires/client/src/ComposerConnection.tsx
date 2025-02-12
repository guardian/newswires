import {
	EuiButton,
	EuiFlexGroup,
	EuiFlexItem,
	EuiLoadingSpinner,
} from '@elastic/eui';
import { useCallback, useState } from 'react';
import { composerPageForId, sendToComposer } from './send-to-composer.ts';
import type { WireData } from './sharedTypes.ts';

type SendState = 'sending' | 'sent' | 'failed' | 'unsent';

const ComposerSendStatus = ({
	state,
	sentBy,
	failureReason,
}: {
	state: SendState;
	sentBy: string | undefined;
	failureReason: string | undefined;
}) => {
	if (state === 'sent' && sentBy)
		return (
			<p>
				Sent to Composer by: <a href={`mailto:${sentBy}`}>{sentBy}</a>
			</p>
		);
	if (state === 'sent') return <p>Sent to Composer</p>;
	if (state === 'failed')
		return (
			<p>Failed to send to Composer: {failureReason ?? 'unknown failure'}</p>
		);
	return <p>Not in Composer</p>;
};

const SendOrVisitInComposerButton = ({
	sendState,
	composerId,
	send,
}: {
	sendState: SendState;
	composerId: undefined | string;
	send: () => void;
}) => {
	if (sendState === 'sent' && composerId)
		return (
			<EuiButton
				href={composerPageForId(composerId)}
				target="_blank"
				iconType="link"
			>
				Open in Composer
			</EuiButton>
		);
	if (sendState === 'sent' || sendState === 'failed')
		return <EuiButton iconType="error">Send to Composer failed</EuiButton>;
	if (sendState === 'sending') return <EuiLoadingSpinner size="l" />;

	return (
		<EuiButton onClick={send} iconType="launch">
			Send to Composer
		</EuiButton>
	);
};

export const ComposerConnection = ({ itemData }: { itemData: WireData }) => {
	const [composerId, setComposerId] = useState(itemData.composerId);
	const [sentBy, setSentBy] = useState(itemData.composerSentBy);
	const [failureReason, setFailureReason] = useState<string | undefined>();

	const [sendState, setSendState] = useState<SendState>(
		itemData.composerId ? 'sent' : 'unsent',
	);

	const send = useCallback(() => {
		setSendState('sending');

		sendToComposer(itemData)
			.then(({ composerId, sentBy }) => {
				setComposerId(composerId);
				setSentBy(sentBy);
				window.open(composerPageForId(composerId));
				setSendState('sent');
			})
			.catch((cause) => {
				if (cause instanceof Error) {
					setFailureReason(cause.message);
				} else if (typeof cause === 'string') {
					setFailureReason(cause);
				}
				setSendState('failed');
			});
	}, [itemData]);

	return (
		<>
			<EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
				<EuiFlexItem>
					<ComposerSendStatus
						state={sendState}
						sentBy={sentBy}
						failureReason={failureReason}
					/>
				</EuiFlexItem>
				<EuiFlexItem grow={false}>
					<SendOrVisitInComposerButton
						sendState={sendState}
						composerId={composerId}
						send={send}
					/>
				</EuiFlexItem>
			</EuiFlexGroup>
		</>
	);
};
