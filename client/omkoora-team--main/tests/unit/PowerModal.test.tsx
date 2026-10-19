import React from "react";
import { MantineProvider } from "@mantine/core";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({
    updateUser: vi.fn(),
    updatePermission: vi.fn(),
    updateAdminMember: vi.fn(),
    getMember: vi.fn(),
    memberResult: { data: undefined as any, loading: false, error: undefined },
}));

vi.mock("../../graphql", () => ({
    AllMembersHasAccount: { kind: "Document", definitions: [] },
    useMember: () => [h.getMember, h.memberResult],
    useUpdateUser: () => [h.updateUser],
    useUpdatePermission: () => [h.updatePermission],
    useUpdateAdminMember: () => [h.updateAdminMember],
}));

vi.mock("../../store/useStore", () => ({
    default: (selector: any) => selector({ userData: {} }),
}));

vi.mock("notyf", () => ({ Notyf: class { success = vi.fn(); error = vi.fn(); open = vi.fn(); } }));

import { UpdatePowerModal } from "../../components/Modal/UpdatePowerModal";

// A sub-user the club granted everything to when the team was created.
const FULL = "1,2,3,4";
const member = (overrides: Record<string, string> = {}) => ({
    id: "m-1",
    person: {
        id: "p-1",
        first_name: "أحمد",
        second_name: "بن",
        third_name: "محمد",
        tribe: "التجريبي",
        phone: "90001111",
        card_number: "1234567",
        date_birth: "1990-01-01",
        user: {
            id: "u-1",
            email: "manager@example.com",
            permission: {
                id: "perm-1",
                members: FULL, technicals: FULL, players: FULL,
                transfer_players: FULL, loan_players: FULL,
                assembly: FULL, inbox: FULL, outbox: FULL, meeting: FULL,
                blogs: FULL, forms: "1", permissions: FULL,
                complaints: FULL, expenses: FULL, leagues: FULL,
                ...overrides,
            },
        },
    },
});

const renderModal = () =>
    render(
        <MantineProvider theme={{ dir: "rtl" }}>
            <UpdatePowerModal title="تعديل الصلاحيات" opened onClose={() => {}} id="m-1" />
        </MantineProvider>
    );

const savedPermission = () => {
    // updateUser runs first and calls onCompleted, which fires updatePermission.
    const call = h.updateUser.mock.calls[0]?.[0];
    call?.onCompleted?.({ updateUser: { id: "u-1" } });
    return h.updatePermission.mock.calls[0]?.[0]?.variables?.content;
};

beforeEach(() => {
    vi.clearAllMocks();
    h.memberResult = { data: { member: member() }, loading: false, error: undefined };
});

describe("<UpdatePowerModal /> (team app) — صلاحيات الأخبار", () => {
    it("offers a news section at all", async () => {
        renderModal();
        expect(await screen.findByText("صلاحيات الاخبار")).toBeInTheDocument();
    });

    it("loads the news permission the user already has", async () => {
        renderModal();
        const group = (await screen.findByText("صلاحيات الاخبار")).closest(".mantine-CheckboxGroup-root");
        await waitFor(() => {
            const checked = Array.from(group?.querySelectorAll('input[type="checkbox"]') || [])
                .filter((c: any) => c.checked);
            expect(checked.length).toBeGreaterThan(0);
        });
    });

    // The bug: every save wrote blogs: [], so the news menu disappeared for good.
    it("keeps the news permission when the form is saved untouched", async () => {
        renderModal();
        await screen.findByText("صلاحيات الاخبار");

        fireEvent.submit(document.getElementById("submit_form")!);

        await waitFor(() => expect(h.updateUser).toHaveBeenCalled());
        expect(savedPermission()?.blogs).toEqual(FULL.split(","));
    });

    it("keeps the transfer and loan permissions too — they are not editable here", async () => {
        renderModal();
        await screen.findByText("صلاحيات الاخبار");

        fireEvent.submit(document.getElementById("submit_form")!);

        await waitFor(() => expect(h.updateUser).toHaveBeenCalled());
        const saved = savedPermission();
        expect(saved?.transfer_players).toEqual(FULL.split(","));
        expect(saved?.loan_players).toEqual(FULL.split(","));
    });

    it("saves what the admin unticks", async () => {
        renderModal();
        const label = await screen.findByText("صلاحيات الاخبار");
        const group = label.closest(".mantine-CheckboxGroup-root");
        const view = group?.querySelector('input[value="1"]') as HTMLInputElement;

        fireEvent.click(view); // untick "عرض"
        fireEvent.submit(document.getElementById("submit_form")!);

        await waitFor(() => expect(h.updateUser).toHaveBeenCalled());
        expect(savedPermission()?.blogs).not.toContain("1");
    });

    it("survives a user who has no news permission stored", async () => {
        h.memberResult = { data: { member: member({ blogs: "" }) }, loading: false, error: undefined };
        renderModal();
        await screen.findByText("صلاحيات الاخبار");

        fireEvent.submit(document.getElementById("submit_form")!);

        await waitFor(() => expect(h.updateUser).toHaveBeenCalled());
        expect(savedPermission()?.blogs).toEqual([""]);
    });
});
