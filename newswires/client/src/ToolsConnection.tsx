import {
	EuiButton,
	EuiButtonIcon,
	EuiIcon,
	EuiListGroup,
	EuiListGroupItem,
	EuiLoadingSpinner,
	EuiPopover,
	EuiScreenReaderOnly,
	EuiText,
	useEuiTheme,
} from '@elastic/eui';
import { css } from '@emotion/react';
import { getErrorMessage } from '@guardian/libs';
import moment from 'moment';
import { useCallback, useState } from 'react';
import { useTelemetry } from './context/TelemetryContext.tsx';
import { useUserSettings } from './context/UserSettingsContext.tsx';
import { convertToLocalDate } from './dateHelpers.ts';
import { ComposerLogo } from './icons/ComposerLogo.tsx';
import { InCopyLogo } from './icons/InCopyLogo.tsx';
import { SendIcon } from './icons/SendIcon.tsx';
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
	const [isOpen, setIsOpen] = useState(false);
	const [errorMessages, setErrorMessages] = useState<
		Array<{ reason: string; timestamp: moment.Moment }>
	>([]);
	const { sendTelemetryEvent } = useTelemetry();
	const previousSend = itemData.toolLinks?.find(
		(toolLink) => toolLink.tool === 'composer',
	);
	const [composerId, setComposerId] = useState<string | undefined>(
		previousSend?.ref,
	);

	const [sendState, setSendState] = useState<SendState>(
		previousSend?.ref ? 'sent' : 'unsent',
	);

	const reportError = useCallback((errorMessage: string) => {
		setErrorMessages((prevReports) => [
			...prevReports.filter((_) => _.reason !== errorMessage),
			{ reason: errorMessage, timestamp: moment.utc() },
		]);
	}, []);

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
				setErrorMessages([]);
				sendTelemetryEvent('NEWSWIRES_SEND_TO_COMPOSER', {
					composerId,
					itemId: itemData.id,
					status: 'success',
				});
			})
			.catch((cause) => {
				reportError(getErrorMessage(cause));

				sendTelemetryEvent('NEWSWIRES_SEND_TO_COMPOSER', {
					itemId: itemData.id,
					status: 'failed',
				});
				setSendState('failed');
			});
	}, [headline, itemData, addToolLink, sendTelemetryEvent, reportError]);

	const icon =
		sendState === 'sending' ? <EuiLoadingSpinner size="s" /> : <ComposerLogo />;

	const popoverButton = (
		<EuiButtonIcon
			onClick={() => setIsOpen(!isOpen)}
			iconType={() => icon}
			size="s"
			aria-label="View Composer integrations"
		>
			Composer integration
		</EuiButtonIcon>
	);

	function decideIntegrationButton() {
		if (sendState === 'sent' && composerId) {
			return (
				<Tooltip tooltipContent="Open existing document in Composer">
					<EuiButton
						href={composerPageForId(composerId)}
						target="_blank"
						iconType={ComposerLogo}
						size="s"
					>
						Open in Composer
					</EuiButton>
				</Tooltip>
			);
		}
		if (sendState === 'sent' || sendState === 'failed') {
			return (
				<>
					<EuiButton
						iconType="refresh"
						size="s"
						color={'danger'}
						onClick={send}
					>
						Send to Composer failed. Click to retry.
					</EuiButton>
				</>
			);
		}
		if (sendState === 'sending') {
			return (
				<EuiButton
					iconType={() => <EuiLoadingSpinner />}
					size="s"
					disabled={true}
				>
					Sending...
				</EuiButton>
			);
		}

		return (
			<EuiButton
				iconType={SendIcon}
				onClick={() => {
					void send();
				}}
			>
				Send to Composer
			</EuiButton>
		);
	}

	return (
		<EuiPopover
			button={popoverButton}
			isOpen={isOpen}
			closePopover={() => {
				setIsOpen(false);
			}}
			aria-labelledby="composer-popover-id"
		>
			<EuiScreenReaderOnly>
				<h1 id="composer-popover-id">Composer integration</h1>
			</EuiScreenReaderOnly>
			<EuiListGroup flush={true}>
				<EuiListGroupItem label={decideIntegrationButton()}></EuiListGroupItem>
				{errorMessages.map((errorMessage) => (
					<EuiListGroupItem
						key={errorMessage.timestamp.format()}
						icon={<EuiIcon type="warning" color="danger" />}
						label={
							<EuiText size="xs" color="danger">
								Error: {errorMessage.reason}{' '}
								<Tooltip tooltipContent={errorMessage.timestamp.format()}>
									{errorMessage.timestamp.fromNow()}
								</Tooltip>
							</EuiText>
						}
						wrapText={true}
					/>
				))}
				{itemData.toolLinks
					?.filter((toolLink) => toolLink.tool === 'composer')
					.map((toolLink) => (
						<EuiListGroupItem
							icon={<EuiIcon type="check" />}
							label={
								<EuiText size="xs">
									Sent to composer by {toolLink.sentBy}
									{' • '}
									<Tooltip
										tooltipContent={convertToLocalDate(
											toolLink.sentAt,
										).format()}
									>
										{convertToLocalDate(toolLink.sentAt).fromNow()}
									</Tooltip>
								</EuiText>
							}
							key={toolLink.id}
						/>
					))}
			</EuiListGroup>
		</EuiPopover>
	);
};

