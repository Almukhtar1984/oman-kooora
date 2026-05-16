import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

// Same passthrough strategy as Card.test.tsx — react-pdf can't render
// inside jsdom, so we drop in DOM stand-ins to assert on content.
// react-pdf accepts style={[obj, obj]} but React DOM doesn't, so we flatten.
const flattenStyle = (style: any) =>
    Array.isArray(style) ? Object.assign({}, ...style.filter(Boolean)) : style;
vi.mock("@react-pdf/renderer", () => {
    const passthrough =
        (name: string) =>
        ({ children, src, style, ...rest }: any) =>
            (
                <div data-testid={`pdf-${name}`} data-src={src} style={flattenStyle(style)} {...rest}>
                    {children}
                </div>
            );
    return {
        PDFViewer: passthrough("viewer"),
        Document: passthrough("document"),
        Page: passthrough("page"),
        View: passthrough("view"),
        Text: ({ children, ...rest }: any) => <span {...rest}>{children}</span>,
        Image: ({ src, style, ...rest }: any) => (
            <img data-testid="pdf-image" src={src} style={flattenStyle(style)} {...rest} />
        ),
        Font: { register: vi.fn() },
        StyleSheet: { create: (s: any) => s },
    };
});

import LeagueCards from "./LeagueCards";
import LeagueList from "./LeagueList";

const samplePlayers = [
    {
        id: "pp-1",
        number: "10",
        player: {
            id: "player-1",
            player_center: "مهاجم",
            person: {
                first_name: "أحمد",
                second_name: "بن",
                third_name: "علي",
                tribe: "الكندي",
                card_number: "12345678",
                phone: "+96812345678",
                date_birth: "2000-01-01",
            },
        },
        participating_team: {
            id: "pt-1",
            team: { id: "t-1", name: "النهضة", club: { id: "c-1", name: "Club" } },
        },
    },
    {
        id: "pp-2",
        number: "7",
        player: {
            id: "player-2",
            player_center: "وسط",
            person: {
                first_name: "سعيد",
                third_name: "محمد",
                card_number: "87654321",
                date_birth: "1998-06-15",
            },
        },
        participating_team: {
            id: "pt-2",
            team: { id: "t-2", name: "السيب" },
        },
    },
];

describe("<LeagueCards />", () => {
    it("shows the empty state when no players are passed", () => {
        render(<LeagueCards players={[]} />);
        expect(screen.getByTestId("league-cards-empty")).toBeInTheDocument();
        expect(screen.queryByTestId("league-cards-pdfviewer")).not.toBeInTheDocument();
    });

    it("renders the PDFViewer when players are present", () => {
        render(<LeagueCards players={samplePlayers} />);
        expect(screen.getByTestId("league-cards-pdfviewer")).toBeInTheDocument();
    });

    it("does not render the literal string 'undefined' for sparse name parts", () => {
        // pp-2 is missing second_name + tribe — the front-card name row should
        // skip those gaps instead of stringifying `undefined`.
        render(<LeagueCards players={samplePlayers} />);
        expect(screen.queryByText(/undefined/)).not.toBeInTheDocument();
    });

    it("populates the QR <Image> for each player with a real data URL", async () => {
        render(<LeagueCards players={samplePlayers} />);
        await waitFor(() => {
            const imgs = screen.getAllByTestId("pdf-image");
            // Expect QR images among the rendered images (first <Image> on
            // each player's front page is the QR).
            const qrImgs = imgs.filter((img) =>
                (img.getAttribute("src") || "").startsWith("data:image/"),
            );
            expect(qrImgs.length).toBeGreaterThanOrEqual(samplePlayers.length);
        });
    });
});

describe("<LeagueList />", () => {
    it("renders the table even when no players are passed", () => {
        render(<LeagueList players={[]} />);
        expect(screen.getByTestId("league-list-pdfviewer")).toBeInTheDocument();
        // header row labels should still show up
        expect(screen.getByText("الاسم الكامل")).toBeInTheDocument();
        expect(screen.getByText("الفريق")).toBeInTheDocument();
    });

    it("renders one row per player and never prints 'undefined'", () => {
        render(<LeagueList players={samplePlayers} />);
        expect(screen.getByText("النهضة")).toBeInTheDocument();
        expect(screen.getByText("السيب")).toBeInTheDocument();
        // pp-2 has missing name parts; the row should compose without
        // 'undefined' tokens leaking through.
        expect(screen.queryByText(/undefined/)).not.toBeInTheDocument();
    });
});
