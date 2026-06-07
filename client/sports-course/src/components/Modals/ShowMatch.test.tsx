import { DirectionProvider, MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeAll, describe, expect, test, vi } from "vitest";
import { ShowMatch } from "./ShowMatch";

beforeAll(() => {
    Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: (query: string) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        }),
    });
});

const noop = () => {};

const buildMatch = (overrides: any) => ({
    id: "m1",
    date: "2026-05-25T18:00:00",
    matchState: "end",
    firstTeam: { id: "pt-a", team: { id: "t-a", name: "نادي دماء" } },
    secondTeam: { id: "pt-b", team: { id: "t-b", name: "نادي عوف" } },
    firstTeamGoal: 0,
    secondTeamGoal: 0,
    firstTeamScorersMatch: [],
    secondTeamScorersMatch: [],
    firstTeamCards: [],
    secondTeamCards: [],
    manOfMatch: null,
    arbitre: null,
    ...overrides,
});

const renderShowMatch = (matches: any[], leagueOverrides: any = {}) =>
    render(
        <MemoryRouter>
            <DirectionProvider initialDirection="rtl">
                <MantineProvider>
                    <ShowMatch
                        title="عرض المباريات"
                        opened={true}
                        onClose={noop}
                        data={{ id: "L1", matchs: matches, ...leagueOverrides }}
                        setSelectedData={noop}
                        setOpenEditMatchModal={noop}
                        setOpenDeleteMatchModal={noop}
                        setOpenAddMatchResultModal={noop}
                        setOpenEditMatchResultModal={noop}
                        setOpenAddMatchCardModal={noop}
                        setOpenAddManOfMatchModal={noop}
                        setOpenEditManOfMatchModal={noop}
                        setOpenAddScorerModal={noop}
                        setOpenUpdateScorerModal={noop}
                        setOpenManageRefereesModal={noop}
                        setOpenUpdateMatchStateModal={noop}
                        setOpenManageMatchCardsModal={noop}
                        setOpenManageMatchLineupModal={noop}
                    />
                </MantineProvider>
            </DirectionProvider>
        </MemoryRouter>
    );

describe("ShowMatch inline match details", () => {
    test("renders yellow and red cards with player name and minute", () => {
        const match = buildMatch({
            firstTeamCards: [
                { id: "c1", type: "yellow", player: "حسين", date: "45" },
                { id: "c2", type: "red", player: "خالد", date: "70" },
            ],
            secondTeamCards: [
                { id: "c3", type: "yellow", player: "سالم", date: "30" },
            ],
        });

        renderShowMatch([match]);

        // Player names appear in card rows
        expect(screen.getByText("حسين")).toBeInTheDocument();
        expect(screen.getByText("خالد")).toBeInTheDocument();
        expect(screen.getByText("سالم")).toBeInTheDocument();
        // Minute badges
        expect(screen.getByText("د.45")).toBeInTheDocument();
        expect(screen.getByText("د.70")).toBeInTheDocument();
        expect(screen.getByText("د.30")).toBeInTheDocument();
        // Type badges (Arabic) — at least one of each
        expect(screen.getAllByText("صفراء").length).toBeGreaterThan(0);
        expect(screen.getAllByText("حمراء").length).toBeGreaterThan(0);
    });

    test("renders man of the match badge when set", () => {
        const match = buildMatch({ manOfMatch: "حسين أحمد" });
        renderShowMatch([match]);

        expect(screen.getByText("رجل المباراة:")).toBeInTheDocument();
        expect(screen.getByText("حسين أحمد")).toBeInTheDocument();
    });

    test("omits the cards section entirely when no cards exist", () => {
        renderShowMatch([buildMatch({})]);

        expect(screen.queryByText("صفراء")).not.toBeInTheDocument();
        expect(screen.queryByText("حمراء")).not.toBeInTheDocument();
    });

    test("omits the man of the match row when manOfMatch is empty", () => {
        renderShowMatch([buildMatch({ manOfMatch: "" })]);
        expect(screen.queryByText("رجل المباراة:")).not.toBeInTheDocument();
    });

    test("renders the penalty shootout result when one was recorded", () => {
        renderShowMatch([
            buildMatch({
                firstTeamGoal: 1,
                secondTeamGoal: 1,
                penalty: { id: "pen-1", firstTeamPenalty: 5, secondTeamPenalty: 4 },
            }),
        ]);

        expect(screen.getByText("ضربات الترجيح")).toBeInTheDocument();
        expect(screen.getByText("5 - 4")).toBeInTheDocument();
    });

    test("omits the penalty row when the match had no shootout", () => {
        renderShowMatch([buildMatch({})]);
        expect(screen.queryByText("ضربات الترجيح")).not.toBeInTheDocument();
    });
});

describe("ShowMatch end-of-tournament lock", () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    const hasMenuTrigger = () =>
        screen
            .getAllByRole("button")
            .some((b) => (b as HTMLElement).querySelector("svg.tabler-icon-dots-vertical"));

    test("hides the match edit menu once the league has ended", () => {
        // Fake only Date: freezing real timers breaks Mantine transitions.
        vi.useFakeTimers({ toFake: ["Date"] });
        vi.setSystemTime(new Date("2026-09-01T12:00:00Z"));

        renderShowMatch([buildMatch({})], { expiryDate: "2026-08-01" });
        expect(hasMenuTrigger()).toBe(false);
    });

    test("keeps the match edit menu while the league is still active", () => {
        vi.useFakeTimers({ toFake: ["Date"] });
        vi.setSystemTime(new Date("2026-07-01T12:00:00Z"));

        renderShowMatch([buildMatch({})], { expiryDate: "2026-08-01" });
        expect(hasMenuTrigger()).toBe(true);
    });
});
