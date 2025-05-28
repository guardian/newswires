import { SUPPLIERS_TO_EXCLUDE } from './app-configuration';

export const reutersBrand = '#fb8023';
export const APBrand = '#eb483b';
export const AFPBrand = '#325aff';
export const PABrand = '#6352ba';
export const AAPBrand = '#013a81';

export const AP = 'AP';

const allSupplierData: Record<
	string,
	{
		label: string;
		shortLabel: string;
		colour: string;
	}
> = {
	REUTERS: { label: 'Reuters', shortLabel: 'Reu', colour: reutersBrand },
	AP: {
		label: 'AP',
		shortLabel: 'AP',
		colour: APBrand,
	},
	AAP: {
		label: 'AAP',
		shortLabel: 'AAP',
		colour: AAPBrand,
	},
	AFP: {
		label: 'AFP',
		shortLabel: 'AFP',
		colour: AFPBrand,
	},
	PA: {
		label: 'PA',
		shortLabel: 'PA',
		colour: PABrand,
	},
	GUAP: {
		label: 'AP (Gu)',
		shortLabel: 'AP (Gu)',
		colour: APBrand,
	},
	GUREUTERS: {
		label: 'Reuters (Gu)',
		shortLabel: 'Reuters (Gu)',
		colour: reutersBrand,
	},
	MINOR_AGENCIES: {
		label: 'Minor',
		shortLabel: 'Min.',
		colour: '#39756a',
	},
};

export function getSupplierInfo(
	supplier: string,
): (typeof allSupplierData)[keyof typeof allSupplierData] | undefined {
	return allSupplierData[supplier.toUpperCase()];
}

export const recognisedSuppliers = Object.keys(allSupplierData).filter(
	(supplier) =>
		!SUPPLIERS_TO_EXCLUDE.map((_) => _.toUpperCase()).includes(
			supplier.toUpperCase(),
		),
);

export const supplierData = Object.fromEntries(
	Object.entries(allSupplierData).filter(([supplier, _]) =>
		recognisedSuppliers.includes(supplier),
	),
);
