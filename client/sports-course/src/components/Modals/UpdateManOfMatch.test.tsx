import { MockedProvider } from "@apollo/client/testing";
import { DirectionProvider, MantineProvider } from "@mantine/core";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeAll, describe, expect, test, vi } from "vitest";
import { UpdateMatch as UpdateMatchMutation } from "../../graphql";
import { UpdateManOfMatch } from "./UpdateManOfMatch";

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

const MATCH_ID = "match-3";

const matchData = () => ({
    id: MATCH_ID,
    manOfMatch: "خالد أحمد",
});

const renderModal = (mocks: any[] = []) =>
    render(
        <MockedProvider mocks={mocks} addTypename={false}>
            <MemoryRouter>
                <DirectionProvider initialDirection="rtl">
                    <MantineProvider>
                        <UpdateManOfMatch
                            title="تعديل رجل المباراة"
                            opened={true}
                            onClose={() => {}}
                            data={matchData()}
                        />
                    </MantineProvider>
                </DirectionProvider>
            </MemoryRouter>
        </MockedProvider>
    );

describe("UpdateManOfMatch modal", () => {
    test("populates the input from the existing manOfMatch", async () => {
        renderModal();

        await waitFor(() => {
            expect(screen.getByDisplayValue("خالد أحمد")).toBeInTheDocument();
        });
    });

    test("clicking تأكيد fires updateMatch with the new manOfMatch", async () => {
        let received: any = null;

        const mocks = [
            {
                request: {
                    query: UpdateMatchMutation,
                    variables: {
                        id: MATCH_ID,
                        content: { manOfMatch: "سعيد ناصر" },
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
            expect(screen.getByDisplayValue("خالد أحمد")).toBeInTheDocument();
        });

        fireEvent.change(screen.getByDisplayValue("خالد أحمد") as HTMLInputElement, {
            target: { value: "سعيد ناصر" },
        });

        fireEvent.click(screen.getByRole("button", { name: /تأكيد/ }));

        await waitFor(() => {
            expect(received).toBe("matched");
        });
    });
});
