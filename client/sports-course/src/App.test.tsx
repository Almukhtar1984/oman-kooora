import { MockedProvider } from '@apollo/client/testing';
import { DirectionProvider,MantineProvider } from '@mantine/core';
import { render,screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import App from './App';

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
});

test('renders login screen', () => {
  render(
    <MockedProvider>
      <MemoryRouter>
        <DirectionProvider initialDirection="rtl">
          <MantineProvider>
            <App />
          </MantineProvider>
        </DirectionProvider>
      </MemoryRouter>
    </MockedProvider>
  );

  expect(screen.getAllByText('تسجيل الدخول').length).toBeGreaterThan(0);
});
