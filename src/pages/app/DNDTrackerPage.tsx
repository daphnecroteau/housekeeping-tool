import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { DNDRecord } from '../../types';
import { today, getDayName, getDayNameFull, formatDisplay } from '../../utils/dateUtils';
import { Plus, Trash2, TrendingUp, Pencil, X, ClipboardPaste } from 'lucide-react';
import PasteImportModal, { ColDef } from '../../components/PasteImportModal';

const DND_COLS: ColDef[] = [
  { key: 'date', label: 'Date', type: 'date', required: true },
  { key: 'occupiedRooms', label: 'Occ Rooms', type: 'int' },
  { key: 'arrivals', label: 'Arrivals', type: 'int' },
  { key: 'departures', label: 'Departures', type: 'int' },
  { key: 'dnds', label: 'DNDs', type: 'int' },
  { key: 'refusedService', label: 'Refused Service', type: 'int' },
];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getDayOfWeek(dateStr: string): number {
  return new Date(dateStr + 'T00:00:00').getDay();
}

export default function DNDTrackerPage() {
  const { currentProperty, currentPropertyId, dndRecords, saveDNDRecord, deleteDNDRecord, mode } = useData();
  const [date, setDate] = useState(today());
  const [occ, setOcc] = useState('');
  const [arr, setArr] = useState('');
  const [dep, setDep] = useState('');
  const [dnds, setDnds] = useState('');
  const [rs, setRs] = useState('');
  const [saved, setSaved] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);

  if (!currentProperty || !currentPropertyId) return <div className="p-6 text-sm" style={{ color: '#3A6878' }}>No property selected.</div>;

  const resetForm = () => {
    setDate(today()); setOcc(''); setArr(''); setDep(''); setDnds(''); setRs('');
    setEditingId(null);
  };

  const handleEdit = (r: DNDRecord) => {
    setEditingId(r.id);
    setDate(r.date);
    setOcc(r.occupiedRooms != null ? String(r.occupiedRooms) : '');
    setArr(r.arrivals != null ? String(r.arrivals) : '');
    setDep(r.departures != null ? String(r.departures) : '');
    setDnds(r.dnds != null ? String(r.dnds) : '');
    setRs(r.refusedService != null ? String(r.refusedService) : '');
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const record: DNDRecord = {
      id: editingId ?? crypto.randomUUID(),
      propertyId: currentPropertyId,
      date,
      occupiedRooms: occ ? parseInt(occ) : null,
      arrivals: arr ? parseInt(arr) : null,
      departures: dep ? parseInt(dep) : null,
      dnds: dnds ? parseInt(dnds) : null,
      refusedService: rs ? parseInt(rs) : null,
      createdAt: new Date().toISOString(),
    };
    saveDNDRecord(record);
    setSaved(true);
    resetForm();
    setTimeout(() => setSaved(false), 2000);
  };

  const handleImport = (rows: Record<string, string | number | null>[]) => {
    for (const row of rows) {
      const date = row.date as string;
      if (!date) continue;
      const record: DNDRecord = {
        id: crypto.randomUUID(),
        propertyId: currentPropertyId,
        date,
        occupiedRooms: row.occupiedRooms as number | null,
        arrivals: row.arrivals as number | null,
        departures: row.departures as number | null,
        dnds: row.dnds as number | null,
        refusedService: row.refusedService as number | null,
        createdAt: new Date().toISOString(),
      };
      saveDNDRecord(record);
    }
  };

  // Analytics by day of week
  const byDow: Record<number, { dndPcts: number[]; rsPcts: number[]; combined: number[] }> = {};
  for (let i = 0; i < 7; i++) byDow[i] = { dndPcts: [], rsPcts: [], combined: [] };

  for (const r of dndRecords) {
    const stayovers = (r.occupiedRooms ?? 0) - (r.arrivals ?? 0);
    if (stayovers <= 0) continue;
    const dow = getDayOfWeek(r.date);
    if (r.dnds != null) byDow[dow].dndPcts.push(r.dnds / stayovers * 100);
    if (r.refusedService != null) byDow[dow].rsPcts.push(r.refusedService / stayovers * 100);
    if (r.dnds != null && r.refusedService != null)
      byDow[dow].combined.push((r.dnds + r.refusedService) / stayovers * 100);
  }

  const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((s, v) => s + v, 0) / arr.length : null;

  const sortedRecords = [...dndRecords].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-5">
      {showImport && (
        <PasteImportModal
          title="DND & Refused Service"
          columns={DND_COLS}
          onImport={handleImport}
          onClose={() => setShowImport(false)}
        />
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold" style={{ color: '#1A3C4A' }}>DND & Refused Service Tracker</h1>
          <p className="text-sm mt-0.5" style={{ color: '#3A6878' }}>
            Track historical DND and RS data to build better forecasts for your weekly schedule.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowImport(true)} className="btn-ghost flex items-center gap-1 text-sm">
            <ClipboardPaste size={14} /> Import
          </button>
          <button onClick={resetForm} className="btn-primary flex items-center gap-1 text-sm">
            <Plus size={14} /> Add Record
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Add Record Form */}
        <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-sm flex items-center gap-2" style={{ color: '#1A3C4A' }}>
                {editingId ? <><Pencil size={14} /> Edit Record</> : <><Plus size={14} /> Add Daily Record</>}
              </h2>
              {editingId && (
                <button type="button" onClick={resetForm} className="text-xs flex items-center gap-1" style={{ color: '#3A6878' }}>
                  <X size={12} /> Cancel
                </button>
              )}
            </div>
            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#3A6878' }}>Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" style={{ borderColor: '#D0DDE2' }} required />
              </div>
              {[
                ['Occupied Rooms', occ, setOcc],
                ['Arrivals', arr, setArr],
                ['Departures', dep, setDep],
                ['DND Rooms', dnds, setDnds],
                ['Refused Service Rooms', rs, setRs],
              ].map(([label, value, setter]) => (
                <div key={String(label)}>
                  <label className="block text-xs font-medium mb-1" style={{ color: '#3A6878' }}>{label as string}</label>
                  <input
                    type="number" min="0"
                    value={value as string}
                    onChange={e => (setter as React.Dispatch<React.SetStateAction<string>>)(e.target.value)}
                    className="w-full border rounded px-3 py-2 text-sm text-right"
                    style={{ background: '#e8f4fb', borderColor: '#D0DDE2' }}
                  />
                </div>
              ))}
              <button type="submit" className={`w-full btn-primary ${saved ? 'opacity-70' : ''}`}>
                {saved ? (editingId ? 'Updated!' : 'Record Added!') : (editingId ? 'Update Record' : 'Add Record')}
              </button>
            </form>
          </div>

        {/* Day of Week Averages */}
        <div className="card p-5">
          <h2 className="font-semibold text-sm mb-4 flex items-center gap-2" style={{ color: '#1A3C4A' }}>
            <TrendingUp size={14} style={{ color: '#C86848' }} /> Historical Avg. DND+RS % by Day
          </h2>
          <p className="text-xs mb-3" style={{ color: '#3A6878' }}>Use these averages as input for your weekly DND % forecast.</p>
          <div className="space-y-2">
            {DAY_NAMES.map((name, dow) => {
              const combined = avg(byDow[dow].combined);
              const n = byDow[dow].combined.length;
              return (
                <div key={dow} className="flex items-center gap-3">
                  <div className="text-xs font-medium w-20" style={{ color: '#3A6878' }}>{name.slice(0, 3)}</div>
                  <div className="flex-1 relative h-4 rounded overflow-hidden" style={{ background: '#F5F7F8' }}>
                    {combined != null && (
                      <div
                        className="absolute inset-y-0 left-0 rounded"
                        style={{ background: '#2E6E82', width: `${Math.min(combined * 3, 100)}%` }}
                      />
                    )}
                  </div>
                  <div className="text-xs font-bold w-12 text-right" style={{ color: '#1A3C4A' }}>
                    {combined != null ? combined.toFixed(1) + '%' : '–'}
                  </div>
                  <div className="text-xs w-12" style={{ color: '#9ca3af' }}>
                    {n > 0 ? `n=${n}` : ''}
                  </div>
                </div>
              );
            })}
          </div>
          {dndRecords.length > 0 && (
            <div className="mt-4 pt-4 border-t text-xs" style={{ borderColor: '#D0DDE2', color: '#3A6878' }}>
              Based on {dndRecords.length} records.
              {dndRecords.length < 14 && ' Add more records for reliable averages.'}
            </div>
          )}
        </div>

        {/* Individual day breakdown for current averages */}
        <div className="card p-5">
          <h2 className="font-semibold text-sm mb-4" style={{ color: '#1A3C4A' }}>Avg. Breakdown</h2>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: '#F5F7F8' }}>
                <th className="text-left px-2 py-1.5 font-semibold" style={{ color: '#3A6878' }}>Day</th>
                <th className="text-right px-2 py-1.5 font-semibold" style={{ color: '#3A6878' }}>DND %</th>
                <th className="text-right px-2 py-1.5 font-semibold" style={{ color: '#3A6878' }}>RS %</th>
                <th className="text-right px-2 py-1.5 font-semibold" style={{ color: '#3A6878' }}>Total %</th>
              </tr>
            </thead>
            <tbody>
              {DAY_NAMES.map((name, dow) => {
                const d = avg(byDow[dow].dndPcts);
                const r = avg(byDow[dow].rsPcts);
                const c = avg(byDow[dow].combined);
                return (
                  <tr key={dow} className="border-t" style={{ borderColor: '#D0DDE2' }}>
                    <td className="px-2 py-1.5 font-medium" style={{ color: '#1A3C4A' }}>{name.slice(0, 3)}</td>
                    <td className="px-2 py-1.5 text-right" style={{ color: '#1A3C4A' }}>{d != null ? d.toFixed(1) + '%' : '–'}</td>
                    <td className="px-2 py-1.5 text-right" style={{ color: '#1A3C4A' }}>{r != null ? r.toFixed(1) + '%' : '–'}</td>
                    <td className="px-2 py-1.5 text-right font-semibold" style={{ color: c != null ? '#2E6E82' : '#9ca3af' }}>
                      {c != null ? c.toFixed(1) + '%' : '–'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Records Table */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: '#D0DDE2' }}>
          <span className="font-semibold text-sm" style={{ color: '#1A3C4A' }}>All Records ({dndRecords.length})</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: '#F5F7F8' }}>
                {['Date', 'Day', 'Occ.', 'Arrivals', 'Departures', 'Stayovers', 'DNDs', 'Refused Svc', 'DND %', 'RS %', 'Combined %', ''].map(h => (
                  <th key={h} className="px-3 py-2 text-right first:text-left font-semibold" style={{ color: '#3A6878' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedRecords.length === 0 && (
                <tr><td colSpan={12} className="px-3 py-6 text-center" style={{ color: '#9ca3af' }}>
                  No DND records yet. Use the form to add your first record.
                </td></tr>
              )}
              {sortedRecords.map(r => {
                const sto = (r.occupiedRooms ?? 0) - (r.arrivals ?? 0);
                const dndPct = sto > 0 && r.dnds != null ? (r.dnds / sto * 100).toFixed(1) + '%' : '–';
                const rsPct = sto > 0 && r.refusedService != null ? (r.refusedService / sto * 100).toFixed(1) + '%' : '–';
                const combined = sto > 0 && r.dnds != null && r.refusedService != null
                  ? ((r.dnds + r.refusedService) / sto * 100).toFixed(1) + '%' : '–';
                return (
                  <tr key={r.id} className="border-t hover:bg-gray-50" style={{ borderColor: '#D0DDE2' }}>
                    <td className="px-3 py-1.5 font-medium" style={{ color: '#1A3C4A' }}>{r.date}</td>
                    <td className="px-3 py-1.5 text-right" style={{ color: '#3A6878' }}>{getDayName(r.date)}</td>
                    <td className="px-3 py-1.5 text-right" style={{ color: '#1A3C4A' }}>{r.occupiedRooms ?? '–'}</td>
                    <td className="px-3 py-1.5 text-right" style={{ color: '#1A3C4A' }}>{r.arrivals ?? '–'}</td>
                    <td className="px-3 py-1.5 text-right" style={{ color: '#1A3C4A' }}>{r.departures ?? '–'}</td>
                    <td className="px-3 py-1.5 text-right" style={{ color: '#1A3C4A' }}>{sto > 0 ? sto : '–'}</td>
                    <td className="px-3 py-1.5 text-right" style={{ color: '#1A3C4A' }}>{r.dnds ?? '–'}</td>
                    <td className="px-3 py-1.5 text-right" style={{ color: '#1A3C4A' }}>{r.refusedService ?? '–'}</td>
                    <td className="px-3 py-1.5 text-right" style={{ color: '#2E6E82', fontWeight: 500 }}>{dndPct}</td>
                    <td className="px-3 py-1.5 text-right" style={{ color: '#2E6E82', fontWeight: 500 }}>{rsPct}</td>
                    <td className="px-3 py-1.5 text-right" style={{ color: '#1A3C4A', fontWeight: 600 }}>{combined}</td>
                    <td className="px-3 py-1.5">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEdit(r)} className="hover:opacity-70" style={{ color: '#3A6878' }} title="Edit">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => deleteDNDRecord(r.id)} className="text-red-400 hover:text-red-600" title="Delete">
                          <Trash2 size={13} />
                        </button>
                      </div>
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
