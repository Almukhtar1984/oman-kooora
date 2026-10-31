import { describe, expect, it } from "vitest";

import { ROAD, bulkMoves, remainingRoad, turnText } from "../../lib/helpers/requestFlow";

// ما بقي من الطريق.
//
// الشحنة تقول «في الطريق إليك» فيعرف صاحبها ما بقي. والطلب كان يقول حالته
// الآن ويسكت، فهذه الدالة هي بقية الخط.

describe("بقية طريق الطلب", () => {
    it("من التقديم يبقى الطريق كله إلا التقديم", () => {
        expect(remainingRoad({ stage: "submitted" }))
            .toEqual(["club_processing", "awaiting_payment", "paid_review", "approved"]);
    });

    it("ومن استكمال الإجراءات يبقى المال والاعتماد", () => {
        expect(remainingRoad({ stage: "club_processing" }))
            .toEqual(["awaiting_payment", "paid_review", "approved"]);
    });

    it("ومن السداد يبقى الاعتماد وحده", () => {
        expect(remainingRoad({ stage: "paid_review" })).toEqual(["approved"]);
    });

    it("والمنتهي لا يُوعَد بخطوة", () => {
        // لا يُقال للفريق «بانتظار الاعتماد» بعد أن اعتُمد أو رُفض أو أُلغي.
        expect(remainingRoad({ stage: "approved", done: true })).toEqual([]);
        expect(remainingRoad({ stage: "rejected_final", done: true })).toEqual([]);
        expect(remainingRoad({ stage: "cancelled", done: true })).toEqual([]);
    });

    it("والمرفوض مبدئياً يعود إلى أول الطريق", () => {
        // «يستطيع الفريق تعديل الطلب وإعادة إرساله» — فالخط يبدأ من التقديم.
        expect(remainingRoad({ stage: "rejected_initial" })).toEqual(ROAD);
    });

    it("والمسودة لم تدخل الطريق بعد", () => {
        expect(remainingRoad({ stage: "draft" })).toEqual(ROAD);
    });

    it("ولا طريق بلا مسار", () => {
        expect(remainingRoad(null)).toEqual([]);
        expect(remainingRoad({ stage: "لا شيء" })).toEqual([]);
    });

    it("ومرحلتا المال من الطريق دائماً — تُسدَّدان أو يُعفى منهما، ولا تُتخطّيان", () => {
        // «جميع الأندية تعتمد على هذا الشيء» (العميل، 2026-10-30).
        expect(remainingRoad({ stage: "club_processing" })).toContain("awaiting_payment");
        expect(remainingRoad({ stage: "club_processing" })).toContain("paid_review");
    });

    it("ومن عليه الدور يُقال بلسان من يقرأ", () => {
        expect(turnText({ stage: "awaiting_payment", actor: "team", side: "team" })).toBe("الدور عليك");
        expect(turnText({ stage: "awaiting_payment", actor: "team", side: "club" })).toBe("الدور على الفريق");
        expect(turnText({ stage: "submitted", actor: "club", side: "chain" }))
            .toBe("الدور على ناديك: موافقة أو رفض في سلسلة الناديين");
        expect(turnText({ stage: "submitted", actor: "club", side: "observer" }))
            .toBe("تتابع هذا الطلب — والقرار فيه لغيرك");
        expect(turnText({ stage: "approved", done: true })).toBeNull();
    });
});

describe("القرارات الجماعية", () => {
    const fee = [{ to: "awaiting_payment", kind: "bill" }, { to: "paid_review", kind: "waive" }];

    it("بعد القبول المبدئي: مطالبة بالسعر المعلن أو إعفاء", () => {
        expect(bulkMoves({ suggestedAmount: 25, actions: fee })).toEqual({ approve: false, bill: true, waive: true });
    });

    it("ولا مطالبة جماعية بلا سعر معلن — يُطالَب به من مساره بمبلغه", () => {
        expect(bulkMoves({ suggestedAmount: null, actions: fee }).bill).toBe(false);
        expect(bulkMoves({ suggestedAmount: 0, actions: fee }).bill).toBe(false);
    });

    it("وبعد السداد: الاعتماد وحده", () => {
        expect(bulkMoves({ actions: [{ to: "approved" }, { to: "awaiting_payment", kind: "return_receipt" }] }))
            .toEqual({ approve: true, bill: false, waive: false });
    });

    it("وما لا قرار فيه لا يُختار", () => {
        expect(bulkMoves(null)).toEqual({ approve: false, bill: false, waive: false });
    });
});
