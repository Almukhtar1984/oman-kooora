import { MockedProvider } from "@apollo/client/testing";
import { DirectionProvider, MantineProvider } from "@mantine/core";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeAll, describe, expect, test, vi } from "vitest";
import {
    AddParticipatingTechnicalStaff as AddParticipatingTechnicalStaffMutation,
    AllTechnicals,
} from "../../graphql";
import { AddParticipatingTechnicalStaff } from "./AddParticipatingTechnicalStaff";

// Capture Notyf toasts: replace the constructor with a class whose instance
// methods forward to module-scoped spies. Using a real class keeps `new Notyf()`
// happy and lets us assert against `notyfSuccess` / `notyfError` from the tests.
const notyfSuccess = vi.fn();
const notyfError = vi.fn();
vi.mock("notyf", () => {
    class NotyfStub {
        success = notyfSuccess;
        error = notyfError;
    }
    return { Notyf: NotyfStub };
});

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

const PTEAM_ID = "pteam-1";
const PTEAM_ID_2 = "pteam-2";
const TEAM_ID = "team-1";
const TECH_A = "tech-a";
const TECH_B = "tech-b";

const buildLeagueData = () => ({
    id: "league-1",
    name: "بطولة الاختبار",
    participatingTeams: [
        {
            id: PTEAM_ID,
            group: "A",
            team: { id: TEAM_ID, name: "نادي دماء" },
        },
        {
            id: PTEAM_ID_2,
            group: "B",
            team: { id: "team-2", name: "نادي بهلاء" },
        },
    ],
});

const allTechnicalsMock = (idTeam: string) => ({
    request: {
        query: AllTechnicals,
        variables: { idTeam },
    },
    result: {
        data: {
            allTechnicalApparatus: [
                {
                    id: TECH_A,
                    occupation: "مدرب",
                    classification: "أول",
                    membership_date: null,
                    status: null,
                    note: null,
                    person: {
                        id: "p-a",
                        personal_picture: "",
                        first_name: "محمد",
                        second_name: "علي",
                        third_name: "ناصر",
                        tribe: "الحبسي",
                        phone: "",
                        card_number: "111",
                        date_birth: "1985-01-01",
                    },
                    team: { id: TEAM_ID, name: "نادي دماء", phone: "" },
                    createdAt: null,
                    updatedAt: null,
                },
                {
                    id: TECH_B,
                    occupation: "مدرب مساعد",
                    classification: "ثاني",
                    membership_date: null,
                    status: null,
                    note: null,
                    person: {
                        id: "p-b",
                        personal_picture: "",
                        first_name: "أحمد",
                        second_name: "خالد",
                        third_name: "سعيد",
                        tribe: "السالمي",
                        phone: "",
                        card_number: "222",
                        date_birth: "1990-01-01",
                    },
                    team: { id: TEAM_ID, name: "نادي دماء", phone: "" },
                    createdAt: null,
                    updatedAt: null,
                },
            ],
        },
    },
});

const renderModal = (mocks: any[], opened = true, data: any = buildLeagueData()) =>
    render(
        <MockedProvider mocks={mocks} addTypename={false}>
            <MemoryRouter>
                <DirectionProvider initialDirection="rtl">
                    <MantineProvider>
                        <AddParticipatingTechnicalStaff
                            title="إضافة جهاز فني"
                            opened={opened}
                            onClose={() => {}}
                            data={data}
                        />
                    </MantineProvider>
                </DirectionProvider>
            </MemoryRouter>
        </MockedProvider>
    );

// Mantine v7's Select trigger is a text input with the visible placeholder
// (`aria-haspopup="listbox"`). Picking by placeholder is unambiguous within
// this form because every Select has a distinct placeholder, and avoids the
// "multiple elements" error from `getByLabelText` (Mantine emits both a
// visible input and a hidden value input under the same label).
const pickFromSelect = async (placeholder: RegExp, optionText: string | RegExp) => {
    const input = screen.getByPlaceholderText(placeholder) as HTMLInputElement;
    fireEvent.click(input);
    fireEvent.focus(input);
    const option = await screen.findByRole("option", { name: optionText });
    fireEvent.click(option);
};

// Variant for when multiple Selects share the same placeholder (e.g. multiple
// technical-staff rows). `index` selects the Nth match in document order.
const pickFromSelectAt = async (
    placeholder: RegExp,
    index: number,
    optionText: string | RegExp,
) => {
    const candidates = screen.getAllByPlaceholderText(placeholder) as HTMLInputElement[];
    if (!candidates[index]) {
        throw new Error(`No Select at index ${index} for placeholder ${placeholder}`);
    }
    fireEvent.click(candidates[index]);
    fireEvent.focus(candidates[index]);
    const option = await screen.findByRole("option", { name: optionText });
    fireEvent.click(option);
};

const clickAddRowButton = () => {
    const btn = screen.getByRole("button", { name: /اضافة عضو الجهاز الفني/ });
    fireEvent.click(btn);
    return btn;
};

const clickSubmit = () => fireEvent.click(screen.getByRole("button", { name: /تأكيد/ }));

