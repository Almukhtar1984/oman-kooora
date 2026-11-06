import React from "react";
import { MantineProvider } from "@mantine/core";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RequestsTable } from "../../components/Tables/RequestsTable";

// «الخيارات ما تشتغل» (العميل، 2026-11-05): لمن لا يملك القبول والرفض كانت القائمة
// تُفتح فارغة بلا كلمة — خطٌّ رفيع تحت الزر.

const request = (over: any = {}) => ({
    id: "r-1",
    status: "waiting",
    type: "request",
    content: "طلب انتقال من الفريق",
    createdAt: "2026-11-05 10:00:00",
    player: { id: "p-1", person: { first_name: "سالم", second_name: "حمد", tribe: "اليحيائي", phone: "9000" } },
    ...over,
});

const mount = ({ list = [request()], search = "", allowed = true, ...props }: any = {}) => render(
    <MantineProvider>
        <RequestsTable
            list={list}
            search={search}
            hasPermission={(permission: string) => permission === "1" || allowed}
            {...props}
        />
    </MantineProvider>,
);

const menuButton = () => screen.getByRole("button", { name: "خيارات الطلب" });

describe("RequestsTable options", () => {
    it("opens with accept and reject on a waiting request", async () => {
        mount();
        fireEvent.click(menuButton());
        expect(await screen.findByRole("menuitem", { name: "قبول" })).toBeInTheDocument();
        expect(screen.getByRole("menuitem", { name: "رفض" })).toBeInTheDocument();
    });

    it("hands the decision to the status window", async () => {
        const setSelectedRow = vi.fn();
        const setOpenEditModal = vi.fn();
        mount({ setSelectedRow, setOpenEditModal });
        fireEvent.click(menuButton());
        fireEvent.click(await screen.findByRole("menuitem", { name: "قبول" }));
        await waitFor(() => expect(setOpenEditModal).toHaveBeenCalledWith(true));
        expect(setSelectedRow).toHaveBeenCalledWith(expect.objectContaining({ id: "r-1", status: "accepted" }));
    });

    it("offers finishing or refusing an accepted request", async () => {
        mount({ list: [request({ status: "accepted" })] });
        fireEvent.click(menuButton());
        expect(await screen.findByRole("menuitem", { name: "تم الانتهاء" })).toBeInTheDocument();
    });

    it("shows a disabled button, not an empty menu, without the permission", () => {
        mount({ allowed: false });
        const button = screen.getByRole("button", { name: "لا إجراء على هذا الطلب" });
        expect(button).toBeDisabled();
        expect(screen.queryByRole("button", { name: "خيارات الطلب" })).not.toBeInTheDocument();
    });

    it("offers nothing on a finished request", () => {
        mount({ list: [request({ status: "done" })] });
        expect(screen.getByRole("button", { name: "لا إجراء على هذا الطلب" })).toBeDisabled();
    });
});

describe("RequestsTable contents", () => {
    it("says which player sent the request", () => {
        mount();
        expect(screen.getByText("سالم حمد اليحيائي")).toBeInTheDocument();
    });

    it("searches by the player's name and the request's text", () => {
        const list = [request(), request({ id: "r-2", content: "شكوى أخرى", player: { person: { first_name: "خالد" } } })];
        const { unmount } = mount({ list, search: "خالد" });
        expect(screen.getByText("شكوى أخرى")).toBeInTheDocument();
        expect(screen.queryByText("طلب انتقال من الفريق")).not.toBeInTheDocument();
        unmount();
        mount({ list, search: "انتقال" });
        expect(screen.getByText("طلب انتقال من الفريق")).toBeInTheDocument();
        expect(screen.queryByText("شكوى أخرى")).not.toBeInTheDocument();
    });
});
