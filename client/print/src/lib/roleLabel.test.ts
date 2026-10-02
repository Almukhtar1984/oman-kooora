import { describe, expect, it } from "vitest";
import { roleLabel } from "./roleLabel";

// A card went out reading "الصفة: متقاعد" — the person's day job. The club
// asked for the job to never appear: only the role (classification) may print.
describe("roleLabel", () => {
    it.each(["مدرب", "مساعد مدرب", "مدرب اللياقة", "مدرب حراس", "طبي", "اعلامي", "مدير الفريق", "مسؤول مهمات"])(
        "prints the role %j as-is",
        (role) => {
            expect(roleLabel({ classification: role })).toBe(role);
        }
    );

    it.each(["متقاعد", "موظف", "طالب", "عسكري", "باحث عن عمل"])(
        "never prints the day job %j",
        (job) => {
            expect(roleLabel({ occupation: job })).toBeNull();
            expect(roleLabel({ classification: "", occupation: job })).toBeNull();
            expect(roleLabel({ classification: "مدرب", occupation: job })).toBe("مدرب");
        }
    );

    it("maps the internal member codes to Arabic", () => {
        expect(roleLabel({ classification: "member" })).toBe("عضو");
        expect(roleLabel({ classification: "manager" })).toBe("مدير الفريق");
        expect(roleLabel({ classification: "technical" })).toBe("الجهاز الفني");
    });

    it.each(["firstDegree", "secondDegree", "young", "rookies"])(
        "prints nothing for the age category %j (not a role)",
        (code) => {
            expect(roleLabel({ classification: code })).toBeNull();
        }
    );

    it("prints nothing when there is no role", () => {
        expect(roleLabel({})).toBeNull();
        expect(roleLabel(null)).toBeNull();
        expect(roleLabel({ classification: "   " })).toBeNull();
    });
});
