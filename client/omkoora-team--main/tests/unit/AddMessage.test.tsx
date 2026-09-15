import React from "react";
import { MantineProvider } from "@mantine/core";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---- mocks ---------------------------------------------------------------

const h = vi.hoisted(() => ({
    createMessage: vi.fn(),
    getAllTeam: vi.fn(),
    teamsResult: { data: undefined as any, loading: false },
    notyfSuccess: vi.fn(),
    notyfError: vi.fn(),
    userData: undefined as any,
}));

const TEAM_MANAGER = { person: { member: { team: { id: "team-own", club: { id: "club-1" } } } } };

vi.mock("../../graphql", () => ({
    AllMessagesSender: { kind: "Document", definitions: [] },
    useAddMessage: () => [h.createMessage],
    // Mirrors Apollo 3.7 on a cache hit: `data` is there, but the per-call
    // `onCompleted` passed to the lazy executor never fires.
    useAllTeams: () => [h.getAllTeam, h.teamsResult],
}));

vi.mock("../../store/useStore", () => ({
    default: (selector: any) => selector({ userData: h.userData }),
}));

vi.mock("notyf", () => ({
    Notyf: class {
        success = h.notyfSuccess;
        error = h.notyfError;
    },
}));

import { AddMessage } from "../../components/Modal/AddMessage";

// ---- helpers -------------------------------------------------------------

const TEAMS = [
    { id: "team-own", name: "فريقي" },
    { id: "team-1", name: "فريق الناشئين" },
    { id: "team-2", name: "الفريق الأول" },
];

// The modal's focus trap grabs focus a tick after opening; a click that lands
// before that is blurred straight back out and the dropdown closes again. A
// real user can't click that fast, so wait for the trap like they would.
const waitForModalFocus = () =>
    waitFor(() => expect(document.activeElement).not.toBe(document.body));

const renderModal = async (props: Partial<React.ComponentProps<typeof AddMessage>> = {}) => {
    const onClose = vi.fn();
    const ui = (p: any) => (
        <MantineProvider theme={{ dir: "rtl" }}>
            <AddMessage title="إضافة رسالة" opened onClose={onClose} {...p} />
        </MantineProvider>
    );
    const utils = render(ui(props));
    await waitForModalFocus();
    return {
        ...utils,
        onClose,
        rerender: async (p: any = props) => {
            utils.rerender(ui(p));
            if (p.opened !== false) await waitForModalFocus();
        },
    };
};

const subjectInput = () => screen.getByPlaceholderText("الموضوع") as HTMLInputElement;
const priorityInput = () => screen.getByPlaceholderText("اختر نوع الاولوية") as HTMLInputElement;
const teamInput = () => screen.getByPlaceholderText("اختر الفريق المرسل اليه") as HTMLInputElement;
const submitButton = () => screen.getByRole("button", { name: /تأكيد/ });

// Option queries pass `hidden: true`: the dropdown lives in a portal that
// Mantine's modal focus trap marks aria-hidden, which only affects the
// accessibility tree — it is visible and clickable in the browser.
const openAndPick = async (input: HTMLInputElement, label: string) => {
    userEvent.click(input);
    // Mantine v6 picks an item on mousedown, not click.
    fireEvent.mouseDown(await screen.findByRole("option", { name: label, hidden: true }));
    await waitFor(() => expect(input.value).toBe(label));
};

const setEditorHtml = async (html: string) => {
    const pm = await waitFor(() => {
        const el = document.querySelector(".ProseMirror") as any;
        expect(el?.editor).toBeTruthy();
        return el;
    });
    act(() => {
        pm.editor.commands.setContent(html, true);
    });
};

const fileInput = () => document.querySelector('input[type="file"]') as HTMLInputElement;

const dropFiles = async (files: File[]) => {
    await act(async () => {
        fireEvent.change(fileInput(), { target: { files } });
    });
};

beforeEach(() => {
    vi.clearAllMocks();
    h.teamsResult = { data: { allTeam: TEAMS }, loading: false };
    h.userData = TEAM_MANAGER;
});

// ---- tests ---------------------------------------------------------------

