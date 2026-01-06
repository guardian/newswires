import {
	EuiButtonIcon,
	EuiFlexGroup,
	EuiFlexItem,
	EuiLoadingSpinner,
	EuiText,
} from '@elastic/eui';
import { getErrorMessage } from '@guardian/libs';
import { useCallback, useState } from 'react';
import { useTelemetry } from './context/TelemetryContext.tsx';
import { useUserSettings } from './context/UserSettingsContext.tsx';
import { convertToLocalDate } from './dateHelpers.ts';
import { ComposerLogo } from './icons/ComposerLogo.tsx';
import { InCopyLogo } from './icons/InCopyLogo.tsx';
import { composerPageForId, sendToComposer } from './send-to-composer.ts';
import { sendToIncopy } from './send-to-incopy.ts';
import type { ToolLink, WireData } from './sharedTypes.ts';
import { Tooltip } from './Tooltip.tsx';

type SendState = 'sending' | 'sent' | 'failed' | 'unsent';

const SendOrVisitInComposerButton = ({
	headline,
	itemData,
	addToolLink,
}: {
	headline: string | undefined;
	itemData: WireData;
	addToolLink: (toolLink: ToolLink) => void;
}) => {
	const { sendTelemetryEvent } = useTelemetry();
	const previousSend = itemData.toolLinks?.find(
		(toolLink) => toolLink.tool === 'composer',
	);
	const [composerId, setComposerId] = useState<string | undefined>(
		previousSend?.ref,
	);
	const [failureReason, setFailureReason] = useState<string | undefined>();

	const [sendState, setSendState] = useState<SendState>(
		previousSend?.ref ? 'sent' : 'unsent',
	);

	const send = useCallback(() => {
		setSendState('sending');

		sendToComposer(headline, itemData)
			.then(({ composerId }) => {
				setComposerId(composerId);
				window.open(composerPageForId(composerId));
				setSendState('sent');
				addToolLink({
					// we don't know the actual id, so guess a random number unlikely to conflict, until we refresh and load data from server
					id: Math.floor(Math.random() * 0xfffffffff),
					wireId: itemData.id,
					tool: 'composer',
					sentBy: 'you',
					sentAt: new Date().toISOString(),
					ref: composerPageForId(composerId),
				});
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
	}, [headline, itemData, sendTelemetryEvent, addToolLink]);

	if (sendState === 'sent' && composerId) {
		return (
			<Tooltip tooltipContent="Open existing document in Composer">
				<EuiButtonIcon
					href={composerPageForId(composerId)}
					target="_blank"
					iconType={ComposerLogo}
					size="s"
				>
					Open in Composer
				</EuiButtonIcon>
			</Tooltip>
		);
	}
	if (sendState === 'sent' || sendState === 'failed') {
		return (
			<>
				<EuiButtonIcon iconType="error" disabled>
					Send to Composer failed
				</EuiButtonIcon>
				<EuiText size="s" color="danger">
					{failureReason}
				</EuiText>
			</>
		);
	}
	if (sendState === 'sending') {
		return <EuiLoadingSpinner size="l" />;
	}

	return (
		<Tooltip tooltipContent="Send wire to Composer">
			<EuiButtonIcon
				onClick={send}
				iconType={ComposerLogo}
				size="s"
				aria-label="Send wire to Composer"
			>
				Send to Composer
			</EuiButtonIcon>
		</Tooltip>
	);
};

export const ToolSendReport = ({ toolLink }: { toolLink: ToolLink }) => {
	const sentAt = convertToLocalDate(toolLink.sentAt);

	return (
		<li key={toolLink.id}>
			<EuiText size="xs">
				Sent to {toolLink.tool} by {toolLink.sentBy}
				{' • '}
				<Tooltip tooltipContent={sentAt.format()}>{sentAt.fromNow()}</Tooltip>
			</EuiText>
		</li>
	);
};

const SendToIncopyButton = ({
	itemData,
	addToolLink,
}: {
	itemData: WireData;
	addToolLink: (toolLink: ToolLink) => void;
}) => {
	return (
		<Tooltip tooltipContent="Send wire to InCopy">
			<EuiButtonIcon
				onClick={() =>
					void sendToIncopy(itemData.id).then(() => {
						addToolLink({
							// we don't know the actual id, so guess a random number unlikely to conflict, until we refresh and load data from server
							id: Math.floor(Math.random() * 0xfffffffff),
							wireId: itemData.id,
							tool: 'incopy',
							sentBy: 'you',
							sentAt: new Date().toISOString(),
						});
					})
				}
				target="_blank"
				size="s"
				rel="noreferrer"
				iconType={InCopyLogo}
				aria-label="Send wire to InCopy"
			>
				Send to InCopy
			</EuiButtonIcon>
		</Tooltip>
	);
};

export const ToolsConnection = ({
	headline,
	itemData,
	addToolLink,
}: {
	headline: string | undefined;
	itemData: WireData;
	addToolLink: (toolLink: ToolLink) => void;
}) => {
	const { showIncopyImport } = useUserSettings();

	return (
		<>
			<EuiFlexItem grow={false}>
				<EuiFlexGroup direction="row" wrap gutterSize="s" alignItems="center">
					<SendOrVisitInComposerButton
						headline={headline}
						itemData={itemData}
						addToolLink={addToolLink}
					/>

					{showIncopyImport && (
						<SendToIncopyButton itemData={itemData} addToolLink={addToolLink} />
					)}
				</EuiFlexGroup>
			</EuiFlexItem>
			{itemData.toolLinks?.length ? (
				<EuiFlexItem grow={false}>
					<ul>
						{itemData.toolLinks.map((toolLink) => (
							<ToolSendReport toolLink={toolLink} key={toolLink.id} />
						))}
					</ul>
				</EuiFlexItem>
			) : (
				<></>
			)}
		</>
	);
};
