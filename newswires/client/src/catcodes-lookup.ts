import { lookupTables } from './category-code-lookup-tables';

const _qCodePrefixesLookup = {
	medtop: ['IPTC MediaTopics'],
	subj: ['IPTC NewsCodes', 'IPTC MediaTopics'],
	a1312cat: ['A1312 CatCodes'],
	n2000: ['N2000 Codes'],
	n2: ['N2000 Codes'],
};

export function lookupCatCodesWideSearch(catCode: string): string[] {
	return lookupTables
		.map((table) => {
			if (table.lookup[catCode]) {
				return `${table.lookup[catCode]} (${table.name})`;
			}
			if (table.lookup[catCode.toUpperCase()]) {
				return `${table.lookup[catCode.toUpperCase()]} (${table.name})`;
			}
			if (table.lookup[catCode.toLowerCase()]) {
				return `${table.lookup[catCode.toLowerCase()]} (${table.name})`;
			}
			if (catCode.includes(':') && table.lookup[catCode.split(':')[1]]) {
				return `${table.lookup[catCode.split(':')[1]]} (${table.name})`;
			}
		})
		.filter((item): item is string => !!item);
}