describe("AddMessage (team) — dropdowns", () => {
    it("fetches the teams of the manager's club", async () => {
        await renderModal();
        expect(h.getAllTeam).toHaveBeenCalledWith(
            expect.objectContaining({ variables: { idClub: "club-1" } })
        );
    });

    it("opens the team dropdown with the club's teams even when the query answers from cache", async () => {
        await renderModal();
        userEvent.click(teamInput());

        const options = await screen.findAllByRole("option", { hidden: true });
        expect(options.map((o) => o.textContent)).toEqual(["فريقي", "فريق الناشئين", "الفريق الأول"]);
    });

    it("does not let a team message itself", async () => {
        await renderModal();
        userEvent.click(teamInput());

        const own = await screen.findByRole("option", { name: "فريقي", hidden: true });
        expect(own).toHaveAttribute("data-disabled", "true");
        fireEvent.mouseDown(own);
        await new Promise((r) => setTimeout(r, 20));
        expect(teamInput().value).toBe("");
    });

    it("still opens the team dropdown (with an explanation) when the club has no teams", async () => {
        h.teamsResult = { data: { allTeam: [] }, loading: false };
        await renderModal();
        userEvent.click(teamInput());

        expect(await screen.findByText("لا توجد فرق أخرى في النادي")).toBeInTheDocument();
    });

    it("tells the user the teams are still loading instead of showing a dead dropdown", async () => {
        h.teamsResult = { data: undefined, loading: true };
        await renderModal();
        userEvent.click(teamInput());

        expect(await screen.findByText("جاري تحميل الفرق...")).toBeInTheDocument();
    });

    it("opens the priority dropdown and selects a value", async () => {
        await renderModal();
        await openAndPick(priorityInput(), "عاجل");
        expect(priorityInput().value).toBe("عاجل");
    });

    it("renders the dropdown in a portal so the modal body does not clip it", async () => {
        const { container } = await renderModal();
        userEvent.click(teamInput());
        const option = await screen.findByRole("option", { name: "الفريق الأول", hidden: true });

        const modalContent = document.querySelector(".mantine-Modal-content") as HTMLElement;
        expect(modalContent).toBeTruthy();
        expect(modalContent.contains(option)).toBe(false);
        expect(container.contains(option)).toBe(false);
    });

    it("clears the selected team with the × button", async () => {
        await renderModal();
        await openAndPick(teamInput(), "الفريق الأول");
        expect(teamInput().value).toBe("الفريق الأول");

        const clear = teamInput().parentElement!.querySelector("button") as HTMLButtonElement;
        expect(clear).toBeTruthy();

        fireEvent.click(clear);
        await waitFor(() => expect(teamInput().value).toBe(""));
    });
});

