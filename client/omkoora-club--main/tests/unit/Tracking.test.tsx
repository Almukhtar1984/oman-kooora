import React from "react";
import { MantineProvider } from "@mantine/core";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

// مسار الطلبات من جانب النادي.
//
// اللوحة تفتح على ما ينتظر قرار النادي، والأزرار تُبنى من صلاحية الخادم.
// والرفض لا يمرّ بلا سبب — فهو ما كان الفريق يُحرم منه أصلاً.

const h = vi.hoisted(() => ({
    getFlows: vi.fn(),
    flowsResult: { data: undefined as any, loading: false },
    getFlow: vi.fn(),
    flowResult: { data: undefined as any, loading: false },
    advance: vi.fn(),
    notyfError: vi.fn(),
    notyfSuccess: vi.fn(),
}));

const STAGES = [
    { stage: "submitted", label: "مقدم من الفريق", also: "بانتظار المراجعة المبدئية من النادي", actor: "club", done: false },
    { stage: "club_processing", label: "مقبول مبدئياً", also: "قيد استكمال إجراءات النادي", actor: "club", done: false },
    { stage: "awaiting_payment", label: "بانتظار سداد الرسوم", also: null, actor: "team", done: false },
    { stage: "paid_review", label: "تم السداد — بانتظار مراجعة النادي", also: "بانتظار الاعتماد النهائي", actor: "club", done: false },
    { stage: "approved", label: "معتمد نهائياً", also: null, actor: null, done: true },
];

vi.mock("../../graphql", () => ({
    useMyRequestFlows: () => [h.getFlows, h.flowsResult],
    useRequestFlow: () => [h.getFlow, h.flowResult],
    useRequestFlowStages: () => ({ data: { requestFlowStages: STAGES }, loading: false }),
    useAdvanceRequestFlow: () => [h.advance, { loading: false }],
    useAllTeams: () => [vi.fn(), { data: { allTeam: [] } }],
    useUpdateTransfer: () => [vi.fn(), { loading: false }],
}));

vi.mock("../../store/useStore", () => ({
    default: (selector: any) => selector({ userData: { person: { clubManagement: { club: { id: "club-1" } } } } }),
}));

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
    side: "club",
    stage: "submitted",
    label: "مقدم من الفريق",
    also: "بانتظار المراجعة المبدئية من النادي",
    actor: "club",
    done: false,
    reason: null,
    createdAt: "2026-10-28",
    payment: null,
    actions: [
        { to: "club_processing", label: "قبول مبدئي", needsReason: false },
        { to: "rejected_initial", label: "رفض مبدئي (مع السبب)", needsReason: true },
        { to: "cancelled", label: "إلغاء الطلب", needsReason: false },
    ],
    ...over,
});

const atTeam = flow({
    id: "flow-2", request_type: "transfer", request_label: "انتقال لاعب",
    entity_type: "transfer", entity_id: "transfer-2", subject: "خالد بن سيف",
    stage: "awaiting_payment", label: "بانتظار سداد الرسوم", also: null, actor: "team",
    payment: { id: "pay-1", label: "انتقال لاعب", amount: 50, status: "waiting" },
    actions: [{ to: "cancelled", label: "إلغاء الطلب", needsReason: false }],
});

// بعد القبول المبدئي: الرسوم قرارٌ أمام النادي — مبلغ أو إعفاء.
const atFee = flow({
    id: "flow-3", request_type: "loan", request_label: "إعارة لاعب",
    entity_type: "transfer", entity_id: "transfer-3", subject: "ناصر بن علي",
    stage: "club_processing", label: "مقبول مبدئياً", also: "قيد استكمال إجراءات النادي",
    suggestedAmount: 25,
    actions: [
        { to: "awaiting_payment", label: "مطالبة بالرسوم", kind: "bill", needsAmount: true, needsReason: false },
        { to: "paid_review", label: "إعفاء من الرسوم", kind: "waive", needsAmount: false, needsReason: true },
        { to: "rejected_final", label: "رفض نهائي (مع السبب)", needsReason: true },
        { to: "cancelled", label: "إلغاء الطلب", needsReason: false },
    ],
});

