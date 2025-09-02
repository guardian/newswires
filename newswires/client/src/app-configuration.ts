import type { AppConfiguration } from './windowConfigType';

const isNode = typeof process !== 'undefined';
const isJest = isNode && process.env.JEST_WORKER_ID !== undefined;

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- if the code isn't running in jest, window should be defined
if (!isJest && !window.configuration) {
	throw new Error('window object is defined, but window.configuration is not');
}

const configLookup: AppConfiguration = isJest
	? {
			switches: {
				ShowGuSuppliers: false,
			},
			stage: 'test',
			sendTelemetryAsDev: true,
			gitCommitId: 'test-commit-id',
		}
	: window.configuration;

const showGuSuppliers = configLookup.switches.ShowGuSuppliers;

/**
 * The list of suppliers to exclude from the list of 'recognised suppliers' that
 * we use to populate the options in the sidebar
 */
export const SUPPLIERS_TO_EXCLUDE = showGuSuppliers
	? ['UNAUTHED_EMAIL_FEED']
	: ['UNAUTHED_EMAIL_FEED', 'GUAP', 'GUREUTERS'];

export const STAGE = configLookup.stage;

export const SEND_TELEMETRY_AS_DEV = configLookup.sendTelemetryAsDev;

export const GIT_COMMIT_ID = configLookup.gitCommitId;
