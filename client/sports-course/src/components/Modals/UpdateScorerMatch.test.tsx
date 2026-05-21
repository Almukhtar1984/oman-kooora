import { MockedProvider } from "@apollo/client/testing";
import { DirectionProvider, MantineProvider } from "@mantine/core";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeAll, describe, expect, test, vi } from "vitest";
import {
    AllParticipatingPlayers,
    AllScorerMatch,
    DeleteScorerMatch,
    UpdateScorerMatch as UpdateScorerMatchMutation,
} from "../../graphql";
import { UpdateScorerMatch } from "./UpdateScorerMatch";

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

const MATCH_ID = "m-1";
const FIRST_TEAM_ID = "pt-first";
const SECOND_TEAM_ID = "pt-second";
const SCORER_ID = "scorer-1";
const PLAYER_ID = "pp-1";

const matchData = () => ({
    id: MATCH_ID,
    firstTeam: { id: FIRST_TEAM_ID, team: { id: "t1", name: "نادي دماء" } },
    secondTeam: { id: SECOND_TEAM_ID, team: { id: "t2", name: "نادي عوف" } },
});

const baseMocks = () => [
    {
        request: { query: AllScorerMatch, variables: { idMatch: MATCH_ID } },
        result: {
            data: {
                allScorerMatch: [
                    {
                        id: SCORER_ID,
                        time: "55",
                        participating_team: {
                            id: FIRST_TEAM_ID,
                            team: { id: "t1", name: "نادي دماء" },
                        },
                        participating_player: {
                            id: PLAYER_ID,
                            number: "10",
                            player: {
                                id: "pl-1",
                                player_center: "هجوم",
                                person: {
                                    first_name: "خالد",
                                    second_name: "أحمد",
                                    third_name: "ناصر",
                                    tribe: "العامري",
                                },
                            },
                        },
                    },
                ],
            },
        },
    },
    {
        request: { query: AllParticipatingPlayers, variables: { idParticipatingTeams: FIRST_TEAM_ID } },
        result: {
            data: {
                allParticipatingPlayers: [
                    {
                        id: PLAYER_ID,
                        number: "10",
                        participating_team: { id: FIRST_TEAM_ID, group: "A", league: { id: "L1", name: "بطولة" }, team: { id: "t1", name: "نادي دماء" } },
                        player: {
                            id: "pl-1",
                            activity: null,
                            player_center: "هجوم",
                            job: null,
                            status: null,
                            person: {
                                id: "person-1",
                                personal_picture: "",
                                first_name: "خالد",
                                second_name: "أحمد",
                                third_name: "ناصر",
                                tribe: "العامري",
                                phone: "",
                                card_number: "999",
                                date_birth: "1995-01-01",
                            },
                        },
                        createdAt: null,
                        updatedAt: null,
                    },
                ],
            },
        },
    },
    {
        request: { query: AllParticipatingPlayers, variables: { idParticipatingTeams: SECOND_TEAM_ID } },
        result: { data: { allParticipatingPlayers: [] } },
    },
];

const renderModal = (extraMocks: any[] = []) =>
    render(
        <MockedProvider mocks={[...baseMocks(), ...extraMocks]} addTypename={false}>
            <MemoryRouter>
                <DirectionProvider initialDirection="rtl">
                    <MantineProvider>
                        <UpdateScorerMatch
                            title="تعديل الهدافين"
                            opened={true}
                            onClose={() => {}}
                            data={matchData()}
                        />
                    </MantineProvider>
                </DirectionProvider>
            </MemoryRouter>
        </MockedProvider>
    );

describe("UpdateScorerMatch", () => {
    test("loads existing scorers and exposes the add-scorer button", async () => {
        renderModal();

        await waitFor(() => {
            // Time of the scorer row is rendered into a TextInput
            const timeInputs = screen.getAllByDisplayValue("55");
            expect(timeInputs.length).toBeGreaterThan(0);
        });
        expect(screen.getByText("إضافة هداف")).toBeInTheDocument();
        expect(screen.getByText("حفظ")).toBeInTheDocument();
    });

    test("regression: existing scorers are NOT silently dropped on submit", async () => {
        let updateCalled = false;
        let calledWith: any = null;

        const extraMocks = [
            {
                request: {
                    query: UpdateScorerMatchMutation,
                    variables: {
                        content: [
                            {
                                id: SCORER_ID,
                                id_match: MATCH_ID,
                                id_participating_player: PLAYER_ID,
                                id_participating_team: FIRST_TEAM_ID,
                                time: "55",
                            },
                        ],
                    },
                },
                result: () => {
                    updateCalled = true;
                    calledWith = "matched";
                    return { data: { updateScorerMatch: { status: true } } };
                },
            },
        ];

        renderModal(extraMocks);

        await waitFor(() => {
            const timeInputs = screen.getAllByDisplayValue("55");
            expect(timeInputs.length).toBeGreaterThan(0);
        });

        const saveBtn = screen.getByText("حفظ");
        fireEvent.click(saveBtn);

        await waitFor(() => {
            expect(updateCalled).toBe(true);
            expect(calledWith).toBe("matched");
        });
    });

    test("deleting an existing scorer fires deleteScorerMatch", async () => {
        let deleteCalled = false;

        const extraMocks = [
            {
                request: { query: DeleteScorerMatch, variables: { id: SCORER_ID } },
                result: () => {
                    deleteCalled = true;
                    return { data: { deleteScorerMatch: { status: true } } };
                },
            },
            // After the row is removed locally, refetchQueries kicks off
            // another AllLeagues fetch. We don't care about its shape — but
            // the lazy queries on the modal don't re-trigger, so no extra
            // matcher is required.
        ];

        renderModal(extraMocks);

        await waitFor(() => {
            const timeInputs = screen.getAllByDisplayValue("55");
            expect(timeInputs.length).toBeGreaterThan(0);
        });

        // The first trash button corresponds to the loaded scorer.
        const trashButtons = screen.getAllByRole("button").filter((b) =>
            b.querySelector("svg")?.classList.contains("tabler-icon-trash")
        );
        // Fallback: pick the trash icon by aria-label-less ActionIcon — click
        // the first one in the row of scorers.
        const target = trashButtons[0] || screen.getAllByRole("button").find((b) =>
            (b as HTMLElement).innerHTML.includes("trash")
        );
        expect(target).toBeTruthy();
        fireEvent.click(target as HTMLElement);

        await waitFor(() => {
            expect(deleteCalled).toBe(true);
        });
    });
});
