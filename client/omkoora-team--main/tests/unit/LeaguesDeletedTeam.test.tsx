import React from "react";
import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// «المسابقات» سقطت عند «فريق الطموح» (العميل، 2026-11-20): فريق «الخليج»
// حُذف بعد أن شاركه أربع دورات، فرجع فريقه في الدورة فارغاً، وقراءة
// اسمه أسقطت الصفحة كلها. الصفحة تبقى قائمة مهما رجع من الخادم.

const h = vi.hoisted(() => ({ mobile: false }));
vi.mock("@mantine/hooks", async (original) => ({
    ...(await original<any>()),
    useMediaQuery: () => h.mobile,
}));
vi.mock("../../lib/helpers/openPrint", () => ({ openPrint: vi.fn() }));

import { LeaguesTabel } from "../../components/Tables";

const league = {
    id: "l1",
    name: "ابو النخيل",
    description: "",
    numberTeams: 3,
    numberGroups: 1,
    inscriptionExpiryDate: "2020-01-01",
    startDate: "2020-01-01",
    expiryDate: "2020-02-01",
    matchs: [],
    participatingTeams: [
        { id: "p-deleted", status: "accepted", team: null },
        { id: "p-other", status: "accepted" },
        { id: "p-mine", status: "accepted", team: { id: "tomoh" } },
    ],
};

const noop = () => {};
const renderTable = (data: any[], idTeam: any = "tomoh") => render(
    <MantineProvider theme={{ dir: "rtl" }}>
        <LeaguesTabel
            data={data}
            idTeam={idTeam}
            setSelectedData={noop}
            setOpenShowGroupsModal={noop}
            setOpenShowMatchsModal={noop}
            setOpenEditModal={noop}
            setOpenDeleteModal={noop}
            setOpenAddParticipatingModal={noop}
            setOpenEditParticipatingModal={noop}
            setOpenAddMatchModal={noop}
            setOpenAddParticipatingPlayersModal={noop}
            setOpenAddParticipatingTechnicalStaffModal={noop}
            setOpenTeamParticipationAccptedModal={noop}
            setSelectedParticipationTeam={noop}
        />
    </MantineProvider>
);

describe("«المسابقات» وفريقٌ محذوف في الدورة", () => {
    it("الجدول يُعرض وحالة الفريق صحيحة", () => {
        h.mobile = false;
        renderTable([league]);
        expect(screen.getByText("ابو النخيل")).toBeInTheDocument();
        expect(screen.getByText("مشارك")).toBeInTheDocument();
    });

    it("دورة لا يظهر فيها الفريق نفسه، وقائمة مشاركين فارغة", () => {
        h.mobile = false;
        renderTable([
            { ...league, id: "l2", name: "دورة أخرى", participatingTeams: [{ id: "x", status: "accepted", team: null }] },
            { ...league, id: "l3", name: "دورة بلا قائمة", participatingTeams: null },
        ]);
        expect(screen.getByText("دورة أخرى")).toBeInTheDocument();
        expect(screen.getByText("دورة بلا قائمة")).toBeInTheDocument();
    });

    it("على الجوال أيضاً", () => {
        h.mobile = true;
        renderTable([league]);
        expect(screen.getByText("ابو النخيل")).toBeInTheDocument();
    });
});
