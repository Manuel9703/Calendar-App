import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the summary and shift list', () => {
    render(<App />);

    expect(screen.getByText(/turni & stipendio/i)).toBeInTheDocument();
    expect(screen.getByText(/stipendio lordo stimato/i)).toBeInTheDocument();
    expect(screen.getByText(/lunedì/i)).toBeInTheDocument();
  });
});
