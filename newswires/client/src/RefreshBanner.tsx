import { EuiHeader, useEuiTheme } from '@elastic/eui';
import { css } from '@emotion/react';
import { getErrorMessage } from '@guardian/libs';
import { useEffect, useState } from 'react';
import z from 'zod/v4';
import { pandaFetch } from './panda-session';

const RefreshMessageSchema = z.union([
	z.object({
		message: z.string(),
		from: z.string(),
		until: z.string().optional(),
	}),
	z.object({ hasMessage: z.literal(false) }),
]);

type RefreshMessage = z.infer<typeof RefreshMessageSchema>;

export function decideRefreshMessage({
	timeThatPageWasLoaded,
	now,
	messageFromServer,
}: {
	timeThatPageWasLoaded: number;
	now: number;
	messageFromServer: RefreshMessage | undefined;
}): string | undefined {
	if (messageFromServer === undefined || 'hasMessage' in messageFromServer) {
		return undefined;
	}
	const { message, from, until } = messageFromServer;
	const fromTime = new Date(from).getTime();
	if (
		timeThatPageWasLoaded < fromTime &&
		now >= fromTime &&
		(!until || now < new Date(until).getTime())
	) {
		return message;
	}
	return undefined;
}

export const RefreshBanner = ({
	timeThatPageWasLoaded,
}: {
	timeThatPageWasLoaded: number;
}) => {
	const [messageFromServer, setMessageFromServer] = useState<
		RefreshMessage | undefined
	>(undefined);
	const { euiTheme } = useEuiTheme();

	useEffect(() => {
		const abortController = new AbortController();

		const pollingInterval = setInterval(() => {
			pandaFetch('/api/client-refresh-message', {
				signal: abortController.signal,
			})
				.then((res) => {
					if (!res.ok) {
						throw new Error(
							`Failed to check if page is stale: ${res.statusText}`,
						);
					}
					return res.json();
				})
				.then((data) => {
					const parseResult = RefreshMessageSchema.safeParse(data);
					if (!parseResult.success) {
						throw new Error(
							`Received invalid data when checking if page is stale: ${JSON.stringify(
								parseResult.error,
							)}`,
						);
					}
					setMessageFromServer(parseResult.data);
				})
				.catch((e) => {
					if (e instanceof Error && e.name === 'AbortError') {
						// we don't want to treat aborts as errors
						return;
					} else {
						console.error(
							'Error checking if page is stale:',
							getErrorMessage(e),
						);
					}
				});
		}, 30000);

		return () => {
			abortController.abort();
			clearInterval(pollingInterval);
		};
	}, [timeThatPageWasLoaded]);

	const now = Date.now();

	const maybeUserFacingMessage = decideRefreshMessage({
		timeThatPageWasLoaded: timeThatPageWasLoaded,
		now,
		messageFromServer,
	});

	if (maybeUserFacingMessage) {
		return (
			<EuiHeader
				position="fixed"
				css={css`
					background-color: ${euiTheme.colors.warning};
					color: ${euiTheme.colors.textHeading};
					padding: 10px;
					top: 10px;
					bottom: 10px;
					text-align: center;
					font-size: 16px;
					font-weight: 400;
					width: 100%;
					align-items: center;
					justify-content: center;
					gap: 10px;

					& p {
						text-align: center;
					}
				`}
			>
				<p>{maybeUserFacingMessage}</p>
			</EuiHeader>
		);
	}
	return null;
};
