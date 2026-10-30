import { describe, expect, it } from "vitest";

import { buildEForm, eFormHtml, FORM_TYPES, fullName } from "../../lib/helpers/eForms";

// الاستمارة تمتلئ من بيانات اللاعب — «فقط يختار بيانات اللاعب وينزل كامل
// الاستمارة… أربع استمارات: انتقال، إعارة، استقالة، ولي الأمر» (العميل).

const player = {
    person: {
        first_name: "سالم", second_name: "محمد", third_name: "سيف", tribe: "الهنائي",
        card_number: "22161381", phone: "95969192", date_birth: "2008-04-12",
    },
    team: { name: "فريق الطموح" },
};
const club = { name: "نادي النهضة" };

const rowsOf = (form: any) => Object.fromEntries(form.sections.flatMap((s: any) => s.rows));

describe("الاستمارات الإلكترونية", () => {
    it("الأربع التي طلبها العميل", () => {
        expect(FORM_TYPES.map((form) => form.label))
            .toEqual(["استمارة انتقال", "استمارة إعارة", "استمارة استقالة", "موافقة ولي الأمر"]);
    });

    it("بيانات اللاعب تمتلئ وحدها", () => {
        const rows = rowsOf(buildEForm("transfer", { player, club, toTeam: "فريق الشعب", startDate: "2026-11-01" }));
        expect(rows["الاسم الرباعي مع القبيلة"]).toBe("سالم محمد سيف الهنائي");
        expect(rows["الرقم المدني"]).toBe("22161381");
        expect(rows["تاريخ الميلاد"]).toBe("2008/04/12");
        expect(rows["رقم الهاتف"]).toBe("95969192");
        expect(rows["من فريق"]).toBe("فريق الطموح");
        expect(rows["إلى فريق"]).toBe("فريق الشعب");
    });

    it("وما لم يُعرف يبقى نقاطاً يُكتب عليها باليد", () => {
        const rows = rowsOf(buildEForm("transfer", { player: { person: { first_name: "سالم" } }, club }));
        expect(rows["الرقم المدني"]).toBe("…………………………");
        expect(rows["إلى فريق"]).toBe("…………………………");
    });

    it("والإعارة بمدّتها، والاستقالة بسببها، وموافقة ولي الأمر بولي الأمر", () => {
        const loan = buildEForm("loan", { player, club, toTeam: "فريق الشعب", startDate: "2026-11-01", endDate: "2027-05-01" });
        expect(rowsOf(loan)["نهاية الإعارة"]).toBe("2027/05/01");
        expect(loan.paragraphs[0]).toContain("من 2026/11/01 إلى 2027/05/01");

        const quit = buildEForm("resignation", { player, club, reason: "السفر للدراسة" });
        expect(quit.subject).toBe("طلب استقالة من عضوية الفريق");
        expect(quit.paragraphs[0]).toContain("للأسباب الآتية: السفر للدراسة");
        expect(quit.to).toBe("إلى رئيس فريق الطموح المحترم");

        const guardian = buildEForm("guardian", { player, club, guardianName: "محمد سيف الهنائي", guardianRelation: "الأب", season: "2026/2027" });
        expect(rowsOf(guardian)["اسم ولي الأمر"]).toBe("محمد سيف الهنائي");
        expect(guardian.paragraphs[0]).toContain("للموسم الرياضي 2026/2027");
        expect(guardian.signatures[0]).toBe("توقيع ولي الأمر");
    });

    it("والصفحة خطابٌ عربي بشعاري النادي والفريق، يحمي ما كُتب يداً", () => {
        const form = buildEForm("resignation", { player, club, reason: "<b>سبب</b>" });
        const html = eFormHtml(form, { player, club, team: { name: "فريق الطموح" } }, { club: "https://x/club.png", team: "https://x/team.png" });
        expect(html).toContain('dir="rtl"');
        expect(html).toContain('src="https://x/club.png"');
        expect(html).toContain('src="https://x/team.png"');
        expect(html).toContain("الموضوع: طلب استقالة من عضوية الفريق");
        expect(html).toContain("&lt;b&gt;سبب&lt;/b&gt;");
        expect(html).not.toContain("<b>سبب</b>");
    });

    it("والاسم يُجمع بلا فراغات زائدة", () => {
        expect(fullName({ first_name: " سالم ", second_name: "", tribe: "الهنائي" })).toBe("سالم الهنائي");
        expect(fullName(null)).toBe("");
    });
});