// سُدّدت رسومه بإيصال، ينتظر الاعتماد.
const paid = (id: string, subject: string) => flow({
    id, entity_id: `${id}-entity`, subject,
    stage: "paid_review", label: "تم السداد — بانتظار مراجعة النادي", also: "بانتظار الاعتماد النهائي",
    payment: { id: `${id}-pay`, label: "تسجيل لاعب", amount: 15, status: "submitted", reference_number: "TR-100" },
    actions: [
        { to: "approved", label: "اعتماد نهائي", needsReason: false },
        { to: "awaiting_payment", label: "ردّ الإيصال للسداد", kind: "return_receipt", needsReason: false },
        { to: "cancelled", label: "إلغاء الطلب", needsReason: false },
    ],
});

const renderPage = () =>
    render(
        <MantineProvider theme={{ dir: "rtl" }}>
            <Tracking />
        </MantineProvider>
    );

const openTrack = async () =>
    fireEvent.click(await screen.findByRole("button", { name: "فتح المسار" }));

// القوائم في Mantine v6 تختار على mousedown لا على click، وقائمتها في بوابة
// يُعلّمها الـfocus trap بـaria-hidden — فتُطلب بـhidden: true.
const pick = async (input: HTMLElement, label: string) => {
    await userEvent.click(input);
    fireEvent.mouseDown(await screen.findByRole("option", { name: label, hidden: true }));
};

beforeEach(() => {
    vi.clearAllMocks();
    h.flowsResult = { data: { myRequestFlows: [flow(), atTeam] }, loading: false };
    h.flowResult = { data: { requestFlow: flow({
        events: [{ id: "e1", stage: "submitted", label: "مقدم من الفريق", note: null, actor: "team", createdAt: "2026-10-28 09:10" }],
    }) }, loading: false };
});

