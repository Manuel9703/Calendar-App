
import React, { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Settings2, X, Trash2, Gauge, Plus, Minus } from "lucide-react";
 
const GIORNI = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
const MESI = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
];
 
const DEFAULT_CONFIG = {
  rate: 12.11,
  overtime1Pct: 35,
  overtime2Pct: 50,
  nightPct: 25,
  holidayPct: 30,
  ivsPct: 9.19,
  cigsPct: 0.30,
  irpefPct: 23,
  detrazioniMensili: 264.79,
  addizionaliMensili: 47.86,
  weeklyHours: 40,
  workingDaysPerWeek: 5,
};
 
const DEFAULT_BALANCES = {
  ferie: { maturato: 0, goduto: 0, residuo: 0 },
  exFestivita: { maturato: 0, goduto: 0, residuo: 0 },
  permessi: { maturato: 0, goduto: 0, residuo: 0 },
};
 
const BALANCE_TYPES = [
  { key: "ferie", label: "Ferie" },
  { key: "exFestivita", label: "Ex-festività" },
  { key: "permessi", label: "Permessi P.A.R." },
];
 
// Colori coerenti categoria -> bordo / testo / puntino / dorso barra
const CATEGORIES = [
  { key: "normal",    label: "Normali",      dot: "bg-blue-500",   text: "text-blue-400",   border: "border-blue-500",   ring: "focus:ring-blue-500" },
  { key: "overtime1", label: "Straord. 35%", dot: "bg-orange-500",  text: "text-orange-400",  border: "border-orange-500",  ring: "focus:ring-orange-500" },
  { key: "overtime2", label: "Straord. 50%", dot: "bg-red-600",     text: "text-red-400",     border: "border-red-600",     ring: "focus:ring-red-500" },
  { key: "night",     label: "Notturne",     dot: "bg-violet-400",  text: "text-violet-300",  border: "border-violet-400",  ring: "focus:ring-violet-400" },
  { key: "holiday",   label: "Festive",      dot: "bg-fuchsia-500", text: "text-fuchsia-400", border: "border-fuchsia-500", ring: "focus:ring-fuchsia-500" },
];
 
const EMPTY_DRAFT_REST = { overtime1: 0, overtime2: 0, night: 0, holiday: 0 };
 
