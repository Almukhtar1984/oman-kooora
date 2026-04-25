import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

jest.mock('./graphql', () => ({
  usePlayer: () => [jest.fn(), { data: null }],
}));

jest.mock('./components/PDF/Card', () => () => <div>print card preview</div>);

test('renders print card preview', () => {
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>
  );

  expect(screen.getByText(/print card preview/i)).toBeInTheDocument();
});
