import { describe, expect, test } from "vitest";
import {
    collectIncidents,
    computeFinalPlacements,
    computeStageCards,
    computeStageScorers,
    matchTypeLabel,
} from "./LeagueStats";

const TEAM_A = "pt-a";
const TEAM_B = "pt-b";

const makeMatch = (overrides: any) => ({
    type: "groups",
    date: "2026-05-20T18:00:00",
    firstTeam: { id: TEAM_A, team: { id: "t-a", name: "نادي دماء" } },
    secondTeam: { id: TEAM_B, team: { id: "t-b", name: "نادي عوف" } },
    firstTeamCards: [],
    secondTeamCards: [],
    ...overrides,
});

describe("matchTypeLabel", () => {
    test("translates known match types to Arabic", () => {
        expect(matchTypeLabel("groups")).toBe("دوري المجموعات");
        expect(matchTypeLabel("quarter-finals")).toBe("ربع النهائي");
        expect(matchTypeLabel("final")).toBe("النهائي");
    });

    test("falls back to the raw value when type is unknown", () => {
        expect(matchTypeLabel("custom-type")).toBe("custom-type");
    });

    test("returns empty string for null/undefined", () => {
        expect(matchTypeLabel(undefined)).toBe("");
        expect(matchTypeLabel("")).toBe("");
    });
});

describe("collectIncidents", () => {
    test("returns empty list when player has no cards", () => {
        const matches = [makeMatch({})];
        expect(collectIncidents(matches, "حسين", TEAM_A, "yellow")).toEqual([]);
    });

    test("collects a single yellow card and reports the opposing team as opponent", () => {
        const matches = [
            makeMatch({
                firstTeamCards: [{ player: "حسين", type: "yellow", date: "45" }],
            }),
        ];

        const out = collectIncidents(matches, "حسين", TEAM_A, "yellow");
        expect(out).toHaveLength(1);
        expect(out[0]).toMatchObject({
            opponent: "نادي عوف",
            minute: "45",
            matchType: "groups",
        });
    });

    test("collects across multiple matches with correct opponents per side", () => {
        const matches = [
            makeMatch({
                type: "groups",
                firstTeamCards: [{ player: "حسين", type: "yellow", date: "30" }],
            }),
            makeMatch({
                type: "quarter-finals",
                // Same player now plays for TEAM_A in the second match (still firstTeam)
                secondTeamCards: [{ player: "حسين", type: "yellow", date: "60" }],
                firstTeam: { id: "pt-x", team: { id: "t-x", name: "نادي قطر" } },
                secondTeam: { id: TEAM_A, team: { id: "t-a", name: "نادي دماء" } },
            }),
        ];

        const out = collectIncidents(matches, "حسين", TEAM_A, "yellow");
        expect(out).toHaveLength(2);
        expect(out[0].opponent).toBe("نادي عوف");
        expect(out[1].opponent).toBe("نادي قطر");
        expect(out[1].matchType).toBe("quarter-finals");
    });

    test("ignores cards for other players, other teams, and other card types", () => {
        const matches = [
            makeMatch({
                firstTeamCards: [
                    { player: "حسين", type: "yellow", date: "45" },
                    { player: "حسين", type: "red", date: "75" }, // wrong type
                    { player: "خالد", type: "yellow", date: "20" }, // wrong player
                ],
                secondTeamCards: [
                    { player: "حسين", type: "yellow", date: "10" }, // wrong team (other side)
                ],
            }),
        ];

        const out = collectIncidents(matches, "حسين", TEAM_A, "yellow");
        expect(out).toHaveLength(1);
        expect(out[0].minute).toBe("45");
    });

    test("returns empty when teamId is missing (defensive)", () => {
        const matches = [
            makeMatch({
                firstTeamCards: [{ player: "حسين", type: "yellow", date: "45" }],
            }),
        ];
        expect(collectIncidents(matches, "حسين", undefined, "yellow")).toEqual([]);
    });
});

