import React from "react";
import { MantineProvider } from "@mantine/core";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// «تسجيل عضو جديد» — بابٌ واحد بدل ثلاثة (العميل، 2026-11-08): يدخل العضو
// العضوية بانتظار النادي، ثم يُختار تصنيفه من بطاقته بعد الاعتماد.

const h = vi.hoisted(() => ({
    register: vi.fn(),
    notyfSuccess: vi.fn(),
    notyfError: vi.fn(),
}));

vi.mock("../../graphql", () => ({
    AllAssembly: { kind: "Document", definitions: [] },
    useRegisterMember: () => [h.register, { loading: false }],
}));

vi.mock("notyf", () => ({
    Notyf: class { success = h.notyfSuccess; error = h.notyfError; open = vi.fn(); },
}));

vi.mock("../../store/useStore", () => ({
    default: (selector: any) =>
        selector({ userData: { person: { member: { team: { id: "team-1", name: "فريق الحزم" } } } } }),
}));

vi.mock("../../lib/helpers/openPrint", () => ({ openPrint: vi.fn() }));

// Mantine's calendar is not what is tested: a plain field that hands back a day.
vi.mock("@mantine/dates", () => ({
    DateInput: ({ label, onChange, error }: any) => (
        <label>
            {label}
            <input aria-label={label} onChange={(e) => {
                const [y, m, d] = e.target.value.split("-").map(Number);
                onChange(e.target.value ? new Date(y, m - 1, d) : null);
            }} />
            {error ? <span>{error}</span> : null}
        </label>
    ),
}));

import { RegisterMemberModal } from "../../components/Modal/RegisterMemberModal";
import { MemberCard } from "../../components/Card/MemberCard";

const renderModal = (onRegistered = vi.fn()) => render(
    <MantineProvider theme={{ dir: "rtl" }}>
        <RegisterMemberModal opened title="تسجيل عضو جديد" idTeam="team-1" onClose={() => {}} onRegistered={onRegistered} />
    </MantineProvider>
);

const type = (label: string, value: string) =>
    fireEvent.change(screen.getByPlaceholderText(label), { target: { value } });

beforeEach(() => {
    vi.clearAllMocks();
    h.register.mockResolvedValue({ data: { registerMember: { id: "a1", status: "waiting_club" } } });
});

describe("نافذة «تسجيل عضو جديد»", () => {
    it("says where the member goes and what follows", () => {
        renderModal();
        expect(screen.getByText(/يدخل العضو «العضوية» مباشرة/)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "إرسال إلى النادي" })).toBeInTheDocument();
    });

    it("sends nothing while a required field is missing", async () => {
        renderModal();
        fireEvent.click(screen.getByRole("button", { name: "إرسال إلى النادي" }));
        await waitFor(() => expect(screen.getAllByText("مطلوب").length).toBeGreaterThan(0));
        expect(h.register).not.toHaveBeenCalled();
    });

    it("sends the civil number and phone in Latin digits, and the birth date as a day", async () => {
        const onRegistered = vi.fn();
        renderModal(onRegistered);
        type("الاسم الأول", "سالم");
        type("الاسم الثاني", "خالد");
        type("القبيلة", "العبري");
        type("الرقم المدني", "١٢٣٤٥٦٧٨");
        type("رقم الهاتف", "٩٩١٢٣٤٥٦");
        fireEvent.change(screen.getByLabelText("تاريخ الميلاد"), { target: { value: "2000-03-15" } });
        fireEvent.click(screen.getByRole("button", { name: "إرسال إلى النادي" }));

        await waitFor(() => expect(h.register).toHaveBeenCalled());
        const content = h.register.mock.calls[0][0].variables.content;
        expect(content).toMatchObject({
            first_name: "سالم", second_name: "خالد", tribe: "العبري",
            card_number: "12345678", phone: "99123456", date_birth: "2000-03-15",
        });
        await waitFor(() => expect(onRegistered).toHaveBeenCalled());
    });

    it("shows the server's reason when the club already has this person", async () => {
        h.register.mockRejectedValue({ graphQLErrors: [{ message: "صاحب هذا الرقم المدني عضوٌ مسجَّل في فريق النصر" }] });
        renderModal();
        type("الاسم الأول", "سالم"); type("الاسم الثاني", "خالد"); type("القبيلة", "العبري");
        type("الرقم المدني", "12345678"); type("رقم الهاتف", "99123456");
        fireEvent.change(screen.getByLabelText("تاريخ الميلاد"), { target: { value: "2000-03-15" } });
        fireEvent.click(screen.getByRole("button", { name: "إرسال إلى النادي" }));
        await waitFor(() => expect(h.notyfError).toHaveBeenCalledWith(
            expect.objectContaining({ message: "صاحب هذا الرقم المدني عضوٌ مسجَّل في فريق النصر" })));
    });
});

const assemblyCard = (status: string | null, onChangeClassification = vi.fn()) => render(
    <MantineProvider theme={{ dir: "rtl" }}>
        <MemberCard
            data={{ id: "a1", status, first_name: "سالم", second_name: "خالد", tribe: "العبري", card_number: "12345678", team: { id: "team-1", name: "فريق الحزم" } }}
            type="assembly"
            hasPermission={() => true}
            onEdit={vi.fn()} onDelete={vi.fn()}
            onChangeClassification={onChangeClassification}
        />
    </MantineProvider>
);

const openMenu = () => {
    const triggers = screen.getAllByRole("button");
    fireEvent.click(triggers[triggers.length - 1]);
};

describe("بطاقة العضو في «العضوية»", () => {
    it("waiting for the club: says so, and offers no classification yet", () => {
        assemblyCard("waiting_club");
        expect(screen.getAllByText("بانتظار اعتماد النادي").length).toBeGreaterThan(0);
        openMenu();
        expect(screen.queryByText("اختيار التصنيف")).not.toBeInTheDocument();
        expect(screen.getByText(/التصنيف بعد الاعتماد/)).toBeInTheDocument();
    });

    it("approved: «اختيار التصنيف» opens the choice", () => {
        const onChange = vi.fn();
        assemblyCard("accepted", onChange);
        openMenu();
        fireEvent.click(screen.getByText("اختيار التصنيف"));
        expect(onChange).toHaveBeenCalled();
    });

    it("an older member with no status counts as approved", () => {
        assemblyCard(null);
        openMenu();
        expect(screen.getByText("اختيار التصنيف")).toBeInTheDocument();
    });

    it("rejected: says so, and offers no classification", () => {
        assemblyCard("rejected");
        expect(screen.getAllByText("رفض النادي العضوية").length).toBeGreaterThan(0);
        openMenu();
        expect(screen.queryByText("اختيار التصنيف")).not.toBeInTheDocument();
    });
});
