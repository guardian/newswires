import { SUPPLIERS_TO_EXCLUDE } from './serverSideConfig.ts/serverSideConfig';

export const reutersBrand = '#fb8023';
export const APBrand = '#eb483b';
export const AFPBrand = '#325aff';
export const PABrand = '#6352ba';
export const AAPBrand = '#013a81';

const allSupplierData: Record<
	string,
	{
		label: string;
		colour: string;
	}
> = {
	REUTERS: { label: 'Reuters', colour: reutersBrand },
	AP: {
		label: 'AP',
		colour: APBrand,
	},
	AAP: {
		label: 'AAP',
		colour: AAPBrand,
	},
	AFP: {
		label: 'AFP',
		colour: AFPBrand,
	},
	PA: {
		label: 'PA',
		colour: PABrand,
	},
	GUAP: {
		label: 'AP (Gu)',
		colour: APBrand,
	},
	GUREUTERS: {
		label: 'Reuters (Gu)',
		colour: reutersBrand,
	},
	COMET: {
		label: 'Comet',
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
