import { MockedProvider } from "@apollo/client/testing";
import { DirectionProvider, MantineProvider } from "@mantine/core";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeAll, describe, expect, test, vi } from "vitest";
import { UpdateMatch as UpdateMatchMutation } from "../../graphql";
import { UpdateMatchResult } from "./UpdateMatchResult";

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

const MATCH_ID = "match-1";

const matchData = (overrides: any = {}) => ({
    id: MATCH_ID,
    firstTeamGoal: 2,
    secondTeamGoal: 1,
    firstTeam: { id: "pt-1", team: { id: "t1", name: "نادي دماء" } },
    secondTeam: { id: "pt-2", team: { id: "t2", name: "نادي عوف" } },
    ...overrides,
});

const renderModal = (mocks: any[] = [], data: any = matchData()) =>
    render(
        <MockedProvider mocks={mocks} addTypename={false}>
            <MemoryRouter>
                <DirectionProvider initialDirection="rtl">
                    <MantineProvider>
                        <UpdateMatchResult
                            title="تعديل النتيجة"
                            opened={true}
                            onClose={() => {}}
                            data={data}
                        />
                    </MantineProvider>
                </DirectionProvider>
            </MemoryRouter>
        </MockedProvider>
    );

describe("UpdateMatchResult modal", () => {
    test("regression: the UpdateMatch mutation declares UpdateMatchInput (matches server schema)", () => {
        // The server's `updateMatch` argument is `UpdateMatchInput!`. The client
        // previously declared `contentMatch!`, which failed validation silently
        // because every caller swallowed onError. This guard ensures we never
        // regress on the variable-type declaration.
        const src = (UpdateMatchMutation as any).loc?.source?.body ?? "";
        expect(src).toContain("UpdateMatchInput");
        expect(src).not.toContain("contentMatch");
    });

    test("populates the score inputs from the existing match data", async () => {
        renderModal();

        await waitFor(() => {
            expect(screen.getByDisplayValue("2")).toBeInTheDocument();
        });
        expect(screen.getByDisplayValue("1")).toBeInTheDocument();
    });

    test("clicking تأكيد fires updateMatch with the edited score", async () => {
        let received: any = null;

        const mocks = [
            {
                request: {
                    query: UpdateMatchMutation,
                    variables: {
                        id: MATCH_ID,
                        // Not a draw → explicit penalty: null clears any stored shootout.
                        content: { firstTeamGoal: 3, secondTeamGoal: 1, penalty: null },
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
            expect(screen.getByDisplayValue("2")).toBeInTheDocument();
        });

        fireEvent.change(screen.getByDisplayValue("2") as HTMLInputElement, {
            target: { value: "3" },
        });

        fireEvent.click(screen.getByRole("button", { name: /تأكيد/ }));

        await waitFor(() => {
            expect(received).toBe("matched");
        });
    });

    test("shows the penalty section prefilled when the match was decided on penalties", async () => {
        renderModal(
            [],
            matchData({
                firstTeamGoal: 1,
                secondTeamGoal: 1,
                penalty: { id: "pen-1", firstTeamPenalty: 5, secondTeamPenalty: 4 },
            })
        );

        await waitFor(() => {
            expect(screen.getByText("ضربات الترجيح")).toBeInTheDocument();
        });
        expect(screen.getByDisplayValue("5")).toBeInTheDocument();
        expect(screen.getByDisplayValue("4")).toBeInTheDocument();
    });

    test("hides the penalty section when the score is not level", async () => {
        renderModal();

        await waitFor(() => {
            expect(screen.getByDisplayValue("2")).toBeInTheDocument();
        });
        expect(screen.queryByText("ضربات الترجيح")).not.toBeInTheDocument();
    });

    test("submits the shootout result alongside a drawn score", async () => {
        let received: any = null;

        const mocks = [
            {
                request: {
                    query: UpdateMatchMutation,
                    variables: {
                        id: MATCH_ID,
                        content: {
                            firstTeamGoal: 1,
                            secondTeamGoal: 1,
                            penalty: { firstTeamPenalty: 5, secondTeamPenalty: 3 },
                        },
                    },
                },
                result: () => {
                    received = "matched";
                    return { data: { updateMatch: { status: true } } };
                },
            },
        ];

        renderModal(
            mocks,
            matchData({
                firstTeamGoal: 1,
                secondTeamGoal: 1,
                penalty: { id: "pen-1", firstTeamPenalty: 5, secondTeamPenalty: 3 },
            })
        );

        await waitFor(() => {
            expect(screen.getByText("ضربات الترجيح")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole("button", { name: /تأكيد/ }));

        await waitFor(() => {
            expect(received).toBe("matched");
        });
    });

    test("blocks submission when the shootout itself is tied", async () => {
        let received: any = null;

        const mocks = [
            {
                request: {
                    query: UpdateMatchMutation,
                    variables: {
                        id: MATCH_ID,
                        content: {
                            firstTeamGoal: 1,
                            secondTeamGoal: 1,
                            penalty: { firstTeamPenalty: 4, secondTeamPenalty: 4 },
                        },
                    },
                },
                result: () => {
                    received = "matched";
                    return { data: { updateMatch: { status: true } } };
                },
            },
        ];

        renderModal(
            mocks,
            matchData({
                firstTeamGoal: 1,
                secondTeamGoal: 1,
                penalty: { id: "pen-1", firstTeamPenalty: 4, secondTeamPenalty: 4 },
            })
        );

        await waitFor(() => {
            expect(screen.getByText("ضربات الترجيح")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole("button", { name: /تأكيد/ }));

        // Give the (rejected) mutation a chance to fire — it must not.
        await new Promise((resolve) => setTimeout(resolve, 150));
        expect(received).toBe(null);
    });
});
