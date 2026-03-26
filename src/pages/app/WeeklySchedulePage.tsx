import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useData } from '../../contexts/DataContext';
import { WeeklySchedule, DailyForecast, Property } from '../../types';
import { calculateDay, fmtInt, fmt2, fmt1, fmtPct } from '../../utils/calculations';
import { getWeekStart, getWeekDates, getDayName, formatDisplay, weekRangeLabel, prevWeek, nextWeek, today } from '../../utils/dateUtils';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Save, Calendar, ClipboardPaste } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PasteImportModal, { ColDef } from '../../components/PasteImportModal';

const WEEKLY_COLS: ColDef[] = [
  { key: 'date', label: 'Date', type: 'date', required: true },
  { key: 'occupiedRooms', label: 'Occ Rooms', type: 'int' },
  { key: 'arrivals', label: 'Arrivals', type: 'int' },
  { key: 'departures', label: 'Departures', type: 'int' },
  { key: 'dndPct', label: 'DND %', type: 'pct' },
  { key: 'rasScheduled', label: 'RAs Scheduled', type: 'int' },
  { key: 'notes', label: 'Notes', type: 'text' },
];

type EditableField = Exclude<keyof DailyForecast, 'date'>;

function emptyDay(date: string): DailyForecast {
  return { date, occupiedRooms: null, arrivals: null, departures: null, carriedOverFromYesterday: 0, carryOverToTomorrow: 0, dndPct: 0.15, additionalCredits: 0, rasScheduled: null, notes: '' };
}

