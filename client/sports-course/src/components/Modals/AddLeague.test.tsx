import { MockedProvider } from "@apollo/client/testing";
import { DirectionProvider, MantineProvider } from "@mantine/core";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { AddLeague as AddLeagueMutation } from "../../graphql";
import useStore from "../../store/useStore";
import { AddLeague } from "./AddLeague";

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

const CLUB_ID = "club-1";

beforeEach(() => {
    useStore.setState({
        userData: { person: { clubManagement: { club: { id: CLUB_ID } } } },
    } as any);
});

const renderModal = (mocks: any[] = []) =>
    render(
        <MockedProvider mocks={mocks} addTypename={false}>
            <MemoryRouter>
                <DirectionProvider initialDirection="rtl">
                    <MantineProvider>
                        <AddLeague title="إضافة بطولة" opened={true} onClose={() => {}} />
                    </MantineProvider>
                </DirectionProvider>
            </MemoryRouter>
        </MockedProvider>
    );

describe("AddLeague modal", () => {
    test("renders the four date inputs: tournament + inscription windows", () => {
        renderModal();

        // Tournament dates
        expect(screen.getByLabelText(/تاريخ بداية البطولة/)).toBeInTheDocument();
        expect(screen.getByLabelText(/تاريخ نهاية البطولة/)).toBeInTheDocument();
        // Inscription window — this is the fix that surfaces the previously
        // hidden DB columns so registration status can become "مفتوح".
        expect(screen.getByLabelText(/تاريخ بداية التسجيل/)).toBeInTheDocument();
        expect(screen.getByLabelText(/تاريخ نهاية التسجيل/)).toBeInTheDocument();
    });

    test("submits inscription dates alongside tournament dates", async () => {
        let received: any = null;

        const mocks = [
            {
                request: {
                    query: AddLeagueMutation,
                    variables: {
                        content: {
                            name: "دوري الهواء",
                            numberTeams: 8,
                            numberGroups: 2,
                            internalplayer: 0,
                            externalplayer: 0,
                            description: "بطولة تجريبية",
                            startDate: "2026-06-01",
                            expiryDate: "2026-08-01",
                            inscriptionStartDate: "2026-05-20",
                            inscriptionExpiryDate: "2026-05-30",
                            id_club: CLUB_ID,
                        },
                    },
                },
                result: () => {
                    received = "matched";
                    return { data: { createLeague: { id: "league-new" } } };
                },
            },
        ];

        renderModal(mocks);

        // Text/number inputs
        fireEvent.change(screen.getByLabelText(/اسم الدورة/) as HTMLInputElement, {
            target: { value: "دوري الهواء" },
        });
        fireEvent.change(screen.getByLabelText(/الوصف/) as HTMLInputElement, {
            target: { value: "بطولة تجريبية" },
        });
        fireEvent.change(screen.getByLabelText(/^عدد الفرق$/) as HTMLInputElement, {
            target: { value: "8" },
        });
        fireEvent.change(screen.getByLabelText(/عدد المجموعات/) as HTMLInputElement, {
            target: { value: "2" },
        });

        // Mantine DateInput renders a text input we can type into when valueFormat
        // is set; entering YYYY-MM-DD parses cleanly.
        fireEvent.change(screen.getByLabelText(/تاريخ بداية البطولة/) as HTMLInputElement, {
            target: { value: "2026-06-01" },
        });
        fireEvent.change(screen.getByLabelText(/تاريخ نهاية البطولة/) as HTMLInputElement, {
            target: { value: "2026-08-01" },
        });
        fireEvent.change(screen.getByLabelText(/تاريخ بداية التسجيل/) as HTMLInputElement, {
            target: { value: "2026-05-20" },
        });
        fireEvent.change(screen.getByLabelText(/تاريخ نهاية التسجيل/) as HTMLInputElement, {
            target: { value: "2026-05-30" },
        });

        fireEvent.click(screen.getByRole("button", { name: /تأكيد/ }));

        await waitFor(() => {
            expect(received).toBe("matched");
        });
    });
});
