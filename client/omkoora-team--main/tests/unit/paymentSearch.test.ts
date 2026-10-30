import { describe, expect, it } from "vitest";

import { matchesPayment } from "../../lib/helpers/paymentSearch";

// المدفوعات يُبحث فيها بالرقم المدني — «هل ممكن بالرقم المدني… في الدفعات» (العميل).

const row = {
    subject: "سالم محمد الهنائي", subject_card: "22161381", reference_number: "TR-COMP-9",
    team: { name: "فريق الطموح" }, label: "إعارة لاعب", note: null,
};

describe("البحث في المدفوعات", () => {
    it("بالرقم المدني", () => expect(matchesPayment(row, "2216")).toBe(true));
    it("وبالاسم، والهمزة والتاء لا تفرّقان", () => expect(matchesPayment(row, "سالم محمد")).toBe(true));
    it("وبالرقم المرجعي — فتُجمع مطالبات الإيصال الواحد", () => expect(matchesPayment(row, "tr-comp")).toBe(true));
    it("وبالفريق", () => expect(matchesPayment(row, "الطموح")).toBe(true));
    it("وما لا يطابق لا يظهر", () => expect(matchesPayment(row, "99999")).toBe(false));
    it("وبحثٌ فارغ يُظهر الكل", () => expect(matchesPayment(row, "  ")).toBe(true));
});
