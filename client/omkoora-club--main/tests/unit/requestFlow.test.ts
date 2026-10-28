import { describe, expect, it } from "vitest";

import { ROAD, isConditional, remainingRoad } from "../../lib/helpers/requestFlow";

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

    it("ومرحلتا المال مشروطتان حتى تصدر المطالبة", () => {
        // نادٍ لم يسعّر هذا النوع لا يمرّ طلبه بالسداد أصلاً، فلا يُوعد به جزماً.
        const unbilled = { stage: "club_processing" };
        expect(isConditional(unbilled, "awaiting_payment")).toBe(true);
        expect(isConditional(unbilled, "paid_review")).toBe(true);
        expect(isConditional(unbilled, "approved")).toBe(false);

        const billed = { stage: "awaiting_payment", payment: { id: "pay-1" } };
        expect(isConditional(billed, "awaiting_payment")).toBe(false);
    });
});
