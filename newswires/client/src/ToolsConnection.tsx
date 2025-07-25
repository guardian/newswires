import {
	EuiButton,
	EuiFlexGroup,
	EuiFlexItem,
	EuiLoadingSpinner,
	EuiSpacer,
	EuiText,
	EuiTitle,
} from '@elastic/eui';
import { css } from '@emotion/react';
import { useCallback, useState } from 'react';
import { getErrorMessage } from '../../../shared/getErrorMessage.ts';
import { useTelemetry } from './context/TelemetryContext.tsx';
import composerLogoUrl from './icons/composer.svg';
import incopyLogoUrl from './icons/incopy.svg';
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
	if (state === 'sent' && sentBy) {
		return (
			<p>
				Sent to Composer by: <a href={`mailto:${sentBy}`}>{sentBy}</a>
			</p>
		);
	}
	if (state === 'sent') {
		return <p>Sent to Composer</p>;
	}
	if (state === 'failed') {
		return (
			<p>Failed to send to Composer: {failureReason ?? 'unknown failure'}</p>
		);
	}
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
	if (sendState === 'sent' && composerId) {
		return (
			<EuiButton
				href={composerPageForId(composerId)}
				target="_blank"
				iconType="link"
			>
				Open in Composer
			</EuiButton>
		);
	}
	if (sendState === 'sent' || sendState === 'failed') {
		return <EuiButton iconType="error">Send to Composer failed</EuiButton>;
	}
	if (sendState === 'sending') {
		return <EuiLoadingSpinner size="l" />;
	}

	return (
		// TODO why does the icon have a black fill? Why not the primary colour, like the native eui icons?
		<EuiButton onClick={send} iconType={composerLogoUrl}>
			Send to Composer
		</EuiButton>
	);
};

export const ToolsConnection = ({ itemData }: { itemData: WireData }) => {
	const { sendTelemetryEvent } = useTelemetry();
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
				sendTelemetryEvent('NEWSWIRES_SEND_TO_COMPOSER', {
					composerId,
					itemId: itemData.id,
					status: 'success',
				});
			})
			.catch((cause) => {
				setFailureReason(getErrorMessage(cause));

				sendTelemetryEvent('NEWSWIRES_SEND_TO_COMPOSER', {
					itemId: itemData.id,
					status: 'failed',
				});
				setSendState('failed');
			});
	}, [itemData, sendTelemetryEvent]);

	const people = ['Mateusz Karpow', 'Andrew Nowak', 'Pete Faulconbridge'];

	return (
		<>
			<EuiFlexGroup justifyContent="spaceBetween">
				<EuiFlexItem grow={false}>
					{/*<ComposerSendStatus*/}
					{/*	state={sendState}*/}
					{/*	sentBy={sentBy}*/}
					{/*	failureReason={failureReason}*/}
					{/*/>*/}

					<EuiTitle>
						<h3>Tools</h3>
					</EuiTitle>
					<EuiSpacer size="xs" />

					<ul>
						{people.map((name) => (
							<li key={name}>
								<EuiText size="xs">Sent by {name} at 24 Jul 2025 16:19</EuiText>
							</li>
						))}
					</ul>
				</EuiFlexItem>

				<EuiFlexItem grow={false}>
					<SendOrVisitInComposerButton
						sendState={sendState}
						composerId={composerId}
						send={send}
					/>

					<EuiSpacer size="s"></EuiSpacer>

					<EuiButton
						href={`/api/item/${itemData.id}/incopy`}
						target="_blank"
						// I hate EUI's default to center the text & icon in the button, so the icons don't align :yuck:
						css={css`
							& > span {
								justify-content: start;
							}
							& > span > span {
								width: 100%;
								justify-items: center;
							}
						`}
						rel="noreferrer"
						iconType={incopyLogoUrl}
					>
						Send to InCopy
					</EuiButton>
				</EuiFlexItem>
			</EuiFlexGroup>
		</>
	);
};
