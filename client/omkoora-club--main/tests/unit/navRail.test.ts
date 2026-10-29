import { describe, expect, it } from "vitest";

import {
    hasRailAfter, hasRailBefore, railDelta, railOffset,
    railOverflows, railSpan, railStep,
} from "../../lib/helpers/navRail";

// طرفا شريط الصفحات.
//
// السهم الذي لا يؤدّي إلى شيء أسوأ من غيابه، فعلى الشريط أن يعرف أوّلاً ما
// خُفي عن يمينه وما خُفي عن يساره. هذه حسابٌ على ثلاثة أرقام، فتُختبر هنا بلا
// متصفّح.

const rail = (over: Partial<{ scrollLeft: number; scrollWidth: number; clientWidth: number }> = {}) => ({
    scrollLeft: 0,
    scrollWidth: 2000,
    clientWidth: 800,
    ...over,
});

describe("شريط الصفحات", () => {
    it("لا سهم لشريطٍ يتّسع لصفحاته", () => {
        const fits = rail({ scrollWidth: 800 });
        expect(railSpan(fits)).toBe(0);
        expect(railOverflows(fits)).toBe(false);
        expect(hasRailBefore(fits)).toBe(false);
        expect(hasRailAfter(fits)).toBe(false);
    });

    it("وأوّل الشريط: لا شيء خلفه وبعده صفحات", () => {
        expect(railOverflows(rail())).toBe(true);
        expect(hasRailBefore(rail())).toBe(false);
        expect(hasRailAfter(rail())).toBe(true);
    });

    it("وآخره: خلفه صفحات ولا شيء بعده", () => {
        // 2000 - 800 = 1200، وهي كل المسافة.
        const end = rail({ scrollLeft: -1200 });
        expect(hasRailBefore(end)).toBe(true);
        expect(hasRailAfter(end)).toBe(false);
    });

    it("ووسطه: صفحات على الجهتين", () => {
        const middle = rail({ scrollLeft: -600 });
        expect(hasRailBefore(middle)).toBe(true);
        expect(hasRailAfter(middle)).toBe(true);
    });

    it("وإشارة scrollLeft لا تُغيّر الجواب", () => {
        // المتصفحات تختلف في إشارتها داخل الاتجاه من اليمين لليسار، والبعد
        // عن الطرفين واحدٌ في الحالتين.
        expect(railOffset(rail({ scrollLeft: -600 }))).toBe(railOffset(rail({ scrollLeft: 600 })));
    });

    it("والكسر العشري ليس طرفاً", () => {
        // تكبير الشاشة يورّث كسوراً؛ بكسلان لا يعنيان أن هناك ما يُرى.
        expect(hasRailBefore(rail({ scrollLeft: -2 }))).toBe(false);
        expect(hasRailAfter(rail({ scrollLeft: -1198.5 }))).toBe(false);
    });

    it("ولا يتجاوز البعدُ المسافةَ كلَّها", () => {
        // بعض المتصفحات تُبالغ أثناء التمرير المطّاطي.
        expect(railOffset(rail({ scrollLeft: -1600 }))).toBe(1200);
    });

    it("والخطوة شاشةٌ ناقصة خُمسها، ولا تقلّ عن قدرٍ معقول", () => {
        expect(railStep(rail())).toBe(640);
        expect(railStep(rail({ clientWidth: 100 }))).toBe(160);
    });

    it("ومن اليمين لليسار تُتابَع الصفحات بنقصان scrollLeft", () => {
        expect(railDelta(rail(), "after", true)).toBe(-640);
        expect(railDelta(rail(), "before", true)).toBe(640);
    });

    it("ومن اليسار لليمين بالعكس", () => {
        expect(railDelta(rail(), "after", false)).toBe(640);
        expect(railDelta(rail(), "before", false)).toBe(-640);
    });

    it("وشريطٌ لم يُركّب بعد لا يكسر الحساب", () => {
        expect(railSpan(null)).toBe(0);
        expect(railOverflows(null)).toBe(false);
        expect(hasRailBefore(undefined)).toBe(false);
        expect(hasRailAfter(undefined)).toBe(false);
    });
});
