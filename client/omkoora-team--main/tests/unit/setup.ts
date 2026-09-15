import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => cleanup());

// jsdom gaps that Mantine (ScrollArea, Popover, Modal) and tiptap rely on.
if (!window.matchMedia) {
    window.matchMedia = (query: string) =>
        ({
            matches: false,
            media: query,
            onchange: null,
            addListener: () => {},
            removeListener: () => {},
            addEventListener: () => {},
            removeEventListener: () => {},
            dispatchEvent: () => false,
        }) as any;
}

class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
}
(globalThis as any).ResizeObserver ??= ResizeObserverStub;

Element.prototype.scrollIntoView ??= function () {};

// ProseMirror measures ranges when it renders the selection.
const rect = { x: 0, y: 0, top: 0, left: 0, bottom: 0, right: 0, width: 0, height: 0, toJSON: () => ({}) };
(Range.prototype as any).getBoundingClientRect ??= () => rect;
(Range.prototype as any).getClientRects ??= () => ({ length: 0, item: () => null, [Symbol.iterator]: [][Symbol.iterator] });
(document as any).elementFromPoint ??= () => null;
