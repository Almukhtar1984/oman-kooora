import React from "react";
import { MantineProvider } from "@mantine/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
    daysLeft, isRegistrationOver, omanToday, periodError, teamAccountState, toApiDay,
} from "../../lib/helpers/teamRegistration";

// مدة تسجيل الفريق: يحدّدها النادي عند الإضافة، وبعد آخر يوم يتوقف حساب الفريق
// حتى يجدّده النادي (العميل، 2026-11-08).

const h = vi.hoisted(() => ({
    changeStatus: vi.fn(),
    notyfSuccess: vi.fn(),
    notyfError: vi.fn(),
}));

vi.mock("../../graphql", () => ({
    AllTeams: { kind: "Document", definitions: [] },
    useChangeStatusTeam: () => [h.changeStatus, { loading: false }],
}));

vi.mock("notyf", () => ({
    Notyf: class { success = h.notyfSuccess; error = h.notyfError; open = vi.fn(); },
}));

// The date field itself is Mantine's; what is tested here is what the window
// does with the day the club picks.
vi.mock("../../components/Input/RegistrationPeriodInputs", () => ({
    default: ({ onEndChange, endError, endLabel }: any) => (
        <div>
            <input
                placeholder={endLabel}
                onChange={(e) => {
                    const [y, m, d] = e.target.value.split("-").map(Number);
                    onEndChange(e.target.value ? new Date(y, m - 1, d) : null);
                }}
            />
            {endError ? <span>{endError}</span> : null}
        </div>
    ),
}));

import { ChangeStatusTeamModal } from "../../components/Modal/ChangeStatusTeamModal";

const TODAY = "2026-11-08";

describe("قاعدة المدة", () => {
    it("counts the day in Oman, not on the server's clock", () => {
        expect(omanToday(new Date("2026-11-08T21:00:00Z"))).toBe("2026-11-09");
    });

    it("keeps the last day inside the period and stops the day after", () => {
        expect(isRegistrationOver("2026-11-08", TODAY)).toBe(false);
        expect(isRegistrationOver("2026-11-07", TODAY)).toBe(true);
        expect(isRegistrationOver(null, TODAY)).toBe(false);
    });

    it("counts today among the days left", () => {
        expect(daysLeft("2026-11-08", TODAY)).toBe(1);
        expect(daysLeft("2026-11-17", TODAY)).toBe(10);
        expect(daysLeft("2026-11-01", TODAY)).toBe(0);
    });

    it("refuses an end that is missing, before the start, or already past", () => {
        expect(periodError(new Date("2026-11-08"), null, { today: TODAY })).toBe("حدّد تاريخ نهاية التسجيل");
        expect(periodError(new Date("2026-12-01"), new Date("2026-11-30"), { today: TODAY })).toBe("النهاية قبل البداية");
        expect(periodError(null, new Date("2026-11-07"), { today: TODAY })).toBe("هذا التاريخ مضى — اختر تاريخاً قادماً");
        expect(periodError(new Date("2026-11-08"), new Date("2027-11-07"), { today: TODAY })).toBeNull();
    });

    it("lets a team added before periods existed stay without one", () => {
        expect(periodError(null, null, { required: false, today: TODAY })).toBeNull();
    });

    it("sends the day the club picked, nothing more", () => {
        expect(toApiDay(new Date(2027, 0, 31))).toBe("2027-01-31");
        expect(toApiDay(null)).toBeNull();
    });
});

describe("ما تقوله بطاقة الفريق", () => {
    it("names a period that ran out apart from a team stopped by hand", () => {
        expect(teamAccountState({ account_status: true, registration_end: "2026-11-07" }, TODAY).label).toBe("انتهى التسجيل");
        expect(teamAccountState({ account_status: false, registration_end: null }, TODAY).label).toBe("متوقف");
    });

    it("warns two weeks ahead, and says when today is the last day", () => {
        expect(teamAccountState({ account_status: true, registration_end: "2026-11-20" }, TODAY).note)
            .toBe("ينتهي التسجيل خلال 13 يوماً (\u20662026-11-20\u2069)");
        expect(teamAccountState({ account_status: true, registration_end: "2026-11-08" }, TODAY).note)
            .toBe("اليوم آخر يوم في مدة التسجيل (\u20662026-11-08\u2069)");
        expect(teamAccountState({ account_status: true, registration_end: "2027-11-08" }, TODAY).note).toBeNull();
    });
});

const renderModal = (data: any) =>
    render(
        <MantineProvider theme={{ dir: "rtl" }}>
            <ChangeStatusTeamModal opened title="t" data={data} onClose={() => {}} />
        </MantineProvider>
    );

beforeEach(() => {
    vi.clearAllMocks();
    h.changeStatus.mockResolvedValue({ data: { updateTeam: { status: true } } });
});

describe("توقيف الفريق وتفعيله", () => {
    it("says that stopping locks every account out", () => {
        renderModal({ id: "t1", account_status: true, registration_end: "2099-01-01" });
        expect(screen.getByText("لن يستطيع أي حساب في الفريق الدخول حتى تفعّله من جديد.")).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: "توقيف" }));
        expect(h.changeStatus).toHaveBeenCalledWith(expect.objectContaining({
            variables: { id: "t1", content: { account_status: false } },
        }));
    });

    it("will not activate a team whose period ran out without a new end date", () => {
        renderModal({ id: "t2", account_status: false, registration_end: "2020-01-01" });
        expect(screen.getByText("2020-01-01")).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: "تجديد وتفعيل" }));
        expect(h.changeStatus).not.toHaveBeenCalled();
        expect(screen.getByText("حدّد تاريخ نهاية التسجيل")).toBeTruthy();
    });

    it("offers renewal, not «توقيف», for a team still marked active after its period ended", () => {
        renderModal({ id: "t3", account_status: true, registration_end: "2020-01-01" });
        expect(screen.queryByRole("button", { name: "توقيف" })).toBeNull();
        expect(screen.getByRole("button", { name: "تجديد وتفعيل" })).toBeTruthy();
    });

    it("renews from today: the new period starts the day the club renews it", () => {
        renderModal({ id: "t5", account_status: false, registration_start: "2025-01-01", registration_end: "2020-01-01" });
        fireEvent.change(screen.getByPlaceholderText("نهاية مدة التسجيل الجديدة"), { target: { value: "2099-06-30" } });
        fireEvent.click(screen.getByRole("button", { name: "تجديد وتفعيل" }));
        expect(h.changeStatus).toHaveBeenCalledWith(expect.objectContaining({
            variables: { id: "t5", content: { account_status: true, registration_start: omanToday(), registration_end: "2099-06-30" } },
        }));
    });

    it("activates a stopped team inside its period with no date asked", () => {
        renderModal({ id: "t4", account_status: false, registration_end: "2099-01-01" });
        fireEvent.click(screen.getByRole("button", { name: "تفعيل" }));
        expect(h.changeStatus).toHaveBeenCalledWith(expect.objectContaining({
            variables: { id: "t4", content: { account_status: true } },
        }));
    });
});
