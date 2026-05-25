import { MockedProvider } from "@apollo/client/testing";
import { DirectionProvider, MantineProvider } from "@mantine/core";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeAll, describe, expect, test, vi } from "vitest";
import { UpdateMatch as UpdateMatchMutation } from "../../graphql";
import { AddMatchResult } from "./AddMatchResult";

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

const MATCH_ID = "match-2";

const matchData = () => ({
    id: MATCH_ID,
    firstTeam: { id: "pt-1", team: { id: "t1", name: "نادي دماء" } },
    secondTeam: { id: "pt-2", team: { id: "t2", name: "نادي عوف" } },
});

const renderModal = (mocks: any[] = []) =>
    render(
        <MockedProvider mocks={mocks} addTypename={false}>
            <MemoryRouter>
                <DirectionProvider initialDirection="rtl">
                    <MantineProvider>
                        <AddMatchResult
                            title="إضافة النتيجة"
                            opened={true}
                            onClose={() => {}}
                            data={matchData()}
                        />
                    </MantineProvider>
                </DirectionProvider>
            </MemoryRouter>
        </MockedProvider>
    );

describe("AddMatchResult modal", () => {
    test("clicking تأكيد fires updateMatch with the entered score", async () => {
        let received: any = null;

        const mocks = [
            {
                request: {
                    query: UpdateMatchMutation,
                    variables: {
                        id: MATCH_ID,
                        content: { firstTeamGoal: 4, secondTeamGoal: 2 },
                    },
                },
                result: () => {
                    received = "matched";
                    return { data: { updateMatch: { status: true } } };
                },
            },
        ];

        renderModal(mocks);

        await waitFor(() => {
            expect(screen.getAllByDisplayValue("0").length).toBeGreaterThanOrEqual(2);
        });

        const zeros = screen.getAllByDisplayValue("0") as HTMLInputElement[];
        fireEvent.change(zeros[0], { target: { value: "4" } });
        fireEvent.change(zeros[1], { target: { value: "2" } });

        fireEvent.click(screen.getByRole("button", { name: /تأكيد/ }));

        await waitFor(() => {
            expect(received).toBe("matched");
        });
    });
});
