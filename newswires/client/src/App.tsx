import {
	EuiButton,
	EuiButtonEmpty,
	EuiCallOut,
	EuiModal,
	EuiModalBody,
	EuiModalFooter,
	EuiModalHeader,
	EuiModalHeaderTitle,
	EuiPageTemplate,
	EuiProvider,
	EuiText,
} from '@elastic/eui';
import { css, Global } from '@emotion/react';
import { useEffect, useState } from 'react';
import { z } from 'zod/v4';
import { STAGE } from './app-configuration.ts';
import { useKeyboardShortcuts } from './context/KeyboardShortcutsContext.tsx';
import {
	loadOrSetInLocalStorage,
	saveToLocalStorage,
} from './context/localStorage.tsx';
import { useSearch } from './context/SearchContext.tsx';
import { isRestricted } from './dateHelpers.ts';
import { DefaultLayout } from './DefaultLayout.tsx';
import { fontStyles } from './fontStyles.ts';
import { presetLabel } from './presets.ts';
import { TelemetryPixel } from './TelemetryPixel.tsx';
import { TickerLayout } from './TickerLayout.tsx';

export function App() {
	const { config, state } = useSearch();

	const [displayDisclaimer, setDisplayDisclaimer] = useState<boolean>(() =>
		loadOrSetInLocalStorage<boolean>('displayDisclaimer', z.boolean(), true),
	);

	const { handleShortcutKeyUp } = useKeyboardShortcuts();

	const isTickerView = config.ticker;

	const { status } = state;

	const dismissDisclaimer = (persist?: boolean) => {
		setDisplayDisclaimer(false);
		if (persist) {
			saveToLocalStorage<boolean>('displayDisclaimer', false);
		}
	};

	useEffect(() => {
		function shortcutKeyHandler(event: KeyboardEvent) {
			void handleShortcutKeyUp(event);
		}

		window.addEventListener('keyup', shortcutKeyHandler);

		return () => {
			window.removeEventListener('keyup', shortcutKeyHandler);
		};
	}, [handleShortcutKeyUp]);

	useEffect(() => {
		const { preset, supplier } = config.query;

		const displayPreset = !!preset;
		const displaySuppliers = supplier.length > 0;

		if (displayPreset || displaySuppliers) {
			const newswiresPrefix = !isTickerView ? 'Newswires -- ' : '';
			const titlePrefix = supplier.length == 1 ? `${supplier[0]} ` : '';
			const titlePostfix = supplier.length > 1 ? ` ${supplier.join(', ')}` : '';

			document.title = `${newswiresPrefix}${titlePrefix}${preset ? `${presetLabel(preset).toUpperCase()}` : ''}${titlePostfix}`;
		} else {
			document.title = 'Newswires';
		}
	}, [isTickerView, config.query]);

	return (
		<>
			<Global styles={fontStyles} />
			<div style={{ position: 'absolute' }}>
				<TelemetryPixel stage={STAGE} />
			</div>
			<EuiProvider colorMode="light">
				<EuiPageTemplate
					css={css`
						height: 100vh;
					`}
				>
					{displayDisclaimer && (
						<EuiModal
							aria-labelledby="disclaimer-title"
							onClose={() => dismissDisclaimer()}
						>
							<EuiModalHeader>
								<EuiModalHeaderTitle
									title={'Newswires is ready to use'}
									id="disclaimer-title"
								>
									Newswires is ready to use
								</EuiModalHeaderTitle>
							</EuiModalHeader>

							<EuiModalBody>
								<EuiText size="m">
									You&rsquo;re using an early version of Newswires. It&rsquo;s
									fully available, with ongoing improvements. Join the{' '}
									<a
										href="https://chat.google.com/room/AAQASNVMF_A?cls=7"
										target="_blank"
										rel="noreferrer"
									>
										chat group
									</a>{' '}
									to stay updated or share feedback with the{' '}
									<a
										href="https://mail.google.com/mail/?view=cm&fs=1&to=media.and.feeds@theguardian.com&su=Newswires feedback"
										target="_blank"
										rel="noreferrer"
									>
										Media & Feeds team
									</a>
								</EuiText>
							</EuiModalBody>

							<EuiModalFooter>
								<EuiButtonEmpty onClick={() => dismissDisclaimer()}>
									Close
								</EuiButtonEmpty>
								<EuiButton onClick={() => dismissDisclaimer(true)} fill>
									Don&apos;t show again
								</EuiButton>
							</EuiModalFooter>
						</EuiModal>
					)}
					{status === 'offline' && (
						<EuiCallOut
							title="The application is no longer retrieving updates. Data
							synchronization will resume once connectivity is restored."
							color="warning"
							iconType="warning"
							size="s"
						/>
					)}
					{isRestricted(config.query.dateRange?.end) &&
						status !== 'offline' &&
						status !== 'error' && (
							<EuiCallOut
								title="Your current filter settings exclude recent updates. Adjust the
								filter to see the latest data."
								color="warning"
								iconType="warning"
								size="s"
							/>
						)}
					<div
						css={css`
							height: 100%;
							max-height: 100vh;
							background: white;
						`}
					>
						{config.ticker && <TickerLayout />}
						{!config.ticker && <DefaultLayout />}
					</div>
				</EuiPageTemplate>
			</EuiProvider>
		</>
	);
}