describe("AddParticipatingTechnicalStaff", () => {
    test("'+' button is disabled until a team is picked", () => {
        renderModal([]);
        const addBtn = screen.getByRole("button", { name: /اضافة عضو الجهاز الفني/ });
        expect(addBtn).toBeDisabled();
    });

    test("happy path: submits multiple rows with the right content payload", async () => {
        notyfSuccess.mockClear();
        notyfError.mockClear();
        let createMatched = false;

        const mocks = [
            allTechnicalsMock(TEAM_ID),
            {
                request: {
                    query: AddParticipatingTechnicalStaffMutation,
                    variables: {
                        content: [
                            { id_technical_apparatus: TECH_A, id_participating_team: PTEAM_ID },
                            { id_technical_apparatus: TECH_B, id_participating_team: PTEAM_ID },
                        ],
                    },
                },
                result: () => {
                    createMatched = true;
                    return {
                        data: {
                            createParticipatingTechnicalStaff: [
                                { id: "row-1" },
                                { id: "row-2" },
                            ],
                        },
                    };
                },
            },
        ];

        renderModal(mocks);

        // Pick team A
        await pickFromSelect(/^اختر الفريق$/, /نادي دماء/);

        // Wait for the technicals to load (the second useEffect fires AllTechnicals).
        await waitFor(() => {
            // The "+" button should now be enabled.
            expect(screen.getByRole("button", { name: /اضافة عضو الجهاز الفني/ })).toBeEnabled();
        });

        // Add two rows
        clickAddRowButton();
        clickAddRowButton();

        // Pick two distinct technicals
        await pickFromSelectAt(/^اختر عضو الجهاز الفني$/, 0, /محمد علي ناصر/);
        await pickFromSelectAt(/^اختر عضو الجهاز الفني$/, 1, /أحمد خالد سعيد/);

        clickSubmit();

        await waitFor(() => {
            expect(createMatched).toBe(true);
        });
        expect(notyfSuccess).toHaveBeenCalledWith("تم إضافة الجهاز الفني");
        expect(notyfError).not.toHaveBeenCalled();
    });

    test("validation: empty rows are rejected and the create mutation does not fire", async () => {
        notyfSuccess.mockClear();
        notyfError.mockClear();

        // Only AllTechnicals is mocked. If the create mutation fires the test will
        // surface as an unmatched-mock warning + failure.
        const mocks = [allTechnicalsMock(TEAM_ID)];

        renderModal(mocks);

        await pickFromSelect(/^اختر الفريق$/, /نادي دماء/);

        await waitFor(() => {
            expect(screen.getByRole("button", { name: /اضافة عضو الجهاز الفني/ })).toBeEnabled();
        });

        clickAddRowButton();

        // Submit with the technical Select blank.
        clickSubmit();

        // Mantine renders a validation error of "مطلوب" for the missing field.
        await waitFor(() => {
            expect(screen.getByText("مطلوب")).toBeInTheDocument();
        });
        expect(notyfSuccess).not.toHaveBeenCalled();
    });

    test("duplicate guard: same technical chosen twice triggers an error toast and aborts submit", async () => {
        notyfSuccess.mockClear();
        notyfError.mockClear();

        const mocks = [allTechnicalsMock(TEAM_ID)];

        renderModal(mocks);

        await pickFromSelect(/^اختر الفريق$/, /نادي دماء/);
        await waitFor(() => {
            expect(screen.getByRole("button", { name: /اضافة عضو الجهاز الفني/ })).toBeEnabled();
        });

        clickAddRowButton();
        clickAddRowButton();

        await pickFromSelectAt(/^اختر عضو الجهاز الفني$/, 0, /محمد علي ناصر/);
        await pickFromSelectAt(/^اختر عضو الجهاز الفني$/, 1, /محمد علي ناصر/);

        clickSubmit();

        await waitFor(() => {
            expect(notyfError).toHaveBeenCalledWith("لا يمكن إضافة نفس العضو مرتين");
        });
        expect(notyfSuccess).not.toHaveBeenCalled();
    });

    test("mutation error keeps the modal open and surfaces a toast", async () => {
        notyfSuccess.mockClear();
        notyfError.mockClear();

        const mocks = [
            allTechnicalsMock(TEAM_ID),
            {
                request: {
                    query: AddParticipatingTechnicalStaffMutation,
                    variables: {
                        content: [
                            { id_technical_apparatus: TECH_A, id_participating_team: PTEAM_ID },
                        ],
                    },
                },
                error: new Error("boom"),
            },
        ];

        renderModal(mocks);

        await pickFromSelect(/^اختر الفريق$/, /نادي دماء/);
        await waitFor(() => {
            expect(screen.getByRole("button", { name: /اضافة عضو الجهاز الفني/ })).toBeEnabled();
        });

        clickAddRowButton();
        await pickFromSelectAt(/^اختر عضو الجهاز الفني$/, 0, /محمد علي ناصر/);

        clickSubmit();

        await waitFor(() => {
            expect(notyfError).toHaveBeenCalled();
        });
        // Modal still open — the team Select is still rendered.
        expect(screen.getByPlaceholderText(/^اختر الفريق$/)).toBeInTheDocument();
        expect(notyfSuccess).not.toHaveBeenCalled();
    });
});

