import { describe, expect, it } from "vitest";
import { accountsSheet, filterAccounts, teamsOf, MemberAccount } from "../../lib/helpers/memberAccounts";

// «حسابات الأعضاء» في النادي (العميل، 2026-11-08): حسابات أعضاء فرقه كلها.

const row = (over: Partial<MemberAccount>): MemberAccount => ({
    key: "k", name: "", card_number: null, membership_number: null, teams: [], kinds: [],
    paidThisYear: 0, totalPaid: 0, lastPaymentDate: null, subscribedThisYear: false, payments: [],
    ...over,
});

const rows = [
    row({ key: "1", name: "سالم العبري", card_number: "12345678", membership_number: "M-7", teams: ["فريق النصر"], subscribedThisYear: true, paidThisYear: 20 }),
    row({ key: "2", name: "خالد الهنائي", card_number: "87654321", teams: ["فريق الجزيرة"] }),
    row({ key: "3", name: "ناصر", teams: ["فريق النصر", "فريق الجزيرة"], subscribedThisYear: true }),
];

describe("filterAccounts", () => {
    it("finds a member by civil number typed in Arabic digits", () => {
        expect(filterAccounts(rows, { search: "١٢٣٤" }).map((r) => r.key)).toEqual(["1"]);
    });

    it("finds by membership number and by name", () => {
        expect(filterAccounts(rows, { search: "m-7" }).map((r) => r.key)).toEqual(["1"]);
        expect(filterAccounts(rows, { search: "الهنائي" }).map((r) => r.key)).toEqual(["2"]);
    });

    it("keeps a person in two teams under either team", () => {
        expect(filterAccounts(rows, { team: "فريق الجزيرة" }).map((r) => r.key)).toEqual(["2", "3"]);
    });

    it("splits who paid this year from who did not", () => {
        expect(filterAccounts(rows, { paid: "paid" }).map((r) => r.key)).toEqual(["1", "3"]);
        expect(filterAccounts(rows, { paid: "unpaid" }).map((r) => r.key)).toEqual(["2"]);
    });
});

describe("teamsOf and the Excel sheet", () => {
    it("lists each team once", () => {
        expect(teamsOf(rows)).toEqual(["فريق الجزيرة", "فريق النصر"]);
    });

    it("writes the year into the columns the club reads", () => {
        const [first] = accountsSheet(rows, 2026);
        expect(first["سدّد 2026"]).toBe("نعم");
        expect(first["المدفوع في 2026 (ر.ع)"]).toBe(20);
        expect(first["رقم العضوية"]).toBe("M-7");
    });
});
