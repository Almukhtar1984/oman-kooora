import React from "react";
import { MantineProvider } from "@mantine/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// شريط الصفحات العلوي وسهماه.
//
// الشريط أطول من الشاشة، وتمريره بإصبعين على لوحة اللمس ممّا لا يُهتدى إليه:
// جاءت الشكوى أن «الصلاحيات ما موجودة» وهي تبويبان خارج النظر. فصار للشريط
// سهمان، وشرطهما أن يَخمد السهم حين لا يكون خلفه ولا أمامه شيء.

const h = vi.hoisted(() => ({ pathname: "/" }));

vi.mock("next/router", () => ({ useRouter: () => ({ pathname: h.pathname }) }));
vi.mock("../../store/useStore", () => ({
    default: (selector: any) => selector({ userData: { person: { member: { classification: "رئيس" } } } }),
}));
// رقم «بانتظارك» على «الطلبات» يُقرأ من مسار الطلبات.
vi.mock("../../graphql", () => ({
    useMyRequestFlows: () => [vi.fn(), { data: { myRequestFlows: [] } }],
}));
import HorizontalNavbar from "../../components/Layout/HorizontalNavbar";

const NEXT = "الصفحات التالية";
const BACK = "الصفحات السابقة";

/** شريطٌ بعرضٍ معلوم في شاشةٍ بعرضٍ معلوم — jsdom لا يقيس من تلقائه. */
const measure = (scrollWidth: number, clientWidth: number, scrollLeft = 0) => {
    Object.defineProperty(HTMLElement.prototype, "scrollWidth", { configurable: true, value: scrollWidth });
    Object.defineProperty(HTMLElement.prototype, "clientWidth", { configurable: true, value: clientWidth });
    Object.defineProperty(HTMLElement.prototype, "scrollLeft", { configurable: true, writable: true, value: scrollLeft });
};

const scrollBy = vi.fn();

beforeEach(() => {
    scrollBy.mockReset();
    Element.prototype.scrollBy = scrollBy;
});

afterEach(() => {
    ["scrollWidth", "clientWidth", "scrollLeft"].forEach((prop) =>
        Reflect.deleteProperty(HTMLElement.prototype, prop));
});

const bar = () => render(
    <MantineProvider theme={{ dir: "rtl" }}>
        <HorizontalNavbar />
    </MantineProvider>
);

describe("سهما شريط الصفحات", () => {
    it("لا سهمَ لشريطٍ يتّسع لصفحاته", () => {
        // الشاشة أوسع من الشريط، فالزرّان زحامٌ بلا فائدة.
        measure(900, 1200);
        bar();
        expect(screen.queryByLabelText(NEXT)).toBeNull();
        expect(screen.queryByLabelText(BACK)).toBeNull();
    });

    it("وأوّل الشريط: سهم المتابعة يعمل وسهم العودة خامد", () => {
        measure(2400, 1000);
        bar();
        expect(screen.getByLabelText(NEXT)).toBeEnabled();
        expect(screen.getByLabelText(BACK)).toBeDisabled();
        // والصفحة التي شُكي من غيابها موجودة في الشريط.
        expect(screen.getByText("الصلاحيات")).toBeInTheDocument();
    });

    it("ووسطه: السهمان يعملان", () => {
        measure(2400, 1000, -700);
        bar();
        expect(screen.getByLabelText(NEXT)).toBeEnabled();
        expect(screen.getByLabelText(BACK)).toBeEnabled();
    });

    it("وآخره: سهم المتابعة يخمد", () => {
        measure(2400, 1000, -1400);
        bar();
        expect(screen.getByLabelText(NEXT)).toBeDisabled();
        expect(screen.getByLabelText(BACK)).toBeEnabled();
    });

    it("والنقرة تُمرّر الشريط نحو بقيّة الصفحات", () => {
        measure(2400, 1000);
        bar();
        fireEvent.click(screen.getByLabelText(NEXT));

        // اللوحة من اليمين لليسار، فالتقدّم نحو آخر القائمة نقصانٌ في scrollLeft.
        expect(scrollBy).toHaveBeenCalledTimes(1);
        expect(scrollBy.mock.calls[0][0].left).toBe(-800);
        expect(scrollBy.mock.calls[0][0].behavior).toBe("smooth");
    });
});
