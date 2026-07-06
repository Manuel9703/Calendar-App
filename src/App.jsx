import { CalendarDays, Clock3, DollarSign, Sparkles } from 'lucide-react';
import { calculateShiftSummary } from './utils/payroll';

const shifts = [
  { day: 'Lunedì', hours: 8, rate: 18 },
  { day: 'Martedì', hours: 6, rate: 18 },
  { day: 'Mercoledì', hours: 8, rate: 18 },
  { day: 'Giovedì', hours: 7, rate: 18 },
  { day: 'Venerdì', hours: 8, rate: 18 },
];

const summary = calculateShiftSummary(shifts);

export default function App() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-4 py-10 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/80 shadow-2xl shadow-black/30 backdrop-blur">
          <div className="border-b border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 p-6 sm:p-8">
            <div className="flex items-center gap-3 text-amber-400">
              <Sparkles size={22} />
              <p className="text-sm font-semibold uppercase tracking-[0.35em]">Turni & Stipendio</p>
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
              <div>
                <h1 className="text-3xl font-semibold sm:text-4xl">
                  Tieni sotto controllo ore e guadagni in un solo posto.
                </h1>
                <p className="mt-3 max-w-2xl text-base text-zinc-300 sm:text-lg">
                  Monitora i tuoi turni, calcola l’orario totale e stimare lo stipendio lordo con facilità.
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5">
                <div className="flex items-center gap-2 text-zinc-400">
                  <DollarSign size={18} />
                  <span className="text-sm">Stipendio lordo stimato</span>
                </div>
                <p className="mt-2 text-4xl font-semibold text-white">€ {summary.gross}</p>
                <p className="mt-2 text-sm text-zinc-400">Su {summary.totalHours} ore di lavoro</p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-zinc-400">
                <CalendarDays size={18} />
                <h2 className="text-lg font-semibold text-white">Turni della settimana</h2>
              </div>
              <div className="space-y-3">
                {summary.shifts.map((shift) => (
                  <div key={shift.day} className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950/60 px-4 py-3">
                    <div>
                      <p className="font-medium text-white">{shift.day}</p>
                      <p className="text-sm text-zinc-400">{shift.hours} ore</p>
                    </div>
                    <div className="flex items-center gap-2 text-amber-400">
                      <Clock3 size={16} />
                      <span className="font-semibold">€ {shift.hours * shift.rate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5">
              <h3 className="text-lg font-semibold text-white">Panoramica</h3>
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
                  <p className="text-sm text-zinc-400">Ore totali</p>
                  <p className="mt-1 text-3xl font-semibold text-white">{summary.totalHours}h</p>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
                  <p className="text-sm text-zinc-400">Media oraria</p>
                  <p className="mt-1 text-3xl font-semibold text-white">€ {summary.averageHourlyRate}</p>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
                  <p className="text-sm text-zinc-400">Turni pianificati</p>
                  <p className="mt-1 text-3xl font-semibold text-white">{summary.shifts.length}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
