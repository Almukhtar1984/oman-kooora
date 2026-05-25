import { MockedProvider } from "@apollo/client/testing";
import { DirectionProvider, MantineProvider } from "@mantine/core";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeAll, describe, expect, test, vi } from "vitest";
import { UpdateLeague as UpdateLeagueMutation } from "../../graphql";
import { UpdateLeague } from "./UpdateLeague";

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

const LEAGUE_ID = "league-1";

const existingLeague = {
    id: LEAGUE_ID,
    name: "دوري الهواء",
    description: "بطولة الهواة",
    numberTeams: 10,
    numberGroups: 2,
    internalplayer: 3,
    externalplayer: 2,
    startDate: "2026-06-01",
    expiryDate: "2026-08-01",
    inscriptionStartDate: "2026-05-20",
    inscriptionExpiryDate: "2026-05-30",
};

const renderModal = (data: any, mocks: any[] = []) =>
    render(
        <MockedProvider mocks={mocks} addTypename={false}>
            <MemoryRouter>
                <DirectionProvider initialDirection="rtl">
                    <MantineProvider>
                        <UpdateLeague
                            title="تعديل البطولة"
                            opened={true}
                            onClose={() => {}}
                            data={data}
                        />
                    </MantineProvider>
                </DirectionProvider>
            </MemoryRouter>
        </MockedProvider>
    );

describe("UpdateLeague modal", () => {
    test("populates all four date inputs from existing league data", async () => {
        renderModal(existingLeague);

        await waitFor(() => {
            expect(screen.getByDisplayValue("2026-06-01")).toBeInTheDocument();
        });
        expect(screen.getByDisplayValue("2026-08-01")).toBeInTheDocument();
        expect(screen.getByDisplayValue("2026-05-20")).toBeInTheDocument();
        expect(screen.getByDisplayValue("2026-05-30")).toBeInTheDocument();
    });

    test("regression: submitting without edits preserves the existing tournament dates", async () => {
        // Previously setValues didn't populate startDate/expiryDate, so any
        // edit submitted "Invalid Date" and silently corrupted the row.
        let received: any = null;

        const mocks = [
            {
                request: {
                    query: UpdateLeagueMutation,
                    variables: {
                        id: LEAGUE_ID,
                        content: {
                            name: "دوري الهواء",
                            description: "بطولة الهواة",
                            numberTeams: 10,
                            numberGroups: 2,
                            internalplayer: 3,
                            externalplayer: 2,
                            startDate: "2026-06-01",
                            expiryDate: "2026-08-01",
                            inscriptionStartDate: "2026-05-20",
                            inscriptionExpiryDate: "2026-05-30",
                        },
                    },
                },
                result: () => {
                    received = "matched";
                    return { data: { updateLeague: { status: true } } };
                },
            },
        ];

        renderModal(existingLeague, mocks);

        await waitFor(() => {
            expect(screen.getByDisplayValue("2026-06-01")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole("button", { name: /تأكيد/ }));

        await waitFor(() => {
            expect(received).toBe("matched");
        });
    });

    test("edits to inscription dates make it into the mutation payload", async () => {
        let received: any = null;

        const mocks = [
            {
                request: {
                    query: UpdateLeagueMutation,
                    variables: {
                        id: LEAGUE_ID,
                        content: {
                            name: "دوري الهواء",
                            description: "بطولة الهواة",
                            numberTeams: 10,
                            numberGroups: 2,
                            internalplayer: 3,
                            externalplayer: 2,
                            startDate: "2026-06-01",
                            expiryDate: "2026-08-01",
                            inscriptionStartDate: "2026-05-20",
                            inscriptionExpiryDate: "2026-05-31",
                        },
                    },
                },
                result: () => {
                    received = "matched";
                    return { data: { updateLeague: { status: true } } };
                },
            },
        ];

        renderModal(existingLeague, mocks);

        await waitFor(() => {
            expect(screen.getByDisplayValue("2026-05-30")).toBeInTheDocument();
        });

        fireEvent.change(screen.getByDisplayValue("2026-05-30") as HTMLInputElement, {
            target: { value: "2026-05-31" },
        });

        fireEvent.click(screen.getByRole("button", { name: /تأكيد/ }));

        await waitFor(() => {
            expect(received).toBe("matched");
        });
    });
});
