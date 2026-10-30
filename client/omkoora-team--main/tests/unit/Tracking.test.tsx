import React from "react";
import { MantineProvider } from "@mantine/core";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// تتبّع الطلبات من جانب الفريق.
//
// الصفحة تفتح على ما ينتظر الفريق نفسه، والدرج يقرأ الخط ويُكمل ما بقي —
// والأزرار من صلاحية الخادم لا من تخمين الواجهة.

const h = vi.hoisted(() => ({
    getFlows: vi.fn(),
    flowsResult: { data: undefined as any, loading: false },
    getFlow: vi.fn(),
    flowResult: { data: undefined as any, loading: false },
    advance: vi.fn(),
    submitReceipt: vi.fn(),
    push: vi.fn(),
    notyfError: vi.fn(),
    notyfSuccess: vi.fn(),
}));

const STAGES = [
    { stage: "draft", label: "مسودة", also: null, actor: "team", done: false },
    { stage: "submitted", label: "مقدم من الفريق", also: "بانتظار المراجعة المبدئية من النادي", actor: "club", done: false },
    { stage: "rejected_initial", label: "مرفوض مبدئياً — يتطلب المعالجة", also: null, actor: "team", done: false },
    { stage: "club_processing", label: "مقبول مبدئياً", also: "قيد استكمال إجراءات النادي", actor: "club", done: false },
    { stage: "awaiting_payment", label: "بانتظار سداد الرسوم", also: null, actor: "team", done: false },
    { stage: "paid_review", label: "تم السداد — بانتظار مراجعة النادي", also: "بانتظار الاعتماد النهائي", actor: "club", done: false },
    { stage: "approved", label: "معتمد نهائياً", also: null, actor: null, done: true },
    { stage: "rejected_final", label: "مرفوض نهائياً", also: null, actor: null, done: true },
    { stage: "cancelled", label: "ملغي", also: null, actor: null, done: true },
];

vi.mock("../../graphql", () => ({
    useMyRequestFlows: () => [h.getFlows, h.flowsResult],
    useRequestFlow: () => [h.getFlow, h.flowResult],
    useRequestFlowStages: () => ({ data: { requestFlowStages: STAGES }, loading: false }),
    useAdvanceRequestFlow: () => [h.advance, { loading: false }],
    useSubmitPaymentReceipt: () => [h.submitReceipt, { loading: false }],
}));

vi.mock("next/router", () => ({ useRouter: () => ({ push: h.push }) }));

vi.mock("notyf", () => ({
    Notyf: class { success = h.notyfSuccess; error = h.notyfError; open = vi.fn(); },
}));

import Tracking from "../../pages/tracking";

const flow = (over: any = {}) => ({
    id: "flow-1",
    request_type: "player_registration",
    request_label: "تسجيل لاعب جديد",
    subject: "سالم بن محمد الهنائي",
    entity_type: "player",
    entity_id: "player-1",
    side: "team",
    stage: "awaiting_payment",
    label: "بانتظار سداد الرسوم",
    also: null,
    actor: "team",
    done: false,
    reason: null,
    createdAt: "2026-10-28",
    payment: { id: "pay-1", label: "تسجيل لاعب", amount: 15, status: "waiting" },
    actions: [{ to: "cancelled", label: "إلغاء الطلب", needsReason: false }],
    ...over,
});

const atClub = flow({
    id: "flow-2", entity_id: "player-2", subject: "خالد بن سيف",
    stage: "submitted", label: "مقدم من الفريق",
    also: "بانتظار المراجعة المبدئية من النادي", actor: "club", payment: null,
});

const closed = flow({
    id: "flow-3", entity_id: "player-3", subject: "ناصر بن علي",
    stage: "approved", label: "معتمد نهائياً", actor: null, done: true, payment: null, actions: [],
});

const renderPage = () =>
    render(
        <MantineProvider theme={{ dir: "rtl" }}>
            <Tracking />
        </MantineProvider>
    );

beforeEach(() => {
    vi.clearAllMocks();
    h.flowsResult = { data: { myRequestFlows: [flow(), atClub, closed] }, loading: false };
    h.flowResult = { data: undefined, loading: false };
});

