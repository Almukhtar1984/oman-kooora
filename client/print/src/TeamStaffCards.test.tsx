import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MockedProvider } from "@apollo/client/testing";
import { MemoryRouter, Route, Routes } from "react-router-dom";

beforeEach(() => {
    // Same jsdom shims as LeagueCards.test.tsx — usePrintAssets needs a canvas
    // stub and gracefully falls back when fetch fails (no fetch mock here).
    (HTMLCanvasElement.prototype as any).getContext = vi.fn(() => ({
        drawImage: vi.fn(),
    }));
    (globalThis as any).createImageBitmap = vi.fn(async () => ({
        width: 100,
        height: 100,
        close: () => {},
    }));
});

// react-pdf can't render inside jsdom — DOM stand-ins, as in LeagueCards.test.tsx.
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

import TeamStaffCards from "./TeamStaffCards";
import { AllParticipatingTechnicalStaff } from "./graphql";

const TEAM_ID = "PT1";

const staffRow = (id: string, firstName: string, occupation: string) => ({
    id,
    participating_team: {
        id: TEAM_ID,
        group: "A",
        league: { id: "L1", name: "دوري تجريبي" },
        team: { id: "t-1", name: "النهضة", logo: null, club: { id: "c-1", name: "النادي", logo: null } },
    },
    technicalApparatus: {
        id: `ta-${id}`,
        occupation,
        classification: "أ",
        person: {
            id: `person-${id}`,
            personal_picture: null,
            first_name: firstName,
            second_name: "بن",
            third_name: "علي",
            tribe: "الكندي",
            phone: "+96812345678",
            card_number: "12345678",
            date_birth: "1980-01-01",
        },
    },
});

const buildMock = (rows: any[]) => ({
    request: {
        query: AllParticipatingTechnicalStaff,
        variables: { idParticipatingTeams: TEAM_ID },
    },
    result: { data: { allParticipatingTechnicalStaff: rows } },
});

const renderRoute = (path: string, rows: any[]) =>
    render(
        <MockedProvider mocks={[buildMock(rows)]} addTypename={false}>
            <MemoryRouter initialEntries={[path]}>
                <Routes>
                    <Route path="/team-staff-cards/:teamId/:ids" element={<TeamStaffCards />} />
                </Routes>
            </MemoryRouter>
        </MockedProvider>
    );

describe("<TeamStaffCards />", () => {
    it("renders one ID card per staff member with the occupation row", async () => {
        renderRoute(`/team-staff-cards/${TEAM_ID}/all`, [
            staffRow("s1", "حسين", "مدرب"),
            staffRow("s2", "خالد", "مدرب حراس"),
        ]);

        await waitFor(() => {
            expect(screen.getByTestId("league-cards-pdfviewer")).toBeInTheDocument();
        });

        // Occupation values render on the cards via the new "الصفة" row.
        expect(screen.getAllByText("الصفة").length).toBe(2);
        expect(screen.getByText("مدرب")).toBeInTheDocument();
        expect(screen.getByText("مدرب حراس")).toBeInTheDocument();
        // League name is the card header, names compose without 'undefined'.
        expect(screen.getAllByText("دوري تجريبي").length).toBeGreaterThan(0);
        expect(screen.queryByText(/undefined/)).not.toBeInTheDocument();
    });

    it("filters down to the requested staff ids", async () => {
        renderRoute(`/team-staff-cards/${TEAM_ID}/s2`, [
            staffRow("s1", "حسين", "مدرب"),
            staffRow("s2", "خالد", "إداري"),
        ]);

        await waitFor(() => {
            expect(screen.getByTestId("league-cards-pdfviewer")).toBeInTheDocument();
        });

        expect(screen.getByText("إداري")).toBeInTheDocument();
        expect(screen.queryByText("مدرب")).not.toBeInTheDocument();
    });

    it("shows the staff empty state when the team has no technical staff", async () => {
        renderRoute(`/team-staff-cards/${TEAM_ID}/all`, []);

        await waitFor(() => {
            expect(screen.getByText("لا يوجد جهاز فني مطابق للطباعة.")).toBeInTheDocument();
        });
        expect(screen.queryByTestId("league-cards-pdfviewer")).not.toBeInTheDocument();
    });
});
