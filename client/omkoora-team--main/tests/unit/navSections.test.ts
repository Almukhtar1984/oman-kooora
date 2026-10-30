import { describe, expect, it } from "vitest";

import { activeSection, isItemActive, resolveNav } from "../../lib/helpers/navSections";

// صفحات الطلب ستٌّ في الشريط، والعميل: «نقلّل كل هذه الصفحات». فصارت بنداً
// واحداً وصفّاً ثانياً تحته.

const NAV = [
    { path: "/", label: "الرئيسية" },
    {
        path: "/requests", label: "الطلبات",
        children: [
            { path: "/requests", label: "بانتظار قرارك" },
            { path: "/tracking", label: "كل الطلبات" },
            { path: "/players_loan", label: "الإعارات", show: false },
            { path: "/payments", label: "المدفوعات" },
        ],
    },
    { path: "/members", label: "الأعضاء", also: ["/players"], children: [{ path: "/members", label: "سجلات الأعضاء" }] },
    { path: "/powers", label: "الصلاحيات", show: false },
    { path: "/x", label: "قسم بلا أبناء مسموحين", children: [{ path: "/x", label: "x", show: false }] },
];

describe("أقسام الشريط", () => {
    it("يحذف ما لا يُسمح به، والقسم الذي لم يبقَ له ابن", () => {
        expect(resolveNav(NAV).map((item) => item.label)).toEqual(["الرئيسية", "الطلبات", "الأعضاء"]);
    });

    it("ويُبقي من القسم أبناءه المسموحين", () => {
        const requests = resolveNav(NAV)[1];
        expect(requests.children?.map((child) => child.label)).toEqual(["بانتظار قرارك", "كل الطلبات", "المدفوعات"]);
    });

    it("والقسم يفتح على أوّل ابنٍ ظاهر", () => {
        const nav = resolveNav([{ path: "/requests", label: "الطلبات", children: [
            { path: "/requests", label: "a", show: false }, { path: "/tracking", label: "b" },
        ] }]);
        expect(nav[0].path).toBe("/tracking");
    });

    it("وكل صفحة من صفحات القسم تُعلّمه نشطاً", () => {
        const requests = resolveNav(NAV)[1];
        expect(["/requests", "/tracking", "/payments"].every((path) => isItemActive(requests, path))).toBe(true);
        expect(isItemActive(requests, "/powers")).toBe(false);
        expect(isItemActive(resolveNav(NAV)[2], "/players")).toBe(true);
    });

    it("والصفّ الثاني للقسم المفتوح وحده، ولا صفّ لقسمٍ بابنٍ واحد", () => {
        const nav = resolveNav(NAV);
        expect(activeSection(nav, "/payments")?.label).toBe("الطلبات");
        expect(activeSection(nav, "/members")).toBeNull();
        expect(activeSection(nav, "/")).toBeNull();
    });
});