export const ToolSendReport = ({
	toolLink,
	showIcon = false,
}: {
	toolLink: ToolLink;
	showIcon?: boolean;
}) => {
	const theme = useEuiTheme();

	const sentAt = convertToLocalDate(toolLink.sentAt);

	const iconType = toolLink.tool === 'composer' ? ComposerLogo : InCopyLogo;

	return (
		<>
			{showIcon && (
				<span
					css={css`
						color: ${theme.euiTheme.colors.backgroundFilledAccent};
					`}
				>
					<EuiIcon type={iconType} size="s" />
				</span>
			)}
			<EuiText size="xs">
				Sent to {toolLink.tool} by {toolLink.sentBy}
				{' • '}
				<Tooltip tooltipContent={sentAt.format()}>{sentAt.fromNow()}</Tooltip>
			</EuiText>
		</>
	);
};

const SendToIncopyButton = ({
	itemData,
	toolLinks,
	addToolLink,
}: {
	itemData: WireData;
	toolLinks: ToolLink[];
	addToolLink: (toolLink: ToolLink) => void;
}) => {
	const [isOpen, setIsOpen] = useState(false);

	const incopyButton = (
		<EuiButtonIcon
			onClick={() => setIsOpen(true)}
			target="_blank"
			size="m"
			rel="noreferrer"
			iconType={InCopyLogo}
			aria-label="Send wire to InCopy"
		>
			Send to InCopy
		</EuiButtonIcon>
	);

	return (
		<EuiPopover
			button={incopyButton}
			isOpen={isOpen}
			closePopover={() => {
				setIsOpen(false);
			}}
			aria-labelledby="incopy-popover-id"
		>
			<EuiScreenReaderOnly>
				<h1 id="incopy-popover-id">InCopy integration</h1>
			</EuiScreenReaderOnly>
			<EuiListGroup flush={true}>
				<EuiListGroupItem
					label={
						<EuiButton
							iconType={SendIcon}
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
						>
							Send to InCopy
						</EuiButton>
					}
				></EuiListGroupItem>
				{toolLinks.map((toolLink) => (
					<EuiListGroupItem
						icon={<EuiIcon type="clockCounter" />}
						label={<ToolSendReport toolLink={toolLink} />}
						key={toolLink.id}
					/>
				))}
			</EuiListGroup>
		</EuiPopover>
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
			<SendOrVisitInComposerButton
				headline={headline}
				itemData={itemData}
				addToolLink={addToolLink}
			/>

			{showIncopyImport && (
				<SendToIncopyButton
					itemData={itemData}
					toolLinks={(itemData.toolLinks ?? []).filter(
						(toolLink) => toolLink.tool === 'incopy',
					)}
					addToolLink={addToolLink}
				/>
			)}
		</>
	);
};
