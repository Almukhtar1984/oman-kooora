import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @react-pdf/renderer: in jsdom we can't actually render a PDFViewer
// (it spins up an iframe + worker), so we replace the heavy components with
// plain DOM stand-ins that preserve children + key attributes so tests can
// assert on the *content* the template would have put on the page.
vi.mock("@react-pdf/renderer", () => {
    const passthrough =
        (name: string) =>
        ({ children, src, style, ...rest }: any) =>
            (
                <div data-testid={`pdf-${name}`} data-src={src} style={style} {...rest}>
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
            <img data-testid="pdf-image" src={src} style={style} {...rest} />
        ),
        Font: { register: vi.fn() },
        StyleSheet: { create: (s: any) => s },
    };
});

import CardTemplate, {
    buildFullName,
    formatBirthLine,
    generateQrDataUrl,
    CardFrontPage,
    CardBackPage,
} from "./Card";

describe("Card helpers", () => {
    describe("buildFullName", () => {
        it("joins all four parts with single spaces when present", () => {
            expect(
                buildFullName({
                    first_name: "أحمد",
                    second_name: "بن",
                    third_name: "علي",
                    tribe: "الكندي",
                }),
            ).toBe("أحمد بن علي الكندي");
        });

        it("drops missing parts instead of rendering 'undefined'", () => {
            expect(
                buildFullName({
                    first_name: "أحمد",
                    second_name: undefined,
                    third_name: "",
                    tribe: "الكندي",
                }),
            ).toBe("أحمد الكندي");
        });

        it("returns empty string when person is null/undefined", () => {
            expect(buildFullName(undefined)).toBe("");
            expect(buildFullName(null)).toBe("");
        });
    });

    describe("formatBirthLine", () => {
        it("returns empty string when date is missing", () => {
            expect(formatBirthLine(undefined)).toBe("");
            expect(formatBirthLine("")).toBe("");
        });

        it("returns the raw value back when input is not parseable", () => {
            expect(formatBirthLine("not-a-date")).toBe("not-a-date");
        });

        it("appends a parenthesized human-readable age when input is valid", () => {
            const out = formatBirthLine("2000-01-01");
            expect(out.startsWith("2000-01-01 (")).toBe(true);
            expect(out.endsWith(")")).toBe(true);
        });
    });

    describe("generateQrDataUrl", () => {
        it("returns a non-empty data URL for a valid string", async () => {
            const url = await generateQrDataUrl("https://example.com/p/1");
            // The qrcode lib produces a base64-encoded PNG data URL.
            expect(url.startsWith("data:image/")).toBe(true);
            expect(url.length).toBeGreaterThan(100); // sanity: real QR, not empty canvas
        });

        it("does not throw on empty input", async () => {
            const url = await generateQrDataUrl("");
            expect(typeof url).toBe("string");
        });
    });
});

describe("<CardTemplate />", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders a loading placeholder when player has no id", () => {
        render(<CardTemplate player={undefined} />);
        expect(screen.getByTestId("print-card-loading")).toBeInTheDocument();
        expect(screen.queryByTestId("print-card-pdfviewer")).not.toBeInTheDocument();
    });

    it("keeps showing loading only while the query is still in flight", () => {
        render(<CardTemplate player={undefined} loaded={false} />);
        expect(screen.getByTestId("print-card-loading")).toBeInTheDocument();
    });

    it("shows a not-found message once the query finished with no player", () => {
        render(<CardTemplate player={undefined} loaded={true} />);
        expect(screen.getByTestId("print-card-notfound")).toBeInTheDocument();
        // The bug was an ENDLESS loading spinner — make sure it is gone.
        expect(screen.queryByTestId("print-card-loading")).not.toBeInTheDocument();
    });

    it("shows an error message when the query failed", () => {
        render(<CardTemplate player={undefined} error={true} loaded={true} />);
        expect(screen.getByTestId("print-card-error")).toBeInTheDocument();
        expect(screen.queryByTestId("print-card-loading")).not.toBeInTheDocument();
    });

    it("renders the PDFViewer once the player has an id", () => {
        render(
            <CardTemplate
                player={{
                    id: "p-1",
                    person: {
                        first_name: "أحمد",
                        second_name: "بن",
                        third_name: "علي",
                        tribe: "الكندي",
                        card_number: "12345678",
                        date_birth: "2000-01-01",
                    },
                    team: {
                        id: "t-1",
                        name: "النهضة",
                        club: { id: "c-1", name: "Club" },
                    },
                }}
            />,
        );

        expect(screen.getByTestId("print-card-pdfviewer")).toBeInTheDocument();
        expect(screen.queryByTestId("print-card-loading")).not.toBeInTheDocument();
    });

    it("never renders the literal string 'undefined' on the card", () => {
        render(
            <CardTemplate
                player={{
                    id: "p-1",
                    person: {
                        first_name: "أحمد",
                        // others intentionally missing
                        card_number: "12345678",
                        date_birth: "2000-01-01",
                    },
                    team: { id: "t-1", name: "النهضة" },
                }}
            />,
        );
        // The original bug surfaced as "undefined undefined undefined" inside
        // the name row — guard against any regression to that behavior.
        expect(screen.queryByText(/undefined/)).not.toBeInTheDocument();
    });

    it("populates the QR image with a real data URL after mount", async () => {
        render(
            <CardTemplate
                player={{
                    id: "p-1",
                    person: { first_name: "أحمد", date_birth: "2000-01-01" },
                    team: { id: "t-1", name: "النهضة" },
                }}
            />,
        );

        await waitFor(() => {
            const imgs = screen.getAllByTestId("pdf-image");
            // The first <Image> on the front page is the QR code.
            const qr = imgs[0];
            expect(qr.getAttribute("src")).toMatch(/^data:image\//);
        });
    });
});

