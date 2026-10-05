import {matchSorter} from "match-sorter";

// Newest first.
//
// This used to call matchSorter(data, "", {keys: ['createdAt']}), which does not
// just sort: it FILTERS. A row whose createdAt was null or missing scored no
// match and was dropped, so a page could render "لا يوجد بيانات" while the API
// had returned rows — and if no row carried a createdAt the whole list vanished.
// Sorting must never remove data, so rows without a usable date are kept and
// pushed to the end.
const createdAtTime = (item: any): number => {
    const raw = item?.createdAt;
    if (!raw) return -Infinity;
    if (raw instanceof Date) return raw.getTime();
    // Backend format is "yyyy-MM-dd HH:mm:ss"; Safari needs the ISO "T".
    const parsed = Date.parse(String(raw).trim().replace(" ", "T"));
    return Number.isNaN(parsed) ? -Infinity : parsed;
};

export const sortedData = (data: Array<object>) => {
    if (!Array.isArray(data)) return [];
    return [...data].sort((a, b) => createdAtTime(b) - createdAtTime(a));
};

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
