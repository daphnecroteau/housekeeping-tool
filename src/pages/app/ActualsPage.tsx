import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { DailyActual } from '../../types';
import { getAvgCreditPerRoom, fmt2, fmt1 } from '../../utils/calculations';
import { today, formatFull, getDayName, getDayNameFull, addDaysStr } from '../../utils/dateUtils';
import { Save, ChevronLeft, ChevronRight, Clock, Trash2, Plus, ClipboardPaste } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PasteImportModal, { ColDef } from '../../components/PasteImportModal';

const ACTUALS_COLS: ColDef[] = [
  { key: 'date', label: 'Date', type: 'date', required: true },
  { key: 'occupiedRooms', label: 'Occ Rooms', type: 'int' },
  { key: 'arrivals', label: 'Arrivals', type: 'int' },
  { key: 'departures', label: 'Departures', type: 'int' },
  { key: 'depCleaned', label: 'Dep Cleaned', type: 'int' },
  { key: 'stoCleaned', label: 'Sto Cleaned', type: 'int' },
  { key: 'dnds', label: 'DNDs', type: 'int' },
  { key: 'refusedService', label: 'Refused Service', type: 'int' },
  { key: 'hoursWorked', label: 'Hours Worked', type: 'float' },
  { key: 'notes', label: 'Notes', type: 'text' },
];

