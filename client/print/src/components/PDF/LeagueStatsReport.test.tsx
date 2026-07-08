import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

// jsdom-safe stand-ins for @react-pdf (same approach as the Card / MatchLineup
// tests): assert on text content, not styling.
vi.mock("@react-pdf/renderer", () => {
    const passthrough =
        (name: string) =>
        ({ children, src, style, ...rest }: any) =>
            (
                <div data-testid={`pdf-${name}`} data-src={src} {...rest}>
                    {children}
                </div>
            );
    return {
        PDFViewer: passthrough("viewer"),
        Document: passthrough("document"),
        Page: passthrough("page"),
        View: passthrough("view"),
        Text: ({ children, style, ...rest }: any) => <span {...rest}>{children}</span>,
        Image: ({ src, style, ...rest }: any) => <img data-testid="pdf-image" src={src} {...rest} />,
        Font: { register: vi.fn() },
        StyleSheet: { create: (s: any) => s },
        pdf: () => ({ toBlob: async () => new Blob() }),
    };
});

// The asset preloader (fetch + canvas downscale + QR) is covered by its own
// test (hooks/usePrintAssets.test.tsx). Here we stub it to a ready state so the
// report's render tests are deterministic and don't depend on jsdom fetch/canvas.
vi.mock("../../hooks/usePrintAssets", () => ({
    usePrintAssets: () => ({
        images: {},
        qr: {},
        progress: { imagesLoaded: 0, imagesTotal: 0, qrLoaded: 0, qrTotal: 0, ready: true, bytesIn: 0, bytesOut: 0 },
    }),
}));

import LeagueStatsReport, {
    scorerName,
    sortStanding,
    buildGroupedStandings,
    computeOverview,
    StandingsGroup,
    ScorersTable,
    CardsTable,
    AlertsSection,
    StandingRow,
} from "./LeagueStatsReport";

describe("scorerName", () => {
    it("joins the person's name parts", () => {
        expect(scorerName({ PlayerID: { player: { person: { first_name: "أحمد", second_name: "علي", tribe: "السباعي" } } } }))
            .toBe("أحمد علي السباعي");
    });
    it("returns empty string when no person", () => {
        expect(scorerName({})).toBe("");
    });
});

describe("sortStanding", () => {
    const base: StandingRow = { name: "", points: 0, matchesPlayed: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0 };
    it("ranks by points, then goal difference, then goals for", () => {
        const a = { ...base, name: "A", points: 6, goalDifference: 1, goalsFor: 5 };
        const b = { ...base, name: "B", points: 6, goalDifference: 3, goalsFor: 4 };
        const c = { ...base, name: "C", points: 9 };
        const sorted = [a, b, c].sort(sortStanding).map((r) => r.name);
        expect(sorted).toEqual(["C", "B", "A"]);
    });
});

describe("buildGroupedStandings", () => {
    const teams = [
        { team: { id: "t1", name: "النهضة", logo: "n.png" }, group: "A" },
        { team: { id: "t2", name: "النصر", logo: "s.png" }, group: "A" },
        { team: { id: "t3", name: "الوحدة", logo: "w.png" }, group: "B" },
    ];
    const ranking = [
        { team: { id: "t2", name: "النصر" }, points: 3, matchesPlayed: 1, wins: 1, draws: 0, losses: 0, goalsFor: 2, goalsAgainst: 0, goalDifference: 2, group: "A" },
    ];

    it("groups teams and puts ranked teams above zero-row teams", () => {
        const grouped = buildGroupedStandings(ranking, teams);
        const groupA = grouped.find(([g]) => g === "A")![1];
        expect(groupA.map((r) => r.name)).toEqual(["النصر", "النهضة"]); // ranked first
        expect(groupA[0].points).toBe(3);
        expect(groupA[1].points).toBe(0); // unranked team added as zero row
    });

    it("includes every participating team even with no ranking", () => {
        const grouped = buildGroupedStandings([], teams);
        const allNames = grouped.flatMap(([, rows]) => rows.map((r) => r.name));
        expect(allNames.sort()).toEqual(["النصر", "النهضة", "الوحدة"].sort());
    });

    it("carries the logo through from the participating-team list", () => {
        const grouped = buildGroupedStandings(ranking, teams);
        const nasr = grouped.find(([g]) => g === "A")![1].find((r) => r.name === "النصر");
        expect(nasr?.logo).toBe("s.png");
    });
});

