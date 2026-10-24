import React from "react";
import { MantineProvider } from "@mantine/core";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// إخلاء الطرف من جانب النادي.
//
// الاعتماد هنا ليس تغيير حالة فحسب — هو ما يحرّر اللاعب من فريقه فعلياً،
// ولذلك الرفض يجب أن يحمل سبباً يقرؤه الفريق بدل رفضٍ صامت لا يُفهم.

const h = vi.hoisted(() => ({
    getReleases: vi.fn(),
    releasesResult: { data: undefined as any, loading: false },
    decide: vi.fn(),
    notyfSuccess: vi.fn(),
    notyfError: vi.fn(),
}));

vi.mock("../../graphql", () => ({
    AllPlayerReleases: { kind: "Document", definitions: [] },
    useAllPlayerReleases: () => [h.getReleases, h.releasesResult],
    useDecidePlayerRelease: () => [h.decide, { loading: false }],
}));

vi.mock("notyf", () => ({
    Notyf: class { success = h.notyfSuccess; error = h.notyfError; open = vi.fn(); },
}));

import Releases from "../../pages/releases";

const release = (over: any = {}) => ({
    id: "rel-1",
    reason: "استقالة بناءً على طلب اللاعب",
    letter: "letter.pdf",
    status: "waiting",
    note: null,
    requested_at: "2026-10-24",
    decided_at: null,
    createdAt: "2026-10-24",
    team: { id: "team-1", name: "فريق الاتفاق" },
    player: { id: "p1", person: { first_name: "محمود", second_name: "بن علي", third_name: "بن سعيد", tribe: "القافري", card_number: "22161381" } },
    ...over,
});

const renderPage = () =>
    render(
        <MantineProvider theme={{ dir: "rtl" }}>
            <Releases />
        </MantineProvider>
    );

beforeEach(() => {
    vi.clearAllMocks();
    h.releasesResult = { data: { allPlayerReleases: [release()] }, loading: false };
});

describe("صفحة إخلاء الطرف (النادي)", () => {
    it("تطلب الطلبات المعلّقة أولاً", () => {
        renderPage();
        expect(h.getReleases).toHaveBeenCalledWith(
            expect.objectContaining({ variables: { status: "waiting" } })
        );
    });

    it("تعرض اللاعب وفريقه وخطاب الاستقالة", async () => {
        renderPage();
        expect(await screen.findByText(/محمود بن علي بن سعيد القافري/)).toBeInTheDocument();
        expect(screen.getByText(/22161381/)).toBeInTheDocument();
        expect(screen.getByText("خطاب الاستقالة")).toBeInTheDocument();
    });

    it("تعتمد إخلاء الطرف", async () => {
        h.decide.mockImplementation((opts: any) => opts.onCompleted());
        renderPage();

        fireEvent.click(await screen.findByRole("button", { name: /اعتماد إخلاء الطرف/ }));

        await waitFor(() => expect(h.decide).toHaveBeenCalledTimes(1));
        expect(h.decide.mock.calls[0][0].variables).toEqual({ id: "rel-1", status: "accepted" });
        expect(h.notyfSuccess).toHaveBeenCalled();
    });

    it("لا ترفض بلا سبب", async () => {
        renderPage();

        fireEvent.click(await screen.findByRole("button", { name: /^رفض$/ }));
        fireEvent.click(await screen.findByRole("button", { name: /تأكيد الرفض/ }));

        expect(h.decide).not.toHaveBeenCalled();
        expect(h.notyfError).toHaveBeenCalledWith("اذكر سبب الرفض ليصل للفريق");
    });

    it("ترفض مع السبب فيصل إلى الفريق", async () => {
        h.decide.mockImplementation((opts: any) => opts.onCompleted());
        renderPage();

        fireEvent.click(await screen.findByRole("button", { name: /^رفض$/ }));
        fireEvent.change(await screen.findByLabelText(/سبب الرفض/), { target: { value: "لم تُستكمل المستندات" } });
        fireEvent.click(screen.getByRole("button", { name: /تأكيد الرفض/ }));

        await waitFor(() => expect(h.decide).toHaveBeenCalledTimes(1));
        expect(h.decide.mock.calls[0][0].variables).toEqual({
            id: "rel-1", status: "rejected", note: "لم تُستكمل المستندات",
        });
    });

    it("لا تعرض أزرار القرار لطلب تمّ البتّ فيه", async () => {
        h.releasesResult = {
            data: { allPlayerReleases: [release({ status: "accepted", decided_at: "2026-10-24" })] },
            loading: false,
        };
        renderPage();

        expect(await screen.findByText("تم إخلاء الطرف")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /اعتماد إخلاء الطرف/ })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /^رفض$/ })).not.toBeInTheDocument();
    });

    it("تُظهر سبب الرفض للفريق", async () => {
        h.releasesResult = {
            data: { allPlayerReleases: [release({ status: "rejected", note: "ناقص خطاب" })] },
            loading: false,
        };
        renderPage();

        expect(await screen.findByText(/سبب الرفض: ناقص خطاب/)).toBeInTheDocument();
    });
});
