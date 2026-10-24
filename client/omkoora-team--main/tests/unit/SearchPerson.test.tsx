import React from "react";
import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// A club opened this very modal, read "نادي بهلاء" next to its own player's
// team name, and only then understood why its squad had vanished: the players
// had been registered into another club's identically-named فريق الاتفاق.
// Nothing on the screen had said which club the team belonged to.

const h = vi.hoisted(() => ({
    getPerson: vi.fn(),
    personResult: { data: undefined as any, error: undefined },
    associatePlayer: vi.fn(),
}));

vi.mock("../../graphql", () => ({
    useGetPerson: () => [h.getPerson, h.personResult],
    useAssociatePlayer: () => [h.associatePlayer],
}));

vi.mock("../../store/useStore", () => ({
    default: (selector: any) =>
        selector({ userData: { person: { member: { team: { id: "team-1", club: { id: "club-1", name: "نادي الرستاق" } } } } } }),
}));

vi.mock("notyf", () => ({
    Notyf: class { success = vi.fn(); error = vi.fn(); open = vi.fn(); },
}));

vi.mock("../../components/Modal/DeletePersonModal", () => ({
    DeletePersonModal: () => null,
}));

import { SearchPerson } from "../../components/Modal/SearchPerson";

const person = (clubId: string, clubName: string) => ({
    id: "person-1",
    first_name: "محمود", second_name: "بن علي", third_name: "بن سعيد", tribe: "القافري",
    phone: "90001111", card_number: "22161381", date_birth: "1995-01-01",
    member: null, technicalApparatus: null,
    player: {
        id: "player-1", activity: "كرة القدم", status: "waiting", type: "internal",
        team: { id: "team-9", name: "فريق الاتفاق", club: { id: clubId, name: clubName } },
    },
});

const renderModal = () =>
    render(
        <MantineProvider theme={{ dir: "rtl" }}>
            <SearchPerson title="بحث بالرقم المدني" opened onClose={() => {}} data={null} />
        </MantineProvider>
    );

beforeEach(() => {
    vi.clearAllMocks();
    h.personResult = { data: { person: person("club-9", "نادي بهلاء") }, error: undefined };
});

describe("<SearchPerson /> (الفريق) — فريق يحمل نفس الاسم في نادٍ آخر", () => {
    it("يحذّر عندما يكون الفريق تابعاً لنادٍ آخر", async () => {
        renderModal();
        const warning = await screen.findByText(/مسجَّل في نادٍ آخر/);
        expect(warning).toHaveTextContent("نادي بهلاء");
        expect(screen.getByText("نادٍ آخر")).toBeInTheDocument();
    });

    it("يعرض اسم الفريق مقروناً بناديه", async () => {
        renderModal();
        expect(await screen.findByText("فريق الاتفاق — نادي بهلاء")).toBeInTheDocument();
    });

    it("يذكر حالة التسجيل", async () => {
        renderModal();
        expect(await screen.findByText(/بانتظار اعتماد الفريق/)).toBeInTheDocument();
    });

    it("لا يحذّر عندما يكون الفريق من نادي الفريق نفسه", async () => {
        h.personResult = { data: { person: person("club-1", "نادي الرستاق") }, error: undefined };
        renderModal();

        expect(await screen.findByText("فريق الاتفاق — نادي الرستاق")).toBeInTheDocument();
        expect(screen.queryByText(/مسجَّل في نادٍ آخر/)).not.toBeInTheDocument();
        expect(screen.queryByText("نادٍ آخر")).not.toBeInTheDocument();
    });
});
