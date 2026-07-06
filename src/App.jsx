
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
  { key: "normal",    label: "Normali",      dot: "bg-amber-500",   text: "text-amber-400",   border: "border-amber-500",   ring: "focus:ring-amber-500" },
  { key: "overtime1", label: "Straord. 35%", dot: "bg-orange-500",  text: "text-orange-400",  border: "border-orange-500",  ring: "focus:ring-orange-500" },
  { key: "overtime2", label: "Straord. 50%", dot: "bg-red-600",     text: "text-red-400",     border: "border-red-600",     ring: "focus:ring-red-500" },
  { key: "night",     label: "Notturne",     dot: "bg-indigo-400",  text: "text-indigo-300",  border: "border-indigo-400",  ring: "focus:ring-indigo-400" },
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans p-3 sm:p-6">
      <div className="max-w-3xl mx-auto">
 
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Gauge className="w-5 h-5 text-amber-400" strokeWidth={2} />
            <div>
              <h1 className="text-sm font-bold tracking-widest uppercase text-zinc-100">Turni &amp; Stipendio</h1>
              <p className="text-[11px] text-zinc-500 font-mono">parametri presi da busta paga reale</p>
            </div>
          </div>
          <button
            onClick={() => setShowSettings((s) => !s)}
            className={`p-2 rounded border ${showSettings ? "bg-zinc-800 border-zinc-600 text-amber-400" : "bg-zinc-900 border-zinc-800 text-zinc-400"}`}
            aria-label="Impostazioni"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
 
        {showSettings && (
          <div className="mb-4 bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-5">
            <div className="border border-amber-500/40 rounded-lg p-3 bg-amber-500/5">
              <button onClick={() => setShowImport((s) => !s)} className="w-full flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-widest text-amber-400 font-mono">Importa da busta paga</p>
                <span className="text-amber-400 text-xs">{showImport ? "−" : "+"}</span>
              </button>
 
              {showImport && (
                <div className="mt-3 space-y-3">
                  <p className="text-[11px] text-zinc-500 font-mono leading-relaxed">
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
 
                  <button onClick={applyImport} className="w-full py-2 rounded bg-amber-500 text-zinc-950 text-sm font-bold hover:bg-amber-400 active:scale-95">
                    Calcola e applica ai parametri
                  </button>
 
                  {importResult && importResult.error && (
                    <p className="text-xs text-rose-400 font-mono">{importResult.error}</p>
                  )}
                  {importResult && !importResult.error && (
                    <div className="bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs font-mono space-y-1">
                      <p className="text-emerald-400">parametri applicati:</p>
                      <p className="text-zinc-400">paga oraria €{fmt(importResult.rate)}/h · straord. {fmt(importResult.overtime1Pct)}% / {fmt(importResult.overtime2Pct)}%</p>
                      <p className="text-zinc-400">ivs {fmt(importResult.ivsPct)}% · cigs {fmt(importResult.cigsPct)}% · irpef {fmt(importResult.irpefPct)}%</p>
                      <p className="text-zinc-400">netto ricalcolato: € {fmt(importResult.nettoCalcolato)}</p>
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
 
            <div>
              <p className="text-[11px] uppercase tracking-widest text-zinc-500 font-mono mb-3">Orario di lavoro</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Ore settimanali contrattuali">
                  <input type="number" step="0.5" value={config.weeklyHours}
                    onChange={(e) => updateConfig("weeklyHours", e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-sm font-mono text-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-500" />
                </Field>
                <Field label="Giorni lavorativi/settimana">
                  <input type="number" step="1" min="1" max="7" value={config.workingDaysPerWeek}
                    onChange={(e) => updateConfig("workingDaysPerWeek", e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-sm font-mono text-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-500" />
                </Field>
              </div>
              <p className="text-[11px] text-zinc-500 font-mono mt-2">
                ore normali di default per giorno: <span className="text-amber-300 font-bold">{fmt(dailyHours)}h</span> ({fmt(config.weeklyHours)}h ÷ {config.workingDaysPerWeek} giorni)
              </p>
            </div>
 
            <div>
              <p className="text-[11px] uppercase tracking-widest text-zinc-500 font-mono mb-3">Retribuzione e trattenute</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Field label="Paga oraria base (€/h)">
                  <input type="number" step="0.01" value={config.rate}
                    onChange={(e) => updateConfig("rate", e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-sm font-mono text-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-500" />
                </Field>
                <Field label="Straord. 35% (magg. %)">
                  <input type="number" step="1" value={config.overtime1Pct}
                    onChange={(e) => updateConfig("overtime1Pct", e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-sm font-mono text-orange-300 focus:outline-none focus:ring-1 focus:ring-orange-500" />
                </Field>
                <Field label="Straord. 50% (magg. %)">
                  <input type="number" step="1" value={config.overtime2Pct}
                    onChange={(e) => updateConfig("overtime2Pct", e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-sm font-mono text-red-300 focus:outline-none focus:ring-1 focus:ring-red-500" />
                </Field>
                <Field label="Magg. notturno %">
                  <input type="number" step="1" value={config.nightPct}
                    onChange={(e) => updateConfig("nightPct", e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-sm font-mono text-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-400" />
                </Field>
                <Field label="Magg. festivo %">
                  <input type="number" step="1" value={config.holidayPct}
                    onChange={(e) => updateConfig("holidayPct", e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-sm font-mono text-fuchsia-300 focus:outline-none focus:ring-1 focus:ring-fuchsia-500" />
                </Field>
                <Field label="IVS %">
                  <input type="number" step="0.01" value={config.ivsPct}
                    onChange={(e) => updateConfig("ivsPct", e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-sm font-mono text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-400" />
                </Field>
                <Field label="CIGS %">
                  <input type="number" step="0.01" value={config.cigsPct}
                    onChange={(e) => updateConfig("cigsPct", e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-sm font-mono text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-400" />
                </Field>
                <Field label="IRPEF lorda %">
                  <input type="number" step="0.1" value={config.irpefPct}
                    onChange={(e) => updateConfig("irpefPct", e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-sm font-mono text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-400" />
                </Field>
                <Field label="Detrazioni lav.dip. (€)">
                  <input type="number" step="0.01" value={config.detrazioniMensili}
                    onChange={(e) => updateConfig("detrazioniMensili", e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-sm font-mono text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-400" />
                </Field>
                <Field label="Addizionali reg.+com. (€)">
                  <input type="number" step="0.01" value={config.addizionaliMensili}
                    onChange={(e) => updateConfig("addizionaliMensili", e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-sm font-mono text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-400" />
                </Field>
              </div>
              <p className="text-[11px] text-zinc-600 mt-3 font-mono leading-relaxed">
                irpef lorda % è l'aliquota sull'imponibile fiscale (non conteggia gli scaglioni annuali cumulati).
                addizionali regionale/comunale in busta sono spesso acconti su un residuo dell'anno precedente: mettici l'importo fisso che vedi scritto.
              </p>
            </div>
 
            <div>
              <p className="text-[11px] uppercase tracking-widest text-zinc-500 font-mono mb-3">Saldi ferie / permessi (da busta paga)</p>
              <div className="space-y-3">
                {BALANCE_TYPES.map((bt) => (
                  <div key={bt.key} className="bg-zinc-950 border border-zinc-800 rounded p-2.5">
                    <p className="text-xs text-teal-400 font-mono mb-2">{bt.label}</p>
                    <div className="grid grid-cols-3 gap-2">
                      {["maturato", "goduto", "residuo"].map((f) => (
                        <Field key={f} label={f}>
                          <input type="number" step="0.01" value={balances[bt.key][f]}
                            onChange={(e) => updateBalance(bt.key, f, e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs font-mono text-zinc-200 focus:outline-none focus:ring-1 focus:ring-teal-500" />
                        </Field>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-zinc-600 mt-2 font-mono">
                sono saldi cumulativi: aggiornali a mano ogni volta che ricevi una nuova busta paga.
              </p>
            </div>
          </div>
        )}
 
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => changeMonth(-1)} className="p-2 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-amber-400">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-mono text-sm tracking-wide text-zinc-200">{MESI[month]} {year}</span>
          <button onClick={() => changeMonth(1)} className="p-2 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-amber-400">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
 
        <div className="flex flex-wrap gap-3 mb-3 px-1">
          {CATEGORIES.map((c) => (
            <div key={c.key} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-sm ${c.dot}`} />
              <span className="text-[11px] text-zinc-500 font-mono">{c.label}</span>
            </div>
          ))}
        </div>
 
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-2 sm:p-3">
          <div className="grid grid-cols-7 gap-1 mb-1">
            {GIORNI.map((g) => (
              <div key={g} className="text-center text-[10px] uppercase tracking-wider text-zinc-600 font-mono py-1">{g}</div>
            ))}
          </div>
 
          {weeks.map((week, wi) => {
            const hasSelected = selectedDay !== null && week.includes(selectedDay);
            return (
              <div key={wi}>
                <div className="grid grid-cols-7 gap-1">
                  {week.map((d, i) => {
                    if (d === null) return <div key={`e${wi}-${i}`} />;
                    const key = dateKey(year, month, d);
                    const entry = shifts[key];
                    const total = dayTotal(entry);
                    const isToday = year === today.getFullYear() && month === today.getMonth() && d === today.getDate();
                    const isSelected = selectedDay === d;
                    return (
                      <button
                        key={key}
                        onClick={() => toggleDay(d)}
                        className={`relative aspect-square rounded border flex flex-col items-center justify-center gap-0.5 px-0.5 transition-colors
                          ${isSelected ? "bg-zinc-800 border-amber-500" : total > 0 ? "bg-zinc-950 border-zinc-700" : "bg-zinc-900 border-zinc-800"}
                          ${isToday && !isSelected ? "ring-1 ring-amber-500" : ""}
                          hover:border-zinc-500`}
                      >
                        <span className="text-[11px] font-mono text-zinc-400 leading-none">{d}</span>
                        {total > 0 ? (
                          <>
                            <div className="w-full flex h-1 rounded-sm overflow-hidden mt-0.5">
                              {CATEGORIES.map((c) => {
                                const v = entry[c.key] || 0;
                                if (v <= 0) return null;
                                return <span key={c.key} className={c.dot} style={{ width: `${(v / total) * 100}%` }} />;
                              })}
                            </div>
                            <span className="text-[10px] font-mono text-zinc-200 leading-none mt-0.5">{fmt(total)}h</span>
                          </>
                        ) : (
                          <span className="text-[10px] font-mono text-zinc-700 leading-none mt-0.5">–</span>
                        )}
                      </button>
                    );
                  })}
                </div>
 
                {hasSelected && (
                  <div className="my-2 bg-zinc-950 border border-amber-500/40 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-sm text-amber-300">{pad(selectedDay)} {MESI[month]}</span>
                      <button onClick={() => setSelectedDay(null)} className="text-zinc-500 hover:text-zinc-200">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
 
                    <div className="space-y-2">
                      {CATEGORIES.map((c) => (
                        <div key={c.key} className={`flex items-center justify-between gap-2 pl-2 border-l-4 ${c.border} rounded-sm bg-zinc-900/60 py-1.5 pr-1.5`}>
                          <div className="min-w-0">
                            <p className={`text-xs font-semibold ${c.text}`}>{c.label}</p>
                            <p className="text-[10px] text-zinc-600 font-mono">€{fmt(rates[c.key])}/h</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button onClick={() => step(c.key, -0.5)}
                              className="w-7 h-7 flex items-center justify-center rounded bg-zinc-800 text-zinc-400 hover:text-zinc-100 active:scale-95">
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <input
                              type="number" min="0" step="0.5"
                              value={draft[c.key]}
                              onChange={(e) => {
                                const v = parseFloat(e.target.value);
                                setDraft((prev) => ({ ...prev, [c.key]: isNaN(v) ? 0 : v }));
                              }}
                              className={`w-14 text-center bg-zinc-950 border border-zinc-700 rounded px-1 py-1 text-sm font-mono ${c.text} focus:outline-none focus:ring-1 ${c.ring}`}
                            />
                            <button onClick={() => step(c.key, 0.5)}
                              className="w-7 h-7 flex items-center justify-center rounded bg-zinc-800 text-zinc-400 hover:text-zinc-100 active:scale-95">
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
 
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-800">
                      <span className="text-xs text-zinc-500 font-mono">tot {fmt(dayTotal(draft))}h · € {fmt(dayPay(draft))}</span>
                      <div className="flex gap-2">
                        <button onClick={clearDay} className="p-2 rounded bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-rose-400">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button onClick={saveDay} className="px-4 py-2 rounded bg-amber-500 text-zinc-950 text-sm font-bold hover:bg-amber-400 active:scale-95">
                          Salva
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
 
        <div className="mt-4 bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <p className="text-[11px] uppercase tracking-widest text-zinc-500 font-mono mb-3">Riepilogo mese</p>
 
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
            {CATEGORIES.map((c) => (
              <div key={c.key} className={`bg-zinc-950 border-l-4 ${c.border} border-y border-r border-zinc-800 rounded p-2`}>
                <p className="text-[10px] uppercase tracking-wide text-zinc-500 font-mono mb-1">{c.label}</p>
                <span className={`text-lg font-mono font-bold ${c.text}`}>{fmt(monthStats.hours[c.key])}</span>
                <span className="text-[10px] text-zinc-600 font-mono ml-1">h</span>
              </div>
            ))}
          </div>
 
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-zinc-800 pt-3">
            <Stat label="Giorni lavorati" value={monthStats.daysWorked} />
            <Stat label="Ore totali" value={`${fmt(monthStats.totalHours)}h`} />
            <Stat label="Lordo stimato" value={`€ ${fmt(monthStats.gross)}`} accent="text-amber-400" />
            <Stat label="Netto stimato" value={`€ ${fmt(monthStats.net)}`} accent="text-emerald-400" />
          </div>
 
          <div className="grid grid-cols-3 gap-3 border-t border-zinc-800 pt-3 mt-3">
            <Stat label="IVS + CIGS" value={`€ ${fmt(monthStats.ivs + monthStats.cigs)}`} accent="text-zinc-400" />
            <Stat label="IRPEF" value={`€ ${fmt(monthStats.irpef)}`} accent="text-zinc-400" />
            <Stat label="Addizionali" value={`€ ${fmt(config.addizionaliMensili)}`} accent="text-zinc-400" />
          </div>
 
          <div className="grid grid-cols-3 gap-3 border-t border-zinc-800 pt-3 mt-3">
            {BALANCE_TYPES.map((bt) => (
              <Stat key={bt.key} label={`Residuo ${bt.label}`} value={`${fmt(balances[bt.key].residuo)}h`} accent="text-teal-400" />
            ))}
          </div>
        </div>
 
        {saveError && (
          <p className="text-[11px] text-rose-400 font-mono mt-3">
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
      <p className="text-[11px] text-zinc-400 font-mono mb-1">{label}</p>
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
      className={`${full ? "w-full" : "flex-1"} bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-sm font-mono text-zinc-200 placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-amber-500`}
    />
  );
}
 
function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-wide text-zinc-500 font-mono mb-1">{label}</span>
      {children}
    </label>
  );
}
 
function Stat({ label, value, accent }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-zinc-500 font-mono mb-0.5">{label}</p>
      <p className={`text-base font-mono font-bold ${accent || "text-zinc-100"}`}>{value}</p>
    </div>
  );
}
 


