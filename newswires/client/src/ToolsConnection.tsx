import {
	EuiButton,
	EuiFlexGroup,
	EuiFlexItem,
	EuiLoadingSpinner,
	EuiText,
} from '@elastic/eui';
import { css } from '@emotion/react';
import { useCallback, useState } from 'react';
import { getErrorMessage } from '../../../shared/getErrorMessage.ts';
import { useTelemetry } from './context/TelemetryContext.tsx';
import { convertToLocalDate } from './dateHelpers.ts';
import composerLogoUrl from './icons/composer.svg';
import incopyLogoUrl from './icons/incopy.svg';
import { composerPageForId, sendToComposer } from './send-to-composer.ts';
import type { ToolLink, WireData } from './sharedTypes.ts';
import { Tooltip } from './Tooltip.tsx';

type SendState = 'sending' | 'sent' | 'failed' | 'unsent';

const SendOrVisitInComposerButton = ({
	itemData,
	addToolLink,
}: {
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

	const style = css`
		flex-basis: fit-content;
		flex-shrink: 0;
	`;
	const send = useCallback(() => {
		setSendState('sending');

		sendToComposer(itemData)
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
	}, [itemData, sendTelemetryEvent, addToolLink]);

	if (sendState === 'sent' && composerId) {
		return (
			<EuiButton
				href={composerPageForId(composerId)}
				target="_blank"
				iconType="link"
				css={style}
			>
				Open in Composer
			</EuiButton>
		);
	}
	if (sendState === 'sent' || sendState === 'failed') {
		return (
			<>
				<EuiButton iconType="error" disabled css={style}>
					Send to Composer failed
				</EuiButton>
				<EuiText size="xs" color="danger">
					{failureReason}
				</EuiText>
			</>
		);
	}
	if (sendState === 'sending') {
		return <EuiLoadingSpinner size="l" />;
	}

	return (
		// TODO why does the icon have a black fill? Why not the primary colour, like the native eui icons?
		<EuiButton onClick={send} iconType={composerLogoUrl} css={style}>
			Send to Composer
		</EuiButton>
	);
};

const ToolSendReport = ({ toolLink }: { toolLink: ToolLink }) => {
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

export const ToolsConnection = ({
	itemData,
	addToolLink,
}: {
	itemData: WireData;
	addToolLink: (toolLink: ToolLink) => void;
}) => {
	return (
		<>
			<EuiFlexGroup direction="column" gutterSize="s">
				<EuiFlexItem grow={false}>
					<EuiFlexGroup direction="row" wrap gutterSize="s">
						<SendOrVisitInComposerButton
							itemData={itemData}
							addToolLink={addToolLink}
						/>

						<EuiButton
							href={`/api/item/${itemData.id}/incopy`}
							onClick={() =>
								addToolLink({
									// we don't know the actual id, so guess a random number unlikely to conflict, until we refresh and load data from server
									id: Math.floor(Math.random() * 0xfffffffff),
									wireId: itemData.id,
									tool: 'incopy',
									sentBy: 'you',
									sentAt: new Date().toISOString(),
								})
							}
							target="_blank"
							css={css`
								flex-basis: fit-content;
								flex-shrink: 0;

								/* I hate EUI's default to center the text & icon in the button, so the icons don't align :yuck: */
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
			</EuiFlexGroup>
		</>
	);
};
