import React from "react";
import { MantineProvider } from "@mantine/core";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// المدفوعات من جانب النادي.
//
// الدفعة تسمّي طلبها: بيان الطلب الذي كتبه النادي شيء، وسبب رفض الإيصال شيء
// آخر — ولو كُتب أحدهما فوق الآخر لعاد السؤال الذي بُنيت الشاشة لإنهائه:
// «هذه الخمسون عن أيّ طلب؟».

const h = vi.hoisted(() => ({
    getPayments: vi.fn(),
    paymentsResult: { data: undefined as any, loading: false },
    getFees: vi.fn(),
    feesResult: { data: undefined as any },
    getTeams: vi.fn(),
    teamsResult: { data: undefined as any },
    decide: vi.fn(),
    bill: vi.fn(),
    notyfSuccess: vi.fn(),
    notyfError: vi.fn(),
}));

vi.mock("../../graphql", () => ({
    useRequestPayments: () => [h.getPayments, h.paymentsResult],
    useClubFees: () => [h.getFees, h.feesResult],
    useAllTeams: () => [h.getTeams, h.teamsResult],
    useDecidePayment: () => [h.decide, { loading: false }],
    useCreateRequestPayment: () => [h.bill, { loading: false }],
}));

vi.mock("notyf", () => ({
    Notyf: class { success = h.notyfSuccess; error = h.notyfError; open = vi.fn(); },
}));

vi.mock("next/link", () => ({ default: ({ children }: any) => <>{children}</> }));

vi.mock("../../store/useStore", () => ({
    default: (selector: any) => selector({
        userData: { person: { clubManagement: { club: { id: "club-1" } } } },
    }),
}));

import Payments from "../../pages/payments";

const payment = (over: any = {}) => ({
    id: "pay-1",
    fee_type: "transfer",
    label: "انتقال لاعب",
    amount: 50,
    status: "submitted",
    reference_number: "TRX-2026-0099",
    receipt: "receipt.png",
    note: "انتقال اللاعب سالم — طلب رقم ١٤",
    decision_note: null,
    paid_at: "2026-10-27",
    decided_at: null,
    createdAt: "2026-10-27",
    team: { id: "team-1", name: "فريق الاتفاق" },
    ...over,
});

const renderPage = () =>
    render(
        <MantineProvider theme={{ dir: "rtl" }}>
            <Payments />
        </MantineProvider>
    );

beforeEach(() => {
    vi.clearAllMocks();
    h.paymentsResult = { data: { requestPayments: [payment()] }, loading: false };
    h.feesResult = {
        data: {
            clubFees: [
                { fee_type: "player_registration", label: "تسجيل لاعب", amount: 15, active: true },
                { fee_type: "transfer", label: "انتقال لاعب", amount: 50, active: true },
                { fee_type: "loan", label: "إعارة لاعب", amount: 0, active: false },
            ],
        },
    };
    h.teamsResult = { data: { allTeam: [{ id: "team-1", name: "فريق الاتفاق" }] } };
});

describe("صفحة المدفوعات (النادي)", () => {
    it("تفتح على الإيصالات المنتظرة قرار النادي", () => {
        renderPage();
        expect(h.getPayments).toHaveBeenCalledWith(
            expect.objectContaining({ variables: { status: "submitted" } })
        );
    });

    it("تعرض الفريق والمبلغ والرقم المرجعي والإيصال", async () => {
        renderPage();
        expect(await screen.findByText(/فريق الاتفاق/)).toBeInTheDocument();
        expect(screen.getByText("50 ر.ع")).toBeInTheDocument();
        expect(screen.getByText(/TRX-2026-0099/)).toBeInTheDocument();
        expect(screen.getByText("الإيصال")).toBeInTheDocument();
    });

    it("تفصل بيان الطلب عن سبب الرفض", async () => {
        h.paymentsResult = {
            data: { requestPayments: [payment({ status: "waiting", decision_note: "الإيصال غير واضح" })] },
            loading: false,
        };
        renderPage();

        expect(await screen.findByText(/بيان الطلب: انتقال اللاعب سالم/)).toBeInTheDocument();
        expect(screen.getByText(/سبب الرفض: الإيصال غير واضح/)).toBeInTheDocument();
    });

    it("تعتمد الإيصال", async () => {
        h.decide.mockImplementation((opts: any) => opts.onCompleted());
        renderPage();

        fireEvent.click(await screen.findByRole("button", { name: /اعتماد الإيصال/ }));

        await waitFor(() => expect(h.decide).toHaveBeenCalledTimes(1));
        expect(h.decide.mock.calls[0][0].variables).toEqual({ id: "pay-1", status: "accepted" });
    });

    it("لا ترفض إيصالاً بلا سبب", async () => {
        renderPage();

        fireEvent.click(await screen.findByRole("button", { name: /^رفض$/ }));
        fireEvent.click(await screen.findByRole("button", { name: /تأكيد الرفض/ }));

        expect(h.decide).not.toHaveBeenCalled();
        expect(h.notyfError).toHaveBeenCalledWith("اذكر سبب الرفض ليصل للفريق");
    });

    it("ترفض مع السبب فيعود الطلب لانتظار الدفع", async () => {
        h.decide.mockImplementation((opts: any) => opts.onCompleted());
        renderPage();

        fireEvent.click(await screen.findByRole("button", { name: /^رفض$/ }));
        fireEvent.change(await screen.findByLabelText(/سبب الرفض/), {
            target: { value: "الرقم المرجعي لا يطابق التحويل" },
        });
        fireEvent.click(screen.getByRole("button", { name: /تأكيد الرفض/ }));

        await waitFor(() => expect(h.decide).toHaveBeenCalledTimes(1));
        expect(h.decide.mock.calls[0][0].variables).toEqual({
            id: "pay-1", status: "rejected", note: "الرقم المرجعي لا يطابق التحويل",
        });
    });

    it("لا تعرض أزرار القرار لدفعة معتمدة", async () => {
        h.paymentsResult = {
            data: { requestPayments: [payment({ status: "accepted", decided_at: "2026-10-27" })] },
            loading: false,
        };
        renderPage();

        expect(await screen.findByText("معتمد")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /اعتماد الإيصال/ })).not.toBeInTheDocument();
    });

    it("لا تطالب فريقاً بلا نوع رسوم", async () => {
        renderPage();

        fireEvent.click(await screen.findByRole("button", { name: /مطالبة فريق برسوم/ }));
        fireEvent.click(await screen.findByRole("button", { name: /إرسال المطالبة/ }));

        expect(h.bill).not.toHaveBeenCalled();
        expect(h.notyfError).toHaveBeenCalledWith("اختر الفريق ونوع الرسوم");
    });

    it("ترشد النادي لضبط الأسعار قبل المطالبة", async () => {
        h.feesResult = { data: { clubFees: [{ fee_type: "loan", label: "إعارة لاعب", amount: 0, active: false }] } };
        renderPage();

        fireEvent.click(await screen.findByRole("button", { name: /مطالبة فريق برسوم/ }));

        // لا خدمة مسعّرة، فالقائمة فارغة والرسالة تقول للنادي من أين يبدأ.
        expect(await screen.findByText(/لم تسعّر أي خدمة بعد/)).toBeInTheDocument();
    });
});
