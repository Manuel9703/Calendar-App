import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders the main summary sections', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /turni & stipendio/i })).toBeInTheDocument();
    expect(screen.getByText(/riepilogo mese/i)).toBeInTheDocument();
    expect(screen.getByText(/giorni lavorati/i)).toBeInTheDocument();
  });

  it('updates the default daily hours when the weekly schedule changes', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /impostazioni/i }));
    fireEvent.change(screen.getByDisplayValue('40'), { target: { value: '20' } });
    fireEvent.change(screen.getByDisplayValue('5'), { target: { value: '2' } });

    expect(screen.getByText(/ore normali di default per giorno/i)).toHaveTextContent(/10,00h/);
  });

  it('applies imported payroll values and shows the calculated result', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /impostazioni/i }));
    fireEvent.click(screen.getByRole('button', { name: /importa da busta paga/i }));

    const amountInputs = screen.getAllByPlaceholderText('importo €');
    const hourInputs = screen.getAllByPlaceholderText('ore');

    fireEvent.change(amountInputs[0], { target: { value: '1000' } });
    fireEvent.change(hourInputs[0], { target: { value: '40' } });
    fireEvent.click(screen.getByRole('button', { name: /calcola e applica ai parametri/i }));

    expect(screen.getByText(/parametri applicati:/i)).toBeInTheDocument();
    expect(screen.getAllByText(/paga oraria/i).length).toBeGreaterThan(0);
  });
});
