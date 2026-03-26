import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { getAvgCreditPerRoom } from '../../utils/calculations';
import { getDayName } from '../../utils/dateUtils';
import { exportToExcel, exportCSV } from '../../utils/export';
import { Download, FileSpreadsheet, FileText, Filter } from 'lucide-react';

type Tab = 'forecast' | 'otb' | 'actuals' | 'dnd';

export default function DatabasePage() {
  const { currentProperty, weeklySchedules, otbEntries, actuals, dndRecords, mode } = useData();
  const [tab, setTab] = useState<Tab>('forecast');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  if (!currentProperty) return <div className="p-6 text-sm" style={{ color: '#3A6878' }}>No property selected.</div>;

  const avgCredit = getAvgCreditPerRoom(currentProperty);

  const handleExcelExport = () => {
    exportToExcel(weeklySchedules, otbEntries, actuals, dndRecords, currentProperty);
  };

  const filterDate = (date: string) => {
    if (fromDate && date < fromDate) return false;
    if (toDate && date > toDate) return false;
    return true;
  };

  // Flatten weekly schedule days
  const forecastRows = weeklySchedules
    .flatMap(ws => ws.days.map(d => ({ ...d, weekStart: ws.weekStartDate })))
    .filter(r => filterDate(r.date))
    .sort((a, b) => b.date.localeCompare(a.date));

  const otbRows = otbEntries.filter(e => filterDate(e.date)).sort((a, b) => b.date.localeCompare(a.date));
  const actualRows = actuals.filter(a => filterDate(a.date));
  const dndRows = dndRecords.filter(r => filterDate(r.date));

  const handleCSVExport = () => {
    if (tab === 'forecast') {
      exportCSV(forecastRows.map(r => ({
        'Week Start': r.weekStart, 'Date': r.date, 'Day': getDayName(r.date),
        'Occ Rooms': r.occupiedRooms ?? '', 'Arrivals': r.arrivals ?? '', 'Departures': r.departures ?? '',
        'Carried Over From': r.carriedOverFromYesterday, 'Carry Over To': r.carryOverToTomorrow,
        'DND %': r.dndPct, 'Add. Credits': r.additionalCredits, 'RAs Scheduled': r.rasScheduled ?? '',
      })), `${currentProperty.name} - Forecasts.csv`);
    } else if (tab === 'otb') {
      exportCSV(otbRows.map(r => ({
        'Date': r.date, 'Day': getDayName(r.date),
        'OTB Occ': r.otbOccupiedRooms ?? '', 'OTB Arrivals': r.otbArrivals ?? '', 'OTB Departures': r.otbDepartures ?? '',
        'Carry Over From': r.carriedOverFromYesterday, 'Carry Over To': r.carryOverToTomorrow,
        'DND %': r.dndPct, 'RAs Override': r.rasScheduledOverride ?? '',
      })), `${currentProperty.name} - Daily Schedule.csv`);
    } else if (tab === 'actuals') {
      exportCSV(actualRows.map(a => {
        const total = (a.actualDeparturesCleaned ?? 0) + (a.actualStayoversCleaned ?? 0);
        return {
          'Date': a.date, 'Day': getDayName(a.date),
          'Occ': a.actualOccupiedRooms ?? '', 'Arrivals': a.actualArrivals ?? '', 'Departures': a.actualDepartures ?? '',
          'Dep Cleaned': a.actualDeparturesCleaned ?? '', 'Sto Cleaned': a.actualStayoversCleaned ?? '',
          'Total Cleaned': total || '', 'DNDs': a.actualDNDs ?? '', 'RS': a.actualRefusedService ?? '',
          'Hours': a.actualHoursWorked ?? '', 'Notes': a.notes,
        };
      }), `${currentProperty.name} - Actuals.csv`);
    } else {
      exportCSV(dndRows.map(r => ({
        'Date': r.date, 'Day': getDayName(r.date),
        'Occ': r.occupiedRooms ?? '', 'Arrivals': r.arrivals ?? '', 'Departures': r.departures ?? '',
        'DNDs': r.dnds ?? '', 'RS': r.refusedService ?? '',
      })), `${currentProperty.name} - DND History.csv`);
    }
  };

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'forecast', label: 'Weekly Forecasts', count: forecastRows.length },
    { id: 'otb', label: 'Daily Entries', count: otbRows.length },
    { id: 'actuals', label: 'Actuals', count: actualRows.length },
    { id: 'dnd', label: 'DND History', count: dndRows.length },
  ];

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold" style={{ color: '#1A3C4A' }}>Database & Export</h1>
          <p className="text-xs mt-0.5" style={{ color: '#3A6878' }}>{currentProperty.name}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleCSVExport} className="btn-ghost flex items-center gap-2 text-sm">
            <FileText size={14} /> CSV
          </button>
          <button onClick={handleExcelExport} className="btn-secondary flex items-center gap-2 text-sm">
            <FileSpreadsheet size={14} /> Export All to Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap items-center gap-4">
        <Filter size={14} style={{ color: '#3A6878' }} />
        <div className="flex items-center gap-2 text-sm">
          <label style={{ color: '#3A6878' }}>From:</label>
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="border rounded px-2 py-1 text-sm" style={{ borderColor: '#D0DDE2' }} />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <label style={{ color: '#3A6878' }}>To:</label>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="border rounded px-2 py-1 text-sm" style={{ borderColor: '#D0DDE2' }} />
        </div>
        {(fromDate || toDate) && (
          <button className="text-xs" style={{ color: '#C86848' }} onClick={() => { setFromDate(''); setToDate(''); }}>
            Clear filter
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b" style={{ borderColor: '#D0DDE2' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t.id ? 'border-b-2' : 'border-transparent hover:border-gray-300'}`}
            style={tab === t.id ? { color: '#2E6E82', borderColor: '#2E6E82' } : { color: '#3A6878' }}
          >
            {t.label}
            <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full" style={{ background: '#D0DDE2', color: '#3A6878' }}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Table content */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          {tab === 'forecast' && <ForecastTable rows={forecastRows} />}
          {tab === 'otb' && <OTBTable rows={otbRows} />}
          {tab === 'actuals' && <ActualsTable rows={actualRows} avgCredit={avgCredit} />}
          {tab === 'dnd' && <DNDTable rows={dndRows} />}
        </div>
      </div>
    </div>
  );
}

