import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

// Card.tsx pulls in @react-pdf/renderer at import time (Font.register); stub it
// so importing CardImageExport stays light in jsdom.
vi.mock("@react-pdf/renderer", () => ({
    PDFViewer: ({ children }: any) => <div>{children}</div>,
    Document: ({ children }: any) => <div>{children}</div>,
    Page: ({ children }: any) => <div>{children}</div>,
    View: ({ children }: any) => <div>{children}</div>,
    Text: ({ children }: any) => <span>{children}</span>,
    Image: () => <img alt="" />,
    Font: { register: vi.fn() },
    StyleSheet: { create: (s: any) => s },
}));

import CardImageExport from "./CardImageExport";

const player = {
    id: "p1",
    person: { first_name: "محمد", second_name: "علي", card_number: "12345678", date_birth: "2010-01-01" },
    team: { name: "فريق الطموح", club: { name: "نادي بهلاء" } },
};

describe("CardImageExport", () => {
    it("renders front + back PNG download buttons and two canvases", () => {
        const { container } = render(<CardImageExport player={player} />);
        expect(screen.getByTestId("download-front-png")).toBeTruthy();
        expect(screen.getByTestId("download-back-png")).toBeTruthy();
        // One canvas per card face, sized to a real ID-1 card.
        const canvases = container.querySelectorAll("canvas");
        expect(canvases.length).toBe(2);
        expect(canvases[0].getAttribute("width")).toBe("1012");
        expect(canvases[0].getAttribute("height")).toBe("638");
    });

    it("labels the buttons for the two card faces", () => {
        render(<CardImageExport player={player} />);
        expect(screen.getByTestId("download-front-png").textContent).toContain("الأمامي");
        expect(screen.getByTestId("download-back-png").textContent).toContain("الخلفي");
    });
});
