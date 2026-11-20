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

// حقول المستندات: الاستمارتان ملفٌ واحد لكلٍّ منهما، و«مرفقات أخرى» عدة ملفات.
const DOC_ACCEPT = ".pdf,.jpg,.jpeg,.png,.doc,.docx";
const docInputs = () => Array.from(document.querySelectorAll(`input[type="file"][accept="${DOC_ACCEPT}"]`)) as HTMLInputElement[];
const pdf = (name: string) => new File(["%PDF"], name, { type: "application/pdf" });
const attach = (input: HTMLInputElement, ...files: File[]) => fireEvent.change(input, { target: { files } });
const formInputs = () => docInputs().filter((input) => !input.multiple);
const extrasInput = () => docInputs().find((input) => input.multiple) as HTMLInputElement;

const fillMember = (birth = "2000-03-15") => {
    type("الاسم الأول", "سالم");
    type("الاسم الثاني", "خالد");
    type("القبيلة", "العبري");
    type("الرقم المدني", "١٢٣٤٥٦٧٨");
    type("رقم الهاتف", "٩٩١٢٣٤٥٦");
    fireEvent.change(screen.getByLabelText("تاريخ الميلاد"), { target: { value: birth } });
};
const send = () => fireEvent.click(screen.getByRole("button", { name: "إرسال إلى النادي" }));

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
        fillMember();
        attach(formInputs()[0], pdf("membership.pdf"));
        send();

        await waitFor(() => expect(h.register).toHaveBeenCalled());
        const content = h.register.mock.calls[0][0].variables.content;
        expect(content).toMatchObject({
            first_name: "سالم", second_name: "خالد", tribe: "العبري",
            card_number: "12345678", phone: "99123456", date_birth: "2000-03-15",
        });
        expect(content.membership_form.name).toBe("membership.pdf");
        // البالغ لا تعهد له.
        expect(content.guardian_form).toBeNull();
        await waitFor(() => expect(onRegistered).toHaveBeenCalled());
    });

    // «استمارة طلب العضوية، وإذا كان أقل من 18 تعهد ولي الأمر» (العميل، 2026-11-19).
    it("sends nothing without the membership application form", async () => {
        renderModal();
        fillMember();
        send();
        expect(await screen.findByText("أرفق استمارة طلب العضوية")).toBeInTheDocument();
        expect(h.register).not.toHaveBeenCalled();
    });

    it("asks an adult for no guardian's undertaking", () => {
        renderModal();
        fillMember("2000-03-15");
        expect(screen.queryByText("تعهد ولي الأمر")).not.toBeInTheDocument();
        expect(formInputs()).toHaveLength(1);
    });

    it("a member under 18 needs the guardian's undertaking too", async () => {
        renderModal();
        fillMember("2014-01-07");
        expect(await screen.findByText("تعهد ولي الأمر")).toBeInTheDocument();
        attach(formInputs()[0], pdf("membership.pdf"));
        send();
        expect(await screen.findByText(/أرفق تعهد ولي الأمر/)).toBeInTheDocument();
        expect(h.register).not.toHaveBeenCalled();

        attach(formInputs()[1], pdf("guardian.pdf"));
        send();
        await waitFor(() => expect(h.register).toHaveBeenCalled());
        const content = h.register.mock.calls[0][0].variables.content;
        expect([content.membership_form.name, content.guardian_form.name]).toEqual(["membership.pdf", "guardian.pdf"]);
    });

    it("sends any other attachments, at most five", async () => {
        renderModal();
        fillMember();
        attach(formInputs()[0], pdf("membership.pdf"));
        attach(extrasInput(), ...[1, 2, 3, 4, 5, 6].map((n) => pdf(`doc-${n}.pdf`)));
        send();
        expect(await screen.findByText("5 ملفات على الأكثر")).toBeInTheDocument();
        expect(h.register).not.toHaveBeenCalled();

        attach(extrasInput(), pdf("guardian-card.pdf"), pdf("certificate.pdf"));
        send();
        await waitFor(() => expect(h.register).toHaveBeenCalled());
        expect(h.register.mock.calls[0][0].variables.content.attachments.map((f: File) => f.name))
            .toEqual(["guardian-card.pdf", "certificate.pdf"]);
    });

    it("shows the server's reason when the club already has this person", async () => {
        h.register.mockRejectedValue({ graphQLErrors: [{ message: "صاحب هذا الرقم المدني عضوٌ مسجَّل في فريق النصر" }] });
        renderModal();
        type("الاسم الأول", "سالم"); type("الاسم الثاني", "خالد"); type("القبيلة", "العبري");
        type("الرقم المدني", "12345678"); type("رقم الهاتف", "99123456");
        fireEvent.change(screen.getByLabelText("تاريخ الميلاد"), { target: { value: "2000-03-15" } });
        attach(formInputs()[0], pdf("membership.pdf"));
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
