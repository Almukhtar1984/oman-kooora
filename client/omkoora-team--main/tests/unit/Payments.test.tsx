import React from "react";
import { MantineProvider } from "@mantine/core";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// المدفوعات من جانب الفريق.
//
// الدفع كامل، والإيصال صورة مع الرقم المرجعي للتحويل — وهما شرطان يُمنعان من
// الواجهة قبل أن يُمنعا من الخادم، كي لا يرسل الفريق ما سيُرفض.

const h = vi.hoisted(() => ({
    getPayments: vi.fn(),
    paymentsResult: { data: undefined as any, loading: false },
    submit: vi.fn(),
    submitBatch: vi.fn(),
    notyfSuccess: vi.fn(),
    notyfError: vi.fn(),
}));

vi.mock("../../graphql", () => ({
    useRequestPayments: () => [h.getPayments, h.paymentsResult],
    useSubmitPaymentReceipt: () => [h.submit, { loading: false }],
    useSubmitPaymentsReceipt: () => [h.submitBatch, { loading: false }],
}));

vi.mock("notyf", () => ({
    Notyf: class { success = h.notyfSuccess; error = h.notyfError; open = vi.fn(); },
}));

import Payments from "../../pages/payments";

const payment = (over: any = {}) => ({
    id: "pay-1",
    fee_type: "transfer",
    label: "انتقال لاعب",
    amount: 50,
    status: "waiting",
    reference_number: null,
    receipt: null,
    note: "انتقال اللاعب سالم — طلب رقم ١٤",
    decision_note: null,
    paid_at: null,
    decided_at: null,
    createdAt: "2026-10-27",
    club: { id: "club-1", name: "نادي الاتفاق" },
    ...over,
});

const renderPage = () =>
    render(
        <MantineProvider theme={{ dir: "rtl" }}>
            <Payments />
        </MantineProvider>
    );

const openDialog = async () =>
    fireEvent.click(await screen.findByRole("button", { name: /رفع الإيصال/ }));

beforeEach(() => {
    vi.clearAllMocks();
    h.paymentsResult = { data: { requestPayments: [payment()] }, loading: false };
});

