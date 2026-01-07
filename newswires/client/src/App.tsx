import {
	EuiButton,
	EuiButtonEmpty,
	EuiButtonIcon,
	EuiCallOut,
	EuiForm,
	EuiFormRow,
	EuiModal,
	EuiModalBody,
	EuiModalFooter,
	EuiModalHeader,
	EuiModalHeaderTitle,
	EuiPageTemplate,
	EuiProvider,
	EuiSwitch,
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
import { useSettingsSwitches } from './SetttingsSwitches.tsx';
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
		const displaySuppliers = !!supplier && supplier.length > 0;

		if (displayPreset || displaySuppliers) {
			const newswiresPrefix = !isTickerView ? 'Newswires -- ' : '';
			const titlePrefix = supplier!.length == 1 ? `${supplier![0]} ` : '';
			const titlePostfix =
				supplier!.length > 1 ? ` ${supplier!.join(', ')}` : '';

			document.title = `${newswiresPrefix}${titlePrefix}${preset ? `${presetLabel(preset).toUpperCase()}` : ''}${titlePostfix}`;
		} else {
			document.title = 'Newswires';
		}
	}, [isTickerView, config.query]);

	const switches = useSettingsSwitches();

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
									Welcome to Newswires
								</EuiModalHeaderTitle>
							</EuiModalHeader>
							<EuiModalBody>
								<EuiText size="m">
									As a new user of newswires, you may want to customise some
									features of the application. If you want to revise any of
									these later, you&apos;ll find them in the settings control:{' '}
									<EuiButtonIcon
										aria-label="Settings"
										display="base"
										size="s"
										iconType={'gear'}
									/>{' '}
									on the top right.
									<div
										css={css`
											margin: 8px 0;
										`}
									>
										<EuiForm>
											{switches.map(({ id, label, checked, onChange }) => (
												<div style={{ padding: 4 }} key={id}>
													<EuiFormRow hasChildLabel={true}>
														<EuiSwitch
															name="switch"
															id={id}
															label={label}
															checked={checked}
															onChange={onChange}
														/>
													</EuiFormRow>
												</div>
											))}
										</EuiForm>
									</div>
									Join the{' '}
									<a
										href="https://chat.google.com/room/AAQASNVMF_A?cls=7"
										target="_blank"
										rel="noreferrer"
									>
										chat group
									</a>{' '}
									to stay updated with new features or share feedback with the
									development team.
								</EuiText>
							</EuiModalBody>

							<EuiModalFooter>
								<EuiButtonEmpty onClick={() => dismissDisclaimer()}>
									Close
								</EuiButtonEmpty>
								<EuiButton onClick={() => dismissDisclaimer(true)} fill>
									Save Settings
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
