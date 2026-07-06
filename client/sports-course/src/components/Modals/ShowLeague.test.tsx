import { DirectionProvider, MantineProvider } from "@mantine/core";
import { MockedProvider } from "@apollo/client/testing";
import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, test, vi } from "vitest";
import { ShowLeague } from "./ShowLeague";

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

const renderModal = (participatingTeams: any[]) =>
    render(
        <MockedProvider addTypename={false}>
            <DirectionProvider initialDirection="rtl">
                <MantineProvider>
                    <ShowLeague
                        title="المجموعات"
                        opened={true}
                        onClose={noop}
                        data={{ id: "L1", name: "دوري الهواء", participatingTeams }}
                        setSelectedData={noop}
                        setOpenShowParticipatingPlayersModal={noop}
                        setOpenShowParticipatingTechnicalStaffModal={noop}
                    />
                </MantineProvider>
            </DirectionProvider>
        </MockedProvider>
    );

describe("ShowLeague participating-team statuses", () => {
    test("shows status counts at the top", () => {
        renderModal([
            { id: "p1", group: "A", status: "accepted", team: { id: "t1", name: "نادي دماء" } },
            { id: "p2", group: "A", status: "accepted", team: { id: "t2", name: "نادي عوف" } },
            { id: "p3", group: "B", status: "waiting", team: { id: "t3", name: "نادي بدر" } },
            { id: "p4", group: "B", status: "rejected", team: { id: "t4", name: "نادي قطر" } },
        ]);

        expect(screen.getByText("مقبولة: 2")).toBeInTheDocument();
        expect(screen.getByText("بانتظار: 1")).toBeInTheDocument();
        expect(screen.getByText("مرفوضة: 1")).toBeInTheDocument();
    });

    test("renders a 'مرفوضة' badge next to the rejected team's row", () => {
        renderModal([
            { id: "p1", group: "A", status: "rejected", team: { id: "t1", name: "نادي قطر" } },
        ]);

        expect(screen.getByText("نادي قطر")).toBeInTheDocument();
        expect(screen.getByText("مرفوضة")).toBeInTheDocument();
    });

    test("renders a 'بانتظار' badge for pending teams", () => {
        renderModal([
            { id: "p1", group: "A", status: "waiting", team: { id: "t1", name: "نادي عمان" } },
        ]);

        expect(screen.getByText("بانتظار")).toBeInTheDocument();
    });

    test("treats a missing status as waiting (defensive default)", () => {
        renderModal([
            { id: "p1", group: "A", team: { id: "t1", name: "نادي السلام" } },
        ]);

        expect(screen.getByText("بانتظار")).toBeInTheDocument();
    });

    test("omits all status pill counts when there are no participating teams", () => {
        renderModal([]);
        expect(screen.queryByText(/مقبولة:/)).not.toBeInTheDocument();
        expect(screen.queryByText(/مرفوضة:/)).not.toBeInTheDocument();
        expect(screen.queryByText(/بانتظار:/)).not.toBeInTheDocument();
    });
});
