// jest-dom adds custom matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom/vitest';
import { TextDecoder, TextEncoder } from 'util';

// dayjs plugins are loaded once globally in src/index.tsx. Tests bypass that
// entry point, so we mirror the same setup here — otherwise calls like
// dayjs(...).fromNow() throw in unit tests.
import dayjs from 'dayjs';
import 'dayjs/locale/ar';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(customParseFormat);
dayjs.extend(duration);
dayjs.extend(relativeTime);

Object.assign(globalThis, { TextDecoder, TextEncoder });
