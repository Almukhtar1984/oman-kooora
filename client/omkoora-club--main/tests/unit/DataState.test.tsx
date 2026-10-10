import React from "react";
import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DataEmpty, DataLoading, DataState } from "../../components/Loading/DataState";
import { MembersTable } from "../../components/Tables/MembersTable";

const wrap = (ui: React.ReactElement) => render(<MantineProvider theme={{ dir: "rtl" }}>{ui}</MantineProvider>);

const member = (id: string, name: string) => ({
    id,
    status: "accepted",
    classification: "عضو",
    createdAt: "2026-01-01 10:00:00",
    person: { id: `p-${id}`, first_name: name, second_name: "بن", third_name: "محمد", tribe: "التجريبي" },
    team: { id: "t-1", name: "الفريق الأول" },
});

describe("DataLoading", () => {
    it("announces itself as busy while the data is on its way", () => {
        wrap(<DataLoading />);
        const box = screen.getByTestId("data-loading");
        expect(box).toHaveAttribute("aria-busy", "true");
        expect(screen.getByText("جاري تحميل البيانات...")).toBeInTheDocument();
    });

    it("takes a custom label", () => {
        wrap(<DataLoading label="جاري تحميل اللاعبين..." />);
        expect(screen.getByText("جاري تحميل اللاعبين...")).toBeInTheDocument();
    });

    it("draws placeholder cards shaped like the list that is coming", () => {
        const { container } = wrap(<DataLoading variant="cards" count={6} />);
        expect(container.querySelectorAll(".mantine-Skeleton-root").length).toBeGreaterThanOrEqual(6);
    });

    it("draws placeholder rows for table views", () => {
        const { container } = wrap(<DataLoading variant="rows" count={4} />);
        expect(container.querySelectorAll(".mantine-Skeleton-root").length).toBeGreaterThanOrEqual(4);
    });
});

describe("DataState", () => {
    it("shows the skeleton while loading — never the empty state", () => {
        wrap(<DataState loading empty><div>القائمة</div></DataState>);
        expect(screen.getByTestId("data-loading")).toBeInTheDocument();
        expect(screen.queryByTestId("data-empty")).not.toBeInTheDocument();
        expect(screen.queryByText("القائمة")).not.toBeInTheDocument();
    });

    it("shows the empty state only once loading has finished", () => {
        wrap(<DataState loading={false} empty><div>القائمة</div></DataState>);
        expect(screen.getByTestId("data-empty")).toBeInTheDocument();
        expect(screen.getByText("لا يوجد بيانات")).toBeInTheDocument();
    });

    it("shows the list when there is data", () => {
        wrap(<DataState loading={false} empty={false}><div>القائمة</div></DataState>);
        expect(screen.getByText("القائمة")).toBeInTheDocument();
        expect(screen.queryByTestId("data-loading")).not.toBeInTheDocument();
        expect(screen.queryByTestId("data-empty")).not.toBeInTheDocument();
    });
});

// The club reported "لا يوجد بيانات" on a page whose query was still running.
describe("<MembersTable /> — the three states", () => {
    const props = { search: "", hasPermission: () => true };

    it("shows the skeleton instead of 'لا يوجد بيانات' while loading", () => {
        wrap(<MembersTable {...props} list={[]} loading />);
        expect(screen.getByTestId("data-loading")).toBeInTheDocument();
        expect(screen.queryByText("لا يوجد بيانات")).not.toBeInTheDocument();
    });

    it("shows the empty state once loading finished with nothing", () => {
        wrap(<MembersTable {...props} list={[]} loading={false} />);
        expect(screen.getByTestId("data-empty")).toBeInTheDocument();
        expect(screen.getByText("لا يوجد بيانات")).toBeInTheDocument();
    });

    it("renders the members once they arrive", () => {
        wrap(<MembersTable {...props} list={[member("1", "أحمد"), member("2", "خالد")]} loading={false} />);
        expect(screen.queryByTestId("data-loading")).not.toBeInTheDocument();
        expect(screen.queryByTestId("data-empty")).not.toBeInTheDocument();
        expect(screen.getByText(/أحمد/)).toBeInTheDocument();
        expect(screen.getByText(/خالد/)).toBeInTheDocument();
    });

    it("keeps showing the rows during a background refetch", () => {
        wrap(<MembersTable {...props} list={[member("1", "أحمد")]} loading />);
        expect(screen.getByText(/أحمد/)).toBeInTheDocument();
        expect(screen.queryByTestId("data-loading")).not.toBeInTheDocument();
    });
});
