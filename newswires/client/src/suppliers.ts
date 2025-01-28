export const reutersBrand = '#fb8023';
export const APBrand = '#eb483b';
export const AFPBrand = '#325aff';
export const PABrand = '#6352ba';
export const AAPBrand = '#013a81';

export const supplierData: Record<
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
): (typeof supplierData)[keyof typeof supplierData] | undefined {
	return supplierData[supplier.toUpperCase()];
}

export const recognisedSuppliers = Object.keys(supplierData);