describe("صفحة المدفوعات (الفريق)", () => {
    it("تجمع ما هو مطلوب الآن وحده", async () => {
        h.paymentsResult = {
            data: {
                requestPayments: [
                    payment(),
                    payment({ id: "pay-2", amount: 15, label: "تسجيل لاعب" }),
                    payment({ id: "pay-3", amount: 90, status: "accepted" }),
                ],
            },
            loading: false,
        };
        renderPage();

        // ٥٠ + ١٥ — والمعتمدة ليست ديناً.
        expect(await screen.findByText("مطلوب 65 ر.ع")).toBeInTheDocument();
    });

    it("تعرض بيان الطلب وسبب الرفض معاً", async () => {
        h.paymentsResult = {
            data: { requestPayments: [payment({ decision_note: "الإيصال غير واضح" })] },
            loading: false,
        };
        renderPage();

        expect(await screen.findByText(/بيان الطلب: انتقال اللاعب سالم/)).toBeInTheDocument();
        expect(screen.getByText(/سبب الرفض: الإيصال غير واضح/)).toBeInTheDocument();
    });

    it("تذكر المبلغ المطلوب في نافذة الرفع", async () => {
        renderPage();
        await openDialog();

        // المبلغ والطلب في جملة واحدة: ما تدفعه، وعمّ تدفعه.
        const notice = await screen.findByText(/والإيصال الذي يقلّ عن المبلغ يُرفض/);
        expect(notice.textContent).toMatch(/50 ر.ع/);
        expect(notice.textContent).toMatch(/انتقال لاعب/);
    });

    it("لا ترفع بلا رقم مرجعي", async () => {
        renderPage();
        await openDialog();

        fireEvent.click(await screen.findByRole("button", { name: /إرسال الإيصال/ }));

        expect(h.submit).not.toHaveBeenCalled();
        expect(h.notyfError).toHaveBeenCalledWith("أدخل الرقم المرجعي للتحويل");
    });

    it("ولا ترفع بلا صورة الإيصال", async () => {
        renderPage();
        await openDialog();

        fireEvent.change(await screen.findByLabelText(/الرقم المرجعي للتحويل/), {
            target: { value: "TRX-2026-0099" },
        });
        fireEvent.click(screen.getByRole("button", { name: /إرسال الإيصال/ }));

        expect(h.submit).not.toHaveBeenCalled();
        expect(h.notyfError).toHaveBeenCalledWith("أرفق صورة الإيصال");
    });

    it("ترفع الإيصال مع رقمه المرجعي", async () => {
        h.submit.mockImplementation((opts: any) => opts.onCompleted());
        renderPage();
        await openDialog();

        fireEvent.change(await screen.findByLabelText(/الرقم المرجعي للتحويل/), {
            target: { value: "TRX-2026-0099" },
        });
        const file = new File(["إيصال"], "receipt.png", { type: "image/png" });
        const input = document.querySelector("input[type=file]") as HTMLInputElement;
        fireEvent.change(input, { target: { files: [file] } });

        fireEvent.click(screen.getByRole("button", { name: /إرسال الإيصال/ }));

        await waitFor(() => expect(h.submit).toHaveBeenCalledTimes(1));
        expect(h.submit.mock.calls[0][0].variables).toEqual({
            id: "pay-1", reference_number: "TRX-2026-0099", receipt: file,
        });
        expect(h.notyfSuccess).toHaveBeenCalled();
    });

    it("لا ترفع إيصالاً على دفعة معتمدة", async () => {
        h.paymentsResult = {
            data: { requestPayments: [payment({ status: "accepted", reference_number: "TRX-88" })] },
            loading: false,
        };
        renderPage();

        expect(await screen.findByText("معتمد")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /الإيصال/ })).not.toBeInTheDocument();
    });

    it("وتسدّد عدّة مطالبات بإيصال واحد — ويرى النادي ما يخصّ كل لاعب", async () => {
        // «يرسل مية ريال مرة واحدة… النادي ما يعرف هذا مال مين» (العميل).
        h.paymentsResult = {
            data: {
                requestPayments: [
                    payment({ id: "pay-a", label: "إعارة لاعب", subject: "محمد", amount: 20 }),
                    payment({ id: "pay-b", label: "إعارة لاعب", subject: "معاوية", amount: 30 }),
                    payment({ id: "pay-c", status: "accepted", subject: "علي", amount: 20 }),
                ],
            },
            loading: false,
        };
        h.submitBatch.mockImplementation((opts: any) => opts.onCompleted({
            submitPaymentsReceipt: { status: true, message: "سُدّدت 2 مطالبات بإيصال واحد (50 ر.ع)" },
        }));
        renderPage();

        // المعتمدة لا تُختار.
        const boxes = await screen.findAllByRole("checkbox");
        expect(boxes).toHaveLength(2);
        boxes.forEach((box) => fireEvent.click(box));
        expect(screen.getByText("2 مطالبات — 50 ر.ع")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "سداد المحدّد بإيصال واحد" }));
        expect(await screen.findByText("إعارة لاعب — محمد")).toBeInTheDocument();
        expect(screen.getByText("إعارة لاعب — معاوية")).toBeInTheDocument();

        fireEvent.change(screen.getByLabelText(/الرقم المرجعي للتحويل/), { target: { value: "TR-COMP-9" } });
        const file = new File(["r"], "receipt.png", { type: "image/png" });
        fireEvent.change(document.querySelector('input[type="file"]') as HTMLInputElement, { target: { files: [file] } });
        fireEvent.click(screen.getByRole("button", { name: "إرسال الإيصال" }));

        await waitFor(() => expect(h.submitBatch).toHaveBeenCalledTimes(1));
        expect(h.submitBatch.mock.calls[0][0].variables).toMatchObject({
            ids: ["pay-a", "pay-b"], reference_number: "TR-COMP-9", amount: 50,
        });
        await waitFor(() => expect(h.notyfSuccess).toHaveBeenCalledWith("سُدّدت 2 مطالبات بإيصال واحد (50 ر.ع)"));
    });
});
