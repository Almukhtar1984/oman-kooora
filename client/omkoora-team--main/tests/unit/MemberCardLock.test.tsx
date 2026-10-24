import React from "react";
import { MantineProvider } from "@mantine/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// بعد اعتماد النادي، الفريق لا يعدّل العضو ولا يحذفه ولا يحرّره.
//
// الاعتماد توقيع النادي على التسجيل؛ ولو بقي الفريق قادراً على تغييره بعده
// لاختلفت البطاقة التي اعتمدها النادي عن الموجودة في النظام دون أن يدري أحد.

vi.mock("../../store/useStore", () => ({
    default: (selector: any) =>
        selector({ userData: { person: { member: { team: { id: "team-1", name: "فريق الحزم" } } } } }),
}));

vi.mock("../../lib/helpers/openPrint", () => ({ openPrint: vi.fn() }));

import { MemberCard } from "../../components/Card/MemberCard";

const person = {
    id: "person-1",
    first_name: "محمد", second_name: "بن سالم", third_name: "بن علي", tribe: "الحراصي",
    card_number: "12345678", date_birth: "2000-01-01", phone: "90001111",
};

const renderCard = (type: any, status: string) =>
    render(
        <MantineProvider theme={{ dir: "rtl" }}>
            <MemberCard
                data={{ id: "rec-1", status, person, team: { id: "team-1", name: "فريق الحزم" } }}
                type={type}
                hasPermission={() => true}
                onEdit={vi.fn()}
                onDelete={vi.fn()}
                onFreePlayer={vi.fn()}
            />
        </MantineProvider>
    );

const openMenu = () => {
    const triggers = screen.getAllByRole("button");
    fireEvent.click(triggers[triggers.length - 1]);
};

describe("<MemberCard /> (الفريق) — قفل السجل بعد الاعتماد", () => {
    it("لاعب معتمد: لا تعديل ولا تحرير", () => {
        renderCard("player", "accepted");
        openMenu();

        expect(screen.queryByText("تعديل")).not.toBeInTheDocument();
        expect(screen.queryByText("تحرير اللاعب")).not.toBeInTheDocument();
        expect(screen.getByText(/من صلاحية النادي/)).toBeInTheDocument();
    });

    it("لاعب قيد الانتظار: التعديل متاح ليصحّح الفريق بياناته", () => {
        renderCard("player", "waiting");
        openMenu();

        expect(screen.getByText("تعديل")).toBeInTheDocument();
    });

    it("جهاز فني معتمد: لا تعديل ولا حذف", () => {
        renderCard("technical", "accepted");
        openMenu();

        expect(screen.queryByText("تعديل المعلومات")).not.toBeInTheDocument();
        expect(screen.queryByText("حذف")).not.toBeInTheDocument();
        expect(screen.getByText(/من صلاحية النادي/)).toBeInTheDocument();
    });

    it("عضو مجلس إدارة معتمد: لا تعديل ولا حذف", () => {
        renderCard("member", "accepted");
        openMenu();

        expect(screen.queryByText("تعديل المعلومات")).not.toBeInTheDocument();
        expect(screen.queryByText("حذف")).not.toBeInTheDocument();
    });

    it("جهاز فني مرفوض: يعدّله الفريق ويعيد تقديمه", () => {
        renderCard("technical", "rejected");
        openMenu();

        expect(screen.getByText("تعديل المعلومات")).toBeInTheDocument();
        expect(screen.getByText("حذف")).toBeInTheDocument();
    });
});
