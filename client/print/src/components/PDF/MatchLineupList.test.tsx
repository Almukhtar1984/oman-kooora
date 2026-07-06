import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

// Same jsdom-safe stand-ins for @react-pdf as the Card tests, plus a `pdf()`
// stub used by the download button.
vi.mock("@react-pdf/renderer", () => {
    // Drop `style` (react-pdf accepts style arrays that real DOM rejects) — the
    // tests assert on text content, not styling.
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

import MatchLineupList, { statusLabel, TeamLineupTable } from "./MatchLineupList";

describe("statusLabel", () => {
    it("labels a starter أساسي", () => {
        expect(statusLabel({ starter: true })).toBe("أساسي");
    });
    it("labels a substitute احتياط", () => {
        expect(statusLabel({ sub: true })).toBe("احتياط");
    });
    it("falls back to a dash when neither", () => {
        expect(statusLabel({})).toBe("—");
    });
});

describe("<TeamLineupTable />", () => {
    const players = [
        { name: "أحمد علي", number: "10", position: "مهاجم", starter: true, sub: false },
        { name: "خالد سعيد", number: "7", position: "وسط", starter: false, sub: true },
    ];

    it("renders every player's name and status", () => {
        render(<TeamLineupTable title="النهضة" players={players} />);
        expect(screen.getByText("أحمد علي")).toBeInTheDocument();
        expect(screen.getByText("خالد سعيد")).toBeInTheDocument();
        expect(screen.getByText("أساسي")).toBeInTheDocument();
        expect(screen.getByText("احتياط")).toBeInTheDocument();
    });

    it("summarises starter / substitute counts in the team header", () => {
        render(<TeamLineupTable title="النهضة" players={players} />);
        expect(screen.getByText(/أساسي: 1/)).toBeInTheDocument();
        expect(screen.getByText(/احتياط: 1/)).toBeInTheDocument();
    });

    it("shows an empty note when a team has no players", () => {
        render(<TeamLineupTable title="فارغ" players={[]} />);
        expect(screen.getByText(/لا يوجد لاعبون/)).toBeInTheDocument();
    });
});

describe("<MatchLineupList />", () => {
    it("shows an empty state when there is no match", () => {
        render(<MatchLineupList lineup={null} />);
        expect(screen.getByTestId("match-lineup-empty")).toBeInTheDocument();
        expect(screen.queryByTestId("match-lineup-pdfviewer")).not.toBeInTheDocument();
    });

    it("renders the report (both teams) once a match is loaded", () => {
        render(
            <MatchLineupList
                lineup={{
                    id: "m-1",
                    date: "2026-07-06",
                    leagueName: "دوري طموح",
                    firstTeamName: "النهضة",
                    secondTeamName: "النصر",
                    firstTeamPlayers: [{ name: "أحمد علي", number: "10", position: "مهاجم", starter: true }],
                    secondTeamPlayers: [{ name: "سالم ناصر", number: "1", position: "حارس", sub: true }],
                }}
            />,
        );
        expect(screen.getByTestId("match-lineup-pdfviewer")).toBeInTheDocument();
        expect(screen.getByText("أحمد علي")).toBeInTheDocument();
        expect(screen.getByText("سالم ناصر")).toBeInTheDocument();
        // Both team names appear (header line + per-team headers).
        expect(screen.getAllByText(/النهضة/).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/النصر/).length).toBeGreaterThan(0);
    });
});
