import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
    // Same jsdom shims the other card tests use.
    (HTMLCanvasElement.prototype as any).getContext = vi.fn(() => ({ drawImage: vi.fn() }));
    (globalThis as any).createImageBitmap = vi.fn(async () => ({ width: 100, height: 100, close: () => {} }));
});

// react-pdf can't render inside jsdom — DOM stand-ins, as in LeagueCards.test.tsx.
const flattenStyle = (style: any) => (Array.isArray(style) ? Object.assign({}, ...style.filter(Boolean)) : style);
vi.mock("@react-pdf/renderer", () => {
    const passthrough =
        (name: string) =>
        ({ children, src, style, ...rest }: any) =>
            (
                <div data-testid={`pdf-${name}`} data-src={src} style={flattenStyle(style)} {...rest}>
                    {children}
                </div>
            );
    return {
        PDFViewer: passthrough("viewer"),
        Document: passthrough("document"),
        Page: passthrough("page"),
        View: passthrough("view"),
        Text: ({ children, ...rest }: any) => <span {...rest}>{children}</span>,
        Image: ({ src, style, ...rest }: any) => <img data-testid="pdf-image" src={src} style={flattenStyle(style)} {...rest} />,
        Font: { register: vi.fn() },
        StyleSheet: { create: (s: any) => s },
        pdf: () => ({ toBlob: () => Promise.resolve(new Blob()) }),
    };
});

import CardTemplate from "./Card";

// The staff record exactly as the single-card route (/#/<id>) receives it from
// the API: the role in `classification`, the private day job in `occupation`.
const staff = (classification: string | null, occupation: string | null) => ({
    id: "t-1",
    classification,
    occupation,
    person: {
        id: "p-1",
        first_name: "داؤد",
        second_name: "محمد",
        third_name: "خميس",
        tribe: "البلوشي",
        card_number: "1535903",
        date_birth: "1968-01-24",
    },
    team: { id: "tm-1", name: "نجم الساحل", club: { id: "c-1", name: "النادي الشباب" } },
});

const renderCard = (entity: any) =>
    render(<CardTemplate player={entity} loaded error={false} title="بطاقة عضو الجهاز الفني" />);

describe("<CardTemplate /> — الصفة", () => {
    it("prints the role, never the private day job", async () => {
        // The card that went out read "الصفة: متقاعد".
        renderCard(staff("مدرب", "متقاعد"));

        await waitFor(() => expect(screen.getByText("الصفة")).toBeInTheDocument());
        expect(screen.getByText("مدرب")).toBeInTheDocument();
        expect(screen.queryByText("متقاعد")).not.toBeInTheDocument();
    });

    it("drops the row entirely when only a day job is known", async () => {
        renderCard(staff(null, "موظف"));

        await waitFor(() => expect(screen.getByText("الرقم المدني")).toBeInTheDocument());
        expect(screen.queryByText("الصفة")).not.toBeInTheDocument();
        expect(screen.queryByText("موظف")).not.toBeInTheDocument();
    });

    it("does not leak an internal age-category code onto the card", async () => {
        renderCard(staff("firstDegree", "متقاعد"));

        await waitFor(() => expect(screen.getByText("الرقم المدني")).toBeInTheDocument());
        expect(screen.queryByText("الصفة")).not.toBeInTheDocument();
        expect(screen.queryByText("firstDegree")).not.toBeInTheDocument();
    });
});
