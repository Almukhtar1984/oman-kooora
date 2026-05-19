import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

beforeEach(() => {
    // jsdom doesn't ship a 2D canvas context. usePrintAssets only invokes
    // canvas-based downscaling when getContext returns something, so we hand
    // it a no-op stub. The hook also gracefully falls back when fetch fails,
    // which is what happens here in the LeagueCards tests (no fetch mock),
    // so we end up exercising the "no compression" code path.
    (HTMLCanvasElement.prototype as any).getContext = vi.fn(() => ({
        drawImage: vi.fn(),
    }));
    (globalThis as any).createImageBitmap = vi.fn(async () => ({
        width: 100,
        height: 100,
        close: () => {},
    }));
});

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
        pdf: () => ({ toBlob: () => Promise.resolve(new Blob()) }),
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

    it("renders the PDFViewer when players are present", async () => {
        render(<LeagueCards players={samplePlayers} />);
        await waitFor(() => {
            expect(screen.getByTestId("league-cards-pdfviewer")).toBeInTheDocument();
        });
    });

    it("does not render the literal string 'undefined' for sparse name parts", async () => {
        // pp-2 is missing second_name + tribe — the front-card name row should
        // skip those gaps instead of stringifying `undefined`.
        render(<LeagueCards players={samplePlayers} />);
        await waitFor(() => {
            expect(screen.getByTestId("league-cards-pdfviewer")).toBeInTheDocument();
        });
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

describe("<LeagueCards /> heavy-league ready screen", () => {
    // Build N players sharing a few teams so dedupe still has work to do.
    const buildPlayers = (n: number) =>
        Array.from({ length: n }, (_, i) => ({
            id: `pp-${i}`,
            number: String(i),
            player: {
                id: `player-${i}`,
                person: {
                    first_name: "لاعب",
                    second_name: String(i),
                    card_number: String(10000 + i),
                    date_birth: "2000-01-01",
                },
            },
            participating_team: {
                id: `pt-${i % 5}`,
                team: { id: `t-${i % 5}`, name: `فريق ${i % 5}` },
            },
        }));

    it("shows the ready screen instead of PDFViewer when league exceeds threshold", async () => {
        // 5 players + deferViewerAbove=3 → heavy path triggers.
        render(<LeagueCards players={buildPlayers(5)} deferViewerAbove={3} />);
        await waitFor(() => {
            expect(screen.getByTestId("league-cards-ready")).toBeInTheDocument();
        });
        expect(screen.queryByTestId("league-cards-pdfviewer")).not.toBeInTheDocument();
        // Player count surfaces on the ready card.
        expect(screen.getByText(/5 بطاقة لاعب/)).toBeInTheDocument();
    });

    it("offers both a direct download and an in-browser preview button", async () => {
        render(<LeagueCards players={buildPlayers(5)} deferViewerAbove={3} />);
        await waitFor(() => {
            expect(screen.getByTestId("league-cards-download")).toBeInTheDocument();
        });
        expect(screen.getByTestId("league-cards-show-viewer")).toBeInTheDocument();
    });

    it("mounts the PDFViewer once the user clicks 'عرض PDF داخل المتصفح'", async () => {
        render(<LeagueCards players={buildPlayers(5)} deferViewerAbove={3} />);
        await waitFor(() => {
            expect(screen.getByTestId("league-cards-show-viewer")).toBeInTheDocument();
        });
        fireEvent.click(screen.getByTestId("league-cards-show-viewer"));
        await waitFor(() => {
            expect(screen.getByTestId("league-cards-pdfviewer")).toBeInTheDocument();
        });
        // Ready screen should be gone now.
        expect(screen.queryByTestId("league-cards-ready")).not.toBeInTheDocument();
    });

    it("keeps the immediate-PDFViewer path for light leagues", async () => {
        // Default deferViewerAbove is 100; 2 players is well below it.
        render(<LeagueCards players={samplePlayers} />);
        await waitFor(() => {
            expect(screen.getByTestId("league-cards-pdfviewer")).toBeInTheDocument();
        });
        expect(screen.queryByTestId("league-cards-ready")).not.toBeInTheDocument();
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

    it("shows the ready screen instead of PDFViewer when above threshold", () => {
        // 3 players + deferViewerAbove=2 → heavy path triggers.
        const players = [samplePlayers[0], samplePlayers[1], {
            ...samplePlayers[0],
            id: "pp-3",
            player: { ...samplePlayers[0].player, id: "p-3" },
        }];
        render(<LeagueList players={players} deferViewerAbove={2} />);
        expect(screen.getByTestId("league-list-ready")).toBeInTheDocument();
        expect(screen.queryByTestId("league-list-pdfviewer")).not.toBeInTheDocument();
        expect(screen.getByText(/قائمة 3 لاعب/)).toBeInTheDocument();
    });

    it("offers a download + a 'show viewer' button on the ready screen", () => {
        const players = Array.from({ length: 4 }, (_, i) => ({
            ...samplePlayers[0],
            id: `pp-${i}`,
        }));
        render(<LeagueList players={players} deferViewerAbove={2} />);
        expect(screen.getByTestId("league-list-download")).toBeInTheDocument();
        expect(screen.getByTestId("league-list-show-viewer")).toBeInTheDocument();
    });

    it("mounts the PDFViewer once the user opts in", () => {
        const players = Array.from({ length: 4 }, (_, i) => ({
            ...samplePlayers[0],
            id: `pp-${i}`,
        }));
        render(<LeagueList players={players} deferViewerAbove={2} />);
        fireEvent.click(screen.getByTestId("league-list-show-viewer"));
        expect(screen.getByTestId("league-list-pdfviewer")).toBeInTheDocument();
        expect(screen.queryByTestId("league-list-ready")).not.toBeInTheDocument();
    });

    it("keeps the immediate-viewer path for small lists", () => {
        // Default deferViewerAbove is 150; 2 players is way below it.
        render(<LeagueList players={samplePlayers} />);
        expect(screen.getByTestId("league-list-pdfviewer")).toBeInTheDocument();
        expect(screen.queryByTestId("league-list-ready")).not.toBeInTheDocument();
    });
});
