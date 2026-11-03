import React from "react";
import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PlayersTableLoan } from "../../components/Tables/PlayersTableLoan";
import { PlayersTableTransfer } from "../../components/Tables/PlayersTableTransfer";
import { dateCell, gridTemplate, TRANSFER_SEARCH_KEYS } from "../../lib/helpers/tableGrid";
import { searchSortedData } from "../../lib/helpers/sort";

// صفحتا الإعارات والانتقالات في لوحة الفريق كانتا متداخلتين: أُضيف عمود ولم
// يُضف عرضه، فخرجت آخر خلية كل سطر إلى السطر التالي وانزاح كل ما بعدها.

const ME = "team-me";
const person = { first_name: "راشد", second_name: "محمد", third_name: "سالم", tribe: "الحنفي", card_number: "27208084" };
const row = (over: any = {}) => ({
    id: "t-1",
    status: "accepted",
    transition_type: "loan",
    date_start: null,
    date_end: null,
    team_from: { id: "team-other", name: "بلادسيب", club: { id: "c2", name: "نادي بلادسيب" } },
    team_to: { id: ME, name: "فريق الطموح", club: { id: "c1", name: "النادي النهضة" } },
    player: { id: "p-1", activity: "كرة القدم", player_center: "مهاجم", job: "طالب", person },
    createdAt: "2026-11-01 10:00:00",
    ...over,
});

const mount = (ui: React.ReactElement) => render(<MantineProvider>{ui}</MantineProvider>);

/** The track count the table library was actually given. */
const injectedTracks = () => {
    const css = Array.from(document.querySelectorAll("style"), (s) => s.textContent || "").join("\n");
    // The library injects an empty default first, and earlier renders' styles stay
    // in <head>: the table just mounted is the last real template.
    const templates = (css.match(/--data-table-library_grid-template-columns:\s*[^;]+;/g) || [])
        .map((m) => m.replace(/^[^:]+:\s*/, "").replace(/;$/, "").trim())
        .filter((value) => value && value !== "''");
    expect(templates.length).toBeGreaterThan(0);
    return templates[templates.length - 1].split(/\s+/).length;
};

describe("gridTemplate", () => {
    it("gives every column a track — a column without its own width still gets one", () => {
        expect(gridTemplate([{ width: "80px" }, {}, { width: "20%" }])).toBe("80px 120px 20%");
    });
});

describe("dateCell", () => {
    it("never prints null or the 1970 placeholder", () => {
        expect(dateCell(null)).toBe("—");
        expect(dateCell(undefined)).toBe("—");
        expect(dateCell("1970-01-01")).toBe("—");
        expect(dateCell("2026-07-01")).toBe("2026-07-01");
    });
});

describe("transfer search", () => {
    it("finds a row by the player's name or the other team — rows have no `name` field", () => {
        const rows = [row(), row({ id: "t-2", team_from: { id: "x", name: "الخليج" }, player: { person: { first_name: "سعيد" } } })];
        expect(searchSortedData(rows, TRANSFER_SEARCH_KEYS, "راشد").map((r: any) => r.id)).toEqual(["t-1"]);
        expect(searchSortedData(rows, TRANSFER_SEARCH_KEYS, "الخليج").map((r: any) => r.id)).toEqual(["t-2"]);
    });
});

describe.each([
    ["PlayersTableLoan", () => <PlayersTableLoan list={[row()]} search="" idTeam={ME} />],
    ["PlayersTableTransfer", () => <PlayersTableTransfer list={[row({ transition_type: "transition" })]} search="" idTeam={ME} />],
])("%s", (_name, ui) => {
    it("has exactly one grid track per column, so rows do not slide into each other", () => {
        const { container } = mount(ui());
        const headers = container.querySelectorAll(".th").length;
        expect(headers).toBeGreaterThan(0);
        expect(injectedTracks()).toBe(headers);
        // And each row fills exactly one line of that grid.
        expect(container.querySelectorAll(".td").length).toBe(headers);
    });

    it("reads activity and position from the player and shows the team with its club", () => {
        mount(ui());
        expect(screen.getByText("كرة القدم")).toBeInTheDocument();
        expect(screen.getByText("مهاجم")).toBeInTheDocument();
        expect(screen.getByText("بلادسيب — نادي بلادسيب")).toBeInTheDocument();
        expect(screen.queryByText("null")).not.toBeInTheDocument();
    });
});

describe("PlayersTableLoan loan state", () => {
    it("does not call a loan without an end date «منتهي»", () => {
        mount(<PlayersTableLoan list={[row()]} search="" idTeam={ME} />);
        expect(screen.queryByText("منتهي")).not.toBeInTheDocument();
    });

    it("does not call a pending request «مستمر»", () => {
        mount(<PlayersTableLoan list={[row({ status: "waiting_club_to", date_start: "2026-07-01", date_end: "2099-07-31" })]} search="" idTeam={ME} />);
        expect(screen.queryByText("مستمر")).not.toBeInTheDocument();
        expect(screen.getByText("2099-07-31")).toBeInTheDocument();
    });

    it("marks a running accepted loan «مستمر»", () => {
        mount(<PlayersTableLoan list={[row({ date_start: "2026-07-01", date_end: "2099-07-31" })]} search="" idTeam={ME} />);
        expect(screen.getByText("مستمر")).toBeInTheDocument();
    });
});
