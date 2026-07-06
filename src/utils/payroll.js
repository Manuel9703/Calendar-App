export function calculateShiftSummary(shifts = []) {
  const normalized = (shifts || [])
    .filter((shift) => shift && typeof shift === 'object')
    .map((shift) => ({
      day: typeof shift.day === 'string' ? shift.day : 'Turno',
      hours: Number.isFinite(Number(shift.hours)) ? Number(shift.hours) : 0,
      rate: Number.isFinite(Number(shift.rate)) ? Number(shift.rate) : 0,
    }))
    .filter((shift) => shift.hours > 0 && shift.rate > 0);

  const totalHours = normalized.reduce((sum, shift) => sum + shift.hours, 0);
  const gross = normalized.reduce((sum, shift) => sum + shift.hours * shift.rate, 0);
  const averageHourlyRate = totalHours > 0 ? Math.round(gross / totalHours) : 0;

  return {
    totalHours,
    gross,
    averageHourlyRate,
    shifts: normalized,
  };
}
