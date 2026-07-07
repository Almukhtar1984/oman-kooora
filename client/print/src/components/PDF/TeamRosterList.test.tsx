import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

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

import TeamRosterList, { PlayersTable, StaffTable } from "./TeamRosterList";

describe("<PlayersTable />", () => {
    it("lists players with number, name and position", () => {
        render(<PlayersTable players={[{ number: "10", name: "أحمد علي", position: "مهاجم" }]} />);
        expect(screen.getByText("أحمد علي")).toBeInTheDocument();
        expect(screen.getByText("مهاجم")).toBeInTheDocument();
        expect(screen.getByText("10")).toBeInTheDocument();
        expect(screen.getByText(/العدد: 1/)).toBeInTheDocument();
    });
    it("shows an empty note with no players", () => {
        render(<PlayersTable players={[]} />);
        expect(screen.getByText(/لا يوجد لاعبون/)).toBeInTheDocument();
    });
});

describe("<StaffTable />", () => {
    it("lists technical staff with name and job", () => {
        render(<StaffTable staff={[{ name: "سالم المدرب", job: "مدرب" }]} />);
        expect(screen.getByText("سالم المدرب")).toBeInTheDocument();
        expect(screen.getByText("مدرب")).toBeInTheDocument();
    });
    it("shows an empty note with no staff", () => {
        render(<StaffTable staff={[]} />);
        expect(screen.getByText(/لا يوجد جهاز فني/)).toBeInTheDocument();
    });
});

describe("<TeamRosterList />", () => {
    it("shows an empty state when there is no roster", () => {
        render(<TeamRosterList roster={null} />);
        expect(screen.getByTestId("team-roster-empty")).toBeInTheDocument();
        expect(screen.queryByTestId("team-roster-pdfviewer")).not.toBeInTheDocument();
    });

    it("renders both players and staff once loaded", () => {
        render(
            <TeamRosterList
                roster={{
                    teamName: "النهضة",
                    leagueName: "دوري طموح",
                    players: [{ number: "7", name: "خالد", position: "وسط" }],
                    staff: [{ name: "عمر المدرب", job: "مدرب عام" }],
                }}
            />,
        );
        expect(screen.getByTestId("team-roster-pdfviewer")).toBeInTheDocument();
        expect(screen.getByText("خالد")).toBeInTheDocument();
        expect(screen.getByText("عمر المدرب")).toBeInTheDocument();
        expect(screen.getByText("اللاعبون")).toBeInTheDocument();
        expect(screen.getByText("الجهاز الفني")).toBeInTheDocument();
    });
});
