import { AllBusiness, AllSports, AllWorld, Soccer } from "./categories";



const allSports = (categoryCodes: string[]) => {
    return categoryCodes.filter((code) => AllSports.includes(code)).length > 0
}

const noSoccer = (isAllSports: boolean, categoryCodes: string[]) => {
    return isAllSports && categoryCodes.filter((code) => Soccer.includes(code)).length === 0;
};

const allWorld = (categoryCodes: string[]) => {
    return categoryCodes.filter((code) => AllWorld.includes(code)).length > 0
}

const allBusiness = (categoryCodes: string[]) => {
    return categoryCodes.filter((code) => AllBusiness.includes(code)).length > 0
}

export const computePresetCategories = (categoryCodes: string[]) => {
    const presetCategories: string[] = [];
    if(allSports(categoryCodes)) {
        presetCategories.push('all-sports');
    }
    if(noSoccer(allSports(categoryCodes), categoryCodes)) {
        presetCategories.push('no-soccer');
    }
    if(allWorld(categoryCodes)) {
        presetCategories.push('all-world');
    }
    if(allBusiness(categoryCodes)) {
        presetCategories.push('all-business');
    }
    return presetCategories;
};