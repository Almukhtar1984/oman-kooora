import { MockedProvider } from '@apollo/client/testing';
import { DirectionProvider,MantineProvider } from '@mantine/core';
import { render,screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
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
