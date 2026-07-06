import { describe, expect, it } from 'vitest';
import { calculateShiftSummary } from './payroll';

describe('calculateShiftSummary', () => {
  it('returns zeroed values for an empty shift list', () => {
    const summary = calculateShiftSummary([]);

    expect(summary).toEqual({
      totalHours: 0,
      gross: 0,
      averageHourlyRate: 0,
      shifts: [],
    });
  });

  it('sanitizes invalid values and keeps only meaningful shifts', () => {
    const summary = calculateShiftSummary([
      { day: 'Lunedì', hours: -2, rate: 18 },
      { day: 'Martedì', hours: 0, rate: 18 },
      { day: 'Mercoledì', hours: 4, rate: 12 },
      { day: 'Giovedì', hours: 2, rate: -5 },
    ]);

    expect(summary.totalHours).toBe(4);
    expect(summary.gross).toBe(48);
    expect(summary.averageHourlyRate).toBe(12);
    expect(summary.shifts).toHaveLength(1);
  });
});
