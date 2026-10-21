import React from "react";
import { MantineProvider } from "@mantine/core";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({
    getPerson: vi.fn(),
    personResult: { data: undefined as any, error: undefined },
    getAllTeam: vi.fn(),
    teamsResult: { data: { allTeam: [] as any[] } },
    associatePlayer: vi.fn(),
    notyfSuccess: vi.fn(),
    notyfError: vi.fn(),
}));

vi.mock("../../graphql", () => ({
    useGetPerson: () => [h.getPerson, h.personResult],
    useAllTeams: () => [h.getAllTeam, h.teamsResult],
    useAssociatePlayer: () => [h.associatePlayer],
}));

vi.mock("../../store/useStore", () => ({
    default: (selector: any) => selector({ userData: { person: { clubManagement: { club: { id: "club-1" } } } } }),
}));

vi.mock("notyf", () => ({
    Notyf: class { success = h.notyfSuccess; error = h.notyfError; },
}));

import { SearchPerson } from "../../components/Modal/SearchPerson";

const TEAMS = [
    { id: "team-1", name: "فريق الناشئين" },
    { id: "team-2", name: "الفريق الأول" },
];

const person = (over: any = {}) => ({
    id: "person-1",
    first_name: "أحمد", second_name: "بن", third_name: "محمد", tribe: "التجريبي",
    phone: "90001111", card_number: "1535903", date_birth: "1995-01-01",
    member: null, technicalApparatus: null,
    player: { id: "player-1", activity: "كرة القدم", status: "accepted", team: null },
    ...over,
});

const renderModal = () =>
    render(
        <MantineProvider theme={{ dir: "rtl" }}>
            <SearchPerson title="بحث بالرقم المدني" opened onClose={() => {}} data={null} />
        </MantineProvider>
    );

const attachButton = () => screen.getByRole("button", { name: /ضمّ اللاعب/ });

beforeEach(() => {
    vi.clearAllMocks();
    h.teamsResult = { data: { allTeam: TEAMS } };
    h.personResult = { data: { person: person() }, error: undefined };
});

// The club searched a civil number, saw "مسجّل سابقاً" and had nowhere to go:
// the result was read-only even when the player belonged to no team at all.
describe("<SearchPerson /> (club) — ضمّ لاعب غير منضم", () => {
    it("fetches the club's teams to choose from", () => {
        renderModal();
        expect(h.getAllTeam).toHaveBeenCalledWith(expect.objectContaining({ variables: { idClub: "club-1" } }));
    });

    it("offers the team picker when the player is on no team", async () => {
        renderModal();
        expect(await screen.findByText(/غير منضم لأي فريق/)).toBeInTheDocument();
        expect(screen.getByPlaceholderText("اختر الفريق")).toBeInTheDocument();
    });

    it("attaches the player to the team the club picks", async () => {
        h.associatePlayer.mockImplementation((opts: any) => opts.onCompleted());
        renderModal();

        userEvent.click(await screen.findByPlaceholderText("اختر الفريق"));
        fireEvent.mouseDown(await screen.findByRole("option", { name: "الفريق الأول", hidden: true }));
        await waitFor(() => expect(attachButton()).not.toBeDisabled());
        fireEvent.click(attachButton());

        await waitFor(() => expect(h.associatePlayer).toHaveBeenCalledTimes(1));
        expect(h.associatePlayer.mock.calls[0][0].variables).toEqual({
            id_player: "player-1",
            id_team: "team-2",
        });
        expect(h.notyfSuccess).toHaveBeenCalledWith("تم ضمّ اللاعب إلى الفريق");
    });

    it("will not attach before a team is chosen", async () => {
        renderModal();
        await screen.findByText(/غير منضم لأي فريق/);
        expect(attachButton()).toBeDisabled();
        expect(h.associatePlayer).not.toHaveBeenCalled();
    });

    it("reports a failed attach instead of closing silently", async () => {
        h.associatePlayer.mockImplementation((opts: any) => opts.onError(new Error("boom")));
        renderModal();

        userEvent.click(await screen.findByPlaceholderText("اختر الفريق"));
        fireEvent.mouseDown(await screen.findByRole("option", { name: "فريق الناشئين", hidden: true }));
        await waitFor(() => expect(attachButton()).not.toBeDisabled());
        fireEvent.click(attachButton());

        await waitFor(() => expect(h.notyfError).toHaveBeenCalledWith("تعذّر ضمّ اللاعب"));
    });

    it("says transfers are a different flow when the player already has a team", async () => {
        h.personResult = {
            data: { person: person({ player: { id: "player-1", team: { id: "t-9", name: "فريق آخر" } } }) },
            error: undefined,
        };
        renderModal();

        expect(await screen.findByText(/منضم بالفعل إلى فريق/)).toBeInTheDocument();
        expect(screen.queryByPlaceholderText("اختر الفريق")).not.toBeInTheDocument();
    });

    it("offers nothing to attach for a person who is not a player", async () => {
        h.personResult = { data: { person: person({ player: null }) }, error: undefined };
        renderModal();

        await waitFor(() => expect(screen.getByText("1535903")).toBeInTheDocument());
        expect(screen.queryByPlaceholderText("اختر الفريق")).not.toBeInTheDocument();
        expect(screen.queryByText(/منضم بالفعل/)).not.toBeInTheDocument();
    });
});
