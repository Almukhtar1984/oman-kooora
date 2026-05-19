import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import PrintProgress from "./PrintProgress";

const base = {
    imagesLoaded: 0,
    imagesTotal: 0,
    qrLoaded: 0,
    qrTotal: 0,
    ready: false,
    bytesIn: 0,
    bytesOut: 0,
};

describe("<PrintProgress />", () => {
    it("uses the default Arabic label when none is passed", () => {
        render(<PrintProgress progress={{ ...base, imagesTotal: 10 }} />);
        expect(screen.getByText(/جارٍ تجهيز البطاقات/)).toBeInTheDocument();
    });

    it("shows the image-loading phase with current count", () => {
        render(
            <PrintProgress
                progress={{ ...base, imagesLoaded: 3, imagesTotal: 10, qrTotal: 5 }}
            />,
        );
        expect(screen.getByText(/تحميل وضغط الصور \(3\/10\)/)).toBeInTheDocument();
    });

    it("switches to the QR phase once all images are in", () => {
        render(
            <PrintProgress
                progress={{
                    ...base,
                    imagesLoaded: 10,
                    imagesTotal: 10,
                    qrLoaded: 4,
                    qrTotal: 10,
                }}
            />,
        );
        expect(screen.getByText(/توليد رموز QR \(4\/10\)/)).toBeInTheDocument();
    });

    it("shows the finalising phase once both image and QR are complete", () => {
        render(
            <PrintProgress
                progress={{
                    ...base,
                    imagesLoaded: 5,
                    imagesTotal: 5,
                    qrLoaded: 5,
                    qrTotal: 5,
                    ready: true,
                }}
            />,
        );
        expect(screen.getByText(/تجهيز ملف PDF/)).toBeInTheDocument();
    });

    it("computes the correct percentage across the combined work", () => {
        // 4/10 images + 0/10 QR = 4/20 done = 20%
        render(
            <PrintProgress
                progress={{
                    ...base,
                    imagesLoaded: 4,
                    imagesTotal: 10,
                    qrLoaded: 0,
                    qrTotal: 10,
                }}
            />,
        );
        expect(screen.getByText("20%")).toBeInTheDocument();
    });

    it("renders 100% when there is no work to do", () => {
        render(<PrintProgress progress={{ ...base }} />);
        expect(screen.getByText("100%")).toBeInTheDocument();
    });

    it("includes the total players in parentheses when provided", () => {
        render(<PrintProgress progress={base} totalPlayers={250} />);
        expect(screen.getByText(/250 لاعب/)).toBeInTheDocument();
    });

    it("does not show the savings line until both bytesIn and bytesOut are set", () => {
        const { queryByText, rerender } = render(<PrintProgress progress={base} />);
        expect(queryByText(/تم تقليل/)).not.toBeInTheDocument();

        rerender(
            <PrintProgress
                progress={{ ...base, bytesIn: 10_000_000, bytesOut: 1_000_000 }}
            />,
        );
        // (10 MB → 1 MB) = -90%
        expect(screen.getByText(/-90%/)).toBeInTheDocument();
    });

    it("formats sub-100KB results in kilobytes instead of megabytes", () => {
        render(
            <PrintProgress
                progress={{ ...base, bytesIn: 1_048_576, bytesOut: 51_200 }}
            />,
        );
        // 50 KB output should appear as "50 كيلو", not "0.0 ميغا".
        expect(screen.getByText(/50 كيلو/)).toBeInTheDocument();
    });

    it("accepts a custom label override", () => {
        render(<PrintProgress progress={base} label="جارٍ تجهيز قائمة" />);
        expect(screen.getByText(/جارٍ تجهيز قائمة/)).toBeInTheDocument();
    });
});
