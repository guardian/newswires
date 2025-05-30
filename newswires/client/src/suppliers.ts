import { SUPPLIERS_TO_EXCLUDE } from './app-configuration';
import { type SupplierInfo, type SupplierName } from './sharedTypes';

export const reutersBrand = '#fb8023';
export const APBrand = '#eb483b';
export const AFPBrand = '#325aff';
export const PABrand = '#6352ba';
export const AAPBrand = '#013a81';

export const AP: SupplierName = 'AP';

export const supplierData: SupplierInfo[] = [
	{
		name: 'REUTERS',
		label: 'Reuters',
		shortLabel: 'Reu',
		colour: reutersBrand,
	},
	{ name: 'AP', label: 'AP', shortLabel: 'AP', colour: APBrand },
	{ name: 'AAP', label: 'AAP', shortLabel: 'AAP', colour: AAPBrand },
	{ name: 'AFP', label: 'AFP', shortLabel: 'AFP', colour: AFPBrand },
	{ name: 'PA', label: 'PA', shortLabel: 'PA', colour: PABrand },
	{ name: 'GUAP', label: 'AP (Gu)', shortLabel: 'AP (Gu)', colour: APBrand },
	{
		name: 'GUREUTERS',
		label: 'Reuters (Gu)',
		shortLabel: 'Reuters (Gu)',
		colour: reutersBrand,
	},
	{
		name: 'MINOR_AGENCIES',
		label: 'Minor',
		shortLabel: 'Min.',
		colour: '#39756a',
	},
] as const;

export const UNKNOWN_SUPPLIER: SupplierInfo = {
	name: 'UNKNOWN',
	label: 'Unknown',
	shortLabel: 'Unknown',
	colour: '#000000',
};

export const recognisedSuppliers: SupplierInfo[] = supplierData.filter(
	(supplier) =>
		!SUPPLIERS_TO_EXCLUDE.map((_) => _.toUpperCase()).includes(
			supplier.name.toUpperCase(),
		),
);