describe("computeStageScorers", () => {
    test("aggregates goals across matches in the selected stage", () => {
        const matches = [
            makeMatch({
                type: "groups",
                firstTeamScorersMatch: [
                    { participating_player: { id: "p1", number: "10", player: { person: { first_name: "حسين" } } } },
                    { participating_player: { id: "p1", number: "10", player: { person: { first_name: "حسين" } } } },
                ],
                secondTeamScorersMatch: [
                    { participating_player: { id: "p2", number: "9", player: { person: { first_name: "خالد" } } } },
                ],
            }),
            makeMatch({
                type: "final",
                firstTeamScorersMatch: [
                    { participating_player: { id: "p1", number: "10", player: { person: { first_name: "حسين" } } } },
                ],
            }),
        ];

        const groupsOnly = computeStageScorers(matches, "groups");
        expect(groupsOnly).toHaveLength(2);
        expect(groupsOnly[0].Goal).toBe(2); // حسين leads in groups
        expect(groupsOnly[0].PlayerID?.id).toBe("p1");

        const all = computeStageScorers(matches, "all");
        expect(all.find((s) => s.PlayerID?.id === "p1")?.Goal).toBe(3);
    });

    test("returns empty when no matches in the chosen stage", () => {
        const matches = [makeMatch({ type: "groups", firstTeamScorersMatch: [] })];
        expect(computeStageScorers(matches, "final")).toEqual([]);
    });
});

describe("computeStageCards", () => {
    test("filters by stage and applies the red-trumps-yellow rule", () => {
        const matches = [
            makeMatch({
                type: "groups",
                firstTeamCards: [
                    { player: "حسين", type: "yellow", date: "30" },
                    { player: "حسين", type: "yellow", date: "60" },
                ],
            }),
            makeMatch({
                type: "groups",
                firstTeamCards: [
                    // Red card supersedes the yellows for this player.
                    { player: "حسين", type: "red", date: "75" },
                ],
            }),
            makeMatch({
                type: "final",
                firstTeamCards: [{ player: "حسين", type: "yellow", date: "10" }],
            }),
        ];

        const groupsStage = computeStageCards(matches, "groups");
        expect(groupsStage.yellowCards).toHaveLength(0); // suppressed by red in same team
        expect(groupsStage.redCards).toHaveLength(1);
        expect(groupsStage.redCards[0].count).toBe(1);

        const finalStage = computeStageCards(matches, "final");
        expect(finalStage.yellowCards).toHaveLength(1);
        expect(finalStage.yellowCards[0].count).toBe(1);
        expect(finalStage.redCards).toHaveLength(0);
    });
});

describe("computeFinalPlacements", () => {
    test("returns null when no final match is played yet", () => {
        const matches = [makeMatch({ type: "groups", matchState: "end" })];
        expect(computeFinalPlacements(matches)).toBe(null);
    });

    test("identifies winner and runner-up from the played final", () => {
        const matches = [
            makeMatch({
                type: "final",
                matchState: "end",
                firstTeamGoal: 2,
                secondTeamGoal: 1,
            }),
        ];

        const out = computeFinalPlacements(matches)!;
        expect(out.winner?.name).toBe("نادي دماء"); // firstTeam in helper default
        expect(out.runnerUp?.name).toBe("نادي عوف");
    });

    test("reports null winner on a drawn final (no penalty data in payload)", () => {
        const matches = [
            makeMatch({
                type: "final",
                matchState: "end",
                firstTeamGoal: 1,
                secondTeamGoal: 1,
            }),
        ];

        const out = computeFinalPlacements(matches)!;
        expect(out.winner).toBe(null);
        expect(out.runnerUp).toBe(null);
    });

    test("resolves a drawn final from the penalty shootout", () => {
        const matches = [
            makeMatch({
                type: "final",
                matchState: "end",
                firstTeamGoal: 1,
                secondTeamGoal: 1,
                penalty: { id: "pen-1", firstTeamPenalty: 3, secondTeamPenalty: 5 },
            }),
        ];

        const out = computeFinalPlacements(matches)!;
        expect(out.winner?.name).toBe("نادي عوف"); // secondTeam won the shootout
        expect(out.runnerUp?.name).toBe("نادي دماء");
    });

    test("keeps the drawn final ambiguous when the recorded shootout is tied", () => {
        const matches = [
            makeMatch({
                type: "final",
                matchState: "end",
                firstTeamGoal: 1,
                secondTeamGoal: 1,
                penalty: { id: "pen-1", firstTeamPenalty: 4, secondTeamPenalty: 4 },
            }),
        ];

        const out = computeFinalPlacements(matches)!;
        expect(out.winner).toBe(null);
        expect(out.runnerUp).toBe(null);
    });
});
