import {  AllSports, Soccer, sportsRelatedNewsCodes, sportsRelatedTopicCodes } from "./categories";


const containsCode = (categoryCodes: string[], codesToCheck: string[]) => {
    return categoryCodes.filter((code) => codesToCheck.includes(code)).length > 0
}

const noSoccer = (isAllSports: boolean, categoryCodes: string[]) => {
    return isAllSports && !containsCode(categoryCodes, Soccer);
};


export const computePresetCategories = (categoryCodes: string[]) => {
    const presetCategories: string[] = [];
    if(containsCode(categoryCodes, AllSports)) {
        presetCategories.push('all-sports');
    }
    if(noSoccer(containsCode(categoryCodes, AllSports), categoryCodes)) {
        presetCategories.push('no-soccer');
    }
  
    if(containsCode(categoryCodes, sportsRelatedTopicCodes)) {
        presetCategories.push('sports-related-topic-codes');
    }

    if(containsCode(categoryCodes, sportsRelatedNewsCodes)) {
        presetCategories.push('sports-related-news-codes');
    }
    return presetCategories;
};