function emptyActual(date: string, propertyId: string): DailyActual {
  return {
    id: crypto.randomUUID(), propertyId, date,
    actualOccupiedRooms: null, actualArrivals: null, actualDepartures: null,
    actualDeparturesCleaned: null, actualStayoversCleaned: null,
    actualDNDs: null, actualRefusedService: null, actualHoursWorked: null,
    notes: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
}

export default function ActualsPage() {
  const { currentProperty, currentPropertyId, getActualByDate, saveActual, deleteActual, actuals, weeklySchedules, otbEntries, mode } = useData();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(today());
  const [form, setForm] = useState<DailyActual | null>(null);
  const [saved, setSaved] = useState(false);
  const [showImport, setShowImport] = useState(false);

  // Pre-fill from OTB or Weekly when date changes
  useEffect(() => {
    if (!currentPropertyId) return;
    const existing = getActualByDate(selectedDate);
    if (existing) {
      setForm({ ...existing });
      return;
    }
    // Pre-fill from OTB first, then weekly
    const otb = otbEntries.find(e => e.date === selectedDate);
    const weekly = weeklySchedules.flatMap(w => w.days).find(d => d.date === selectedDate);
    const source = otb ? {
      actualOccupiedRooms: otb.otbOccupiedRooms,
      actualArrivals: otb.otbArrivals,
      actualDepartures: otb.otbDepartures,
    } : weekly ? {
      actualOccupiedRooms: weekly.occupiedRooms,
      actualArrivals: weekly.arrivals,
      actualDepartures: weekly.departures,
    } : {};
    setForm({ ...emptyActual(selectedDate, currentPropertyId), ...source });
  }, [selectedDate, currentPropertyId, getActualByDate, otbEntries, weeklySchedules]);

  const handleSave = () => {
    if (mode === 'demo') { navigate('/login'); return; }
    if (!form) return;
    saveActual({ ...form, updatedAt: new Date().toISOString() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleImport = (rows: Record<string, string | number | null>[]) => {
    if (!currentPropertyId) return;
    for (const row of rows) {
      const date = row.date as string;
      if (!date) continue;
      const existing = getActualByDate(date);
      const base = existing ?? emptyActual(date, currentPropertyId);
      saveActual({
        ...base,
        actualOccupiedRooms: row.occupiedRooms as number | null ?? base.actualOccupiedRooms,
        actualArrivals: row.arrivals as number | null ?? base.actualArrivals,
        actualDepartures: row.departures as number | null ?? base.actualDepartures,
        actualDeparturesCleaned: row.depCleaned as number | null ?? base.actualDeparturesCleaned,
        actualStayoversCleaned: row.stoCleaned as number | null ?? base.actualStayoversCleaned,
        actualDNDs: row.dnds as number | null ?? base.actualDNDs,
        actualRefusedService: row.refusedService as number | null ?? base.actualRefusedService,
        actualHoursWorked: row.hoursWorked as number | null ?? base.actualHoursWorked,
        notes: (row.notes as string) || base.notes,
        updatedAt: new Date().toISOString(),
      });
    }
  };

  if (!currentProperty || !form) return <div className="p-6 text-sm" style={{ color: '#3A6878' }}>No property selected.</div>;

  const up = (field: keyof DailyActual, value: number | null | string) => setForm(f => f ? { ...f, [field]: value } : f);
  const numField = (field: keyof DailyActual) => (e: React.ChangeEvent<HTMLInputElement>) =>
    up(field, e.target.value === '' ? null : parseFloat(e.target.value));

  // Derived calculations
  const totalRoomsCleaned = (form.actualDeparturesCleaned ?? 0) + (form.actualStayoversCleaned ?? 0);
  const avgCredit = getAvgCreditPerRoom(currentProperty);
  const creditsAttained = totalRoomsCleaned > 0 ? totalRoomsCleaned * avgCredit : null;
  const actualHPOR = (form.actualOccupiedRooms && form.actualHoursWorked)
    ? form.actualHoursWorked / form.actualOccupiedRooms : null;

  // Weekly plan for comparison
  const weeklyDay = weeklySchedules.flatMap(w => w.days).find(d => d.date === selectedDate);
  const otbDay = otbEntries.find(e => e.date === selectedDate);

  // Recent actuals for list
  const recentActuals = [...actuals].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14);

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-5">
      {showImport && (
        <PasteImportModal
          title="Daily Actuals"
          columns={ACTUALS_COLS}
          onImport={handleImport}
          onClose={() => setShowImport(false)}
        />
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold" style={{ color: '#1A3C4A' }}>Daily Actuals</h1>
          <p className="text-xs mt-0.5" style={{ color: '#3A6878' }}>{currentProperty.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setSelectedDate(d => addDaysStr(d, -1))} className="btn-ghost p-2"><ChevronLeft size={16} /></button>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="border rounded px-3 py-1.5 text-sm"
            style={{ borderColor: '#D0DDE2' }}
          />
          <button onClick={() => setSelectedDate(d => addDaysStr(d, 1))} className="btn-ghost p-2"><ChevronRight size={16} /></button>
          <button onClick={() => setSelectedDate(today())} className="btn-ghost text-xs px-2 py-1">Today</button>
          <button
            onClick={() => setSelectedDate(today())}
            className="btn-primary flex items-center gap-1 text-sm"
            title="Add today's actuals"
          >
            <Plus size={14} /> New Entry
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="btn-ghost flex items-center gap-1 text-sm"
            title="Paste multiple rows from Excel"
          >
            <ClipboardPaste size={14} /> Import
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Main form */}
        <div className="lg:col-span-2 card p-5 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-sm" style={{ color: '#1A3C4A' }}>{getDayNameFull(selectedDate)}, {formatFull(selectedDate)}</div>
              {getActualByDate(selectedDate) && (
                <div className="text-xs mt-0.5 flex items-center gap-1" style={{ color: '#3A6878' }}>
                  <Clock size={11} /> Last updated {form.updatedAt.split('T')[0]}
                </div>
              )}
            </div>
            <button onClick={handleSave} className={`btn-primary flex items-center gap-1 text-sm ${saved ? 'opacity-70' : ''}`}>
              <Save size={14} /> {mode === 'demo' ? 'Sign In to Save' : saved ? 'Saved!' : 'Save Actuals'}
            </button>
          </div>

          {/* Volume fields */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: '#3A6878' }}>Actual Volumes</h3>
            <div className="grid grid-cols-3 gap-3">
              <FormField label="Occupied Rooms" hint={weeklyDay?.occupiedRooms ?? otbDay?.otbOccupiedRooms}>
                <input type="number" min="0" value={form.actualOccupiedRooms ?? ''} onChange={numField('actualOccupiedRooms')} className="w-full border rounded px-3 py-2 text-sm text-right focus:outline-none" style={{ background: '#e8f4fb', borderColor: '#D0DDE2' }} />
              </FormField>
              <FormField label="Arrivals" hint={weeklyDay?.arrivals ?? otbDay?.otbArrivals}>
                <input type="number" min="0" value={form.actualArrivals ?? ''} onChange={numField('actualArrivals')} className="w-full border rounded px-3 py-2 text-sm text-right focus:outline-none" style={{ background: '#e8f4fb', borderColor: '#D0DDE2' }} />
              </FormField>
              <FormField label="Departures" hint={weeklyDay?.departures ?? otbDay?.otbDepartures}>
                <input type="number" min="0" value={form.actualDepartures ?? ''} onChange={numField('actualDepartures')} className="w-full border rounded px-3 py-2 text-sm text-right focus:outline-none" style={{ background: '#e8f4fb', borderColor: '#D0DDE2' }} />
              </FormField>
            </div>
          </div>

          {/* Rooms cleaned */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: '#3A6878' }}>Rooms Cleaned</h3>
            <div className="grid grid-cols-3 gap-3">
              <FormField label="Departures Cleaned">
                <input type="number" min="0" value={form.actualDeparturesCleaned ?? ''} onChange={numField('actualDeparturesCleaned')} className="w-full border rounded px-3 py-2 text-sm text-right focus:outline-none" style={{ background: '#e8f4fb', borderColor: '#D0DDE2' }} />
              </FormField>
              <FormField label="Stayovers Cleaned">
                <input type="number" min="0" value={form.actualStayoversCleaned ?? ''} onChange={numField('actualStayoversCleaned')} className="w-full border rounded px-3 py-2 text-sm text-right focus:outline-none" style={{ background: '#e8f4fb', borderColor: '#D0DDE2' }} />
              </FormField>
              <FormField label="Total Rooms Cleaned">
                <div className="border rounded px-3 py-2 text-sm font-semibold text-right" style={{ background: '#e8f7ef', borderColor: '#D0DDE2', color: '#065f46' }}>
                  {totalRoomsCleaned || '–'}
                </div>
              </FormField>
            </div>
          </div>

          {/* DNDs & Hours */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: '#3A6878' }}>Service & Hours</h3>
            <div className="grid grid-cols-3 gap-3">
              <FormField label="DNDs">
                <input type="number" min="0" value={form.actualDNDs ?? ''} onChange={numField('actualDNDs')} className="w-full border rounded px-3 py-2 text-sm text-right focus:outline-none" style={{ background: '#e8f4fb', borderColor: '#D0DDE2' }} />
              </FormField>
              <FormField label="Refused Service">
                <input type="number" min="0" value={form.actualRefusedService ?? ''} onChange={numField('actualRefusedService')} className="w-full border rounded px-3 py-2 text-sm text-right focus:outline-none" style={{ background: '#e8f4fb', borderColor: '#D0DDE2' }} />
              </FormField>
              <FormField label="Total Hours Worked">
                <input type="number" min="0" step="0.5" value={form.actualHoursWorked ?? ''} onChange={numField('actualHoursWorked')} className="w-full border rounded px-3 py-2 text-sm text-right focus:outline-none" style={{ background: '#e8f4fb', borderColor: '#D0DDE2' }} />
              </FormField>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-medium" style={{ color: '#3A6878' }}>Notes</label>
            <textarea
              value={form.notes}
              onChange={e => up('notes', e.target.value)}
              className="mt-1 w-full border rounded px-3 py-2 text-sm resize-none"
              style={{ borderColor: '#D0DDE2', height: '64px' }}
              placeholder="Why more/less staff? Special events, room conditions…"
              disabled={mode === 'demo'}
            />
          </div>
        </div>

        {/* Right column: KPIs + comparison */}
        <div className="space-y-4">
          {/* Actual KPIs */}
          <div className="card p-4">
            <h3 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: '#3A6878' }}>Actual Performance</h3>
            <div className="space-y-3">
              <KPI label="Credits Attained" value={creditsAttained ? fmt1(creditsAttained) : '–'} />
              <KPI label="Actual HPOR" value={actualHPOR ? fmt2(actualHPOR) : '–'} />
              <KPI label="DND + RS Rooms" value={String((form.actualDNDs ?? 0) + (form.actualRefusedService ?? 0)) || '–'} />
              {form.actualOccupiedRooms && (form.actualDNDs || form.actualRefusedService) && (
                <KPI
                  label="DND+RS % of Stayovers"
                  value={(() => {
                    const sto = (form.actualOccupiedRooms ?? 0) - (form.actualArrivals ?? 0);
                    return sto > 0 ? (((form.actualDNDs ?? 0) + (form.actualRefusedService ?? 0)) / sto * 100).toFixed(1) + '%' : '–';
                  })()}
                />
              )}
            </div>
          </div>

          {/* Plan vs Actual */}
          {(weeklyDay || otbDay) && (
            <div className="card p-4">
              <h3 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: '#3A6878' }}>
                {otbDay ? 'Daily' : 'Forecast'} vs. Actual
              </h3>
              <div className="space-y-2">
                {[
                  ['Occ. Rooms', otbDay?.otbOccupiedRooms ?? weeklyDay?.occupiedRooms, form.actualOccupiedRooms],
                  ['Arrivals', otbDay?.otbArrivals ?? weeklyDay?.arrivals, form.actualArrivals],
                  ['Departures', otbDay?.otbDepartures ?? weeklyDay?.departures, form.actualDepartures],
                ].map(([label, plan, actual]) => (
                  <div key={String(label)} className="flex justify-between items-center text-xs">
                    <span style={{ color: '#3A6878' }}>{label}</span>
                    <div className="flex items-center gap-2">
                      <span style={{ color: '#9ca3af' }}>Plan: {plan ?? '–'}</span>
                      <span className="font-medium" style={{ color: '#1A3C4A' }}>Act: {actual ?? '–'}</span>
                      {plan != null && actual != null && (
                        <span style={{ color: (actual as number) >= (plan as number) ? '#065f46' : '#b91c1c', fontWeight: 600 }}>
                          {(actual as number) >= (plan as number) ? '+' : ''}{(actual as number) - (plan as number)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent actuals table */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b font-semibold text-sm" style={{ borderColor: '#D0DDE2', color: '#1A3C4A' }}>
          Recent Actuals
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: '#F5F7F8' }}>
                {['Date', 'Occ', 'Dep', 'Dep Cleaned', 'Sto Cleaned', 'Total Rooms', 'DNDs', 'RS', 'Hours', 'Credits Att.', 'HPOR', ''].map(h => (
                  <th key={h} className="px-3 py-2 text-right first:text-left font-semibold" style={{ color: '#3A6878' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentActuals.length === 0 && (
                <tr><td colSpan={12} className="px-3 py-4 text-center" style={{ color: '#9ca3af' }}>No actuals recorded yet.</td></tr>
              )}
              {recentActuals.map(a => {
                const total = (a.actualDeparturesCleaned ?? 0) + (a.actualStayoversCleaned ?? 0);
                const cred = total > 0 ? (total * avgCredit).toFixed(1) : '–';
                const hpor = (a.actualOccupiedRooms && a.actualHoursWorked) ? (a.actualHoursWorked / a.actualOccupiedRooms).toFixed(2) : '–';
                const isSelected = a.date === selectedDate;
                return (
                  <tr
                    key={a.id}
                    className="border-t cursor-pointer hover:bg-gray-50"
                    style={{ borderColor: '#D0DDE2', background: isSelected ? '#e8f4fb' : undefined }}
                    onClick={() => setSelectedDate(a.date)}
                  >
                    <td className="px-3 py-1.5 font-medium" style={{ color: '#1A3C4A' }}>{getDayName(a.date)} {a.date}</td>
                    {[a.actualOccupiedRooms, a.actualDepartures, a.actualDeparturesCleaned, a.actualStayoversCleaned, total || null, a.actualDNDs, a.actualRefusedService, a.actualHoursWorked, cred, hpor].map((v, i) => (
                      <td key={i} className="px-3 py-1.5 text-right" style={{ color: '#1A3C4A' }}>{v ?? '–'}</td>
                    ))}
                    <td className="px-3 py-1.5" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => deleteActual(a.id)}
                        className="text-red-400 hover:text-red-600"
                        title="Delete this record"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, hint, children }: { label: string; hint?: number | null; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: '#3A6878' }}>{label}</label>
      <div>
        {children}
      </div>
      {hint != null && <div className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>Plan: {hint}</div>}
    </div>
  );
}

function KPI({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs" style={{ color: '#3A6878' }}>{label}</span>
      <span className="text-sm font-semibold" style={{ color: '#1A3C4A' }}>{value}</span>
    </div>
  );
}
