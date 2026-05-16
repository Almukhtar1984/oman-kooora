import { describe, it, expect, vi } from "vitest";
import dayjs from "dayjs";

vi.mock("./components/PDF/ListPlayers", () => ({
    default: () => null,
}));

import { computeAgeYears, matchesAgeFilter } from "./Players";

describe("computeAgeYears", () => {
    it("returns null for missing input", () => {
        expect(computeAgeYears(undefined)).toBeNull();
        expect(computeAgeYears("")).toBeNull();
    });

    it("returns null for unparseable input", () => {
        expect(computeAgeYears("not-a-date")).toBeNull();
    });

    it("returns a whole-year diff for a real date", () => {
        const tenYearsAgo = dayjs().subtract(10, "year").format("YYYY-MM-DD");
        expect(computeAgeYears(tenYearsAgo)).toBe(10);
    });

    it("rounds down (does not count partial years)", () => {
        // half a year ago should still be zero whole years
        const halfYear = dayjs().subtract(6, "month").format("YYYY-MM-DD");
        expect(computeAgeYears(halfYear)).toBe(0);
    });
});

describe("matchesAgeFilter", () => {
    const playerAge = (years: number) => ({
        person: { date_birth: dayjs().subtract(years, "year").format("YYYY-MM-DD") },
    });

    it("keeps every player when no operator or age is given", () => {
        expect(matchesAgeFilter(playerAge(25), undefined, undefined)).toBe(true);
        expect(matchesAgeFilter(playerAge(25), "<", "0")).toBe(true);
        expect(matchesAgeFilter(playerAge(25), ">", "0")).toBe(true);
        expect(matchesAgeFilter(playerAge(25), "<", "")).toBe(true);
    });

    it("'<' keeps players at or below the age", () => {
        expect(matchesAgeFilter(playerAge(15), "<", "18")).toBe(true);
        expect(matchesAgeFilter(playerAge(18), "<", "18")).toBe(true);
        expect(matchesAgeFilter(playerAge(20), "<", "18")).toBe(false);
    });

    it("'>' keeps players at or above the age", () => {
        expect(matchesAgeFilter(playerAge(25), ">", "18")).toBe(true);
        expect(matchesAgeFilter(playerAge(18), ">", "18")).toBe(true);
        expect(matchesAgeFilter(playerAge(15), ">", "18")).toBe(false);
    });

    it("keeps players whose date_birth is missing/invalid", () => {
        // The print app should not silently drop rows when birth data is bad;
        // missing → visible, so the operator can spot the gap.
        expect(matchesAgeFilter({ person: { date_birth: undefined } }, "<", "18")).toBe(true);
        expect(matchesAgeFilter({ person: { date_birth: "bogus" } }, ">", "18")).toBe(true);
        expect(matchesAgeFilter({}, "<", "18")).toBe(true);
    });

    it("ignores a non-numeric age", () => {
        expect(matchesAgeFilter(playerAge(15), "<", "eighteen")).toBe(true);
    });
});