describe("صفحة تتبّع الطلبات (الفريق)", () => {
    it("تفتح على ما ينتظر الفريق وحده", async () => {
        renderPage();

        expect(await screen.findByText("1 بانتظارك")).toBeInTheDocument();
        expect(screen.getByText("سالم بن محمد الهنائي")).toBeInTheDocument();
        // ما هو عند النادي وما انتهى ليسا عمل الفريق الآن.
        expect(screen.queryByText("خالد بن سيف")).not.toBeInTheDocument();
        expect(screen.queryByText("ناصر بن علي")).not.toBeInTheDocument();
    });

    it("وتُظهر ما عند النادي حين يُطلب", async () => {
        renderPage();
        fireEvent.click(await screen.findByText("عند النادي"));

        expect(await screen.findByText("خالد بن سيف")).toBeInTheDocument();
        expect(screen.getByText("بانتظار المراجعة المبدئية من النادي")).toBeInTheDocument();
    });

    it("وتعرض سبب الرفض في السطر لا في الدرج وحده", async () => {
        h.flowsResult = {
            data: {
                myRequestFlows: [flow({
                    stage: "rejected_initial",
                    label: "مرفوض مبدئياً — يتطلب المعالجة",
                    reason: "صورة البطاقة غير واضحة",
                    payment: null,
                })],
            },
            loading: false,
        };
        renderPage();

        expect(await screen.findByText("السبب: صورة البطاقة غير واضحة")).toBeInTheDocument();
    });

    it("و«سدّد الرسوم» يفتح الطلب نفسه، والإيصال يُرفع فيه", async () => {
        // «ليش ما سوّيت المدفوعات في نفس مسار الطلب؟» (العميل).
        h.flowResult = {
            data: { requestFlow: flow({ events: [{ id: "e1", stage: "awaiting_payment", label: "بانتظار سداد الرسوم", note: null, actor: "club", createdAt: "2026-10-28 11:00" }] }) },
            loading: false,
        };
        h.submitReceipt.mockImplementation((opts: any) => opts.onCompleted({ submitPaymentReceipt: { status: true } }));
        renderPage();

        expect(await screen.findByText(/رسوم تسجيل لاعب: 15 ر.ع/)).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: /سدّد الرسوم/ }));
        expect(h.push).not.toHaveBeenCalled();

        expect(await screen.findByText("سداد رسوم تسجيل لاعب")).toBeInTheDocument();
        const send = screen.getByRole("button", { name: "رفع الإيصال" });
        expect(send).toBeDisabled();

        fireEvent.change(screen.getByLabelText(/الرقم المرجعي للتحويل/), { target: { value: "TR-778" } });
        const file = new File(["receipt"], "receipt.png", { type: "image/png" });
        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        fireEvent.change(input, { target: { files: [file] } });

        await waitFor(() => expect(send).not.toBeDisabled());
        fireEvent.click(send);

        await waitFor(() => expect(h.submitReceipt).toHaveBeenCalledTimes(1));
        expect(h.submitReceipt.mock.calls[0][0].variables).toMatchObject({ id: "pay-1", reference_number: "TR-778" });
        await waitFor(() => expect(h.notyfSuccess).toHaveBeenCalledWith("رُفع الإيصال — الطلب بانتظار مراجعة النادي"));
    });

    it("والدرج يقرأ الخط بترتيبه ثم يُكمل ما بقي", async () => {
        h.flowResult = {
            data: {
                requestFlow: flow({
                    stage: "club_processing",
                    label: "مقبول مبدئياً",
                    also: "قيد استكمال إجراءات النادي",
                    actor: "club",
                    payment: null,
                    events: [
                        { id: "e1", stage: "submitted", label: "مقدم من الفريق", note: null, actor: "team", createdAt: "2026-10-28 09:10" },
                        { id: "e2", stage: "rejected_initial", label: "مرفوض مبدئياً — يتطلب المعالجة", note: "صورة البطاقة غير واضحة", actor: "club", createdAt: "2026-10-28 09:30" },
                        { id: "e3", stage: "submitted", label: "مقدم من الفريق", note: null, actor: "team", createdAt: "2026-10-28 10:00" },
                        { id: "e4", stage: "club_processing", label: "مقبول مبدئياً", note: null, actor: "club", createdAt: "2026-10-28 10:20" },
                    ],
                    actions: [],
                }),
            },
            loading: false,
        };
        renderPage();
        fireEvent.click(await screen.findByRole("button", { name: "تتبّع الطلب" }));

        expect(await screen.findByText("صورة البطاقة غير واضحة")).toBeInTheDocument();

        const line = document.body.textContent || "";
        // ما مرّ بترتيبه: قُدّم، فرُفض، فأُعيد، فقُبل — ثم ما بقي بعده.
        expect(line.indexOf("09:10")).toBeLessThan(line.indexOf("09:30"));
        expect(line.indexOf("09:30")).toBeLessThan(line.indexOf("10:20"));
        expect(line.indexOf("10:20")).toBeLessThan(line.indexOf("معتمد نهائياً"));
        // والسداد من الطريق دائماً: يُرى ما بقي منه قبل الاعتماد (آخر ذكرٍ له
        // هو بقية الخط في الدرج؛ ما قبله سطر القائمة خلفه).
        const fee = line.lastIndexOf("بانتظار سداد الرسوم");
        expect(line.indexOf("10:20")).toBeLessThan(fee);
        expect(fee).toBeLessThan(line.lastIndexOf("معتمد نهائياً"));
    });

    it("ولا يرسم الدرج زراً لم يأذن به الخادم", async () => {
        h.flowResult = {
            data: {
                requestFlow: flow({
                    events: [{ id: "e1", stage: "awaiting_payment", label: "بانتظار سداد الرسوم", note: null, actor: "club", createdAt: "2026-10-28 11:00" }],
                    // الخادم لم يأذن للفريق بإعلان سداده: السداد يُسجَّل بالإيصال.
                    actions: [{ to: "cancelled", label: "إلغاء الطلب", needsReason: false }],
                }),
            },
            loading: false,
        };
        renderPage();
        fireEvent.click(await screen.findByRole("button", { name: "تتبّع الطلب" }));

        expect(await screen.findByRole("button", { name: "إلغاء الطلب" })).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /تأكيد السداد/ })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /اعتماد نهائي/ })).not.toBeInTheDocument();
    });

    it("والإلغاء لا يمرّ بضغطة واحدة", async () => {
        h.flowResult = {
            data: {
                requestFlow: flow({
                    events: [{ id: "e1", stage: "submitted", label: "مقدم من الفريق", note: null, actor: "team", createdAt: "2026-10-28 09:10" }],
                    actions: [{ to: "cancelled", label: "إلغاء الطلب", needsReason: false }],
                }),
            },
            loading: false,
        };
        renderPage();
        fireEvent.click(await screen.findByRole("button", { name: "تتبّع الطلب" }));
        fireEvent.click(await screen.findByRole("button", { name: "إلغاء الطلب" }));

        // إغلاق الطلب قرار، فيُراجَع قبل أن يُنفَّذ.
        expect(h.advance).not.toHaveBeenCalled();
        const confirm = await screen.findByRole("button", { name: /تأكيد إلغاء الطلب/ });

        fireEvent.change(screen.getByLabelText(/سبب الإلغاء/), {
            target: { value: "اللاعب سافر" },
        });
        fireEvent.click(confirm);

        await waitFor(() => expect(h.advance).toHaveBeenCalledTimes(1));
        expect(h.advance.mock.calls[0][0].variables).toEqual({
            id: "flow-1", to: "cancelled", reason: "اللاعب سافر",
        });
    });

    it("ويُعرض رفض الخادم بنصّه", async () => {
        h.flowResult = {
            data: {
                requestFlow: flow({
                    events: [{ id: "e1", stage: "submitted", label: "مقدم من الفريق", note: null, actor: "team", createdAt: "2026-10-28 09:10" }],
                    actions: [{ to: "cancelled", label: "إلغاء الطلب", needsReason: false }],
                }),
            },
            loading: false,
        };
        h.advance.mockImplementation((opts: any) => opts.onCompleted({
            advanceRequestFlow: { ok: false, code: "FLOW_CLOSED", message: "الطلب معتمد نهائياً ولا يقبل إجراءً جديداً" },
        }));
        renderPage();
        fireEvent.click(await screen.findByRole("button", { name: "تتبّع الطلب" }));
        fireEvent.click(await screen.findByRole("button", { name: "إلغاء الطلب" }));
        fireEvent.click(await screen.findByRole("button", { name: /تأكيد إلغاء الطلب/ }));

        await waitFor(() => expect(h.notyfError)
            .toHaveBeenCalledWith("الطلب معتمد نهائياً ولا يقبل إجراءً جديداً"));
    });
});
