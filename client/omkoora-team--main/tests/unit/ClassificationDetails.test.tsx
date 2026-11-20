import React from "react";
import { MantineProvider } from "@mantine/core";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// «اختيار التصنيف» لا يقف عند النوع (العميل، 2026-11-19): اللاعب ← مركزه
// وفئته العمرية، والجهاز الفني ← صفته، ومجلس الإدارة ← منصبه.

const h = vi.hoisted(() => ({ change: vi.fn(), notify: vi.fn() }));

vi.mock("../../graphql/hooks/members", () => ({
    useChangeMemberClassification: () => [h.change, { loading: false }],
}));
vi.mock("../../graphql/queries", () => ({
    AllPlayers: { kind: "Document", definitions: [] },
    AllMembers: { kind: "Document", definitions: [] },
    AllTechnicals: { kind: "Document", definitions: [] },
    AllAssembly: { kind: "Document", definitions: [] },
}));
vi.mock("@mantine/notifications", () => ({ showNotification: h.notify }));

// قائمة Mantine المنسدلة ليست ما يُختبر: قائمةٌ أصلية بالخيارات نفسها.
vi.mock("@mantine/core", async (original) => {
    const actual: any = await original();
    return {
        ...actual,
        Select: ({ label, data, value, onChange, placeholder }: any) => (
            <label>
                {label}
                <select aria-label={label} value={value ?? ""} onChange={(e) => onChange(e.target.value || null)}>
                    <option value="">{placeholder}</option>
                    {data.map((item: any) => typeof item === "string"
                        ? <option key={item} value={item}>{item}</option>
                        : <option key={item.value} value={item.value} disabled={item.disabled}>{item.label}</option>)}
                </select>
            </label>
        ),
    };
});

import { ChangeClassificationModal } from "../../components/Modal/ChangeClassificationModal";
import { roleLabel } from "../../lib/helpers/classificationDetails";

const member = { id: "a1", first_name: "سعيد", second_name: "محمد", third_name: "حسان", tribe: "المالكي" };

const renderModal = (onClose = vi.fn()) => render(
    <MantineProvider theme={{ dir: "rtl" }}>
        <ChangeClassificationModal opened onClose={onClose} data={member} fromType="assembly" onSuccess={() => {}} idTeam="team-1" />
    </MantineProvider>
);

const choose = (label: string, value: string) =>
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
const options = (label: string) =>
    Array.from((screen.getByLabelText(label) as HTMLSelectElement).options).map((o) => o.textContent).slice(1);
const confirm = () => screen.getByRole("button", { name: "تأكيد التغيير" });

beforeEach(() => {
    vi.clearAllMocks();
    h.change.mockResolvedValue({ data: { changeMemberClassification: { id: "p1" } } });
});

describe("«اختيار التصنيف» وتفاصيله", () => {
    it("اللاعب: الفئة العمرية ومركزه — ولا تأكيد قبلهما", async () => {
        renderModal();
        expect(screen.queryByLabelText("الفئة العمرية")).toBeNull();

        choose("التصنيف الجديد", "player");
        expect(options("الفئة العمرية")).toEqual(["الفريق الأول", "تحت 23 سنة", "تحت 18 سنة", "تحت 16 سنة"]);
        expect(options("مركز اللاعب")).toEqual(["حارس", "دفاع", "وسط", "مهاجم"]);
        expect(confirm()).toBeDisabled();

        choose("الفئة العمرية", "young");
        expect(confirm()).toBeDisabled();
        choose("مركز اللاعب", "حارس");
        expect(confirm()).toBeEnabled();

        fireEvent.click(confirm());
        await waitFor(() => expect(h.change).toHaveBeenCalledTimes(1));
        expect(h.change.mock.calls[0][0].variables).toEqual({
            id: "a1", fromType: "assembly", toType: "player", class: "young", player_center: "حارس",
        });
    });

    it("مجلس الإدارة: المنصب — رئيس، نائب رئيس، أمين الصندوق…", async () => {
        renderModal();
        choose("التصنيف الجديد", "member");
        expect(options("المنصب في مجلس الإدارة")).toEqual(["رئيس", "نائب رئيس", "أمين السر", "أمين الصندوق", "عضو"]);
        expect(confirm()).toBeDisabled();

        choose("المنصب في مجلس الإدارة", "نائب رئيس");
        fireEvent.click(confirm());
        await waitFor(() => expect(h.change).toHaveBeenCalledTimes(1));
        expect(h.change.mock.calls[0][0].variables).toEqual({
            id: "a1", fromType: "assembly", toType: "member", classification: "نائب رئيس",
        });
    });

    it("الجهاز الفني: الصفة — مدرب، مساعد مدرب…", async () => {
        renderModal();
        choose("التصنيف الجديد", "technical");
        expect(options("الصفة في الجهاز الفني").slice(0, 2)).toEqual(["مدرب", "مساعد مدرب"]);

        choose("الصفة في الجهاز الفني", "مساعد مدرب");
        fireEvent.click(confirm());
        await waitFor(() => expect(h.change).toHaveBeenCalledTimes(1));
        expect(h.change.mock.calls[0][0].variables.classification).toBe("مساعد مدرب");
    });

    it("تغيير النوع يمسح تفاصيل النوع السابق", () => {
        renderModal();
        choose("التصنيف الجديد", "member");
        choose("المنصب في مجلس الإدارة", "رئيس");
        choose("التصنيف الجديد", "technical");
        expect((screen.getByLabelText("الصفة في الجهاز الفني") as HTMLSelectElement).value).toBe("");
        expect(confirm()).toBeDisabled();
    });

    it("رسالة الخادم تظهر كما هي", async () => {
        h.change.mockRejectedValue({ graphQLErrors: [{ message: "مسجّل لاعباً في هذا الفريق بالفعل" }] });
        renderModal();
        choose("التصنيف الجديد", "player");
        choose("الفئة العمرية", "firstDegree");
        choose("مركز اللاعب", "وسط");
        fireEvent.click(confirm());
        await waitFor(() => expect(h.notify).toHaveBeenCalled());
        expect(h.notify.mock.calls[0][0].message).toBe("مسجّل لاعباً في هذا الفريق بالفعل");
    });
});

describe("الصفة على البطاقة بالعربية", () => {
    it("ما كتبه التصنيف القديم بالإنجليزية", () => {
        expect(roleLabel("member")).toBe("عضو");
        expect(roleLabel("technical")).toBe("جهاز فني");
        expect(roleLabel("manager")).toBe("مدير الفريق");
    });
    it("والعربية كما هي", () => {
        expect(roleLabel("نائب رئيس")).toBe("نائب رئيس");
        expect(roleLabel(null)).toBe("");
    });
});
