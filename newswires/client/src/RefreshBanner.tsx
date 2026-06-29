import { EuiHeader, useEuiTheme } from '@elastic/eui';
import { css } from '@emotion/react';
import { getErrorMessage } from '@guardian/libs';
import { useEffect, useState } from 'react';
import { usePageLoadTime } from './context/PageLoadTimeContext.tsx';
import {
	decideRefreshMessage,
	RefreshMessageSchema,
} from './decideRefreshMessage.tsx';
import { pandaFetch } from './panda-session';

export const RefreshBanner = () => {
	const [userFacingMessage, setUserFacingMessage] = useState<
		string | undefined
	>(undefined);
	const { euiTheme } = useEuiTheme();
	const timeThatPageWasLoaded = usePageLoadTime();

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
					setUserFacingMessage(
						decideRefreshMessage({
							timeThatPageWasLoaded: timeThatPageWasLoaded,
							now: Date.now(),
							messageFromServer: parseResult.data,
						}),
					);
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

	if (userFacingMessage) {
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
				<p>{userFacingMessage}</p>
			</EuiHeader>
		);
	}
	return null;
};
