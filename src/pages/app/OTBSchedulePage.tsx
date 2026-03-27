import React, { useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useData } from '../../contexts/DataContext';
import { OTBEntry } from '../../types';
import { calculateDay, fmt2, fmt1, fmtInt } from '../../utils/calculations';
import { today, getDayName, formatDisplay, addDaysStr } from '../../utils/dateUtils';
import { ChevronLeft, ChevronRight, Edit2, ClipboardPaste, Check } from 'lucide-react';
import PasteImportModal, { ColDef } from '../../components/PasteImportModal';

const OTB_COLS: ColDef[] = [
  { key: 'date', label: 'Date', type: 'date', required: true },
  { key: 'otbOccupiedRooms', label: 'OTB Rooms', type: 'int' },
  { key: 'otbArrivals', label: 'OTB Arrivals', type: 'int' },
  { key: 'otbDepartures', label: 'OTB Departures', type: 'int' },
  { key: 'notes', label: 'Notes', type: 'text' },
];

function emptyOTB(date: string, propertyId: string, coFrom: number, dndPct: number, addCr: number): OTBEntry {
  return {
    id: crypto.randomUUID(),
    propertyId,
    date,
    otbOccupiedRooms: null,
    otbArrivals: null,
    otbDepartures: null,
    carriedOverFromYesterday: coFrom,
    carryOverToTomorrow: 0,
    dndPct,
    additionalCredits: addCr,
    rasScheduledOverride: null,
    notes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function NumInput({ value, onChange, disabled = false, step = '1', placeholder = '—' }: {
  value: number | null; onChange: (v: number | null) => void; disabled?: boolean; step?: string; placeholder?: string;
}) {
  return (
    <input
      type="number" step={step} min="0"
      value={value ?? ''}
      onChange={e => onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
      disabled={disabled}
      placeholder={placeholder}
      className="border rounded pl-1 pr-2 py-0.5 text-right text-xs w-full focus:outline-none focus:ring-1"
      style={{ background: disabled ? '#F5F7F8' : '#e8f4fb', borderColor: '#D0DDE2' }}
    />
  );
}

function CalcVal({ v, bold = false }: { v: string; bold?: boolean }) {
  return (
    <div className={`text-right text-xs pr-2 py-0.5 ${bold ? 'font-semibold' : ''}`} style={{ color: '#1A3C4A' }}>
      {v}
    </div>
  );
}

function VarianceBadge({ variance, rasScheduled }: { variance: number | undefined; rasScheduled: number | null }) {
  if (variance == null || rasScheduled == null) {
    return <div className="text-xs text-center text-gray-400">–</div>;
  }
  if (variance > 0) return <div className="badge-callin text-center">+{variance} to call in</div>;
  if (variance < 0) return <div className="badge-calloff text-center">{variance} to call off</div>;
  return <div className="badge-ontarget text-center">On Target</div>;
}

function InfoTooltip({ text }: { text: string }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [tapped, setTapped] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  const show = () => {
    if (ref.current) {
      const r = ref.current.getBoundingClientRect();
      setPos({ x: Math.min(r.right + 6, window.innerWidth - 230), y: r.top - 2 });
    }
  };

  return (
    <span className="inline-block" style={{ marginLeft: 4, verticalAlign: 'middle' }}>
      <span
        ref={ref}
        onMouseEnter={show}
        onMouseLeave={() => { if (!tapped) setPos(null); }}
        onClick={() => { if (tapped) { setPos(null); setTapped(false); } else { show(); setTapped(true); } }}
        className="inline-flex items-center justify-center rounded-full cursor-help select-none"
        style={{ width: 13, height: 13, background: '#D0DDE2', color: '#3A6878', fontSize: '9px', fontWeight: 700, lineHeight: 1 }}
      >
        i
      </span>
      {pos && createPortal(
        <div
          onClick={() => { setPos(null); setTapped(false); }}
          style={{ position: 'fixed', left: pos.x, top: pos.y, background: '#1A3C4A', color: 'white', padding: '6px 10px', width: 220, lineHeight: 1.5, zIndex: 9999, borderRadius: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.2)', fontSize: '12px', cursor: 'pointer' }}
        >
          {text}
        </div>,
        document.body
      )}
    </span>
  );
}

function SectionRow({ label, cols }: { label: string; cols: number }) {
  return (
    <tr>
      <td colSpan={cols + 1} className="px-3 py-1 text-xs font-bold uppercase tracking-wide text-white sticky left-0" style={{ background: '#1A3C4A' }}>
        {label}
      </td>
    </tr>
  );
}

function Row({ label, children, calc = false, highlight = false, bold = false, info }: {
  label: string; children: React.ReactNode; calc?: boolean; highlight?: boolean; bold?: boolean; info?: string;
}) {
  return (
    <tr className="border-b" style={{ borderColor: '#D0DDE2' }}>
      <td
        className="sticky left-0 z-10 px-3 py-1 text-xs border-r"
        style={{
          borderColor: '#D0DDE2',
          background: 'white',
          color: '#1A3C4A',
          fontWeight: bold ? 600 : 400,
          minWidth: '200px',
        }}
      >
        {label}{info && <InfoTooltip text={info} />}
      </td>
      {children}
    </tr>
  );
}

export default function OTBSchedulePage() {
  const {
    currentProperty, currentPropertyId,
    otbEntries, saveOTBEntry, getOTBByDate,
    weeklySchedules, mode,
  } = useData();

  const [windowStart, setWindowStart] = useState(() => addDaysStr(today(), -1));
  const [editingRas, setEditingRas] = useState<string | null>(null);
  const [editingCoFrom, setEditingCoFrom] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dates = Array.from({ length: 7 }, (_, i) => addDaysStr(windowStart, i));
  const todayStr = today();

  const getWeeklyDay = useCallback((date: string) => {
    return weeklySchedules.flatMap(w => w.days).find(d => d.date === date);
  }, [weeklySchedules]);

  const getCarryFrom = useCallback((date: string): number => {
    const prevDate = addDaysStr(date, -1);
    const prevOTB = getOTBByDate(prevDate);
    if (prevOTB) return prevOTB.carryOverToTomorrow;
    const prevWeekly = getWeeklyDay(prevDate);
    return prevWeekly?.carryOverToTomorrow ?? 0;
  }, [getOTBByDate, getWeeklyDay]);

  const getEntry = useCallback((date: string): OTBEntry => {
    const existing = getOTBByDate(date);
    if (existing) return existing;
    const weeklyDay = getWeeklyDay(date);
    return emptyOTB(date, currentPropertyId!, getCarryFrom(date), weeklyDay?.dndPct ?? 0.15, weeklyDay?.additionalCredits ?? 0);
  }, [getOTBByDate, getWeeklyDay, getCarryFrom, currentPropertyId]);

  const updateEntry = useCallback((date: string, updates: Partial<OTBEntry>) => {
    const entry = getEntry(date);
    saveOTBEntry({ ...entry, ...updates, updatedAt: new Date().toISOString() });
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      setAutoSaved(true);
      setTimeout(() => setAutoSaved(false), 2000);
    }, 600);
  }, [getEntry, saveOTBEntry]);

  const handleImport = (rows: Record<string, string | number | null>[]) => {
    for (const row of rows) {
      const date = row.date as string;
      if (!date) continue;
      updateEntry(date, {
        otbOccupiedRooms: row.otbOccupiedRooms as number | null,
        otbArrivals: row.otbArrivals as number | null,
        otbDepartures: row.otbDepartures as number | null,
        notes: (row.notes as string) || '',
      });
    }
  };

  if (!currentProperty || !currentPropertyId) {
    return (
      <div className="p-6 text-sm space-y-2" style={{ color: '#3A6878' }}>
        <div className="font-semibold" style={{ color: '#1A3C4A' }}>No property selected</div>
        <div>Go to <strong>Configuration</strong> to set up your hotel, or use the property selector in the sidebar.</div>
      </div>
    );
  }

  const entries = dates.map(d => getEntry(d));
  const calcs = entries.map(e => {
    if (!e.otbOccupiedRooms || e.otbDepartures == null) return null;
    const weeklyDay = getWeeklyDay(e.date);
    const rasEff = e.rasScheduledOverride ?? weeklyDay?.rasScheduled ?? null;
    return {
      calc: calculateDay({
        occupiedRooms: e.otbOccupiedRooms,
        arrivals: e.otbArrivals ?? 0,
        departures: e.otbDepartures,
        carriedOverFromYesterday: e.carriedOverFromYesterday,
        carryOverToTomorrow: e.carryOverToTomorrow,
        dndPct: e.dndPct,
        additionalCredits: e.additionalCredits,
        rasScheduled: rasEff,
        property: currentProperty,
        date: e.date,
      }),
      rasEff,
    };
  });

  const tdBorder = { borderColor: '#D0DDE2' };

  // Window date range label
  const endDate = addDaysStr(windowStart, 6);
  const rangeLabel = `${formatDisplay(windowStart)} – ${formatDisplay(endDate)}`;

  return (
    <div className="p-4 space-y-4">
      {showImport && (
        <PasteImportModal
          title="Daily Schedule (OTB)"
          columns={OTB_COLS}
          onImport={handleImport}
          onClose={() => setShowImport(false)}
        />
      )}
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold" style={{ color: '#1A3C4A' }}>OTB Schedule <span className="text-xs font-normal ml-1" style={{ color: '#9ca3af' }}>On-The-Books</span></h1>
          <p className="text-xs mt-0.5" style={{ color: '#3A6878' }}>{currentProperty.name} · 7-day rolling view · updates staffing vs. weekly plan · <span style={{ color: '#059669' }}>changes save automatically</span></p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {autoSaved && (
            <span className="flex items-center gap-1 text-xs font-medium" style={{ color: '#059669' }}>
              <Check size={12} /> Auto-saved
            </span>
          )}
          <button onClick={() => setWindowStart(d => addDaysStr(d, -7))} className="btn-ghost p-2"><ChevronLeft size={16} /></button>
          <div className="text-sm font-medium px-2" style={{ color: '#1A3C4A' }}>{rangeLabel}</div>
          <button onClick={() => setWindowStart(d => addDaysStr(d, 7))} className="btn-ghost p-2"><ChevronRight size={16} /></button>
          <button onClick={() => setWindowStart(addDaysStr(todayStr, -1))} className="btn-ghost text-xs px-2 py-1">Today</button>
          <button onClick={() => setShowImport(true)} className="btn-ghost flex items-center gap-1 text-sm">
            <ClipboardPaste size={14} /> Import
          </button>
          {mode === 'demo' && <span className="text-xs px-2 py-1 rounded" style={{ background: '#FBE8DC', color: '#C86848' }}>Demo</span>}
        </div>
      </div>

      {/* Mobile scroll hint */}
      <div className="lg:hidden text-xs text-center py-1.5 rounded" style={{ background: '#e0f2fe', color: '#0369a1' }}>
        ← Swipe left/right to see all days →
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ minWidth: '900px' }}>
            <colgroup>
              <col style={{ width: '200px' }} />
              {entries.map((_, i) => <col key={i} style={{ width: '120px' }} />)}
            </colgroup>
            <thead>
              <tr>
                <th className="sticky left-0 z-10 text-left px-3 py-2 text-xs font-semibold border-r" style={{ background: '#1A3C4A', color: 'white', borderColor: '#2E6E82' }}>
                  OTB Schedule
                </th>
                {entries.map((e) => {
                  const isToday = e.date === todayStr;
                  const isPast = e.date < todayStr;
                  const bg = isToday ? '#2E6E82' : isPast ? '#4a7a8a' : '#3A6878';
                  return (
                    <th key={e.date} className="text-center px-2 py-2 text-xs font-semibold border-r" style={{ background: bg, color: 'white', borderColor: '#2E6E82' }}>
                      <div className="flex items-center justify-center gap-1">
                        <span>{getDayName(e.date)}</span>
                        {isToday && <span className="px-1 py-0.5 rounded text-white font-bold" style={{ background: '#C86848', fontSize: '9px' }}>TODAY</span>}
                        {isPast && <span style={{ fontSize: '9px', opacity: 0.6 }}>past</span>}
                      </div>
                      <div className="font-normal opacity-80">{formatDisplay(e.date)}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>

              {/* DAILY VOLUMES */}
              <SectionRow label="DAILY VOLUMES" cols={7} />

              <Row label="Occupied Rooms" highlight info="On-the-books count of rooms occupied for this date. Updates your staffing forecast vs. the weekly plan.">
                {entries.map((e, i) => (
                  <td key={i} className="px-1 py-1 border-r" style={tdBorder}>
                    <NumInput value={e.otbOccupiedRooms} onChange={v => updateEntry(e.date, { otbOccupiedRooms: v != null ? Math.round(v) : null })} />
                    <div className="text-right pr-2 mt-0.5" style={{ color: '#9ca3af', fontSize: '10px' }}>Plan: {getWeeklyDay(e.date)?.occupiedRooms ?? ''}</div>
                  </td>
                ))}
              </Row>

              <Row label="Arrivals" highlight info="On-the-books arrivals for this date.">
                {entries.map((e, i) => (
                  <td key={i} className="px-1 py-1 border-r" style={tdBorder}>
                    <NumInput value={e.otbArrivals} onChange={v => updateEntry(e.date, { otbArrivals: v != null ? Math.round(v) : null })} />
                    <div className="text-right pr-2 mt-0.5" style={{ color: '#9ca3af', fontSize: '10px' }}>Plan: {getWeeklyDay(e.date)?.arrivals ?? ''}</div>
                  </td>
                ))}
              </Row>

              <Row label="Departures" highlight info="On-the-books departures for this date. Higher departures trigger stricter contract rules.">
                {entries.map((e, i) => (
                  <td key={i} className="px-1 py-1 border-r" style={tdBorder}>
                    <NumInput value={e.otbDepartures} onChange={v => updateEntry(e.date, { otbDepartures: v != null ? Math.round(v) : null })} />
                    <div className="text-right pr-2 mt-0.5" style={{ color: '#9ca3af', fontSize: '10px' }}>Plan: {getWeeklyDay(e.date)?.departures ?? ''}</div>
                  </td>
                ))}
              </Row>

              <Row label="Carry Over from Yesterday" info="Checkout rooms not cleaned yesterday that are added to today's workload. Auto-fills from the previous day's carry-over value.">
                {entries.map((e, i) => (
                  <td key={i} className="px-1 py-1 border-r" style={tdBorder}>
                    {editingCoFrom === e.date ? (
                      <input
                        type="number" min="0" autoFocus
                        defaultValue={e.carriedOverFromYesterday}
                        className="border rounded pl-1 pr-2 py-0.5 text-right text-xs w-full focus:outline-none"
                        style={{ borderColor: '#D0DDE2' }}
                        onBlur={ev => { updateEntry(e.date, { carriedOverFromYesterday: parseInt(ev.target.value) || 0 }); setEditingCoFrom(null); }}
                        onKeyDown={ev => { if (ev.key === 'Enter') (ev.target as HTMLInputElement).blur(); }}
                      />
                    ) : (
                      <div className="flex items-center justify-end gap-1 pr-2">
                        <span className="text-xs font-medium" style={{ color: '#1A3C4A' }}>{e.carriedOverFromYesterday}</span>
                        <button onClick={() => setEditingCoFrom(e.date)}>
                          <Edit2 size={10} style={{ color: '#2E6E82' }} />
                        </button>
                      </div>
                    )}
                    <div className="text-right pr-2" style={{ color: '#9ca3af', fontSize: '10px' }}>auto</div>
                  </td>
                ))}
              </Row>

              <Row label="Carry Over to Tomorrow" highlight info="Checkout rooms that will not be cleaned today and are pushed to tomorrow's workload.">
                {entries.map((e, i) => (
                  <td key={i} className="px-1 py-1 border-r" style={tdBorder}>
                    <NumInput value={e.carryOverToTomorrow || null} onChange={v => updateEntry(e.date, { carryOverToTomorrow: Math.round(v ?? 0) })} placeholder="0" />
                  </td>
                ))}
              </Row>

              <Row label="Stayovers (calculated)" calc info="= Occupied Rooms − Arrivals. Guests staying another night who may receive housekeeping service.">
                {calcs.map((c, i) => <td key={i} className="px-1 py-1 border-r" style={tdBorder}><CalcVal v={c ? fmtInt(c.calc.stayovers) : '–'} /></td>)}
              </Row>

              <Row label="DND & RS %" info="Estimated % of stayover rooms that will decline service (Do Not Disturb or Refused Service). Enter as a number, e.g. 15 for 15%.">
                {entries.map((e, i) => (
                  <td key={i} className="px-1 py-1 border-r" style={tdBorder}>
                    <NumInput value={+(e.dndPct * 100).toFixed(1)} onChange={v => updateEntry(e.date, { dndPct: (v ?? 0) / 100 })} step="0.1" />
                  </td>
                ))}
              </Row>

              <Row label="DND & RS # (calculated)" calc info="= Stayovers × DND %. Estimated number of stayover rooms that will skip housekeeping service.">
                {calcs.map((c, i) => <td key={i} className="px-1 py-1 border-r" style={tdBorder}><CalcVal v={c ? fmt1(c.calc.dndRooms) : '–'} /></td>)}
              </Row>

              <Row label="Additional Credits" info="Extra credits outside standard room cleaning (e.g. deep cleans, special assignments). Added directly to total credits.">
                {entries.map((e, i) => (
                  <td key={i} className="px-1 py-1 border-r" style={tdBorder}>
                    <NumInput value={e.additionalCredits || null} onChange={v => updateEntry(e.date, { additionalCredits: v ?? 0 })} step="0.5" placeholder="0" />
                  </td>
                ))}
              </Row>

              {/* ROOM CALCULATIONS */}
              <SectionRow label="ROOM CALCULATIONS" cols={7} />

              <Row label="Departures to Clean" calc info="= Departures + Carry Over From Yesterday − Carry Over To Tomorrow. Total checkout rooms to be cleaned today.">
                {calcs.map((c, i) => <td key={i} className="px-1 py-1 border-r" style={tdBorder}><CalcVal v={c ? fmtInt(c.calc.departuresToClean) : '–'} /></td>)}
              </Row>

              <Row label="Stayovers to Clean" calc info="= Stayovers − DND & RS rooms, rounded up. Stayover rooms that will receive housekeeping service.">
                {calcs.map((c, i) => <td key={i} className="px-1 py-1 border-r" style={tdBorder}><CalcVal v={c ? fmtInt(c.calc.stayoversToClean) : '–'} /></td>)}
              </Row>

              <Row label="Total Rooms to Clean" calc bold info="= Departures to Clean + Stayovers to Clean. Total rooms requiring housekeeping today.">
                {calcs.map((c, i) => <td key={i} className="px-1 py-1 border-r" style={tdBorder}><CalcVal v={c ? fmtInt(c.calc.totalRoomsToClean) : '–'} bold /></td>)}
              </Row>

              <Row label="Estimated Credits" calc info="= Total Rooms to Clean × Avg. Credits per Room. Workload expressed in credits based on your room type configuration.">
                {calcs.map((c, i) => <td key={i} className="px-1 py-1 border-r" style={tdBorder}><CalcVal v={c ? fmt1(c.calc.estimatedCredits) : '–'} /></td>)}
              </Row>

              <Row label="Total Credits to Consider" calc bold info="= Estimated Credits + Additional Credits. Full workload in credits used to determine the required RA count.">
                {calcs.map((c, i) => <td key={i} className="px-1 py-1 border-r" style={tdBorder}><CalcVal v={c ? fmt1(c.calc.totalCreditsToConsider) : '–'} bold /></td>)}
              </Row>

              {/* STAFFING RECOMMENDATION */}
              <SectionRow label="STAFFING RECOMMENDATION" cols={7} />

              <Row label="RAs Needed" calc bold info="Recommended number of Room Attendants based on total credits and the applicable contract rule.">
                {calcs.map((c, i) => (
                  <td key={i} className="px-1 py-1 border-r" style={tdBorder}>
                    <CalcVal v={c ? String(c.calc.rasNeeded) : '–'} bold />
                  </td>
                ))}
              </Row>

              <Row label="Pot. Credit Attainment" calc info="= Estimated Credits ÷ RAs Needed. Average credits each RA would earn if fully staffed as recommended.">
                {calcs.map((c, i) => <td key={i} className="px-1 py-1 border-r" style={tdBorder}><CalcVal v={c ? fmt1(c.calc.potentialCreditAttainment) : '–'} /></td>)}
              </Row>

              <Row label={`Pot. HPOR (${currentProperty.shiftHours}h shift)`} calc info={`= (RAs Needed × ${currentProperty.shiftHours}h) ÷ Occupied Rooms. Hours per occupied room if staffed as recommended. Lower is more efficient.`}>
                {calcs.map((c, i) => <td key={i} className="px-1 py-1 border-r" style={tdBorder}><CalcVal v={c ? fmt2(c.calc.potentialHPOR) : '–'} /></td>)}
              </Row>

              {/* SCHEDULED vs. PLANNED */}
              <SectionRow label="SCHEDULED vs. PLANNED" cols={7} />

              <Row label="RAs Scheduled" highlight info="Number of Room Attendants you plan to schedule. The weekly plan value is shown; you can override it for this specific date.">
                {entries.map((e, i) => {
                  const weeklyDay = getWeeklyDay(e.date);
                  const rasFromWeekly = weeklyDay?.rasScheduled ?? null;
                  const rasEff = e.rasScheduledOverride ?? rasFromWeekly;
                  const isEditing = editingRas === e.date;
                  return (
                    <td key={i} className="px-1 py-1 border-r" style={{ ...tdBorder, background: '#e8f4fb' }}>
                      {isEditing ? (
                        <input
                          type="number" min="0" autoFocus
                          defaultValue={rasEff ?? ''}
                          className="border rounded pl-1 pr-2 py-0.5 text-right text-xs w-full focus:outline-none"
                          style={{ borderColor: '#D0DDE2' }}
                          onBlur={ev => { updateEntry(e.date, { rasScheduledOverride: ev.target.value ? parseInt(ev.target.value) : null }); setEditingRas(null); }}
                          onKeyDown={ev => { if (ev.key === 'Enter') (ev.target as HTMLInputElement).blur(); }}
                        />
                      ) : (
                        <div className="flex items-center justify-end gap-1 pr-2">
                          <span className="text-xs font-bold" style={{ color: '#1A3C4A' }}>{rasEff ?? '–'}</span>
                          <button onClick={() => setEditingRas(e.date)}>
                            <Edit2 size={10} style={{ color: '#2E6E82' }} />
                          </button>
                        </div>
                      )}
                      <div className="text-right pr-2" style={{ fontSize: '10px', color: '#9ca3af' }}>
                        {e.rasScheduledOverride != null ? (
                          <span style={{ color: '#C86848' }}>
                            override{rasFromWeekly != null && <> · <button className="underline" onClick={() => updateEntry(e.date, { rasScheduledOverride: null })}>reset</button></>}
                          </span>
                        ) : rasFromWeekly != null ? 'from plan' : ''}
                      </div>
                    </td>
                  );
                })}
              </Row>

              <Row label="Variance (RAs)" calc info="= RAs Needed − RAs Scheduled. Positive means you should call more RAs in; negative means you could call some off.">
                {calcs.map((c, i) => (
                  <td key={i} className="px-1 py-1 border-r" style={tdBorder}>
                    <VarianceBadge variance={c?.calc.variance} rasScheduled={c?.rasEff ?? null} />
                  </td>
                ))}
              </Row>

              <Row label="Notes">
                {entries.map((e, i) => (
                  <td key={i} className="px-1 py-1 border-r" style={tdBorder}>
                    <textarea
                      value={e.notes}
                      onChange={ev => updateEntry(e.date, { notes: ev.target.value })}
                      className="text-xs w-full border rounded px-1 py-0.5 resize-none"
                      style={{ borderColor: '#D0DDE2', height: '40px' }}
                    />
                  </td>
                ))}
              </Row>

            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs" style={{ color: '#3A6878' }}>
        <span><span className="inline-block w-3 h-3 rounded mr-1 align-middle" style={{ background: '#e8f4fb' }}></span>Input cell</span>
        <span><span className="inline-block w-3 h-3 rounded mr-1 align-middle border" style={{ background: 'white', borderColor: '#D0DDE2' }}></span>Calculated cell</span>
        <span>DND % is entered as a percentage (e.g. 15 for 15%)</span>
      </div>
    </div>
  );
}