describe("computeOverview", () => {
    it("derives matches played from half the summed matchesPlayed and totals cards/goals", () => {
        const ov = computeOverview(
            [{ team: { id: "t1" } }, { team: { id: "t2" } }],
            [{ matchesPlayed: 3 }, { matchesPlayed: 3 }],
            [{ Goal: 2, PlayerID: { id: "p1" } }, { Goal: 1, PlayerID: { id: "p2" } }, { Goal: 5 } as any],
            [{ count: 2 }, { count: 1 }],
            [{ count: 1 }],
        );
        expect(ov.teams).toBe(2);
        expect(ov.played).toBe(3); // (3+3)/2
        expect(ov.scorers).toBe(2); // the PlayerID-less row is excluded
        expect(ov.goals).toBe(3); // 2 + 1
        expect(ov.yellow).toBe(3);
        expect(ov.red).toBe(1);
    });
});

describe("<StandingsGroup />", () => {
    const rows: StandingRow[] = [
        { teamId: "t1", name: "النهضة", points: 6, matchesPlayed: 2, wins: 2, draws: 0, losses: 0, goalsFor: 4, goalsAgainst: 1, goalDifference: 3 },
    ];
    it("renders the team name and its points", () => {
        render(<StandingsGroup groupName="A" rows={rows} showGroupName />);
        expect(screen.getByText("النهضة")).toBeInTheDocument();
        expect(screen.getByText("المجموعة A")).toBeInTheDocument();
        expect(screen.getByText("6")).toBeInTheDocument();
    });
});

describe("<ScorersTable /> & <CardsTable />", () => {
    it("lists scorers with their name and goals", () => {
        render(<ScorersTable scorers={[{ team: "النصر", Goal: 4, PlayerID: { id: "p1", player: { person: { first_name: "خالد", second_name: "سالم" } } } }]} />);
        expect(screen.getByText("خالد سالم")).toBeInTheDocument();
        expect(screen.getByText("4")).toBeInTheDocument();
    });
    it("shows an empty note when no scorers", () => {
        render(<ScorersTable scorers={[]} />);
        expect(screen.getByText(/لا يوجد هدافون/)).toBeInTheDocument();
    });
    it("lists carded players with their count", () => {
        render(<CardsTable rows={[{ player: "عمر ناصر", number: "8", count: 2, team: { name: "الوحدة" } }]} unit="صفراء" />);
        expect(screen.getByText("عمر ناصر")).toBeInTheDocument();
        expect(screen.getByText("الوحدة")).toBeInTheDocument();
    });
});

describe("<AlertsSection />", () => {
    it("renders nothing when there are no alerts", () => {
        const { container } = render(<AlertsSection alerts={[]} />);
        expect(container).toBeEmptyDOMElement();
    });
    it("renders the player and the two consecutive matches", () => {
        render(
            <AlertsSection
                alerts={[{ player: "سعيد علي", number: "9", yellowCount: 2, team: { name: "النهضة" }, matches: [{ firstTeam: "النهضة", secondTeam: "النصر", date: "2026-07-01" }] }]}
            />,
        );
        expect(screen.getByText(/سعيد علي/)).toBeInTheDocument();
        expect(screen.getByText(/النهضة ضد النصر/)).toBeInTheDocument();
    });
});

describe("<LeagueStatsReport />", () => {
    it("shows an empty state when there is no data", () => {
        render(<LeagueStatsReport data={{}} />);
        expect(screen.getByTestId("league-stats-empty")).toBeInTheDocument();
        expect(screen.queryByTestId("league-stats-pdfviewer")).not.toBeInTheDocument();
    });

    it("renders the report (viewer + standings) once data is present", () => {
        // No logos → the asset preloader has nothing to fetch, so progress is
        // ready immediately and the viewer mounts synchronously.
        render(
            <LeagueStatsReport
                data={{
                    leagueName: "دورة الصداقة",
                    participatingTeams: [{ team: { id: "t1", name: "النهضة" }, group: "A" }],
                    ranking: [{ team: { id: "t1", name: "النهضة" }, points: 3, matchesPlayed: 1, wins: 1, draws: 0, losses: 0, goalsFor: 2, goalsAgainst: 0, goalDifference: 2, group: "A" }],
                    scorers: [{ team: "النهضة", Goal: 1, PlayerID: { id: "p1", player: { person: { first_name: "أحمد" } } } }],
                    yellowCards: [],
                    redCards: [],
                    alerts: [],
                }}
            />,
        );
        expect(screen.getByTestId("league-stats-pdfviewer")).toBeInTheDocument();
        expect(screen.getAllByText("النهضة").length).toBeGreaterThan(0);
        expect(screen.getByText("دورة الصداقة")).toBeInTheDocument();
        expect(screen.getByText("أحمد")).toBeInTheDocument();
    });
});