function pad(n) { return String(n).padStart(2, "0"); }
function monthKey(y, m) { return `${y}-${pad(m + 1)}`; }
function dateKey(y, m, d) { return `${y}-${pad(m + 1)}-${pad(d)}`; }
function fmt(n) {
  const v = Math.round((n || 0) * 100) / 100;
  return v.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function dowMon(date) { return (date.getDay() + 6) % 7; }
function clamp0(n) { return n < 0 ? 0 : n; }
 
export default function TurniStipendio() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [balances, setBalances] = useState(DEFAULT_BALANCES);
  const [shifts, setShifts] = useState({});
  const [configLoaded, setConfigLoaded] = useState(false);
  const [balancesLoaded, setBalancesLoaded] = useState(false);
  const [monthLoaded, setMonthLoaded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showWorkHours, setShowWorkHours] = useState(true);
  const [showPayConfig, setShowPayConfig] = useState(true);
  const [showBalances, setShowBalances] = useState(true);
  const [importForm, setImportForm] = useState({
    retribuzioneOrdinaria: "", oreOrdinarie: "",
    importoStraord35: "", oreStraord35: "",
    importoStraord50: "", oreStraord50: "",
    ivsImporto: "", cigsImporto: "",
    imponibileIrpef: "", irpefLorda: "",
    detrazioniLavDip: "", ulterioreDetrazione: "",
    addizionaleRegionale: "", addizionaleComunale: "", accontoAddizionaleComunale: "",
    nettoBustaVerifica: "",
  });
  const [importResult, setImportResult] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [draft, setDraft] = useState({ normal: 8, ...EMPTY_DRAFT_REST });
  const [saveError, setSaveError] = useState(false);
 
  const mKey = monthKey(year, month);
 
  useEffect(() => {
    (async () => {
      try {
        const raw = localStorage.getItem("config");
        if (raw) setConfig({ ...DEFAULT_CONFIG, ...JSON.parse(raw) });
      } catch (e) {}
      finally { setConfigLoaded(true); }
    })();
    (async () => {
      try {
        const raw = localStorage.getItem("balances");
        if (raw) setBalances({ ...DEFAULT_BALANCES, ...JSON.parse(raw) });
      } catch (e) {}
      finally { setBalancesLoaded(true); }
    })();
  }, []);
 
  useEffect(() => {
    if (!configLoaded) return;
    (async () => {
      try { localStorage.setItem("config", JSON.stringify(config)); }
      catch (e) { setSaveError(true); }
    })();
  }, [config, configLoaded]);
 
  useEffect(() => {
    if (!balancesLoaded) return;
    (async () => {
      try { localStorage.setItem("balances", JSON.stringify(balances)); }
      catch (e) { setSaveError(true); }
    })();
  }, [balances, balancesLoaded]);
 
  useEffect(() => {
    setMonthLoaded(false);
    (async () => {
      try {
        const raw = localStorage.getItem(`shifts:${mKey}`);
        setShifts(raw ? JSON.parse(raw) : {});
      } catch (e) { setShifts({}); }
      finally { setMonthLoaded(true); }
    })();
  }, [mKey]);
 
  useEffect(() => {
    if (!monthLoaded) return;
    (async () => {
      try { localStorage.setItem(`shifts:${mKey}`, JSON.stringify(shifts)); }
      catch (e) { setSaveError(true); }
    })();
  }, [shifts, monthLoaded, mKey]);
 
  const changeMonth = (delta) => {
    let m = month + delta, y = year;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setMonth(m); setYear(y); setSelectedDay(null);
  };
 
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = dowMon(new Date(year, month, 1));
  const cells = useMemo(() => {
    const arr = [];
    for (let i = 0; i < firstDow; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(d);
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [firstDow, daysInMonth]);
 
  const weeks = useMemo(() => {
    const w = [];
    for (let i = 0; i < cells.length; i += 7) w.push(cells.slice(i, i + 7));
    return w;
  }, [cells]);
 
  const dailyHours = useMemo(() => {
    const days = config.workingDaysPerWeek > 0 ? config.workingDaysPerWeek : 5;
    return Math.round((config.weeklyHours / days) * 100) / 100;
  }, [config.weeklyHours, config.workingDaysPerWeek]);
 
  const rates = useMemo(() => ({
    normal: config.rate,
    overtime1: config.rate * (1 + config.overtime1Pct / 100),
    overtime2: config.rate * (1 + config.overtime2Pct / 100),
    night: config.rate * (1 + config.nightPct / 100),
    holiday: config.rate * (1 + config.holidayPct / 100),
  }), [config]);
 
  const dayTotal = (entry) => {
    if (!entry) return 0;
    return CATEGORIES.reduce((s, c) => s + (entry[c.key] || 0), 0);
  };
  const dayPay = (entry) => {
    if (!entry) return 0;
    return CATEGORIES.reduce((s, c) => s + (entry[c.key] || 0) * rates[c.key], 0);
  };
 
  const monthStats = useMemo(() => {
    let hours = { normal: 0, overtime1: 0, overtime2: 0, night: 0, holiday: 0 };
    let daysWorked = 0, gross = 0;
    Object.values(shifts).forEach((entry) => {
      const t = dayTotal(entry);
      if (t > 0) {
        daysWorked += 1;
        CATEGORIES.forEach((c) => { hours[c.key] += entry[c.key] || 0; });
        gross += dayPay(entry);
      }
    });
    const totalHours = CATEGORIES.reduce((s, c) => s + hours[c.key], 0);
 
    const ivs = gross * (config.ivsPct / 100);
    const cigs = gross * (config.cigsPct / 100);
    const imponibileFiscale = gross - ivs - cigs;
    const irpefLorda = imponibileFiscale * (config.irpefPct / 100);
    const irpef = Math.max(0, irpefLorda - config.detrazioniMensili);
    const net = gross - ivs - cigs - irpef - config.addizionaliMensili;
 
    return { hours, daysWorked, gross, totalHours, ivs, cigs, irpef, net };
  }, [shifts, rates, config]);
 
  const toggleDay = (d) => {
    if (selectedDay === d) { setSelectedDay(null); return; }
    const key = dateKey(year, month, d);
    const existing = shifts[key];
    setDraft(existing ? { ...existing } : { normal: dailyHours, ...EMPTY_DRAFT_REST });
    setSelectedDay(d);
  };
 
  const saveDay = () => {
    const key = dateKey(year, month, selectedDay);
    const total = dayTotal(draft);
    setShifts((prev) => {
      const next = { ...prev };
      if (total > 0) next[key] = { ...draft }; else delete next[key];
      return next;
    });
    setSelectedDay(null);
  };
 
  const clearDay = () => {
    const key = dateKey(year, month, selectedDay);
    setShifts((prev) => { const next = { ...prev }; delete next[key]; return next; });
    setSelectedDay(null);
  };
 
  const step = (catKey, delta) => {
    setDraft((prev) => ({ ...prev, [catKey]: clamp0(Math.round(((prev[catKey] || 0) + delta) * 4) / 4) }));
  };
 
  const updateImportField = (field, value) => {
    setImportForm((prev) => ({ ...prev, [field]: value }));
  };
 
  const applyImport = () => {
    const n = (v) => { const x = parseFloat(String(v).replace(",", ".")); return isNaN(x) ? 0 : x; };
    const f = importForm;
 
    const retribOrd = n(f.retribuzioneOrdinaria), oreOrd = n(f.oreOrdinarie);
    if (oreOrd <= 0 || retribOrd <= 0) {
      setImportResult({ error: "servono almeno retribuzione ordinaria e ore ordinarie per calcolare la paga oraria" });
      return;
    }
    const rate = retribOrd / oreOrd;
 
    const impStr35 = n(f.importoStraord35), oreStr35 = n(f.oreStraord35);
    const impStr50 = n(f.importoStraord50), oreStr50 = n(f.oreStraord50);
    const overtime1Pct = oreStr35 > 0 ? Math.round(((impStr35 / oreStr35) / rate - 1) * 1000) / 10 : config.overtime1Pct;
    const overtime2Pct = oreStr50 > 0 ? Math.round(((impStr50 / oreStr50) / rate - 1) * 1000) / 10 : config.overtime2Pct;
 
    const grossBase = retribOrd + impStr35 + impStr50;
    const ivsImp = n(f.ivsImporto), cigsImp = n(f.cigsImporto);
    const ivsPct = grossBase > 0 && ivsImp > 0 ? Math.round((ivsImp / grossBase) * 10000) / 100 : config.ivsPct;
    const cigsPct = grossBase > 0 && cigsImp > 0 ? Math.round((cigsImp / grossBase) * 10000) / 100 : config.cigsPct;
 
    const imponibileIrpef = n(f.imponibileIrpef), irpefLorda = n(f.irpefLorda);
    const irpefPct = imponibileIrpef > 0 ? Math.round((irpefLorda / imponibileIrpef) * 1000) / 10 : config.irpefPct;
 
    const detrazioniMensili = Math.round((n(f.detrazioniLavDip) + n(f.ulterioreDetrazione)) * 100) / 100;
    const addizionaliMensili = Math.round((n(f.addizionaleRegionale) + n(f.addizionaleComunale) + n(f.accontoAddizionaleComunale)) * 100) / 100;
 
    setConfig((prev) => ({
      ...prev, rate, overtime1Pct, overtime2Pct, ivsPct, cigsPct, irpefPct,
      detrazioniMensili, addizionaliMensili,
    }));
 
    const ivsCalc = grossBase * (ivsPct / 100);
    const cigsCalc = grossBase * (cigsPct / 100);
    const irpefCalc = Math.max(0, imponibileIrpef * (irpefPct / 100) - detrazioniMensili);
    const nettoCalcolato = grossBase - ivsCalc - cigsCalc - irpefCalc - addizionaliMensili;
    const nettoBusta = n(f.nettoBustaVerifica);
 
    setImportResult({
      rate, overtime1Pct, overtime2Pct, ivsPct, cigsPct, irpefPct, detrazioniMensili, addizionaliMensili,
      nettoCalcolato, nettoBusta: nettoBusta > 0 ? nettoBusta : null,
    });
  };
 
  const updateConfig = (field, value) => {
    const v = parseFloat(value);
    setConfig((prev) => ({ ...prev, [field]: isNaN(v) ? 0 : v }));
  };
 
  const updateBalance = (typeKey, field, value) => {
    const v = parseFloat(value);
    setBalances((prev) => ({ ...prev, [typeKey]: { ...prev[typeKey], [field]: isNaN(v) ? 0 : v } }));
  };
 
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_35%),linear-gradient(135deg,_#020617,_#172554)] text-slate-100 font-sans px-3 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto flex max-w-4xl flex-col gap-4">
        <header className="rounded-3xl border border-slate-800/80 bg-slate-900/80 p-4 shadow-2xl shadow-black/25 backdrop-blur sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-2.5 text-blue-400">
                <Gauge className="h-5 w-5" strokeWidth={2.2} />
              </div>
              <div>
                <h1 className="text-base font-semibold uppercase tracking-[0.3em] text-slate-100">Turni &amp; Stipendio</h1>
                <p className="mt-1 text-[11px] font-mono text-slate-500">parametri presi da busta paga reale</p>
              </div>
            </div>
            <button
              onClick={() => setShowSettings((s) => !s)}
              className={`flex h-11 w-11 items-center justify-center rounded-2xl border transition ${showSettings ? "border-blue-500/40 bg-blue-500/10 text-blue-400" : "border-slate-800 bg-slate-950/80 text-slate-400 hover:text-slate-100"}`}
              aria-label="Impostazioni"
            >
              <Settings2 className="h-5 w-5" />
            </button>
          </div>
        </header>

        {showSettings && (
          <section className="rounded-3xl border border-slate-800/80 bg-slate-900/80 p-3 shadow-lg shadow-black/20 sm:p-4">
            <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-3">
              <button onClick={() => setShowImport((s) => !s)} className="flex w-full items-center justify-between rounded-xl px-1 py-1 text-left">
                <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-blue-400">Importa da busta paga</p>
                <span className="text-sm text-blue-400">{showImport ? "−" : "+"}</span>
              </button>
 
              {showImport && (
                <div className="mt-3 space-y-3">
                  <p className="text-[11px] leading-relaxed text-slate-500 font-mono">
                    inserisci gli importi e le ore così come sono scritti sul cedolino: la app calcola da sola paga oraria, maggiorazioni e aliquote e aggiorna i parametri sotto.
                  </p>
 
                  <ImportRow label="Retribuzione ordinaria">
                    <ImportInput placeholder="importo €" value={importForm.retribuzioneOrdinaria} onChange={(v) => updateImportField("retribuzioneOrdinaria", v)} />
                    <ImportInput placeholder="ore" value={importForm.oreOrdinarie} onChange={(v) => updateImportField("oreOrdinarie", v)} />
                  </ImportRow>
                  <ImportRow label="Straordinario 35%">
                    <ImportInput placeholder="importo €" value={importForm.importoStraord35} onChange={(v) => updateImportField("importoStraord35", v)} />
                    <ImportInput placeholder="ore" value={importForm.oreStraord35} onChange={(v) => updateImportField("oreStraord35", v)} />
                  </ImportRow>
                  <ImportRow label="Straordinario 50%">
                    <ImportInput placeholder="importo €" value={importForm.importoStraord50} onChange={(v) => updateImportField("importoStraord50", v)} />
                    <ImportInput placeholder="ore" value={importForm.oreStraord50} onChange={(v) => updateImportField("oreStraord50", v)} />
                  </ImportRow>
                  <ImportRow label="Contributo IVS">
                    <ImportInput placeholder="importo €" value={importForm.ivsImporto} onChange={(v) => updateImportField("ivsImporto", v)} full />
                  </ImportRow>
                  <ImportRow label="Contributo CIGS">
                    <ImportInput placeholder="importo €" value={importForm.cigsImporto} onChange={(v) => updateImportField("cigsImporto", v)} full />
                  </ImportRow>
                  <ImportRow label="Imponibile IRPEF">
                    <ImportInput placeholder="importo €" value={importForm.imponibileIrpef} onChange={(v) => updateImportField("imponibileIrpef", v)} full />
                  </ImportRow>
                  <ImportRow label="IRPEF lorda">
                    <ImportInput placeholder="importo €" value={importForm.irpefLorda} onChange={(v) => updateImportField("irpefLorda", v)} full />
                  </ImportRow>
                  <ImportRow label="Detrazioni lav. dip.">
                    <ImportInput placeholder="importo €" value={importForm.detrazioniLavDip} onChange={(v) => updateImportField("detrazioniLavDip", v)} full />
                  </ImportRow>
                  <ImportRow label="Ulteriore detrazione">
                    <ImportInput placeholder="importo €" value={importForm.ulterioreDetrazione} onChange={(v) => updateImportField("ulterioreDetrazione", v)} full />
                  </ImportRow>
                  <ImportRow label="Addiz. regionale">
                    <ImportInput placeholder="importo €" value={importForm.addizionaleRegionale} onChange={(v) => updateImportField("addizionaleRegionale", v)} full />
                  </ImportRow>
                  <ImportRow label="Addiz. comunale">
                    <ImportInput placeholder="importo €" value={importForm.addizionaleComunale} onChange={(v) => updateImportField("addizionaleComunale", v)} full />
                  </ImportRow>
                  <ImportRow label="Acconto addiz. comunale">
                    <ImportInput placeholder="importo €" value={importForm.accontoAddizionaleComunale} onChange={(v) => updateImportField("accontoAddizionaleComunale", v)} full />
                  </ImportRow>
                  <ImportRow label="Netto busta (verifica, opz.)">
                    <ImportInput placeholder="importo €" value={importForm.nettoBustaVerifica} onChange={(v) => updateImportField("nettoBustaVerifica", v)} full />
                  </ImportRow>
 
                  <button onClick={applyImport} className="w-full rounded-2xl bg-blue-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-blue-400 active:scale-[0.98]">
                    Calcola e applica ai parametri
                  </button>
 
                  {importResult && importResult.error && (
                    <p className="text-xs text-rose-400 font-mono">{importResult.error}</p>
                  )}
                  {importResult && !importResult.error && (
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3 text-xs font-mono space-y-1">
                      <p className="text-emerald-400">parametri applicati:</p>
                      <p className="text-slate-400">paga oraria €{fmt(importResult.rate)}/h · straord. {fmt(importResult.overtime1Pct)}% / {fmt(importResult.overtime2Pct)}%</p>
                      <p className="text-slate-400">ivs {fmt(importResult.ivsPct)}% · cigs {fmt(importResult.cigsPct)}% · irpef {fmt(importResult.irpefPct)}%</p>
                      <p className="text-slate-400">netto ricalcolato: € {fmt(importResult.nettoCalcolato)}</p>
                      {importResult.nettoBusta !== null && (
                        <p className={Math.abs(importResult.nettoCalcolato - importResult.nettoBusta) < 2 ? "text-emerald-400" : "text-orange-400"}>
                          netto busta dichiarato: € {fmt(importResult.nettoBusta)} · scarto € {fmt(importResult.nettoCalcolato - importResult.nettoBusta)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
 
            <SettingsSection title="Orario di lavoro" open={showWorkHours} onToggle={() => setShowWorkHours((s) => !s)}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Ore settimanali contrattuali">
                  <input type="number" step="0.5" value={config.weeklyHours}
                    onChange={(e) => updateConfig("weeklyHours", e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-2 text-base font-mono text-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </Field>
                <Field label="Giorni lavorativi/settimana">
                  <input type="number" step="1" min="1" max="7" value={config.workingDaysPerWeek}
                    onChange={(e) => updateConfig("workingDaysPerWeek", e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-2 text-base font-mono text-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </Field>
              </div>
              <p className="text-[11px] text-slate-500 font-mono mt-2">
                ore normali di default per giorno: <span className="text-blue-300 font-bold">{fmt(dailyHours)}h</span> ({fmt(config.weeklyHours)}h ÷ {config.workingDaysPerWeek} giorni)
              </p>
            </SettingsSection>

            <SettingsSection title="Retribuzione e trattenute" open={showPayConfig} onToggle={() => setShowPayConfig((s) => !s)}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <Field label="Paga oraria base (€/h)">
                  <input type="number" step="0.01" value={config.rate}
                    onChange={(e) => updateConfig("rate", e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-sm font-mono text-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </Field>
                <Field label="Straord. 35% (magg. %)">
                  <input type="number" step="1" value={config.overtime1Pct}
                    onChange={(e) => updateConfig("overtime1Pct", e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-sm font-mono text-orange-300 focus:outline-none focus:ring-1 focus:ring-orange-500" />
                </Field>
                <Field label="Straord. 50% (magg. %)">
                  <input type="number" step="1" value={config.overtime2Pct}
                    onChange={(e) => updateConfig("overtime2Pct", e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-sm font-mono text-red-300 focus:outline-none focus:ring-1 focus:ring-red-500" />
                </Field>
                <Field label="Magg. notturno %">
                  <input type="number" step="1" value={config.nightPct}
                    onChange={(e) => updateConfig("nightPct", e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-sm font-mono text-violet-300 focus:outline-none focus:ring-1 focus:ring-violet-400" />
                </Field>
                <Field label="Magg. festivo %">
                  <input type="number" step="1" value={config.holidayPct}
                    onChange={(e) => updateConfig("holidayPct", e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-sm font-mono text-fuchsia-300 focus:outline-none focus:ring-1 focus:ring-fuchsia-500" />
                </Field>
                <Field label="IVS %">
                  <input type="number" step="0.01" value={config.ivsPct}
                    onChange={(e) => updateConfig("ivsPct", e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-sm font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400" />
                </Field>
                <Field label="CIGS %">
                  <input type="number" step="0.01" value={config.cigsPct}
                    onChange={(e) => updateConfig("cigsPct", e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-sm font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400" />
                </Field>
                <Field label="IRPEF lorda %">
                  <input type="number" step="0.1" value={config.irpefPct}
                    onChange={(e) => updateConfig("irpefPct", e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-sm font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400" />
                </Field>
                <Field label="Detrazioni lav.dip. (€)">
                  <input type="number" step="0.01" value={config.detrazioniMensili}
                    onChange={(e) => updateConfig("detrazioniMensili", e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-sm font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400" />
                </Field>
                <Field label="Addizionali reg.+com. (€)">
                  <input type="number" step="0.01" value={config.addizionaliMensili}
                    onChange={(e) => updateConfig("addizionaliMensili", e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-sm font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400" />
                </Field>
              </div>
              <p className="text-[11px] text-slate-600 mt-3 font-mono leading-relaxed">
                irpef lorda % è l'aliquota sull'imponibile fiscale (non conteggia gli scaglioni annuali cumulati).
                addizionali regionale/comunale in busta sono spesso acconti su un residuo dell'anno precedente: mettici l'importo fisso che vedi scritto.
              </p>
            </SettingsSection>

            <SettingsSection title="Saldi ferie / permessi" open={showBalances} onToggle={() => setShowBalances((s) => !s)}>
              <div className="space-y-3">
                {BALANCE_TYPES.map((bt) => (
                  <div key={bt.key} className="rounded-2xl border border-slate-800 bg-slate-950/80 p-2.5">
                    <p className="text-xs text-teal-400 font-mono mb-2">{bt.label}</p>
                    <div className="grid grid-cols-3 gap-2">
                      {["maturato", "goduto", "residuo"].map((f) => (
                        <Field key={f} label={f}>
                          <input type="number" step="0.01" value={balances[bt.key][f]}
                            onChange={(e) => updateBalance(bt.key, f, e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500" />
                        </Field>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-slate-600 mt-2 font-mono">
                sono saldi cumulativi: aggiornali a mano ogni volta che ricevi una nuova busta paga.
              </p>
            </SettingsSection>
          </section>
        )}
 
        <section className="rounded-3xl border border-slate-800/80 bg-slate-900/80 p-3 shadow-lg shadow-black/20 sm:p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <button onClick={() => changeMonth(-1)} className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/80 text-slate-400 transition hover:text-blue-400">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-center text-sm font-semibold tracking-[0.2em] text-slate-200">{MESI[month]} {year}</span>
            <button onClick={() => changeMonth(1)} className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/80 text-slate-400 transition hover:text-blue-400">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
 
          <div className="mb-3 flex flex-wrap gap-2 px-1">
          {CATEGORIES.map((c) => (
            <div key={c.key} className="flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-950/70 px-2.5 py-1">
              <span className={`h-2.5 w-2.5 rounded-full ${c.dot}`} />
              <span className="text-[11px] font-mono text-slate-500">{c.label}</span>
            </div>
          ))}
        </div>
 
        <div className="mt-3 rounded-3xl border border-slate-800/80 bg-slate-950/70 p-2 sm:p-3">
          <div className="mb-1 grid grid-cols-7 gap-1">
            {GIORNI.map((g) => (
              <div key={g} className="text-center text-[10px] uppercase tracking-wider text-slate-600 font-mono py-1">{g}</div>
            ))}
          </div>
 
          <div className="space-y-2.5">
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1.5">
              {week.map((d, i) => {
                if (d === null) return <div key={`e${wi}-${i}`} className="aspect-square" />;
                const key = dateKey(year, month, d);
                const entry = shifts[key];
                const total = dayTotal(entry);
                const isToday = year === today.getFullYear() && month === today.getMonth() && d === today.getDate();
                const isSelected = selectedDay === d;
                return (
                  <button
                    key={key}
                    onClick={() => toggleDay(d)}
                    className={`relative aspect-square overflow-hidden rounded-lg border p-1.5 transition-all duration-200 flex flex-col items-center justify-center gap-0.5 shrink-0
                      ${isSelected ? "border-blue-500 bg-slate-800" : total > 0 ? "border-slate-700 bg-slate-950" : "border-slate-800 bg-slate-900"}
                      ${isToday && !isSelected ? "ring-1 ring-blue-500" : ""}
                      hover:border-slate-500 active:scale-95`}
                  >
                    <span className="text-[11px] font-mono text-slate-400 leading-none">{d}</span>
                    {total > 0 ? (
                      <>
                        <div className="w-full flex h-1 rounded-sm overflow-hidden mt-0.5">
                          {CATEGORIES.map((c) => {
                            const v = entry[c.key] || 0;
                            if (v <= 0) return null;
                            return <span key={c.key} className={c.dot} style={{ width: `${(v / total) * 100}%` }} />;
                          })}
                        </div>
                        <span className="text-[10px] font-mono text-slate-200 leading-none mt-0.5">{fmt(total)}h</span>
                      </>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-700 leading-none mt-0.5">–</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
          </div>
        </div>
        </section>

        {selectedDay !== null && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]"
              onClick={() => setSelectedDay(null)}
            />
            <div className="fixed inset-x-0 bottom-0 z-50 animate-[slideUp_0.2s_ease-out]">
              <div className="mx-auto max-w-4xl rounded-t-3xl border border-blue-500/40 bg-slate-950 p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-2xl shadow-black/50">
                <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-700" />
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-base text-blue-300">{pad(selectedDay)} {MESI[month]} {year}</span>
                  <button onClick={() => setSelectedDay(null)} className="flex h-9 w-9 items-center justify-center text-slate-500 hover:text-slate-200" aria-label="Chiudi">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="max-h-[55vh] overflow-y-auto space-y-2 -mx-1 px-1">
                  {CATEGORIES.map((c) => (
                    <div key={c.key} className={`flex items-center justify-between gap-2 pl-2 border-l-4 ${c.border} rounded-sm bg-slate-900/60 py-2 pr-1.5`}>
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold ${c.text}`}>{c.label}</p>
                        <p className="text-[11px] text-slate-600 font-mono">€{fmt(rates[c.key])}/h</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <button onClick={() => step(c.key, -0.5)}
                          className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800 text-slate-400 transition hover:text-slate-100 active:scale-95">
                          <Minus className="w-4 h-4" />
                        </button>
                        <input
                          type="number" min="0" step="0.5"
                          value={draft[c.key]}
                          onChange={(e) => {
                            const v = parseFloat(e.target.value);
                            setDraft((prev) => ({ ...prev, [c.key]: isNaN(v) ? 0 : v }));
                          }}
                          className={`w-14 rounded-xl border border-slate-700 bg-slate-950 px-1 py-2 text-center text-base font-mono ${c.text} focus:outline-none focus:ring-1 ${c.ring}`}
                        />
                        <button onClick={() => step(c.key, 0.5)}
                          className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800 text-slate-400 transition hover:text-slate-100 active:scale-95">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800">
                  <span className="text-xs text-slate-500 font-mono">tot {fmt(dayTotal(draft))}h · € {fmt(dayPay(draft))}</span>
                  <div className="flex gap-2">
                    <button onClick={clearDay} className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-slate-500 transition hover:text-rose-400" aria-label="Elimina giorno">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button onClick={saveDay} className="rounded-2xl bg-blue-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-blue-400 active:scale-[0.98]">
                      Salva
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
 
        <section className="rounded-3xl border border-slate-800/80 bg-slate-900/80 p-4 shadow-lg shadow-black/20">
          <p className="mb-3 text-[11px] font-mono uppercase tracking-[0.25em] text-slate-500">Riepilogo mese</p>
 
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {CATEGORIES.map((c) => (
              <div key={c.key} className={`rounded-2xl border border-slate-800 bg-slate-950/80 p-2 ${c.border} border-l-4`}>
                <p className="text-[10px] uppercase tracking-wide text-slate-500 font-mono mb-1">{c.label}</p>
                <span className={`text-lg font-mono font-bold ${c.text}`}>{fmt(monthStats.hours[c.key])}</span>
                <span className="text-[10px] text-slate-600 font-mono ml-1">h</span>
              </div>
            ))}
          </div>
 
          <div className="grid grid-cols-1 gap-3 border-t border-slate-800 pt-3 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Giorni lavorati" value={monthStats.daysWorked} />
            <Stat label="Ore totali" value={`${fmt(monthStats.totalHours)}h`} />
            <Stat label="Lordo stimato" value={`€ ${fmt(monthStats.gross)}`} accent="text-blue-400" />
            <Stat label="Netto stimato" value={`€ ${fmt(monthStats.net)}`} accent="text-emerald-400" />
          </div>
 
          <div className="grid grid-cols-3 gap-3 border-t border-slate-800 pt-3 mt-3">
            <Stat label="IVS + CIGS" value={`€ ${fmt(monthStats.ivs + monthStats.cigs)}`} accent="text-slate-400" />
            <Stat label="IRPEF" value={`€ ${fmt(monthStats.irpef)}`} accent="text-slate-400" />
            <Stat label="Addizionali" value={`€ ${fmt(config.addizionaliMensili)}`} accent="text-slate-400" />
          </div>
 
          <div className="mt-3 grid grid-cols-1 gap-3 border-t border-slate-800 pt-3 sm:grid-cols-3">
            {BALANCE_TYPES.map((bt) => (
              <Stat key={bt.key} label={`Residuo ${bt.label}`} value={`${fmt(balances[bt.key].residuo)}h`} accent="text-teal-400" />
            ))}
          </div>
        </section>
 
        {saveError && (
          <p className="mt-3 text-[11px] font-mono text-rose-400">
            attenzione: il salvataggio automatico non è riuscito, i dati potrebbero non persistere.
          </p>
        )}
      </div>
    </div>
  );
}
 
function ImportRow({ label, children }) {
  return (
    <div>
      <p className="text-[11px] text-slate-400 font-mono mb-1">{label}</p>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}
 
function sanitizeNumericText(raw) {
  // consente solo cifre e un separatore decimale (. oppure ,)
  let v = raw.replace(/[^0-9.,]/g, "");
  const firstSep = v.search(/[.,]/);
  if (firstSep !== -1) {
    v = v.slice(0, firstSep + 1) + v.slice(firstSep + 1).replace(/[.,]/g, "");
  }
  return v;
}
 
function ImportInput({ placeholder, value, onChange, full }) {
  return (
    <input
      type="text" inputMode="decimal" placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(sanitizeNumericText(e.target.value))}
      className={`${full ? "w-full" : "flex-1"} bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-sm font-mono text-slate-200 placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500`}
    />
  );
}
 
function SettingsSection({ title, open, onToggle, children }) {
  return (
    <div className="mt-5 rounded-2xl border border-slate-800/80 bg-slate-950/60 p-3">
      <button onClick={onToggle} className="flex w-full items-center justify-between rounded-xl px-1 py-1 text-left">
        <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-slate-500">{title}</p>
        <span className="text-sm text-slate-500">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-wide text-slate-500 font-mono mb-1">{label}</span>
      {children}
    </label>
  );
}
 
function Stat({ label, value, accent }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-slate-500 font-mono mb-0.5">{label}</p>
      <p className={`text-base font-mono font-bold ${accent || "text-slate-100"}`}>{value}</p>
    </div>
  );
}
 


