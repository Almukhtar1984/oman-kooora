import { describe, expect, it } from "vitest";

import { ACTIVITIES, canonicalActivity, joinActivities, splitActivities } from "../../lib/helpers/activities";

// نشاط الفريق قائمة تُختار. وما كُتب قبلها نصّاً حرّاً يُقرأ باسمه الواحد كي
// يظهر في القائمة مختاراً — «كره القدم» هي «كرة القدم».

describe("أنشطة الفريق", () => {
    it("القائمة هي نفسها في نموذج اللاعب", () => {
        expect(ACTIVITIES).toEqual(["كرة القدم", "كرة السلة", "كرة اليد", "كرة الطائرة"]);
    });

    it("الصيغ المكتوبة يداً تعود إلى اسمها", () => {
        expect(canonicalActivity("كره القدم")).toBe("كرة القدم");
        expect(canonicalActivity("FOOTBAL")).toBe("كرة القدم");
        expect(canonicalActivity("كرة الطايرة")).toBe("كرة الطائرة");
        expect(canonicalActivity("سباحة")).toBe("سباحة");
        expect(canonicalActivity("   ")).toBeNull();
    });

    it("الفريق ذو النشاطين يُقرأ نشاطين بلا تكرار", () => {
        expect(splitActivities("كرة القدم، كرة السلة")).toEqual(["كرة القدم", "كرة السلة"]);
        expect(splitActivities("كرة القدم, كره القدم")).toEqual(["كرة القدم"]);
        expect(splitActivities(null)).toEqual([]);
    });

    it("ويُرسل كما يخزّنه الخادم", () => {
        expect(joinActivities(["كرة السلة", "كرة القدم"])).toBe("كرة السلة، كرة القدم");
        expect(joinActivities([])).toBe("");
    });
});
