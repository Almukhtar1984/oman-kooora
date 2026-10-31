import { describe, expect, it } from "vitest";

import { transferFeeType, transferSide } from "../../lib/helpers/transferSide";

// النادي المُرسِل يقرّر رسومه، والمستقبِل يختار الفريق.

const external = { transition_type: "loan", team_from: { club: { id: "A" } }, club_to: { id: "B" } };

describe("موقع النادي من الانتقال", () => {
    it("المُرسِل في انتقالٍ إلى نادٍ آخر", () => expect(transferSide(external, "A")).toBe("sending"));
    it("والمستقبِل", () => expect(transferSide(external, "B")).toBe("receiving"));
    it("والانتقال الداخلي: النادي واحد فهو المستقبِل", () =>
        expect(transferSide({ team_from: { club: { id: "A" } }, team_to: { club: { id: "A" } } }, "A")).toBe("receiving"));
    it("ونوع الرسوم من نوع الطلب", () => {
        expect(transferFeeType(external)).toBe("loan");
        expect(transferFeeType({ transition_type: "transition" })).toBe("transfer");
    });
});