describe("AddMessage (team) — validation & submit", () => {
    it("blocks submit and shows errors when the required fields are empty", async () => {
        await renderModal();
        fireEvent.click(submitButton());

        expect(await screen.findByText("الموضوع مطلوب")).toBeInTheDocument();
        expect(screen.getByText("اختر الاولوية")).toBeInTheDocument();
        expect(h.createMessage).not.toHaveBeenCalled();
    });

    it("sends to the club when no team is picked", async () => {
        h.createMessage.mockImplementation((opts: any) => opts.onCompleted());
        await renderModal();
        expect(screen.getByText("إذا لم تختر فريقاً سيتم إرسال الرسالة إلى النادي")).toBeInTheDocument();

        userEvent.type(subjectInput(), "إلى النادي");
        await openAndPick(priorityInput(), "عادي");
        fireEvent.click(submitButton());

        await waitFor(() => expect(h.createMessage).toHaveBeenCalledTimes(1));
        expect(h.createMessage.mock.calls[0][0].variables.content).toMatchObject({
            subject: "إلى النادي",
            priority: "normal",
            id_team_receiver: null,
            id_team_sender: "team-own",
            id_club_sender: "",
        });
    });

    it("rejects a whitespace-only subject", async () => {
        await renderModal();
        userEvent.type(subjectInput(), "   ");
        fireEvent.click(submitButton());
        expect(await screen.findByText("الموضوع مطلوب")).toBeInTheDocument();
        expect(h.createMessage).not.toHaveBeenCalled();
    });

    it("sends the message with the right payload, then closes and notifies", async () => {
        h.createMessage.mockImplementation((opts: any) => opts.onCompleted());
        const { onClose } = await renderModal();

        userEvent.type(subjectInput(), "  اجتماع  ");
        await setEditorHtml("<p>نص الرسالة</p>");
        await openAndPick(priorityInput(), "عاجل جدا");
        await openAndPick(teamInput(), "الفريق الأول");
        const pdf = new File(["%PDF"], "report.pdf", { type: "application/pdf" });
        await dropFiles([pdf]);

        fireEvent.click(submitButton());

        await waitFor(() => expect(h.createMessage).toHaveBeenCalledTimes(1));
        const { variables, refetchQueries } = h.createMessage.mock.calls[0][0];
        expect(variables.content).toEqual({
            subject: "اجتماع",
            content: "<p>نص الرسالة</p>",
            priority: "very_urgent",
            attachment: [pdf],
            id_club_sender: "",
            id_team_receiver: "team-2",
            id_team_sender: "team-own",
        });
        expect(refetchQueries).toHaveLength(1);
        expect(onClose).toHaveBeenCalled();
        expect(h.notyfSuccess).toHaveBeenCalledWith("تم ارسال الرسالة");
    });

    it("does not double-send while a send is in flight", async () => {
        h.createMessage.mockImplementation(() => {}); // never resolves
        await renderModal();
        userEvent.type(subjectInput(), "موضوع");
        await openAndPick(priorityInput(), "عادي");
        await openAndPick(teamInput(), "فريق الناشئين");

        fireEvent.click(submitButton());
        await waitFor(() => expect(h.createMessage).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(submitButton()).toBeDisabled());
        fireEvent.click(submitButton());
        expect(h.createMessage).toHaveBeenCalledTimes(1);
    });

    it("keeps the modal open with the typed data when sending fails", async () => {
        h.createMessage.mockImplementation((opts: any) => opts.onError(new Error("boom")));
        const { onClose } = await renderModal();
        userEvent.type(subjectInput(), "موضوع");
        await openAndPick(priorityInput(), "عادي");
        await openAndPick(teamInput(), "فريق الناشئين");

        fireEvent.click(submitButton());

        await waitFor(() => expect(h.notyfError).toHaveBeenCalled());
        expect(onClose).not.toHaveBeenCalled();
        expect(subjectInput().value).toBe("موضوع");
        expect(submitButton()).not.toBeDisabled();
    });

    it("clears every field, the editor and the attachments when it is closed", async () => {
        const { onClose, rerender } = await renderModal();
        userEvent.type(subjectInput(), "موضوع قديم");
        await setEditorHtml("<p>نص قديم</p>");
        await openAndPick(priorityInput(), "عاجل");
        await openAndPick(teamInput(), "الفريق الأول");
        await dropFiles([new File(["x"], "old.png", { type: "image/png" })]);
        expect(screen.getByText("old.png")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: /إلغاء/ }));
        expect(onClose).toHaveBeenCalled();

        await rerender({ opened: false });
        await rerender({ opened: true });

        await waitFor(() => expect(subjectInput().value).toBe(""));
        expect(priorityInput().value).toBe("");
        expect(teamInput().value).toBe("");
        expect(screen.queryByText("old.png")).not.toBeInTheDocument();
        expect((document.querySelector(".ProseMirror") as HTMLElement).textContent).toBe("");
    });
});

describe("AddMessage (team) — attachments", () => {
    it("accepts the document types the backend stores, not only images", async () => {
        await renderModal();
        const accept = fileInput().getAttribute("accept") || "";
        for (const type of [
            "image/png",
            "image/jpeg",
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ]) {
            expect(accept).toContain(type);
        }
        // The backend rejects these, so the picker must not offer them.
        expect(accept).not.toContain("image/gif");
        expect(accept).not.toContain("image/svg+xml");
    });

    it("adds files across several picks and lets the user remove one", async () => {
        await renderModal();
        await dropFiles([new File(["a"], "a.pdf", { type: "application/pdf" })]);
        await dropFiles([new File(["b"], "b.png", { type: "image/png" })]);

        expect(screen.getByText("a.pdf")).toBeInTheDocument();
        expect(screen.getByText("b.png")).toBeInTheDocument();

        const row = screen.getByText("a.pdf").closest("[data-attachment]") as HTMLElement;
        fireEvent.click(within(row).getByRole("button", { name: "حذف المرفق" }));

        expect(screen.queryByText("a.pdf")).not.toBeInTheDocument();
        expect(screen.getByText("b.png")).toBeInTheDocument();
    });

    it("warns about rejected files instead of dropping them silently", async () => {
        await renderModal();
        await dropFiles([new File(["x"], "virus.exe", { type: "application/x-msdownload" })]);
        await waitFor(() => expect(h.notyfError).toHaveBeenCalled());
        expect(screen.queryByText("virus.exe")).not.toBeInTheDocument();
    });
});
