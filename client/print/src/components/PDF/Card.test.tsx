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
