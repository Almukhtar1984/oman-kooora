// jest-dom adds custom matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom/vitest';
import { TextDecoder, TextEncoder } from 'util';

Object.assign(globalThis, { TextDecoder, TextEncoder });

// jsdom doesn't ship a ResizeObserver. Mantine's ScrollArea (used inside
// menus, selects, tabs) crashes without one in tests. Trivial no-op
// polyfill is enough — we don't assert layout.
class ResizeObserverPolyfill {
    observe() {}
    unobserve() {}
    disconnect() {}
}
(globalThis as any).ResizeObserver = (globalThis as any).ResizeObserver || ResizeObserverPolyfill;
