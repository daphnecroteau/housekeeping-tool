import * as XLSX from 'xlsx';
import { WeeklySchedule, OTBEntry, DailyActual, DNDRecord, Property } from '../types';
import { calculateDay, getAvgCreditPerRoom } from './calculations';
import { getDayName, formatFull } from './dateUtils';

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function scheduleToRows(schedules: WeeklySchedule[], property: Property) {
  const rows: Record<string, unknown>[] = [];
  for (const ws of schedules) {
    for (const day of ws.days) {
      if (!day.occupiedRooms && !day.departures) continue;
      const calc = (day.occupiedRooms && day.departures != null)
        ? calculateDay({
            occupiedRooms: day.occupiedRooms!,
            arrivals: day.arrivals ?? 0,
            departures: day.departures!,
            carriedOverFromYesterday: day.carriedOverFromYesterday,
            carryOverToTomorrow: day.carryOverToTomorrow,
            dndPct: day.dndPct,
            additionalCredits: day.additionalCredits,
            rasScheduled: day.rasScheduled,
            property,
            date: day.date,
          })
        : null;
      rows.push({
        'Week Start': ws.weekStartDate,
        'Date': day.date,
        'Day': getDayName(day.date),
        'Occ Rooms (F)': day.occupiedRooms ?? '',
        'Arrivals (F)': day.arrivals ?? '',
        'Departures (F)': day.departures ?? '',
        'Carried Over From': day.carriedOverFromYesterday,
        'Carry Over To': day.carryOverToTomorrow,
        'DND %': day.dndPct,
        'Add. Credits': day.additionalCredits,
        'Departures to Clean': calc?.departuresToClean?.toFixed(1) ?? '',
        'Stayovers to Clean': calc?.stayoversToClean?.toFixed(1) ?? '',
        'Total Rooms to Clean': calc?.totalRoomsToClean?.toFixed(1) ?? '',
        'Est. Credits': calc?.estimatedCredits?.toFixed(2) ?? '',
        'Total Credits': calc?.totalCreditsToConsider?.toFixed(2) ?? '',
        'RAs Needed': calc?.rasNeeded ?? '',
        'RAs Scheduled': day.rasScheduled ?? '',
        'Variance': calc?.variance ?? '',
        'Pot. Credit Attainment': calc?.potentialCreditAttainment?.toFixed(2) ?? '',
        'Pot. HPOR': calc?.potentialHPOR?.toFixed(2) ?? '',
        'Sched. Credit Attainment': calc?.scheduledCreditAttainment?.toFixed(2) ?? '',
        'Sched. HPOR': calc?.scheduledHPOR?.toFixed(2) ?? '',
        'Notes': day.notes,
      });
    }
  }
  return rows;
}

function otbToRows(entries: OTBEntry[], property: Property, weeklySchedules: WeeklySchedule[]) {
  return entries.map(e => {
    const weekDay = weeklySchedules
      .flatMap(w => w.days)
      .find(d => d.date === e.date);
    const rasFromWeekly = weekDay?.rasScheduled ?? null;
    const rasEff = e.rasScheduledOverride ?? rasFromWeekly;

    const calc = (e.otbOccupiedRooms && e.otbDepartures != null)
      ? calculateDay({
          occupiedRooms: e.otbOccupiedRooms!,
          arrivals: e.otbArrivals ?? 0,
          departures: e.otbDepartures!,
          carriedOverFromYesterday: e.carriedOverFromYesterday,
          carryOverToTomorrow: e.carryOverToTomorrow,
          dndPct: e.dndPct,
          additionalCredits: e.additionalCredits,
          rasScheduled: rasEff,
          property,
          date: e.date,
        })
      : null;

    return {
      'Date': e.date,
      'Day': getDayName(e.date),
      'OTB Occ Rooms': e.otbOccupiedRooms ?? '',
      'OTB Arrivals': e.otbArrivals ?? '',
      'OTB Departures': e.otbDepartures ?? '',
      'Carried Over From': e.carriedOverFromYesterday,
      'Carry Over To': e.carryOverToTomorrow,
      'DND %': e.dndPct,
      'Add. Credits': e.additionalCredits,
      'RAs Needed (OTB)': calc?.rasNeeded ?? '',
      'RAs Scheduled': rasEff ?? '',
      'RAs Override': e.rasScheduledOverride ?? '',
      'Call In / Call Off': calc?.variance != null ? (calc.variance > 0 ? `+${calc.variance}` : `${calc.variance}`) : '',
      'Notes': e.notes,
      'Updated At': e.updatedAt,
    };
  });
}

function actualsToRows(actuals: DailyActual[], property: Property) {
  return actuals.map(a => {
    const totalRoomsCleaned = (a.actualDeparturesCleaned ?? 0) + (a.actualStayoversCleaned ?? 0);
    const avgCredit = getAvgCreditPerRoom(property);
    const creditsAttained = totalRoomsCleaned * avgCredit;
    const hpor = (a.actualOccupiedRooms && a.actualHoursWorked)
      ? a.actualHoursWorked / a.actualOccupiedRooms : null;
    return {
      'Date': a.date,
      'Day': getDayName(a.date),
      'Actual Occ Rooms': a.actualOccupiedRooms ?? '',
      'Actual Arrivals': a.actualArrivals ?? '',
      'Actual Departures': a.actualDepartures ?? '',
      'Dep. Cleaned': a.actualDeparturesCleaned ?? '',
      'Stayovers Cleaned': a.actualStayoversCleaned ?? '',
      'Total Rooms Cleaned': totalRoomsCleaned || '',
      'DNDs': a.actualDNDs ?? '',
      'Refused Service': a.actualRefusedService ?? '',
      'Hours Worked': a.actualHoursWorked ?? '',
      'Credits Attained': creditsAttained ? creditsAttained.toFixed(2) : '',
      'Actual HPOR': hpor ? hpor.toFixed(2) : '',
      'Notes': a.notes,
    };
  });
}

export function exportToExcel(
  schedules: WeeklySchedule[],
  otbEntries: OTBEntry[],
  actuals: DailyActual[],
  dndRecords: DNDRecord[],
  property: Property
) {
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(scheduleToRows(schedules, property)), 'Weekly Forecasts');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(otbToRows(otbEntries, property, schedules)), 'Daily Schedule');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(actualsToRows(actuals, property)), 'Actuals');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dndRecords.map(r => ({
    Date: r.date, Day: getDayName(r.date), 'Occ Rooms': r.occupiedRooms ?? '', Arrivals: r.arrivals ?? '',
    Departures: r.departures ?? '', DNDs: r.dnds ?? '', 'Refused Service': r.refusedService ?? '',
    'DND+RS %': (r.occupiedRooms && (r.dnds || r.refusedService))
      ? (((r.dnds ?? 0) + (r.refusedService ?? 0)) / (r.occupiedRooms - (r.arrivals ?? 0)) * 100).toFixed(1) + '%' : '',
  }))), 'DND History');

  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  downloadBlob(new Blob([buf], { type: 'application/octet-stream' }), `${property.name} - Housekeeping Data.xlsx`);
}

export function exportCSV(rows: Record<string, unknown>[], filename: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(','), ...rows.map(r => headers.map(h => {
    const v = String(r[h] ?? '');
    return v.includes(',') || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v;
  }).join(','))].join('\n');
  downloadBlob(new Blob([csv], { type: 'text/csv' }), filename);
}
