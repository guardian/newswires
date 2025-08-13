const CategoryCodes = {
    UK: {
        PA: ['paCat:HHH', 'paCat:SCN', 'paCat:IFN', 'paCat:QFF', 'paCat:PPP'],
        MINOR_AGENCIES: ['N2:GB']
    }
}

const allUK: Record<Supplier, SearchCriteria[]> = {
    'PA' :[{
            categoryCodes: CategoryCodes.UK.PA,
            categoryCodesExclude: [],
            keywords: [],
            keywordsExclude: []
        }],
    'MINOR_AGENCIES': [{
            categoryCodes: CategoryCodes.UK.MINOR_AGENCIES,
            categoryCodesExclude: [],
            keywords: [],
            keywordsExclude: []
        }],
}
const presets: Record<string, Record<Supplier, SearchCriteria[]>> = {
    'all-uk': allUK
}
export function classification(content: ProcessedContent): string[] {
   return Object.entries(presets).reduce<string[]>((acc, [preset, supplierToSearchCriteria]) => {
       if(matchesPreset(content, supplierToSearchCriteria)) {
           acc.push(preset)
       }
       return acc
   }, [])
}

export function matchesPreset(content: ProcessedContent, preset: Record<Supplier, SearchCriteria[]>): boolean {
    const supplier = content.supplier;
    const searchCriteria = preset[supplier] || [];
    return searchCriteria.reduce((bool, criteria) => matchesSearchCriteria(content, criteria) || bool, false);
}

export function matchesSearchCriteria(content: ProcessedContent, criteria: SearchCriteria): boolean {
    const matchesCategory = criteria.categoryCodes.length === 0 || content.categoryCodes.some(code => criteria.categoryCodes.includes(code));
    const matchesKeywords = criteria.keywords.length === 0 || content.keywords.some(keyword => criteria.keywords.includes(keyword));
    return matchesCategory && matchesKeywords;
}
export type Supplier = 'PA' | 'MINOR_AGENCIES' | 'SUPPLIER_S';

export type ProcessedContent = {
    categoryCodes: string[],
    supplier: Supplier,
    keywords: string[]
}
export type SearchCriteria = {
  categoryCodes: string[];
  categoryCodesExclude: string[];
  keywords: string[];
  keywordsExclude: string[];
}




