import React from "react";
import { MantineProvider } from "@mantine/core";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---- mocks ---------------------------------------------------------------

const h = vi.hoisted(() => ({
    getPlayer: vi.fn(),
    playerResult: { data: undefined as any, loading: false, error: undefined },
}));

vi.mock("../../graphql", () => ({
    AllPlayers: { kind: "Document", definitions: [] },
    useAddPlayer: () => [vi.fn()],
    useUpdatePlayer: () => [vi.fn()],
    usePlayer: () => [h.getPlayer, h.playerResult],
}));

vi.mock("../../store/useStore", () => ({
    default: (selector: any) => selector({ userData: {} }),
}));

vi.mock("notyf", () => ({
    Notyf: class {
        success = vi.fn();
        error = vi.fn();
        open = vi.fn();
    },
}));

import { AddPlayersModal } from "../../components/Modal/AddPlayersModal";
import { UpdatePlayersModal } from "../../components/Modal/UpdatePlayersModal";

// ---- helpers -------------------------------------------------------------

const player = (date_birth: any) => ({
    id: "p-1",
    status: "accepted",
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

const wrap = (ui: React.ReactElement) => render(<MantineProvider theme={{ dir: "rtl" }}>{ui}</MantineProvider>);

const birthInput = () => screen.getByPlaceholderText("تاريخ الميلاد") as HTMLInputElement;

beforeEach(() => {
    vi.clearAllMocks();
    h.playerResult = { data: undefined, loading: false, error: undefined };
});

// ---- tests ---------------------------------------------------------------

describe("AddPlayersModal — hidden on the page while another player is edited", () => {
    // The team home page passes the player being edited to this (closed) modal.
    // A birth date `new Date()` can't read used to throw from date-differencer
    // during render and blank the whole page.
    it.each(["31/12/2008", "٢٠٠٨-١٢-٣١", "Invalid Date", "39813", ""])(
        "does not crash for a stored birth date of %j",
        (date) => {
            expect(() =>
                wrap(<AddPlayersModal title="إضافة لاعب" opened={false} onClose={() => {}} data={player(date)} />)
            ).not.toThrow();
        }
    );
});

describe("AddPlayersModal — opened", () => {
    it("reads a DD/MM/YYYY birth date and asks for the guardian form for a minor", async () => {
        const birth = new Date();
        birth.setFullYear(birth.getFullYear() - 12);
        const ddmmyyyy = `${String(birth.getDate()).padStart(2, "0")}/${String(birth.getMonth() + 1).padStart(2, "0")}/${birth.getFullYear()}`;

        wrap(<AddPlayersModal title="إضافة لاعب" opened onClose={() => {}} data={player(ddmmyyyy)} />);

        await waitFor(() => expect(birthInput().value).not.toBe(""));
        expect(birthInput().value).not.toMatch(/Invalid/);
        expect(screen.getByText("استمارة موافقة ولي الامر (PDF)")).toBeInTheDocument();
    });

    it("does not ask for the guardian form for an adult", async () => {
        wrap(<AddPlayersModal title="إضافة لاعب" opened onClose={() => {}} data={player("1998-01-01")} />);
        await waitFor(() => expect(birthInput().value).toBe("01/01/1998"));
        expect(screen.queryByText("استمارة موافقة ولي الامر (PDF)")).not.toBeInTheDocument();
    });

    it("leaves the date empty (not 'Invalid Date') when the stored value is unreadable", async () => {
        wrap(<AddPlayersModal title="إضافة لاعب" opened onClose={() => {}} data={player("Invalid Date")} />);
        await waitFor(() => expect(screen.getByDisplayValue("لاعب")).toBeInTheDocument());
        expect(birthInput().value).toBe("");
    });
});

describe("UpdatePlayersModal — edit form", () => {
    it.each([
        ["1998-01-01", "01/01/1998"],
        ["31/12/2008", "12/31/2008"],
        ["٣١/١٢/٢٠٠٨", "12/31/2008"],
    ])("shows a stored birth date of %j as %s", async (stored, shown) => {
        h.playerResult = { data: { player: player(stored) }, loading: false, error: undefined };
        wrap(<UpdatePlayersModal title="تعديل لاعب" opened onClose={() => {}} id="p-1" />);

        await waitFor(() => expect(birthInput().value).toBe(shown));
    });

    it("leaves an unreadable birth date empty instead of showing 'Invalid Date'", async () => {
        h.playerResult = { data: { player: player("abc") }, loading: false, error: undefined };
        wrap(<UpdatePlayersModal title="تعديل لاعب" opened onClose={() => {}} id="p-1" />);

        await waitFor(() => expect(screen.getByDisplayValue("لاعب")).toBeInTheDocument());
        expect(birthInput().value).toBe("");
    });
});