function getOrCreateSchedule(weekStart: string, propertyId: string, existing?: WeeklySchedule): WeeklySchedule {
  const dates = getWeekDates(weekStart);
  if (existing) {
    // Ensure all 7 days exist
    const days = dates.map(d => existing.days.find(x => x.date === d) ?? emptyDay(d));
    return { ...existing, days };
  }
  return {
    id: crypto.randomUUID(),
    propertyId,
    weekStartDate: weekStart,
    days: dates.map(emptyDay),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function NumInput({ value, onChange, disabled = false, step = '1', min = '0', placeholder = '' }: {
  value: number | null; onChange: (v: number | null) => void; disabled?: boolean; step?: string; min?: string; placeholder?: string;
}) {
  return (
    <input
      type="number" step={step} min={min}
      value={value ?? ''}
      onChange={e => onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
      disabled={disabled}
      placeholder={placeholder}
      className="border rounded pl-1 pr-2 py-0.5 text-right text-xs w-full focus:outline-none focus:ring-1 focus:ring-teal-500"
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

function VarianceBadge({ v }: { v: number | undefined }) {
  if (v == null) return <div className="text-xs text-center text-gray-400">–</div>;
  if (v > 0) return <div className="badge-callin text-center">+{v} to call in</div>;
  if (v < 0) return <div className="badge-calloff text-center">{v} to call off</div>;
  return <div className="badge-ontarget text-center">On Target</div>;
}

export default function WeeklySchedulePage() {
  const { currentProperty, currentPropertyId, getWeeklyByWeekStart, saveWeeklySchedule, mode } = useData();
  const navigate = useNavigate();
  const [weekStart, setWeekStart] = useState(() => getWeekStart(today()).toISOString().split('T')[0]);
  const [schedule, setSchedule] = useState<WeeklySchedule | null>(null);
  const [saved, setSaved] = useState(false);
  const [showImport, setShowImport] = useState(false);

  useEffect(() => {
    if (!currentPropertyId) return;
    const existing = getWeeklyByWeekStart(weekStart);
    setSchedule(getOrCreateSchedule(weekStart, currentPropertyId, existing));
  }, [weekStart, currentPropertyId, getWeeklyByWeekStart]);

  const updateDay = useCallback((date: string, field: EditableField, value: unknown) => {
    setSchedule(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        updatedAt: new Date().toISOString(),
        days: prev.days.map(d => d.date === date ? { ...d, [field]: value } : d),
      };
    });
  }, []);

  const handleSave = () => {
    if (mode === 'demo') { navigate('/login'); return; }
    if (!schedule) return;
    saveWeeklySchedule(schedule);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    if (!currentPropertyId) return;
    setSchedule(getOrCreateSchedule(weekStart, currentPropertyId));
  };

  const handleImport = (rows: Record<string, string | number | null>[]) => {
    if (!currentPropertyId) return;
    // Group rows by week start
    const byWeek = new Map<string, typeof rows>();
    for (const row of rows) {
      const date = row.date as string;
      if (!date) continue;
      const ws = getWeekStart(date).toISOString().split('T')[0];
      if (!byWeek.has(ws)) byWeek.set(ws, []);
      byWeek.get(ws)!.push(row);
    }
    byWeek.forEach((weekRows, ws) => {
      const sched = getOrCreateSchedule(ws, currentPropertyId, getWeeklyByWeekStart(ws));
      const updatedDays = sched.days.map(day => {
        const r = weekRows.find(row => row.date === day.date);
        if (!r) return day;
        return {
          ...day,
          occupiedRooms: r.occupiedRooms as number | null ?? day.occupiedRooms,
          arrivals: r.arrivals as number | null ?? day.arrivals,
          departures: r.departures as number | null ?? day.departures,
          dndPct: r.dndPct as number | null ?? day.dndPct,
          rasScheduled: r.rasScheduled as number | null ?? day.rasScheduled,
          notes: (r.notes as string) || day.notes,
        };
      });
      saveWeeklySchedule({ ...sched, days: updatedDays, updatedAt: new Date().toISOString() });
      // If imported rows touch the current week, refresh local state
      if (ws === weekStart) {
        setSchedule({ ...sched, days: updatedDays, updatedAt: new Date().toISOString() });
      }
    });
  };

  if (!currentProperty || !schedule) {
    return <div className="p-6 text-sm" style={{ color: '#3A6878' }}>No property selected.</div>;
  }

  const days = schedule.days;

  // Only the first day (Sunday) has a manually-entered carry-over from yesterday.
  // All other days auto-inherit the previous day's "carry over to tomorrow" value.
  const effectiveCarryOver = days.map((d, i) =>
    i === 0 ? (d.carriedOverFromYesterday ?? 0) : (days[i - 1].carryOverToTomorrow ?? 0)
  );

  const calcs = days.map((d, i) => {
    if (d.occupiedRooms == null || d.departures == null) return null;
    return calculateDay({
      occupiedRooms: d.occupiedRooms,
      arrivals: d.arrivals ?? 0,
      departures: d.departures,
      carriedOverFromYesterday: effectiveCarryOver[i],
      carryOverToTomorrow: d.carryOverToTomorrow,
      dndPct: d.dndPct,
      additionalCredits: d.additionalCredits,
      rasScheduled: d.rasScheduled,
      property: currentProperty,
      date: d.date,
    });
  });

  // Weekly totals
  const totOcc = days.reduce((s, d) => s + (d.occupiedRooms ?? 0), 0);
  const totArr = days.reduce((s, d) => s + (d.arrivals ?? 0), 0);
  const totDep = days.reduce((s, d) => s + (d.departures ?? 0), 0);
  const totCoFrom = effectiveCarryOver.reduce((s, v) => s + v, 0);
  const totCoTo = days.reduce((s, d) => s + d.carryOverToTomorrow, 0);
  const totSto = calcs.reduce((s, c) => s + (c?.stayovers ?? 0), 0);
  const totDNDRooms = calcs.reduce((s, c) => s + (c?.dndRooms ?? 0), 0);
  const totDepClean = calcs.reduce((s, c) => s + (c?.departuresToClean ?? 0), 0);
  const totStoClean = calcs.reduce((s, c) => s + (c?.stayoversToClean ?? 0), 0);
  const totRooms = calcs.reduce((s, c) => s + (c?.totalRoomsToClean ?? 0), 0);
  const totEstCred = calcs.reduce((s, c) => s + (c?.estimatedCredits ?? 0), 0);
  const totAddCred = days.reduce((s, d) => s + d.additionalCredits, 0);
  const totCredits = calcs.reduce((s, c) => s + (c?.totalCreditsToConsider ?? 0), 0);
  const totRasNeeded = calcs.reduce((s, c) => s + (c?.rasNeeded ?? 0), 0);
  const totRasSched = days.reduce((s, d) => s + (d.rasScheduled ?? 0), 0);
  const totVariance = totRasNeeded - totRasSched;

  const cols = days.length; // 7

  return (
    <div className="p-4 space-y-4">
      {showImport && (
        <PasteImportModal
          title="Weekly Schedule"
          columns={WEEKLY_COLS}
          onImport={handleImport}
          onClose={() => setShowImport(false)}
        />
      )}
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold" style={{ color: '#1A3C4A' }}>Weekly Schedule</h1>
          <p className="text-xs mt-0.5" style={{ color: '#3A6878' }}>{currentProperty.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekStart(prevWeek(weekStart))} className="btn-ghost p-2" title="Previous week"><ChevronLeft size={16} /></button>
          <div className="text-sm font-medium px-2" style={{ color: '#1A3C4A' }}>
            <Calendar size={14} className="inline mr-1" style={{ color: '#2E6E82' }} />
            {weekRangeLabel(weekStart)}
          </div>
          <button onClick={() => setWeekStart(nextWeek(weekStart))} className="btn-ghost p-2" title="Next week"><ChevronRight size={16} /></button>
          <button onClick={() => setWeekStart(getWeekStart(today()).toISOString().split('T')[0])} className="btn-ghost text-xs px-2 py-1">Today</button>
          {mode === 'demo' && (
            <button onClick={handleReset} className="btn-ghost text-xs px-2 py-1" title="Clear all values for this week">
              Reset
            </button>
          )}
          <button onClick={() => setShowImport(true)} className="btn-ghost flex items-center gap-1 text-sm">
            <ClipboardPaste size={14} /> Import
          </button>
          <button onClick={handleSave} className={`btn-primary flex items-center gap-1 text-sm ${saved ? 'opacity-70' : ''}`}>
            <Save size={14} /> {mode === 'demo' ? 'Sign In to Save' : saved ? 'Saved!' : 'Save'}
          </button>
          {mode === 'demo' && <span className="text-xs px-2 py-1 rounded" style={{ background: '#FBE8DC', color: '#C86848' }}>Demo</span>}
        </div>
      </div>

      {/* Schedule Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ minWidth: '900px' }}>
            <colgroup>
              <col style={{ width: '200px' }} />
              {days.map((_, i) => <col key={i} style={{ width: '100px' }} />)}
              <col style={{ width: '90px' }} />
            </colgroup>
            <thead>
              <tr>
                <th className="sticky left-0 z-10 text-left px-3 py-2 text-xs font-semibold border-r" style={{ background: '#1A3C4A', color: 'white', borderColor: '#2E6E82' }}>
                  Weekly Schedule
                </th>
                {days.map(d => (
                  <th key={d.date} className="text-center px-2 py-2 text-xs font-semibold border-r" style={{ background: '#3A6878', color: 'white', borderColor: '#2E6E82' }}>
                    <div>{getDayName(d.date)}</div>
                    <div className="font-normal opacity-80">{formatDisplay(d.date)}</div>
                  </th>
                ))}
                <th className="text-center px-2 py-2 text-xs font-semibold" style={{ background: '#1A3C4A', color: 'white' }}>Total</th>
              </tr>
            </thead>
            <tbody>

              {/* === STATISTICS SECTION === */}
              <SectionRow label="FORECASTED VOLUMES" />

              <Row label="Occupied Rooms" highlight info="Total forecast of rooms occupied (checked in) for the night.">
                {days.map((d, i) => <td key={i} className="px-1 py-1 border-r" style={{ borderColor: '#D0DDE2' }}><NumInput value={d.occupiedRooms} onChange={v => updateDay(d.date, 'occupiedRooms', v)} /></td>)}
                <td className="total-col">{totOcc || '–'}</td>
              </Row>

              <Row label="Arrivals" info="Forecast number of guests checking in that day.">
                {days.map((d, i) => <td key={i} className="px-1 py-1 border-r" style={{ borderColor: '#D0DDE2' }}><NumInput value={d.arrivals} onChange={v => updateDay(d.date, 'arrivals', v)} /></td>)}
                <td className="total-col">{totArr || '–'}</td>
              </Row>

              <Row label="Departures" info="Forecast number of guests checking out that day.">
                {days.map((d, i) => <td key={i} className="px-1 py-1 border-r" style={{ borderColor: '#D0DDE2' }}><NumInput value={d.departures} onChange={v => updateDay(d.date, 'departures', v)} /></td>)}
                <td className="total-col">{totDep || '–'}</td>
              </Row>

              <Row label="Rooms Carried Over (from yesterday)" info="Checkout rooms not cleaned the prior day added to today's workload. Sunday is entered manually; other days auto-fill from the previous day's carry-over.">
                {days.map((d, i) => (
                  <td key={i} className="px-1 py-1 border-r" style={{ borderColor: '#D0DDE2' }}>
                    {i === 0
                      ? <NumInput value={d.carriedOverFromYesterday || null} onChange={v => updateDay(d.date, 'carriedOverFromYesterday', v ?? 0)} />
                      : <CalcVal v={effectiveCarryOver[i] ? String(effectiveCarryOver[i]) : '–'} />
                    }
                  </td>
                ))}
                <td className="total-col">{totCoFrom || '–'}</td>
              </Row>

              <Row label="Rooms to Carry Over (to tomorrow)" info="Checkout rooms that will not be cleaned today and are pushed to tomorrow's team.">
                {days.map((d, i) => <td key={i} className="px-1 py-1 border-r" style={{ borderColor: '#D0DDE2' }}><NumInput value={d.carryOverToTomorrow || null} onChange={v => updateDay(d.date, 'carryOverToTomorrow', v ?? 0)} /></td>)}
                <td className="total-col">{totCoTo || '–'}</td>
              </Row>

              <Row label="Stayovers (calculated)" calc info="= Occupied Rooms − Arrivals. Guests staying another night who may receive housekeeping service.">
                {calcs.map((c, i) => <td key={i} className="px-1 py-1 border-r" style={{ borderColor: '#D0DDE2' }}><CalcVal v={c ? fmtInt(c.stayovers) : '–'} /></td>)}
                <td className="total-col">{totSto ? fmtInt(totSto) : '–'}</td>
              </Row>

              <Row label="DND & RS %" info="Estimated % of stayover rooms that will decline service (Do Not Disturb or Refused Service). Enter as a number, e.g. 15 for 15%.">
                {days.map((d, i) => <td key={i} className="px-1 py-1 border-r" style={{ borderColor: '#D0DDE2' }}><NumInput value={+(d.dndPct * 100).toFixed(1)} onChange={v => updateDay(d.date, 'dndPct', (v ?? 0) / 100)} step="0.1" min="0" /></td>)}
                <td className="total-col">–</td>
              </Row>

              <Row label="DND & RS # (calculated)" calc info="= Stayovers × DND %. Estimated number of stayover rooms that will skip housekeeping service.">
                {calcs.map((c, i) => <td key={i} className="px-1 py-1 border-r" style={{ borderColor: '#D0DDE2' }}><CalcVal v={c ? fmt1(c.dndRooms) : '–'} /></td>)}
                <td className="total-col">{totDNDRooms ? fmt1(totDNDRooms) : '–'}</td>
              </Row>

              <Row label="Additional Credits Drop" info="Extra credits outside standard room cleaning (e.g. deep cleans, special assignments). Added directly to total credits.">
                {days.map((d, i) => <td key={i} className="px-1 py-1 border-r" style={{ borderColor: '#D0DDE2' }}><NumInput value={d.additionalCredits || null} onChange={v => updateDay(d.date, 'additionalCredits', v ?? 0)} step="0.5" /></td>)}
                <td className="total-col">{totAddCred || '–'}</td>
              </Row>

              {/* === CALCULATION SECTION === */}
              <SectionRow label="ROOM CALCULATIONS" />

              <Row label="Departures to Clean" calc info="= Departures + Carry Over From Yesterday − Carry Over To Tomorrow. Total checkout rooms to be cleaned today.">
                {calcs.map((c, i) => <td key={i} className="px-1 py-1 border-r" style={{ borderColor: '#D0DDE2' }}><CalcVal v={c ? fmtInt(c.departuresToClean) : '–'} /></td>)}
                <td className="total-col">{totDepClean ? fmtInt(totDepClean) : '–'}</td>
              </Row>

              <Row label="Stayovers to Clean" calc info="= Stayovers − DND & RS rooms, rounded up. Stayover rooms that will receive housekeeping service.">
                {calcs.map((c, i) => <td key={i} className="px-1 py-1 border-r" style={{ borderColor: '#D0DDE2' }}><CalcVal v={c ? fmtInt(c.stayoversToClean) : '–'} /></td>)}
                <td className="total-col">{totStoClean ? fmtInt(totStoClean) : '–'}</td>
              </Row>

              <Row label="Total Rooms to Clean" calc bold info="= Departures to Clean + Stayovers to Clean. Total rooms requiring housekeeping today.">
                {calcs.map((c, i) => <td key={i} className="px-1 py-1 border-r" style={{ borderColor: '#D0DDE2' }}><CalcVal v={c ? fmtInt(c.totalRoomsToClean) : '–'} bold /></td>)}
                <td className="total-col font-bold">{totRooms ? fmtInt(totRooms) : '–'}</td>
              </Row>

              <Row label="Estimated Credits" calc info="= Total Rooms to Clean × Avg. Credits per Room. Workload expressed in credits based on your room type configuration.">
                {calcs.map((c, i) => <td key={i} className="px-1 py-1 border-r" style={{ borderColor: '#D0DDE2' }}><CalcVal v={c ? fmt1(c.estimatedCredits) : '–'} /></td>)}
                <td className="total-col">{totEstCred ? fmt1(totEstCred) : '–'}</td>
              </Row>

              <Row label="Total Credits to Consider" calc bold info="= Estimated Credits + Additional Credits. Full workload in credits used to determine the required RA count.">
                {calcs.map((c, i) => <td key={i} className="px-1 py-1 border-r" style={{ borderColor: '#D0DDE2' }}><CalcVal v={c ? fmt1(c.totalCreditsToConsider) : '–'} bold /></td>)}
                <td className="total-col font-bold">{totCredits ? fmt1(totCredits) : '–'}</td>
              </Row>

              {/* Rule Results */}
              {currentProperty.contractRules
                .sort((a, b) => b.maxCredits - a.maxCredits)
                .map((rule, ri) => (
                  <Row key={rule.id} label={`Rule ${ri + 1} — RAs (max ${rule.maxCredits} cr${rule.minDepartures ? `, ≥${rule.minDepartures} dep/RA` : ''})`} calc>
                    {calcs.map((c, i) => {
                      const rr = c?.ruleResults[ri];
                      return (
                        <td key={i} className="px-1 py-1 border-r" style={{ borderColor: '#D0DDE2' }}>
                          {rr ? (
                            <div className="text-right text-xs pr-2" style={{ color: rr.applied ? '#1A3C4A' : '#9ca3af' }}>
                              {rr.rasNeeded}
                              <div className="text-gray-400" style={{ fontSize: '10px' }}>
                                {fmt1(rr.avgDeparturesPerRA)} dep/RA
                              </div>
                            </div>
                          ) : <CalcVal v="–" />}
                        </td>
                      );
                    })}
                    <td className="total-col text-xs text-gray-400">–</td>
                  </Row>
                ))}

              <SectionRow label="STAFFING RECOMMENDATION" />

              <Row label="RAs to Schedule" calc bold info="Recommended number of Room Attendants based on total credits and the applicable contract rule.">
                {calcs.map((c, i) => (
                  <td key={i} className="px-1 py-1 border-r" style={{ borderColor: '#D0DDE2' }}>
                    <CalcVal v={c ? String(c.rasNeeded) : '–'} bold />
                  </td>
                ))}
                <td className="total-col font-bold">{totRasNeeded || '–'}</td>
              </Row>

              <Row label="Potential Credit Attainment" calc info="= Estimated Credits ÷ RAs Needed. Average credits each RA would earn if fully staffed as recommended.">
                {calcs.map((c, i) => <td key={i} className="px-1 py-1 border-r" style={{ borderColor: '#D0DDE2' }}><CalcVal v={c ? fmt1(c.potentialCreditAttainment) : '–'} /></td>)}
                <td className="total-col">–</td>
              </Row>

              <Row label={`Potential HPOR (${currentProperty.shiftHours}h shift)`} calc info={`= (RAs Needed × ${currentProperty.shiftHours}h) ÷ Occupied Rooms. Hours per occupied room if staffed as recommended. Lower is more efficient.`}>
                {calcs.map((c, i) => <td key={i} className="px-1 py-1 border-r" style={{ borderColor: '#D0DDE2' }}><CalcVal v={c ? fmt2(c.potentialHPOR) : '–'} /></td>)}
                <td className="total-col">–</td>
              </Row>

              <SectionRow label="SCHEDULED vs. PLANNED" />

              <Row label="RAs Scheduled" highlight info="Number of Room Attendants you plan to schedule. Compare against RAs to Schedule to see the variance.">
                {days.map((d, i) => <td key={i} className="px-1 py-1 border-r" style={{ borderColor: '#D0DDE2' }}><NumInput value={d.rasScheduled} onChange={v => updateDay(d.date, 'rasScheduled', v)} /></td>)}
                <td className="total-col font-bold">{totRasSched || '–'}</td>
              </Row>

              <Row label="Scheduled Credit Attainment" calc info="= Estimated Credits ÷ RAs Scheduled. Average credits each RA earns based on your actual scheduled count.">
                {calcs.map((c, i) => <td key={i} className="px-1 py-1 border-r" style={{ borderColor: '#D0DDE2' }}><CalcVal v={c?.scheduledCreditAttainment != null ? fmt1(c.scheduledCreditAttainment) : '–'} /></td>)}
                <td className="total-col">–</td>
              </Row>

              <Row label="Scheduled HPOR" calc info={`= (RAs Scheduled × ${currentProperty.shiftHours}h) ÷ Occupied Rooms. Hours per occupied room based on your scheduled RA count.`}>
                {calcs.map((c, i) => <td key={i} className="px-1 py-1 border-r" style={{ borderColor: '#D0DDE2' }}><CalcVal v={c?.scheduledHPOR != null ? fmt2(c.scheduledHPOR) : '–'} /></td>)}
                <td className="total-col">–</td>
              </Row>

              <Row label="Variance (RAs)" calc info="= RAs Needed − RAs Scheduled. Positive means you need to call more RAs in; negative means you could call some off.">
                {calcs.map((c, i) => (
                  <td key={i} className="px-1 py-1 border-r" style={{ borderColor: '#D0DDE2' }}>
                    <VarianceBadge v={c?.variance} />
                  </td>
                ))}
                <td className="total-col text-center">
                  <VarianceBadge v={totRasSched > 0 ? totVariance : undefined} />
                </td>
              </Row>

              <Row label="Notes">
                {days.map((d, i) => (
                  <td key={i} className="px-1 py-1 border-r" style={{ borderColor: '#D0DDE2' }}>
                    <textarea
                      value={d.notes}
                      onChange={e => updateDay(d.date, 'notes', e.target.value)}
                      className="text-xs w-full border rounded px-1 py-0.5 resize-none"
                      style={{ borderColor: '#D0DDE2', height: '40px' }}
                    />
                  </td>
                ))}
                <td className="total-col">–</td>
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

function InfoTooltip({ text }: { text: string }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const ref = useRef<HTMLSpanElement>(null);
  return (
    <span className="inline-block" style={{ marginLeft: 4, verticalAlign: 'middle' }}>
      <span
        ref={ref}
        onMouseEnter={() => {
          if (ref.current) {
            const r = ref.current.getBoundingClientRect();
            setPos({ x: r.right + 6, y: r.top - 2 });
          }
        }}
        onMouseLeave={() => setPos(null)}
        className="inline-flex items-center justify-center rounded-full cursor-help select-none"
        style={{ width: 13, height: 13, background: '#D0DDE2', color: '#3A6878', fontSize: '9px', fontWeight: 700, lineHeight: 1 }}
      >
        i
      </span>
      {pos && createPortal(
        <div
          style={{ position: 'fixed', left: pos.x, top: pos.y, background: '#1A3C4A', color: 'white', padding: '6px 10px', width: 220, lineHeight: 1.5, zIndex: 9999, borderRadius: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.2)', fontSize: '12px', pointerEvents: 'none' }}
        >
          {text}
        </div>,
        document.body
      )}
    </span>
  );
}

function SectionRow({ label }: { label: string }) {
  return (
    <tr>
      <td colSpan={9} className="px-3 py-1 text-xs font-bold uppercase tracking-wide text-white sticky left-0" style={{ background: '#1A3C4A' }}>
        {label}
      </td>
    </tr>
  );
}

function Row({ label, children, bold = false, info }: {
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
