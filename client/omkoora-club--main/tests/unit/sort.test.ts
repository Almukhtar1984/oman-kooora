import { describe, expect, it } from "vitest";
import { searchSortedData, sortedData } from "../../lib/helpers/sort";

// sortedData used to run matchSorter with an empty query, which FILTERS as well
// as sorts: every row whose createdAt was null/missing was dropped, so a page
// could show "لا يوجد بيانات" while the API had returned rows.
describe("sortedData", () => {
    const rows = [
        { id: "old", createdAt: "2026-01-01 10:00:00" },
        { id: "null", createdAt: null },
        { id: "missing" },
        { id: "empty", createdAt: "" },
        { id: "new", createdAt: "2026-02-01 10:00:00" },
    ];

    it("keeps every row — sorting must not drop data", () => {
        expect(sortedData(rows as any)).toHaveLength(rows.length);
    });

    it("keeps rows even when not one of them has a date", () => {
        const undated = [{ id: "a" }, { id: "b", createdAt: null }];
        expect(sortedData(undated as any).map((r: any) => r.id)).toEqual(["a", "b"]);
    });

    it("orders newest first and parks undated rows at the end", () => {
        const ids = sortedData(rows as any).map((r: any) => r.id);
        expect(ids.slice(0, 2)).toEqual(["new", "old"]);
        expect(ids.slice(2).sort()).toEqual(["empty", "missing", "null"]);
    });

    it("reads the backend's 'yyyy-MM-dd HH:mm:ss' format and Date objects", () => {
        const mixed = [
            { id: "jan", createdAt: "2026-01-05 08:30:00" },
            { id: "mar", createdAt: new Date("2026-03-05T08:30:00") },
            { id: "feb", createdAt: "2026-02-05 08:30:00" },
        ];
        expect(sortedData(mixed as any).map((r: any) => r.id)).toEqual(["mar", "feb", "jan"]);
    });

    it("does not mutate the caller's array", () => {
        const input = [...rows];
        sortedData(input as any);
        expect(input.map((r: any) => r.id)).toEqual(rows.map((r: any) => r.id));
    });

    it("survives a missing list instead of throwing", () => {
        expect(sortedData(undefined as any)).toEqual([]);
        expect(sortedData(null as any)).toEqual([]);
    });
});

describe("searchSortedData", () => {
    const people = [
        { id: "1", person: { first_name: "أحمد" }, createdAt: "2026-01-01 10:00:00" },
        { id: "2", person: { first_name: "خالد" } },
    ];

    it("returns the list untouched when the search box is empty", () => {
        expect(searchSortedData(people, ["person.first_name"], "")).toHaveLength(2);
    });

    it("filters on the searched term", () => {
        const found = searchSortedData(people, ["person.first_name"], "خالد");
        expect(found.map((r: any) => r.id)).toEqual(["2"]);
    });
});
