import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import App from './App';

vi.mock('./graphql', () => ({
  usePlayer: () => [vi.fn(), { data: null }],
}));

vi.mock('./components/PDF/Card', () => ({
  default: () => <div>print card preview</div>,
}));

test('renders print card preview', () => {
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>
  );

  expect(screen.getByText(/print card preview/i)).toBeInTheDocument();
});