describe("لوحة مسار الطلبات (النادي)", () => {
    it("تفتح على ما ينتظر قرار النادي", async () => {
        renderPage();

        expect(await screen.findByText("1 بانتظار قرارك")).toBeInTheDocument();
        expect(screen.getByText("سالم بن محمد الهنائي")).toBeInTheDocument();
        // ما ينتظر سداد الفريق ليس في ملعب النادي.
        expect(screen.queryByText("خالد بن سيف")).not.toBeInTheDocument();
    });

    it("وتُظهر ما هو عند الفريق حين يُطلب، بمطالبته", async () => {
        renderPage();
        fireEvent.click(await screen.findByText("عند الفريق"));

        expect(await screen.findByText("خالد بن سيف")).toBeInTheDocument();
        expect(screen.getByText(/رسوم انتقال لاعب: 50 ر.ع/)).toBeInTheDocument();
    });

    it("وترشّح بنوع الطلب من الخادم لا في الذاكرة", async () => {
        renderPage();
        await waitFor(() => expect(h.getFlows).toHaveBeenCalled());
        h.getFlows.mockClear();

        await pick(screen.getByPlaceholderText("كل الأنواع"), "إعارة لاعب");

        await waitFor(() => expect(h.getFlows).toHaveBeenCalled());
        expect(h.getFlows.mock.calls[0][0].variables).toEqual({ request_type: "loan" });
    });

    it("والرفض لا يمرّ بلا سبب", async () => {
        renderPage();
        await openTrack();
        fireEvent.click(await screen.findByRole("button", { name: "رفض مبدئي (مع السبب)" }));

        const confirm = await screen.findByRole("button", { name: /تأكيد رفض مبدئي/ });
        expect(h.advance).not.toHaveBeenCalled();
        // زرٌّ معطّل أصدق من رفض يعود من الخادم.
        expect(confirm).toBeDisabled();

        fireEvent.change(screen.getByLabelText(/سبب القرار/), {
            target: { value: "شهادة إخلاء الطرف ناقصة" },
        });
        expect(confirm).not.toBeDisabled();
        fireEvent.click(confirm);

        await waitFor(() => expect(h.advance).toHaveBeenCalledTimes(1));
        expect(h.advance.mock.calls[0][0].variables).toEqual({
            id: "flow-1", to: "rejected_initial", reason: "شهادة إخلاء الطرف ناقصة",
        });
    });

    it("والقبول المبدئي يمرّ بضغطة، ويُحدِّث اللوحة بعده", async () => {
        h.advance.mockImplementation((opts: any) => opts.onCompleted({
            advanceRequestFlow: { ok: true, code: null, message: "الطلب الآن: مقبول مبدئياً" },
        }));
        renderPage();
        await waitFor(() => expect(h.getFlows).toHaveBeenCalled());
        h.getFlows.mockClear();

        await openTrack();
        fireEvent.click(await screen.findByRole("button", { name: "قبول مبدئي" }));

        await waitFor(() => expect(h.advance).toHaveBeenCalledTimes(1));
        expect(h.advance.mock.calls[0][0].variables).toEqual({
            id: "flow-1", to: "club_processing", reason: null,
        });
        // القرار يغيّر اللوحة، فتُقرأ من الخادم لا من المخزن.
        await waitFor(() => expect(h.getFlows).toHaveBeenCalled());
    });

    it("والرسوم بعد القبول المبدئي: المبلغ مقترحٌ من سعر النادي، ولا زرّ اعتماد يتخطّاها", async () => {
        h.flowResult = { data: { requestFlow: { ...atFee, events: [] } }, loading: false };
        renderPage();
        await openTrack();

        expect(await screen.findByText("رسوم إعارة لاعب")).toBeInTheDocument();
        expect(screen.getByDisplayValue("25.00")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "اعتماد نهائي" })).not.toBeInTheDocument();
        // المطالبة والإعفاء في لوحة الرسوم، لا مكرّرةً بين أزرار الخط.
        expect(screen.getAllByRole("button", { name: /إعفاء من الرسوم/ })).toHaveLength(1);

        fireEvent.click(screen.getByRole("button", { name: /مطالبة الفريق بـ/ }));
        await waitFor(() => expect(h.advance).toHaveBeenCalledTimes(1));
        expect(h.advance.mock.calls[0][0].variables).toEqual({
            id: "flow-3", to: "awaiting_payment", reason: null, amount: 25,
        });
    });

    it("والإعفاء لا يمرّ بلا سبب يُكتب في الخط", async () => {
        h.flowResult = { data: { requestFlow: { ...atFee, events: [] } }, loading: false };
        renderPage();
        await openTrack();

        fireEvent.click(await screen.findByRole("button", { name: "إعفاء من الرسوم" }));
        const confirm = await screen.findByRole("button", { name: "تأكيد الإعفاء" });
        expect(confirm).toBeDisabled();

        fireEvent.click(screen.getByText("إعارة مجانية"));
        expect(confirm).not.toBeDisabled();
        fireEvent.click(confirm);

        await waitFor(() => expect(h.advance).toHaveBeenCalledTimes(1));
        expect(h.advance.mock.calls[0][0].variables).toEqual({
            id: "flow-3", to: "paid_review", reason: "إعارة مجانية", amount: null,
        });
    });

    it("وما سُدّد يُعتمد معاً — موسم المسابقات", async () => {
        h.flowsResult = { data: { myRequestFlows: [paid("p1", "محمد"), paid("p2", "معاوية"), atTeam] }, loading: false };
        h.advance.mockResolvedValue({ data: { advanceRequestFlow: { ok: true } } });
        renderPage();

        const boxes = await screen.findAllByRole("checkbox");
        expect(boxes).toHaveLength(2);
        boxes.forEach((box) => fireEvent.click(box));
        fireEvent.click(await screen.findByRole("button", { name: "اعتماد نهائي للمحدّد" }));

        await waitFor(() => expect(h.advance).toHaveBeenCalledTimes(2));
        expect(h.advance.mock.calls.map((call: any) => call[0].variables)).toEqual([
            { id: "p1", to: "approved" }, { id: "p2", to: "approved" },
        ]);
        await waitFor(() => expect(h.notyfSuccess).toHaveBeenCalledWith("اعتُمد 2 طلبات نهائياً"));
    });
});
