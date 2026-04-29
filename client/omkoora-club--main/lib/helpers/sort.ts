import {matchSorter} from "match-sorter";

export const sortedData = (data: Array<object>) => {
    return matchSorter(data, "", {
        keys: ['createdAt'],
        baseSort: (a: any, b: any) => (a?.rankedValue > b?.rankedValue ? -1 : 1)
    })
}

export const searchSortedData = (data: object[], keys: string[], value: string ) => {
    if (!value || !value.length) {
        return data;
    }

    const terms = value.split(" ");
    if (!terms) {
        return data;
    }

    return matchSorter(data, value, {
        keys: keys,
        baseSort: (a: any, b: any) => (a?.rankedValue > b?.rankedValue ? -1 : 1)
    })
}