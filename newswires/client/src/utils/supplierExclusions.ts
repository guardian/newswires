/**
 * The list of suppliers to exclude from the list of 'recognised suppliers' that
 * we use to populate the options in the sidebar
 */

export const computeSuppliersToExclude = (showGuSuppliers: boolean) => {
	const guSuppliers = showGuSuppliers ? [] : ['GUAP', 'GUREUTERS'];
	const dotCopy = ['UNAUTHED_EMAIL_FEED'];
	const paAPI = ['PAAPI'];
	return [...dotCopy, ...paAPI, ...guSuppliers];
};