describe("CardFrontPage with preloaded images", () => {
    const player = {
        id: "p-1",
        person: {
            first_name: "أحمد",
            tribe: "الكندي",
            personal_picture: "photo.jpg",
            card_number: "12345678",
            date_birth: "2000-01-01",
        },
        team: {
            id: "t-1",
            name: "النهضة",
            logo: "team.png",
            club: { id: "c-1", name: "Club", logo: "club.png" },
        },
    };

    it("uses preloaded Object URLs when supplied in the images map", () => {
        render(
            <CardFrontPage
                qrDataUrl="data:image/png;base64,xxx"
                player={player}
                images={{
                    "photo.jpg": "blob:fake/photo",
                    "team.png": "blob:fake/team",
                    "club.png": "blob:fake/club",
                }}
            />,
        );
        const srcs = screen
            .getAllByTestId("pdf-image")
            .map((el) => el.getAttribute("src"))
            .filter(Boolean);
        // Preloaded URLs win over the api.omkooora.com fallback.
        expect(srcs).toContain("blob:fake/photo");
        expect(srcs).toContain("blob:fake/team");
        expect(srcs).toContain("blob:fake/club");
        // And we never reach for the live API when a preloaded URL exists.
        expect(srcs.some((s) => s && s.includes("api.omkooora.com"))).toBe(false);
    });

    it("falls back to the API URL when no preload entry exists for a file", () => {
        render(
            <CardFrontPage
                qrDataUrl=""
                player={player}
                images={{ "photo.jpg": "blob:fake/photo" }}
            />,
        );
        const srcs = screen
            .getAllByTestId("pdf-image")
            .map((el) => el.getAttribute("src"))
            .filter(Boolean);
        expect(srcs).toContain("blob:fake/photo");
        // team.png + club.png weren't in the map → fall back to the live API's
        // baseline resize transform (react-pdf can't render raw progressive JPEGs).
        expect(srcs.some((s) => s && s.endsWith("/images/team.png?w=512"))).toBe(true);
        expect(srcs.some((s) => s && s.endsWith("/images/club.png?w=512"))).toBe(true);
    });

    it("renders the photo when a personal_picture exists (no placeholder)", () => {
        render(
            <CardFrontPage qrDataUrl="" player={player} images={{ "photo.jpg": "blob:fake/photo" }} />,
        );
        // The real photo is embedded…
        const srcs = screen.getAllByTestId("pdf-image").map((el) => el.getAttribute("src"));
        expect(srcs).toContain("blob:fake/photo");
        // …and the default avatar is NOT shown.
        expect(screen.queryByTestId("photo-placeholder")).not.toBeInTheDocument();
    });

    it("shows the default avatar placeholder when the player has no photo", () => {
        const noPhoto = { ...player, person: { ...player.person, personal_picture: null } };
        render(<CardFrontPage qrDataUrl="" player={noPhoto} images={{}} />);
        // Placeholder is rendered instead of a photo Image.
        expect(screen.getByTestId("photo-placeholder")).toBeInTheDocument();
        const srcs = screen.getAllByTestId("pdf-image").map((el) => el.getAttribute("src"));
        // No image src points at a personal photo file (only team/club logos may remain via fallback).
        expect(srcs.some((s) => s && s.includes("photo.jpg"))).toBe(false);
    });

    it("works the same on the back page", () => {
        render(
            <CardBackPage
                player={player}
                images={{ "team.png": "blob:fake/team", "club.png": "blob:fake/club" }}
            />,
        );
        const srcs = screen
            .getAllByTestId("pdf-image")
            .map((el) => el.getAttribute("src"))
            .filter(Boolean);
        expect(srcs).toContain("blob:fake/team");
        expect(srcs).toContain("blob:fake/club");
    });
});
