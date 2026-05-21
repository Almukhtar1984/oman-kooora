import { MockedProvider } from "@apollo/client/testing";
import { DirectionProvider, MantineProvider } from "@mantine/core";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeAll, describe, expect, test, vi } from "vitest";
import { AllParticipatingPlayers } from "../../graphql";
import { ShowParticipatingPlayers } from "./ShowParticipatingPlayers";

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

const TEAM_ID = "pteam-007";

const playerRow = (overrides: any = {}) => ({
    __typename: "ParticipatingPlayers",
    id: "pp-1",
    number: "10",
    participating_team: {
        __typename: "ParticipatingTeams",
        id: TEAM_ID,
        group: "A",
        league: { __typename: "League", id: "L1", name: "بطولة" },
        team:   { __typename: "Team",   id: "T1", name: "نادي دماء" },
    },
    player: {
        __typename: "Player",
        id: "pl-1",
        activity: null,
        player_center: "وسط",
        job: null,
        status: null,
        person: {
            __typename: "Person",
            id: "person-1",
            personal_picture: "",
            first_name: "أحمد",
            second_name: "خالد",
            third_name: "سالم",
            tribe: "العامري",
            phone: "",
            card_number: "12345",
            date_birth: "1998-06-10",
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
                        <ShowParticipatingPlayers
                            title="عرض لاعبين الفريق"
                            opened={opened}
                            onClose={() => {}}
                            data={dataProp}
                            setSelectedData={() => {}}
                            setOpenEditParticipatingPlayersModal={() => {}}
                        />
                    </MantineProvider>
                </DirectionProvider>
            </MemoryRouter>
        </MockedProvider>
    );

describe("ShowParticipatingPlayers", () => {
    test("renders player rows and exposes the select-all / print toolbar", async () => {
        const mocks = [
            {
                request: {
                    query: AllParticipatingPlayers,
                    variables: { idParticipatingTeams: TEAM_ID },
                },
                result: { data: { allParticipatingPlayers: [playerRow()] } },
            },
        ];

        renderModal(mocks);

        await waitFor(() => {
            expect(screen.getByText(/أحمد خالد سالم/)).toBeInTheDocument();
        });
        // toolbar must be present once the list has rendered
        expect(screen.getByText(/تحديد الكل/)).toBeInTheDocument();
        expect(screen.getByText(/طباعة/)).toBeInTheDocument();
    });

    test("renders the empty state when no players match the team filter", async () => {
        const mocks = [
            {
                request: {
                    query: AllParticipatingPlayers,
                    variables: { idParticipatingTeams: TEAM_ID },
                },
                result: { data: { allParticipatingPlayers: [] } },
            },
        ];

        renderModal(mocks);

        await waitFor(() => {
            expect(screen.getByText(/لا يوجد لاعبون مسجلون/)).toBeInTheDocument();
        });
    });

    test("regression: receives the participating-team id as a string, not the match object", async () => {
        // Previously the modal received `selectedMatch` (an empty object) and
        // forwarded it as `idParticipatingTeams`, which silently produced an
        // empty list. Guard by asserting we resolve when the variable is a
        // bare string id.
        const mocks = [
            {
                request: {
                    query: AllParticipatingPlayers,
                    variables: { idParticipatingTeams: TEAM_ID },
                },
                result: { data: { allParticipatingPlayers: [playerRow()] } },
            },
        ];

        renderModal(mocks, TEAM_ID);

        await waitFor(() => {
            expect(screen.getByText(/أحمد خالد سالم/)).toBeInTheDocument();
        });
    });
});
