import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

// jsdom-safe stand-ins for @react-pdf (same approach as the other PDF tests).
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

import LeagueList, {
    isLoanedInto,
    playerStatus,
    filterParticipants,
    distinctTeams,
    distinctGroups,
    FilterBar,
    STATUS_LOAN,
    STATUS_EXTERNAL,
    STATUS_INTERNAL,
} from "./LeagueList";

const P = (
    id: string,
    teamId: string,
    teamName: string,
    name: string,
    opts: { group?: string; type?: string; lastLoan?: any } = {},
) => ({
    id,
    number: "",
    participating_team: {
        id: `pt-${teamId}`,
        group: opts.group,
        league: { name: "دوري طموح" },
        team: { id: teamId, name: teamName },
    },
    player: {
        id: `pl-${id}`,
        player_center: "مهاجم",
        type: opts.type || "internal",
        lastLoan: opts.lastLoan ?? null,
        person: { first_name: name, second_name: "", third_name: "", tribe: "", phone: "", card_number: "", date_birth: "" },
    },
});

const loanInto = (teamId: string) => ({ transition_type: "loan", status: "accepted", team_to: { id: teamId } });

describe("playerStatus / isLoanedInto", () => {
    it("labels an internal player داخلي", () => {
        expect(playerStatus(P("1", "t1", "النهضة", "أحمد"))).toBe(STATUS_INTERNAL);
    });
    it("labels an external player محترف", () => {
        expect(playerStatus(P("2", "t1", "النهضة", "خالد", { type: "external" }))).toBe(STATUS_EXTERNAL);
    });
    it("labels a player loaned INTO their participating team معار", () => {
        const pp = P("3", "t1", "النهضة", "سالم", { lastLoan: loanInto("t1") });
        expect(isLoanedInto(pp)).toBe(true);
        expect(playerStatus(pp)).toBe(STATUS_LOAN);
    });
    it("is NOT معار when the loan is into a different team", () => {
        const pp = P("4", "t1", "النهضة", "ناصر", { lastLoan: loanInto("t2") });
        expect(isLoanedInto(pp)).toBe(false);
        expect(playerStatus(pp)).toBe(STATUS_INTERNAL);
    });
    it("is NOT معار when the loan is not accepted", () => {
        const pp = P("5", "t1", "النهضة", "عمر", { lastLoan: { transition_type: "loan", status: "pending", team_to: { id: "t1" } } });
        expect(isLoanedInto(pp)).toBe(false);
    });
    it("is NOT معار when the latest record is a return", () => {
        const pp = P("6", "t1", "النهضة", "بدر", { lastLoan: { transition_type: "returning", status: "accepted", team_to: { id: "t1" } } });
        expect(isLoanedInto(pp)).toBe(false);
    });
});

describe("filterParticipants", () => {
    const players = [
        P("1", "t1", "النهضة", "أحمد", { group: "A" }),
        P("2", "t1", "النهضة", "خالد", { group: "A", type: "external" }),
        P("3", "t2", "النصر", "سالم", { group: "B", lastLoan: loanInto("t2") }),
    ];
    it("filters by team", () => {
        expect(filterParticipants(players, { team: "t2", group: "all", status: "all" }).map((p) => p.id)).toEqual(["3"]);
    });
    it("filters by group", () => {
        expect(filterParticipants(players, { team: "all", group: "A", status: "all" }).map((p) => p.id)).toEqual(["1", "2"]);
    });
    it("filters by status (محترف / معار)", () => {
        expect(filterParticipants(players, { team: "all", group: "all", status: STATUS_EXTERNAL }).map((p) => p.id)).toEqual(["2"]);
        expect(filterParticipants(players, { team: "all", group: "all", status: STATUS_LOAN }).map((p) => p.id)).toEqual(["3"]);
    });
    it("combines filters", () => {
        expect(filterParticipants(players, { team: "t1", group: "A", status: STATUS_INTERNAL }).map((p) => p.id)).toEqual(["1"]);
    });
});

describe("distinctTeams / distinctGroups", () => {
    const players = [P("1", "t1", "النهضة", "أ", { group: "A" }), P("2", "t2", "النصر", "ب", { group: "B" }), P("3", "t1", "النهضة", "ج", { group: "A" })];
    it("returns unique teams", () => {
        expect(distinctTeams(players).map((t) => t.id).sort()).toEqual(["t1", "t2"]);
    });
    it("returns unique groups", () => {
        expect(distinctGroups(players)).toEqual(["A", "B"]);
    });
});

describe("<FilterBar />", () => {
    it("renders the three filters and fires onChange", () => {
        const onChange = vi.fn();
        render(
            <FilterBar
                teams={[{ id: "t1", name: "النهضة" }]}
                groups={["A"]}
                filter={{ team: "all", group: "all", status: "all" }}
                onChange={onChange}
                onDownload={() => {}}
                downloading={false}
                count={5}
            />,
        );
        expect(screen.getByTestId("filter-team")).toBeInTheDocument();
        expect(screen.getByTestId("filter-group")).toBeInTheDocument();
        expect(screen.getByTestId("filter-status")).toBeInTheDocument();
        fireEvent.change(screen.getByTestId("filter-team"), { target: { value: "t1" } });
        expect(onChange).toHaveBeenCalledWith({ team: "t1" });
    });
});

describe("<LeagueList />", () => {
    const players = [
        P("1", "t1", "النهضة", "أحمد علي", { group: "A" }),
        P("2", "t1", "النهضة", "خالد سعيد", { group: "A", type: "external" }),
        P("3", "t2", "النصر", "سالم ناصر", { group: "B", lastLoan: loanInto("t2") }),
    ];

    it("renders all players with the status column", () => {
        render(<LeagueList players={players} />);
        const viewer = screen.getByTestId("league-list-pdfviewer");
        expect(screen.getByText("أحمد علي")).toBeInTheDocument();
        expect(screen.getByText("سالم ناصر")).toBeInTheDocument();
        // status labels present in the printed table (scoped to avoid the
        // dropdown <option> labels which carry the same text).
        expect(within(viewer).getAllByText(STATUS_INTERNAL).length).toBeGreaterThan(0);
        expect(within(viewer).getByText(STATUS_EXTERNAL)).toBeInTheDocument();
        expect(within(viewer).getByText(STATUS_LOAN)).toBeInTheDocument();
    });

    it("filters to a single team when selected", () => {
        render(<LeagueList players={players} />);
        fireEvent.change(screen.getByTestId("filter-team"), { target: { value: "t2" } });
        expect(screen.getByText("سالم ناصر")).toBeInTheDocument();
        expect(screen.queryByText("أحمد علي")).not.toBeInTheDocument();
    });

    it("shows an empty note when filters match nobody", () => {
        render(<LeagueList players={players} />);
        // team t1 has no معار players
        fireEvent.change(screen.getByTestId("filter-team"), { target: { value: "t1" } });
        fireEvent.change(screen.getByTestId("filter-status"), { target: { value: STATUS_LOAN } });
        expect(screen.getByTestId("league-list-empty")).toBeInTheDocument();
    });
});
