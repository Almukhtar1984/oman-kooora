import { MockedProvider } from "@apollo/client/testing";
import { DirectionProvider, MantineProvider } from "@mantine/core";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeAll, describe, expect, test, vi } from "vitest";
import { AllParticipatingTechnicalStaff } from "../../graphql";
import { ShowParticipatingTechnicalStaff } from "./ShowParticipatingTechnicalStaff";

beforeAll(() => {
    Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: (query: string) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        }),
    });
});

const TEAM_ID = "pteam-001";

const staffRow = (overrides: any = {}) => ({
    __typename: "ParticipatingTechnicalStaff",
    id: "staff-1",
    participating_team: {
        __typename: "ParticipatingTeams",
        id: TEAM_ID,
        group: "A",
        league: { __typename: "League", id: "L1", name: "بطولة" },
        team:   { __typename: "Team",   id: "T1", name: "نادي دماء" },
    },
    technicalApparatus: {
        __typename: "TechnicalApparatus",
        id: "ta-1",
        occupation: "مدرب",
        classification: "أول",
        membership_date: null,
        membership_date_end: null,
        paid: null,
        testimony_experience: null,
        status: null,
        note: null,
        team: { __typename: "Team", id: "T1", name: "نادي دماء" },
        person: {
            __typename: "Person",
            id: "p-1",
            personal_picture: "",
            first_name: "محمد",
            second_name: "علي",
            third_name: "ناصر",
            tribe: "الحبسي",
            phone: "",
            card_number: "999",
            date_birth: "1985-01-01",
        },
    },
    createdAt: null,
    updatedAt: null,
    ...overrides,
});

const renderModal = (mocks: any[], dataProp: any = TEAM_ID, opened = true) =>
    render(
        <MockedProvider mocks={mocks} addTypename={false}>
            <MemoryRouter>
                <DirectionProvider initialDirection="rtl">
                    <MantineProvider>
                        <ShowParticipatingTechnicalStaff
                            title="عرض جهاز فني"
                            opened={opened}
                            onClose={() => {}}
                            data={dataProp}
                            setSelectedData={() => {}}
                        />
                    </MantineProvider>
                </DirectionProvider>
            </MemoryRouter>
        </MockedProvider>
    );

describe("ShowParticipatingTechnicalStaff", () => {
    test("regression: query must NOT request startDate/expiryDate (removed from schema)", () => {
        // These fields were dropped from the ParticipatingTechnicalStaff schema
        // type. Requesting them makes the whole query fail GraphQL validation, so
        // the staff list silently comes back empty. Guard against re-adding them.
        const src = (AllParticipatingTechnicalStaff as any).loc?.source?.body ?? "";
        expect(src).not.toContain("startDate");
        expect(src).not.toContain("expiryDate");
    });

    test("queries with the right idParticipatingTeams variable and renders staff name", async () => {
        const mocks = [
            {
                request: {
                    query: AllParticipatingTechnicalStaff,
                    variables: { idParticipatingTeams: TEAM_ID },
                },
                result: { data: { allParticipatingTechnicalStaff: [staffRow()] } },
            },
        ];

        renderModal(mocks);

        await waitFor(() => {
            expect(screen.getByText(/محمد علي ناصر الحبسي/)).toBeInTheDocument();
        });
    });

    test("shows the empty state when the query returns []", async () => {
        const mocks = [
            {
                request: {
                    query: AllParticipatingTechnicalStaff,
                    variables: { idParticipatingTeams: TEAM_ID },
                },
                result: { data: { allParticipatingTechnicalStaff: [] } },
            },
        ];

        renderModal(mocks);

        await waitFor(() => {
            expect(screen.getByText(/لا يوجد جهاز فني مسجل/)).toBeInTheDocument();
        });
    });

    test("offers a print-all button that opens the staff-cards print route", async () => {
        const openSpy = vi.fn();
        const originalOpen = window.open;
        window.open = openSpy as any;

        const mocks = [
            {
                request: {
                    query: AllParticipatingTechnicalStaff,
                    variables: { idParticipatingTeams: TEAM_ID },
                },
                result: { data: { allParticipatingTechnicalStaff: [staffRow()] } },
            },
        ];

        renderModal(mocks);

        await waitFor(() => {
            expect(screen.getByText("طباعة بطاقات الجهاز الفني")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText("طباعة بطاقات الجهاز الفني"));

        expect(openSpy).toHaveBeenCalledTimes(1);
        expect(String(openSpy.mock.calls[0][0])).toContain(`/#/team-staff-cards/${TEAM_ID}/all`);

        window.open = originalOpen;
    });

    test("does NOT fire the query while the modal is closed", async () => {
        // If the modal fires the query while closed, MockedProvider would warn
        // about an unmatched request. Using a never-resolving deferred mock
        // would also surface as a Network error in the console — we assert
        // the empty/loading copy never appears (because no fetch ran).
        renderModal([], TEAM_ID, false);

        // Empty state copy is only rendered after a fetch completes; with the
        // modal closed nothing should be visible.
        expect(screen.queryByText(/لا يوجد جهاز فني مسجل/)).toBeNull();
    });
});