function TH({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2 text-right text-xs font-semibold first:text-left whitespace-nowrap" style={{ color: '#3A6878', background: '#F5F7F8' }}>{children}</th>;
}
function TD({ children, left = false }: { children: React.ReactNode; left?: boolean }) {
  return <td className={`px-3 py-1.5 text-xs ${left ? 'text-left' : 'text-right'}`} style={{ color: '#1A3C4A' }}>{children}</td>;
}
function Empty({ cols, msg }: { cols: number; msg?: string }) {
  return <tr><td colSpan={cols} className="px-3 py-6 text-center text-xs" style={{ color: '#9ca3af' }}>{msg ?? 'No records found.'}</td></tr>;
}

function ForecastTable({ rows }: { rows: any[] }) {
  return (
    <table className="w-full">
      <thead><tr>
        {['Week Start', 'Date', 'Day', 'Occ', 'Arrivals', 'Departures', 'CO From', 'CO To', 'DND %', 'Add. Cr.', 'RAs Sched.'].map(h => <TH key={h}>{h}</TH>)}
      </tr></thead>
      <tbody>
        {rows.length === 0 ? <Empty cols={11} msg="No weekly schedules yet." /> : rows.map((r, i) => (
          <tr key={i} className="border-t hover:bg-gray-50" style={{ borderColor: '#D0DDE2' }}>
            <TD left>{r.weekStart}</TD>
            <TD left>{r.date}</TD>
            <TD>{getDayName(r.date)}</TD>
            <TD>{r.occupiedRooms ?? '–'}</TD>
            <TD>{r.arrivals ?? '–'}</TD>
            <TD>{r.departures ?? '–'}</TD>
            <TD>{r.carriedOverFromYesterday}</TD>
            <TD>{r.carryOverToTomorrow}</TD>
            <TD>{(r.dndPct * 100).toFixed(1)}%</TD>
            <TD>{r.additionalCredits}</TD>
            <TD>{r.rasScheduled ?? '–'}</TD>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function OTBTable({ rows }: { rows: any[] }) {
  return (
    <table className="w-full">
      <thead><tr>
        {['Date', 'Day', 'OTB Occ', 'OTB Arr', 'OTB Dep', 'CO From', 'CO To', 'DND %', 'RAs Override', 'Updated'].map(h => <TH key={h}>{h}</TH>)}
      </tr></thead>
      <tbody>
        {rows.length === 0 ? <Empty cols={10} msg="No daily entries yet." /> : rows.map(r => (
          <tr key={r.id} className="border-t hover:bg-gray-50" style={{ borderColor: '#D0DDE2' }}>
            <TD left>{r.date}</TD>
            <TD>{getDayName(r.date)}</TD>
            <TD>{r.otbOccupiedRooms ?? '–'}</TD>
            <TD>{r.otbArrivals ?? '–'}</TD>
            <TD>{r.otbDepartures ?? '–'}</TD>
            <TD>{r.carriedOverFromYesterday}</TD>
            <TD>{r.carryOverToTomorrow}</TD>
            <TD>{(r.dndPct * 100).toFixed(1)}%</TD>
            <TD>{r.rasScheduledOverride ?? '–'}</TD>
            <TD>{r.updatedAt.split('T')[0]}</TD>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ActualsTable({ rows, avgCredit }: { rows: any[]; avgCredit: number }) {
  return (
    <table className="w-full">
      <thead><tr>
        {['Date', 'Day', 'Occ', 'Arrivals', 'Dep', 'Dep Cl.', 'Sto Cl.', 'Total Cl.', 'DNDs', 'RS', 'Hours', 'Credits Att.', 'HPOR'].map(h => <TH key={h}>{h}</TH>)}
      </tr></thead>
      <tbody>
        {rows.length === 0 ? <Empty cols={13} msg="No actuals recorded yet." /> : rows.map(a => {
          const total = (a.actualDeparturesCleaned ?? 0) + (a.actualStayoversCleaned ?? 0);
          const cred = total > 0 ? (total * avgCredit).toFixed(1) : '–';
          const hpor = (a.actualOccupiedRooms && a.actualHoursWorked) ? (a.actualHoursWorked / a.actualOccupiedRooms).toFixed(2) : '–';
          return (
            <tr key={a.id} className="border-t hover:bg-gray-50" style={{ borderColor: '#D0DDE2' }}>
              <TD left>{a.date}</TD>
              <TD>{getDayName(a.date)}</TD>
              <TD>{a.actualOccupiedRooms ?? '–'}</TD>
              <TD>{a.actualArrivals ?? '–'}</TD>
              <TD>{a.actualDepartures ?? '–'}</TD>
              <TD>{a.actualDeparturesCleaned ?? '–'}</TD>
              <TD>{a.actualStayoversCleaned ?? '–'}</TD>
              <TD>{total || '–'}</TD>
              <TD>{a.actualDNDs ?? '–'}</TD>
              <TD>{a.actualRefusedService ?? '–'}</TD>
              <TD>{a.actualHoursWorked ?? '–'}</TD>
              <TD>{cred}</TD>
              <TD>{hpor}</TD>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function DNDTable({ rows }: { rows: any[] }) {
  return (
    <table className="w-full">
      <thead><tr>
        {['Date', 'Day', 'Occ Rooms', 'Arrivals', 'Departures', 'Stayovers', 'DNDs', 'Refused Svc', 'DND %', 'RS %', 'Combined %'].map(h => <TH key={h}>{h}</TH>)}
      </tr></thead>
      <tbody>
        {rows.length === 0 ? <Empty cols={11} msg="No DND records yet." /> : rows.map(r => {
          const sto = (r.occupiedRooms ?? 0) - (r.arrivals ?? 0);
          return (
            <tr key={r.id} className="border-t hover:bg-gray-50" style={{ borderColor: '#D0DDE2' }}>
              <TD left>{r.date}</TD>
              <TD>{getDayName(r.date)}</TD>
              <TD>{r.occupiedRooms ?? '–'}</TD>
              <TD>{r.arrivals ?? '–'}</TD>
              <TD>{r.departures ?? '–'}</TD>
              <TD>{sto > 0 ? sto : '–'}</TD>
              <TD>{r.dnds ?? '–'}</TD>
              <TD>{r.refusedService ?? '–'}</TD>
              <TD>{sto > 0 && r.dnds != null ? (r.dnds / sto * 100).toFixed(1) + '%' : '–'}</TD>
              <TD>{sto > 0 && r.refusedService != null ? (r.refusedService / sto * 100).toFixed(1) + '%' : '–'}</TD>
              <TD>{sto > 0 && r.dnds != null && r.refusedService != null ? ((r.dnds + r.refusedService) / sto * 100).toFixed(1) + '%' : '–'}</TD>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
