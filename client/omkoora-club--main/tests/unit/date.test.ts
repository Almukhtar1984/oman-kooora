import { describe, expect, it } from "vitest";
import { ageInYears, parseDate } from "../../lib/helpers/date";

const ymd = (d: Date | null) =>
    d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` : null;

describe("parseDate", () => {
    it.each([
        ["2008-12-31", "2008-12-31"],
        ["2008/12/31", "2008-12-31"],
        ["2008-1-5", "2008-01-05"],
        ["2008-12-31T00:00:00.000Z", "2008-12-31"],
        ["31/12/2008", "2008-12-31"],
        ["05/01/2008", "2008-01-05"], // day-first
        ["12/31/2008", "2008-12-31"], // month-first only when it can't be day-first
        ["31-12-2008", "2008-12-31"],
        ["31.12.2008", "2008-12-31"],
        ["٣١/١٢/٢٠٠٨", "2008-12-31"],
        ["۲۰۰۸-۱۲-۳۱", "2008-12-31"],
        ["39813", "2008-12-31"], // Excel serial
        [39813, "2008-12-31"],
        ["  2008-12-31 ", "2008-12-31"],
    ])("%s → %s", (input, expected) => {
        expect(ymd(parseDate(input))).toBe(expected);
    });

    it.each([null, undefined, "", "   ", "Invalid Date", "abc", "31/02/2008", "2008-13-01", "2008", "00/00/0000", "0000-00-00"])(
        "%s → null",
        (input) => {
            expect(parseDate(input)).toBeNull();
        }
    );

    it("keeps a valid Date and rejects an invalid one", () => {
        const d = new Date(2008, 11, 31);
        expect(parseDate(d)).toBe(d);
        expect(parseDate(new Date("nope"))).toBeNull();
    });
});

describe("ageInYears", () => {
    const now = new Date(2026, 8, 18);
    it("counts whole years", () => {
        expect(ageInYears("2008-09-18", now)).toBe(18);
        expect(ageInYears("2008-09-19", now)).toBe(17);
        expect(ageInYears("31/12/2010", now)).toBe(15);
    });
    it("is null for an unusable date instead of throwing", () => {
        expect(ageInYears("Invalid Date", now)).toBeNull();
        expect(ageInYears(new Date("nope"), now)).toBeNull();
    });
});
