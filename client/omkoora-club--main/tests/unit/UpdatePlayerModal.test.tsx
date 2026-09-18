import React from "react";
import { MantineProvider } from "@mantine/core";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({
    getPlayer: vi.fn(),
    updatePlayer: vi.fn(),
    playerResult: { data: undefined as any, loading: false, error: undefined },
}));

vi.mock("../../graphql", () => ({
    AllPlayers: { kind: "Document", definitions: [] },
    AllTechnicals: { kind: "Document", definitions: [] },
    useUpdatePlayer: () => [h.updatePlayer],
    usePlayer: () => [h.getPlayer, h.playerResult],
}));

vi.mock("../../store/useStore", () => ({
    default: (selector: any) => selector({ userData: {} }),
}));

vi.mock("notyf", () => ({
    Notyf: class {
        success = vi.fn();
        error = vi.fn();
    },
}));

import { UpdatePlayerModal } from "../../components/Modal/UpdatePlayerModal";

const player = (date_birth: any) => ({
    id: "p-1",
    class: "young",
    activity: "كرة القدم",
    player_center: "وسط",
    job: "طالب",
    person: {
        id: "person-1",
        first_name: "لاعب",
        second_name: "بن",
        third_name: "محمد",
        tribe: "التجريبي",
        phone: "90001052",
        card_number: "1052",
        date_birth,
    },
});

const renderWith = (date_birth: any) => {
    h.playerResult = { data: { player: player(date_birth) }, loading: false, error: undefined };
    return render(
        <MantineProvider theme={{ dir: "rtl" }}>
            <UpdatePlayerModal title="تعديل اللاعب" opened onClose={() => {}} id="p-1" />
        </MantineProvider>
    );
};

const birthInput = () => screen.getByPlaceholderText("تاريخ الميلاد") as HTMLInputElement;

beforeEach(() => {
    vi.clearAllMocks();
    h.updatePlayer.mockResolvedValue({});
});

describe("UpdatePlayerModal (club) — stored birth dates", () => {
    it.each([
        ["1998-01-01", "01/01/1998"],
        ["31/12/2008", "12/31/2008"],
        ["٣١/١٢/٢٠٠٨", "12/31/2008"],
        ["39813", "12/31/2008"],
    ])("opens with %j shown as %s", async (stored, shown) => {
        renderWith(stored);
        await waitFor(() => expect(birthInput().value).toBe(shown));
    });

    it("opens (without crashing) on an unreadable date and leaves it empty", async () => {
        renderWith("abc");
        await waitFor(() => expect(screen.getByDisplayValue("لاعب")).toBeInTheDocument());
        expect(birthInput().value).toBe("");
    });

    it("saves a DD/MM/YYYY date back as YYYY-MM-DD", async () => {
        renderWith("31/12/2008");
        await waitFor(() => expect(birthInput().value).toBe("12/31/2008"));

        fireEvent.submit(document.getElementById("submit_form")!);

        await waitFor(() => expect(h.updatePlayer).toHaveBeenCalledTimes(1));
        expect(h.updatePlayer.mock.calls[0][0].variables.content.person.date_birth).toBe("2008-12-31");
    });

    it("refuses to save an unreadable date as the text 'Invalid Date'", async () => {
        renderWith("abc");
        await waitFor(() => expect(screen.getByDisplayValue("لاعب")).toBeInTheDocument());

        fireEvent.submit(document.getElementById("submit_form")!);

        expect(await screen.findByText("تاريخ الميلاد مطلوب")).toBeInTheDocument();
        expect(h.updatePlayer).not.toHaveBeenCalled();
    });
});
