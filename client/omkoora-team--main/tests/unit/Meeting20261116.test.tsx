import React from "react";
import { MantineProvider } from "@mantine/core";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// اجتماع العميل 2026-11-16: الفريق يطلب استقالة لاعبه وانتقاله من بطاقته، والتعليق
// يظهر في قائمة الرسائل نفسها، ومستندات الرسالة والتعليق ظاهرة.

const h = vi.hoisted(() => ({
    createRelease: vi.fn(),
    notyfSuccess: vi.fn(),
    notyfError: vi.fn(),
}));

vi.mock("../../graphql", () => ({
    AllPlayers: { kind: "Document", definitions: [] },
    useCreatePlayerRelease: () => [h.createRelease, { loading: false }],
}));

vi.mock("notyf", () => ({
    Notyf: class { success = h.notyfSuccess; error = h.notyfError; open = vi.fn(); },
}));

vi.mock("../../store/useStore", () => ({
    default: (selector: any) =>
        selector({ userData: { person: { member: { team: { id: "team-1", name: "فريق النصر" } } } } }),
}));

vi.mock("../../lib/helpers/openPrint", () => ({ openPrint: vi.fn() }));

import { RequestReleaseModal } from "../../components/Modal/RequestReleaseModal";
import { MemberCard } from "../../components/Card/MemberCard";
import { CommentsBadge } from "../../components/Messages/CommentsBadge";
import { AttachmentLinks, fileKind } from "../../components/Messages/AttachmentLinks";

const wrap = (node: React.ReactNode) => render(<MantineProvider theme={{ dir: "rtl" }}>{node}</MantineProvider>);

const player = {
    id: "p1", status: "accepted",
    person: { id: "person-1", first_name: "شهاب", second_name: "أحمد", tribe: "الهنائي", card_number: "27130289" },
    team: { id: "team-1", name: "فريق النصر" },
};

beforeEach(() => {
    vi.clearAllMocks();
    h.createRelease.mockResolvedValue({ data: { createPlayerRelease: { id: "r1", status: "waiting" } } });
});

describe("طلب استقالة لاعب من الفريق", () => {
    it("says where the request goes and how the player ends up free", () => {
        wrap(<RequestReleaseModal opened title="طلب استقالة لاعب" data={player} idTeam="team-1" onClose={() => {}} />);
        expect(screen.getByText(/يصبح لاعباً حراً يمكن لأي فريق تسجيله/)).toBeInTheDocument();
    });

    it("asks for a reason before sending", () => {
        wrap(<RequestReleaseModal opened title="t" data={player} idTeam="team-1" onClose={() => {}} />);
        fireEvent.click(screen.getByRole("button", { name: "إرسال طلب الاستقالة" }));
        expect(screen.getByText("اكتب سبب الاستقالة")).toBeInTheDocument();
        expect(h.createRelease).not.toHaveBeenCalled();
    });

    it("sends the player and the reason to the club", async () => {
        const onClose = vi.fn();
        wrap(<RequestReleaseModal opened title="t" data={player} idTeam="team-1" onClose={onClose} />);
        fireEvent.change(screen.getByPlaceholderText("مثال: بناءً على طلب اللاعب"), { target: { value: "بناءً على طلب اللاعب" } });
        fireEvent.click(screen.getByRole("button", { name: "إرسال طلب الاستقالة" }));
        await waitFor(() => expect(h.createRelease).toHaveBeenCalled());
        expect(h.createRelease.mock.calls[0][0].variables.content).toMatchObject({ id_player: "p1", reason: "بناءً على طلب اللاعب" });
        await waitFor(() => expect(onClose).toHaveBeenCalled());
    });

    it("shows the server's refusal as it is", async () => {
        h.createRelease.mockRejectedValue({ graphQLErrors: [{ message: "يوجد طلب إخلاء طرف قيد الدراسة لهذا اللاعب" }] });
        wrap(<RequestReleaseModal opened title="t" data={player} idTeam="team-1" onClose={() => {}} />);
        fireEvent.change(screen.getByPlaceholderText("مثال: بناءً على طلب اللاعب"), { target: { value: "سبب" } });
        fireEvent.click(screen.getByRole("button", { name: "إرسال طلب الاستقالة" }));
        await waitFor(() => expect(h.notyfError).toHaveBeenCalledWith(
            expect.objectContaining({ message: "يوجد طلب إخلاء طرف قيد الدراسة لهذا اللاعب" })));
    });
});

describe("بطاقة اللاعب المعتمد", () => {
    const openMenu = () => {
        const triggers = screen.getAllByRole("button");
        fireEvent.click(triggers[triggers.length - 1]);
    };

    it("offers transfer and resignation beside the loan", () => {
        const onTransfer = vi.fn(), onRelease = vi.fn();
        wrap(<MemberCard data={player} type="player" hasPermission={() => true}
            onLoanPlayer={vi.fn()} onTransferPlayer={onTransfer} onRequestRelease={onRelease} />);
        openMenu();
        expect(screen.getByText("إعارة اللاعب")).toBeInTheDocument();
        fireEvent.click(screen.getByText("انتقال اللاعب"));
        expect(onTransfer).toHaveBeenCalledWith(player);
        openMenu();
        fireEvent.click(screen.getByText("طلب استقالة اللاعب"));
        expect(onRelease).toHaveBeenCalledWith(player);
    });

    it("keeps them away from an account without the permission", () => {
        wrap(<MemberCard data={player} type="player" hasPermission={(p: string) => p !== "2"}
            onTransferPlayer={vi.fn()} onRequestRelease={vi.fn()} />);
        openMenu();
        expect(screen.queryByText("انتقال اللاعب")).not.toBeInTheDocument();
        expect(screen.queryByText("طلب استقالة اللاعب")).not.toBeInTheDocument();
    });
});

describe("التعليقات والمستندات ظاهرة", () => {
    it("the list says a message has comments, and opens them", () => {
        const open = vi.fn();
        wrap(<CommentsBadge count={2} onClick={open} />);
        fireEvent.click(screen.getByRole("button", { name: "عرض التعليقات (2)" }));
        expect(open).toHaveBeenCalled();
    });

    it("says nothing when there is no comment", () => {
        const { container } = wrap(<CommentsBadge count={0} />);
        expect(container.textContent).toBe("");
    });

    it("names each document by its kind, and says when there is none", () => {
        expect([fileKind("a.PDF"), fileKind("b.docx"), fileKind("c.JPG"), fileKind("d.xlsx")]).toEqual(["PDF", "Word", "صورة", "Excel"]);
        wrap(<AttachmentLinks items={[{ id: "1", content: "x.PDF" }]} />);
        expect(screen.getByRole("link", { name: /مستند \(PDF\)/ })).toBeInTheDocument();
    });

    it("an empty list reads as such instead of nothing", () => {
        wrap(<AttachmentLinks items={[]} empty="لا توجد مرفقات في هذه الرسالة" />);
        expect(screen.getByText("لا توجد مرفقات في هذه الرسالة")).toBeInTheDocument();
    });
});
