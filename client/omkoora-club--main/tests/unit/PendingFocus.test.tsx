import React, { useCallback, useState } from "react";
import { MantineProvider } from "@mantine/core";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { focusOn, isUndecided } from "../../lib/helpers/pendingFocus";
import { PendingFocusBar } from "../../components/RequestTrack/PendingFocusBar";
import { MembersTable } from "../../components/Tables/MembersTable";
import { TechnicalsTable } from "../../components/Tables/TechnicalsTable";

// «لا تعرف أين مكان الطلب… لازم تدور واحد واحد» — من «الطلبات» يرى النادي الطلب وحده.
describe("focusOn", () => {
    const rows = [{ id: "a" }, { id: "b" }, { id: "c" }];

    it("keeps only the requests the counter counted", () => {
        expect(focusOn(rows, new Set(["b"]))).toEqual([{ id: "b" }]);
    });

    it("leaves the list alone when nobody asked for a focus", () => {
        expect(focusOn(rows, null)).toBe(rows);
    });

    it("reads the id from where the row keeps it — a loan card holds its loan", () => {
        const cards = [{ id: "p1", lastLoan: { id: "l1" } }, { id: "p2", lastLoan: { id: "l2" } }];
        expect(focusOn(cards, new Set(["l2"]), (card: any) => card.lastLoan.id)).toEqual([cards[1]]);
    });

    it("shows nothing rather than everything while the set is empty", () => {
        expect(focusOn(rows, new Set())).toEqual([]);
    });
});

describe("isUndecided", () => {
    it("is what «تحديد كل قيد الانتظار» selects", () => {
        expect(["waiting", "waiting_club", "accepted", "rejected"].map((status) => isUndecided({ status })))
            .toEqual([true, true, false, false]);
    });
});

describe("PendingFocusBar", () => {
    const mount = (count: number, onClear = vi.fn()) => {
        render(<MantineProvider><PendingFocusBar count={count} onClear={onClear} /></MantineProvider>);
        return onClear;
    };

    it("says why the list is short and gives the whole list back", () => {
        const onClear = mount(3);
        expect(screen.getByText("تعرض الطلبات التي تنتظر قرارك فقط (3)")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "عرض الكل" }));
        expect(onClear).toHaveBeenCalledTimes(1);
    });

    it("says so when the last one was decided", () => {
        mount(0);
        expect(screen.getByText("لم يبقَ هنا طلب ينتظر قرارك")).toBeInTheDocument();
    });
});

// الجدول يبلّغ الصفحة بصفوفه، فتُعيد الصفحة رسمه. كانت مصفوفة جديدة في كل رسم تجعل
// ذلك حلقة لا تنتهي: صفحة الجهاز الفني تأكل المعالج ولا تجيب على الضغط («يتأخر…
// نضغط عليه ما شي»، العميل 2026-11-05). والقيد يوقف الحلقة حتى لا يعلق الاختبار.
describe.each([
    ["TechnicalsTable", TechnicalsTable],
    ["MembersTable", MembersTable],
])("%s", (_name, Table: any) => {
    it("reports its page once, not on every render", async () => {
        let reports = 0;
        const Page = ({ list }: { list: any[] }) => {
            const [, setPageIds] = useState<string[]>([]);
            const onPageItemsChange = useCallback((ids: string[]) => {
                reports += 1;
                if (reports < 25) setPageIds(ids);
            }, []);
            return (
                <Table
                    list={list}
                    search=""
                    hasPermission={() => true}
                    selectedIds={[]}
                    onToggleSelect={() => {}}
                    onPageItemsChange={onPageItemsChange}
                />
            );
        };
        const empty: any[] = [];
        await act(async () => {
            render(<MantineProvider><Page list={empty} /></MantineProvider>);
        });
        await act(async () => { await new Promise((resolve) => setTimeout(resolve, 50)); });
        expect(reports).toBeLessThanOrEqual(3);
    });
});
