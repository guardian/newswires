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
				ShowPAAPI: false,
			},
			stage: 'test',
			sendTelemetryAsDev: true,
			gitCommitId: 'test-commit-id',
		}
	: window.configuration;

const showGuSuppliers = configLookup.switches.ShowGuSuppliers;
const showPAAPI = configLookup.switches.ShowPAAPI;

/**
 * The list of suppliers to exclude from the list of 'recognised suppliers' that
 * we use to populate the options in the sidebar
 */

const computeSuppliersToExclude = (
	showGuSuppliers: boolean,
	showPAAPI: boolean,
) => {
	const guSuppliers = showGuSuppliers ? [] : ['GUAP', 'GUREUTERS'];
	const newPaApi = showPAAPI ? [] : ['PAAPI'];
	const dotCopy = ['UNAUTHED_EMAIL_FEED'];
	return [...dotCopy, ...guSuppliers, ...newPaApi];
};

export const SUPPLIERS_TO_EXCLUDE = computeSuppliersToExclude(
	showGuSuppliers,
	showPAAPI,
);

export const STAGE = configLookup.stage;

export const SEND_TELEMETRY_AS_DEV = configLookup.sendTelemetryAsDev;

export const GIT_COMMIT_ID = configLookup.gitCommitId;
