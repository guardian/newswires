const isNode = typeof process !== 'undefined';
const isJest = isNode && process.env.JEST_WORKER_ID !== undefined;

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- if the code isn't
if (isJest === undefined && !window.configuration) {
	throw new Error('window object is defined, but window.configuration is not');
}

const configLookup = isJest
	? {
			switches: {
				ShowGuSuppliers: false,
			},
			stage: 'test',
		}
	: window.configuration;

const showGuSuppliers = configLookup.switches.ShowGuSuppliers;

export const SUPPLIERS_TO_EXCLUDE = showGuSuppliers
	? []
	: ['GUAP', 'GUREUTERS'];

export const stage = configLookup.stage;
