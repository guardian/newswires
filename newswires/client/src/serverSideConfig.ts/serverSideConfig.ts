export const SUPPLIERS_TO_EXCLUDE = window.configuration.switches
	.ShowGuSuppliers
	? []
	: ['GUAP', 'GUREUTERS'];

export const stage = window.configuration.stage;
