/**
 * The list of suppliers to exclude from the list of 'recognised suppliers' that
 * we use to populate the options in the sidebar
 */

export const computeSuppliersToExclude = (
	showGuSuppliers: boolean,
	showPAAPI: boolean,
) => {
	const guSuppliers = showGuSuppliers ? [] : ['GUAP', 'GUREUTERS'];
	const newPaApi = showPAAPI ? [] : ['PAAPI'];
	const dotCopy = ['UNAUTHED_EMAIL_FEED'];
	return [...dotCopy, ...guSuppliers, ...newPaApi];
};
