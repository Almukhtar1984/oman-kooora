import { DirectionProvider, MantineProvider } from "@mantine/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { isLeagueEnded, LeagueCard } from "./LeagueCard";

const openMenu = () => {
    // The menu trigger is the lone ActionIcon containing the IconDotsVertical svg.
    const buttons = screen.getAllByRole("button");
    const trigger = buttons.find((b) =>
        (b as HTMLElement).querySelector("svg.tabler-icon-dots-vertical")
    );
    if (!trigger) throw new Error("Menu trigger not found");
    fireEvent.click(trigger);
};

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

const noop = () => {};

const renderCard = (data: any) =>
    render(
        <DirectionProvider initialDirection="rtl">
            <MantineProvider>
                <LeagueCard
                    data={data}
                    onShowMatches={noop}
                    onShowGroups={noop}
                    onShowStats={noop}
                    onAddMatch={noop}
                    onAddParticipating={noop}
                    onEditParticipating={noop}
                    onAddParticipatingPlayers={noop}
                    onAddParticipatingTechnicalStaff={noop}
                    onEdit={noop}
                    onDelete={noop}
                />
            </MantineProvider>
        </DirectionProvider>
    );

const baseLeague = {
    id: "L1",
    name: "دوري الهواء",
    description: "بطولة تجريبية",
    numberTeams: 8,
    numberGroups: 2,
    startDate: "2026-06-01",
    expiryDate: "2026-08-01",
    participatingTeams: [],
    matchs: [],
};

describe("LeagueCard status badge", () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    test("shows متوقف when inscription dates are missing (default DB state)", () => {
        renderCard({ ...baseLeague, inscriptionStartDate: "", inscriptionExpiryDate: "" });
        expect(screen.getByText("متوقف")).toBeInTheDocument();
    });

    test("shows لم يبدأ when current date is before inscription start", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-05-10T12:00:00Z"));

        renderCard({
            ...baseLeague,
            inscriptionStartDate: "2026-05-20",
            inscriptionExpiryDate: "2026-05-30",
        });
        expect(screen.getByText("لم يبدأ")).toBeInTheDocument();
    });

    test("shows مفتوح when current date falls within the inscription window", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-05-25T12:00:00Z"));

        renderCard({
            ...baseLeague,
            inscriptionStartDate: "2026-05-20",
            inscriptionExpiryDate: "2026-05-30",
        });
        expect(screen.getByText("مفتوح")).toBeInTheDocument();
    });

    test("shows متوقف when current date is past inscription end", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-06-15T12:00:00Z"));

        renderCard({
            ...baseLeague,
            inscriptionStartDate: "2026-05-20",
            inscriptionExpiryDate: "2026-05-30",
        });
        expect(screen.getByText("متوقف")).toBeInTheDocument();
    });
});

describe("isLeagueEnded helper", () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    test("returns false when expiryDate is missing", () => {
        expect(isLeagueEnded({ expiryDate: "" })).toBe(false);
        expect(isLeagueEnded({})).toBe(false);
    });

    test("returns false when expiryDate is in the future", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-07-01T12:00:00Z"));
        expect(isLeagueEnded({ expiryDate: "2026-08-01" })).toBe(false);
    });

    test("returns false on the same day as expiryDate (gives the full day)", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-08-01T12:00:00Z"));
        expect(isLeagueEnded({ expiryDate: "2026-08-01" })).toBe(false);
    });

    test("returns true the day after expiryDate", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-08-02T08:00:00Z"));
        expect(isLeagueEnded({ expiryDate: "2026-08-01" })).toBe(true);
    });
});

describe("LeagueCard end-of-tournament lock", () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    test("shows منتهية badge when the tournament has ended", () => {
        // Fake only Date: freezing real timers blocks Mantine's menu
        // transition, which keeps the dropdown from ever rendering.
        vi.useFakeTimers({ toFake: ["Date"] });
        vi.setSystemTime(new Date("2026-09-01T12:00:00Z"));

        renderCard({ ...baseLeague, expiryDate: "2026-08-01" });
        expect(screen.getByText("منتهية")).toBeInTheDocument();
    });

    test("hides 'تعديل' and 'حذف' menu items once ended", async () => {
        vi.useFakeTimers({ toFake: ["Date"] });
        vi.setSystemTime(new Date("2026-09-01T12:00:00Z"));

        renderCard({
            ...baseLeague,
            expiryDate: "2026-08-01",
            participatingTeams: [{ id: "PT1" }],
        });
        openMenu();

        // Wait for the dropdown — read-only items stay visible once ended,
        // which also proves the menu actually opened.
        expect(await screen.findByText("عرض المجموعات")).toBeInTheDocument();

        // These mutate the tournament, so they must be gone once it's ended.
        expect(screen.queryByText("تعديل")).not.toBeInTheDocument();
        expect(screen.queryByText("حذف")).not.toBeInTheDocument();
        expect(screen.queryByText("إضافة مباراة")).not.toBeInTheDocument();
        expect(screen.queryByText("تعديل الفرق")).not.toBeInTheDocument();
        expect(screen.queryByText("إضافة لاعبين")).not.toBeInTheDocument();
        expect(screen.queryByText("إضافة جهاز فني")).not.toBeInTheDocument();
        expect(screen.queryByText("إضافة فرق")).not.toBeInTheDocument();
    });

    test("keeps edit/delete actions visible while the tournament is still active", async () => {
        vi.useFakeTimers({ toFake: ["Date"] });
        vi.setSystemTime(new Date("2026-07-01T12:00:00Z"));

        renderCard({ ...baseLeague, expiryDate: "2026-08-01" });
        expect(screen.queryByText("منتهية")).not.toBeInTheDocument();

        openMenu();
        // The dropdown mounts asynchronously (floating-ui), so wait for it.
        expect(await screen.findByText("تعديل")).toBeInTheDocument();
        expect(screen.getByText("حذف")).toBeInTheDocument();
    });
});
