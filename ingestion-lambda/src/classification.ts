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
   const supplier = content.supplier;
   const searchCriteria = allUK[supplier] || [];
   const matches = searchCriteria.reduce((bool, criteria) => matchesSearchCriteria(content, criteria) || bool, false);
   if(matches) {
    return ['all-uk']
   }
   return []
}

export function matchesSearchCriteria(content: ProcessedContent, criteria: SearchCriteria): boolean {
    const matchesCategory = criteria.categoryCodes.length === 0 || content.categoryCodes.some(code => criteria.categoryCodes.includes(code));
    const matchesKeywords = criteria.keywords.length === 0 || content.keywords.some(keyword => criteria.keywords.includes(keyword));
    return matchesCategory && matchesKeywords;
}
type Supplier = 'PA' | 'MINOR_AGENCIES';

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




