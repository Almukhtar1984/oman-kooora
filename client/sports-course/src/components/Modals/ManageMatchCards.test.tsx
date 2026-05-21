import { MockedProvider } from "@apollo/client/testing";
import { DirectionProvider, MantineProvider } from "@mantine/core";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeAll, describe, expect, test, vi } from "vitest";
import { DeleteMatchCard, UpdateMatchCard } from "../../graphql";
import { ManageMatchCards } from "./ManageMatchCards";

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

const FIRST_TEAM = "pt-first";
const SECOND_TEAM = "pt-second";
const CARD_1 = "card-1";

const matchData = (cards: { team: 1 | 2; id: string; type: string; player: string; date: string }[]) => ({
    id: "m-99",
    firstTeam: { id: FIRST_TEAM, team: { id: "t1", name: "نادي دماء" } },
    secondTeam: { id: SECOND_TEAM, team: { id: "t2", name: "نادي عوف" } },
    firstTeamCards: cards
        .filter((c) => c.team === 1)
        .map((c) => ({
            id: c.id,
            type: c.type,
            player: c.player,
            date: c.date,
            team: { id: FIRST_TEAM, team: { id: "t1", name: "نادي دماء" } },
        })),
    secondTeamCards: cards
        .filter((c) => c.team === 2)
        .map((c) => ({
            id: c.id,
            type: c.type,
            player: c.player,
            date: c.date,
            team: { id: SECOND_TEAM, team: { id: "t2", name: "نادي عوف" } },
        })),
});

const renderModal = (data: any, mocks: any[]) =>
    render(
        <MockedProvider mocks={mocks} addTypename={false}>
            <MemoryRouter>
                <DirectionProvider initialDirection="rtl">
                    <MantineProvider>
                        <ManageMatchCards
                            title="تعديل البطاقات"
                            opened={true}
                            onClose={() => {}}
                            data={data}
                        />
                    </MantineProvider>
                </DirectionProvider>
            </MemoryRouter>
        </MockedProvider>
    );

describe("ManageMatchCards", () => {
    test("renders rows for existing cards on both teams", () => {
        const data = matchData([
            { team: 1, id: CARD_1, type: "yellow", player: "أحمد", date: "30" },
            { team: 2, id: "card-2", type: "red", player: "خالد", date: "70" },
        ]);

        renderModal(data, []);

        expect(screen.getByDisplayValue("أحمد")).toBeInTheDocument();
        expect(screen.getByDisplayValue("خالد")).toBeInTheDocument();
        // Both badges should appear (one yellow, one red) — match by Arabic copy.
        expect(screen.getAllByText("صفراء").length).toBeGreaterThan(0);
        expect(screen.getAllByText("حمراء").length).toBeGreaterThan(0);
    });

    test("empty state when no cards exist", () => {
        const data = matchData([]);
        renderModal(data, []);

        expect(screen.getByText(/لا توجد بطاقات/)).toBeInTheDocument();
    });

    test("clicking the trash button fires deleteMatchCard for that row", async () => {
        let deleted = false;
        const data = matchData([
            { team: 1, id: CARD_1, type: "yellow", player: "أحمد", date: "30" },
        ]);

        const mocks = [
            {
                request: { query: DeleteMatchCard, variables: { id: CARD_1 } },
                result: () => {
                    deleted = true;
                    return { data: { deleteMatchCard: { status: true } } };
                },
            },
        ];

        renderModal(data, mocks);

        // The trash button is the lone red ActionIcon in the row.
        const buttons = screen.getAllByRole("button");
        const trashBtn = buttons.find((b) =>
            (b as HTMLElement).querySelector("svg")?.classList.contains("tabler-icon-trash")
        );
        expect(trashBtn).toBeTruthy();
        fireEvent.click(trashBtn as HTMLElement);

        await waitFor(() => {
            expect(deleted).toBe(true);
        });
    });

    test("save button is disabled until a field is edited", () => {
        const data = matchData([
            { team: 1, id: CARD_1, type: "yellow", player: "أحمد", date: "30" },
        ]);
        renderModal(data, []);

        const save = screen.getByRole("button", { name: /حفظ التغييرات/ });
        expect((save as HTMLButtonElement).disabled).toBe(true);
    });

    test("editing a player name marks the row dirty and updateMatchCard runs on save", async () => {
        let calledWith: any = null;
        const data = matchData([
            { team: 1, id: CARD_1, type: "yellow", player: "أحمد", date: "30" },
        ]);

        const mocks = [
            {
                request: {
                    query: UpdateMatchCard,
                    variables: {
                        id: CARD_1,
                        content: {
                            type: "yellow",
                            player: "أحمد ناصر",
                            date: "30",
                            id_team: FIRST_TEAM,
                            id_match: "m-99",
                        },
                    },
                },
                result: () => {
                    calledWith = "matched";
                    return { data: { updateMatchCard: { status: true } } };
                },
            },
        ];

        renderModal(data, mocks);

        const playerInput = screen.getByDisplayValue("أحمد") as HTMLInputElement;
        fireEvent.change(playerInput, { target: { value: "أحمد ناصر" } });

        const save = screen.getByRole("button", { name: /حفظ التغييرات/ });
        expect((save as HTMLButtonElement).disabled).toBe(false);
        fireEvent.click(save);

        await waitFor(() => {
            expect(calledWith).toBe("matched");
        });
    });
});
