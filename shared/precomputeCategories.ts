import {  AllSports, businessRelatedNewsCodes, businessRelatedTopicCodes, otherTopicCodes, Soccer, sportsRelatedNewsCodes, sportsRelatedTopicCodes } from "./categories";


const containsCode = (categoryCodes: string[], codesToCheck: string[]) => {
    return categoryCodes.some((code) => codesToCheck.includes(code))
}

const noSoccer = (isAllSports: boolean, categoryCodes: string[]) => {
    return isAllSports && !containsCode(categoryCodes, Soccer);
};

const presetCodesMap: { [key: string]: (categoryCodes: string[]) => boolean } = {
    'all-sports': (categoryCodes) => containsCode(categoryCodes, AllSports),
    'no-soccer': (categoryCodes) => noSoccer(containsCode(categoryCodes, AllSports), categoryCodes),
    'sports-related-topic-codes': (categoryCodes) => containsCode(categoryCodes, sportsRelatedTopicCodes),
    'sports-related-news-codes': (categoryCodes) => containsCode(categoryCodes, sportsRelatedNewsCodes),
    'business-related-news-codes': (categoryCodes) => containsCode(categoryCodes, businessRelatedNewsCodes),
    'business-related-topic-codes': (categoryCodes) => containsCode(categoryCodes, businessRelatedTopicCodes),
    'other-topic-codes': (categoryCodes) => containsCode(categoryCodes, otherTopicCodes),
}

export const computePresetCategories = (categoryCodes: string[]) => {
    return Object.entries(presetCodesMap).filter(([_, checkFn]) => {
        return checkFn(categoryCodes);
    }).map(([presetCategory, _]) => presetCategory);
};