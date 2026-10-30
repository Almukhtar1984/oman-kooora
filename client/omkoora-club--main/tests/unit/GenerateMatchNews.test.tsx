import React from "react";
import { MantineProvider } from "@mantine/core";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// خبر المباراة يُكتب ولا يُنشر.
//
// العميل: «يوم تسوّيها في خبر ينشر مباشرة… لما يعمل توليد، يجي المحتوى في
// الحقول، ويقدر يزيد، يعدّل، أو يضيف مرفقات». فالزرّ يسلّم المسودّة لنموذج
// «إضافة خبر» ولا يحفظ شيئاً.

const h = vi.hoisted(() => ({ draft: vi.fn(), fetch: vi.fn(), notyfError: vi.fn() }));

vi.mock("../../graphql", () => ({
    useAiMatchCandidates: () => [h.fetch, {
        data: { aiMatchCandidates: [{ id: "m1", teamA: "الطموح", teamB: "الشعب", goalsA: 2, goalsB: 1, matchState: "end" }] },
        loading: false,
    }],
    useDraftMatchNews: () => [h.draft, { loading: false }],
}));
vi.mock("../../store/useStore", () => ({
    default: (selector: any) => selector({ userData: { person: {
        clubManagement: { club: { id: "club-1" } }, member: { team: { id: "team-1" } },
    } } }),
}));
vi.mock("notyf", () => ({ Notyf: class { success = vi.fn(); error = h.notyfError; } }));

import { GenerateMatchNewsModal } from "../../components/Modal/GenerateMatchNewsModal";

const DRAFT = { subject: "الطموح يتغلّب على الشعب", short_description: "فوز 2-1", description: "سطر أول\nسطر ثانٍ" };

beforeEach(() => vi.clearAllMocks());

describe("توليد خبر مباراة", () => {
    it("يسلّم الخبر المكتوب لنموذج الإضافة ولا ينشره", async () => {
        h.draft.mockImplementation((opts: any) => opts.onCompleted({ draftMatchNews: DRAFT }));
        const onDraft = vi.fn();
        render(
            <MantineProvider theme={{ dir: "rtl" }}>
                <GenerateMatchNewsModal title="توليد خبر مباراة" opened onClose={vi.fn()} onDraft={onDraft} />
            </MantineProvider>
        );

        expect(screen.queryByText("نشر مباشرة")).not.toBeInTheDocument();
        fireEvent.click(await screen.findByRole("button", { name: /كتابة الخبر/ }));

        await waitFor(() => expect(onDraft).toHaveBeenCalledWith(DRAFT));
        // المسودّة وحدها تُطلب: لا علم «نشر»، ولا نادٍ أو فريق يُحفظ له خبر.
        expect(h.draft.mock.calls[0][0].variables).toEqual({ id_match: "m1" });
    });

    it("وتعذّر الكتابة يُقال بسببه ولا يُفتح نموذجٌ فارغ", async () => {
        h.draft.mockImplementation((opts: any) => opts.onError({ graphQLErrors: [{ message: "الذكاء الاصطناعي غير مفعّل" }] }));
        const onDraft = vi.fn();
        render(
            <MantineProvider theme={{ dir: "rtl" }}>
                <GenerateMatchNewsModal title="توليد خبر مباراة" opened onClose={vi.fn()} onDraft={onDraft} />
            </MantineProvider>
        );
        fireEvent.click(await screen.findByRole("button", { name: /كتابة الخبر/ }));

        await waitFor(() => expect(h.notyfError).toHaveBeenCalledWith("الذكاء الاصطناعي غير مفعّل"));
        expect(onDraft).not.toHaveBeenCalled();
    });
});
