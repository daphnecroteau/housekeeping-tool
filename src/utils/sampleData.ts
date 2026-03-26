import { Property, WeeklySchedule, OTBEntry, DailyActual, DNDRecord } from '../types';
import { getWeekStart, addDaysStr } from './dateUtils';
import { format, addDays, subDays } from 'date-fns';

const DEMO_USER_ID = 'demo-user';
const DEMO_PROPERTY_ID = 'demo-property-grand';

export const DEMO_PROPERTY: Property = {
  id: DEMO_PROPERTY_ID,
  userId: DEMO_USER_ID,
  name: 'Grand Example Hotel',
  numRooms: 255,
  shiftHours: 8,
  roomTypes: [
    { id: 'rt1', name: 'Standard', numRooms: 220, credits: 1 },
    { id: 'rt2', name: 'Deluxe', numRooms: 30, credits: 1.5 },
    { id: 'rt3', name: 'Suite', numRooms: 5, credits: 2 },
  ],
  contractRules: [
    { id: 'rule1', ruleNumber: 1, minDepartures: null, maxCredits: 13, description: 'Maximum of 13 credits at all times' },
    { id: 'rule2', ruleNumber: 2, minDepartures: 8, maxCredits: 12, description: 'If 8+ departures/RA, max 12 credits' },
    { id: 'rule3', ruleNumber: 3, minDepartures: 9, maxCredits: 11, description: 'If 9+ departures/RA, max 11 credits' },
    { id: 'rule4', ruleNumber: 4, minDepartures: 10, maxCredits: 10, description: 'If 10+ departures/RA, max 10 credits' },
  ],
  createdAt: '2026-01-01T00:00:00Z',
};

function mondayOf(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return format(d, 'yyyy-MM-dd');
}

const todayStr = format(new Date(), 'yyyy-MM-dd');
const currentWeekStart = mondayOf(todayStr);
const prevWeekStart = format(subDays(new Date(currentWeekStart + 'T00:00:00'), 7), 'yyyy-MM-dd');

function makeDay(date: string, occ: number, arr: number, dep: number, coFrom: number, coTo: number, dnd: number, addCr: number, ras: number): WeeklySchedule['days'][0] {
  return { date, occupiedRooms: occ, arrivals: arr, departures: dep, carriedOverFromYesterday: coFrom, carryOverToTomorrow: coTo, dndPct: dnd, additionalCredits: addCr, rasScheduled: ras, notes: '' };
}

export const DEMO_WEEKLY_CURRENT: WeeklySchedule = {
  id: 'ws-current',
  propertyId: DEMO_PROPERTY_ID,
  weekStartDate: currentWeekStart,
  days: [
    makeDay(currentWeekStart,           95,  50,  20, 10, 0,  0.22, 3, 15),
    makeDay(addDaysStr(currentWeekStart,1), 125,  75,  48,  0, 5,  0.23, 3, 16),
    makeDay(addDaysStr(currentWeekStart,2), 152,  55,  42,  5, 0,  0.24, 2, 16),
    makeDay(addDaysStr(currentWeekStart,3), 165,  65,  41,  0,10,  0.24, 1, 16),
    makeDay(addDaysStr(currentWeekStart,4), 189, 115,  56, 10, 0,  0.21, 0, 16),
    makeDay(addDaysStr(currentWeekStart,5), 248,  90,  94,  0, 0,  0.12, 4, 20),
    makeDay(addDaysStr(currentWeekStart,6), 110,  85, 100,  0,20,  0.15, 1, 23),
  ],
  createdAt: new Date(currentWeekStart + 'T08:00:00Z').toISOString(),
  updatedAt: new Date(currentWeekStart + 'T08:00:00Z').toISOString(),
};

export const DEMO_WEEKLY_PREV: WeeklySchedule = {
  id: 'ws-prev',
  propertyId: DEMO_PROPERTY_ID,
  weekStartDate: prevWeekStart,
  days: [
    makeDay(prevWeekStart,              88,  42,  18,  5, 0,  0.20, 2, 14),
    makeDay(addDaysStr(prevWeekStart,1),118,  70,  44,  0, 0,  0.21, 3, 15),
    makeDay(addDaysStr(prevWeekStart,2),144,  60,  40,  0, 8,  0.23, 2, 15),
    makeDay(addDaysStr(prevWeekStart,3),158,  58,  38,  8, 0,  0.22, 1, 15),
    makeDay(addDaysStr(prevWeekStart,4),175, 105,  52,  0, 0,  0.20, 0, 15),
    makeDay(addDaysStr(prevWeekStart,5),240,  88,  90,  0, 0,  0.11, 4, 19),
    makeDay(addDaysStr(prevWeekStart,6),105,  80,  95,  0,15,  0.14, 1, 21),
  ],
  createdAt: new Date(prevWeekStart + 'T08:00:00Z').toISOString(),
  updatedAt: new Date(prevWeekStart + 'T08:00:00Z').toISOString(),
};

// OTB entries for next 3 days (from today)
// Day+1: high departures → rule 3 triggers (avg dep/RA ≥ 9 after rule 2)
// Day+2: extreme checkout day → rule 4 triggers (avg dep/RA ≥ 10 after rule 3)
// Day+3: normal occupancy day → rule 1 only
export function buildDemoOTBEntries(): OTBEntry[] {
  const configs = [
    { occ: 150, arr: 126, dep: 100, coFrom: 0, coTo: 0, dnd: 0.15, addCr: 0 },
    { occ: 120, arr: 118, dep: 120, coFrom: 0, coTo: 0, dnd: 0.15, addCr: 0 },
    { occ: 175, arr: 70,  dep: 60,  coFrom: 0, coTo: 0, dnd: 0.15, addCr: 2 },
  ];
  return configs.map((cfg, i) => {
    const date = addDaysStr(todayStr, i + 1);
    return {
      id: `otb-${date}`,
      propertyId: DEMO_PROPERTY_ID,
      date,
      otbOccupiedRooms: cfg.occ,
      otbArrivals: cfg.arr,
      otbDepartures: cfg.dep,
      carriedOverFromYesterday: cfg.coFrom,
      carryOverToTomorrow: cfg.coTo,
      dndPct: cfg.dnd,
      additionalCredits: cfg.addCr,
      rasScheduledOverride: null,
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });
}

// Actuals for previous 4 days
export function buildDemoActuals(): DailyActual[] {
  const actuals = [
    { occ: 98, arr: 52, dep: 19, depCl: 29, stoCl: 31, dnds: 8, rs: 3, hrs: 120 },
    { occ: 127, arr: 78, dep: 45, depCl: 46, stoCl: 39, dnds: 11, rs: 4, hrs: 136 },
    { occ: 155, arr: 58, dep: 40, depCl: 45, stoCl: 70, dnds: 23, rs: 5, hrs: 136 },
    { occ: 162, arr: 62, dep: 39, depCl: 49, stoCl: 76, dnds: 24, rs: 3, hrs: 136 },
  ];
  return actuals.map((a, i) => ({
    id: `actual-${i}`,
    propertyId: DEMO_PROPERTY_ID,
    date: addDaysStr(todayStr, -(4 - i)),
    actualOccupiedRooms: a.occ,
    actualArrivals: a.arr,
    actualDepartures: a.dep,
    actualDeparturesCleaned: a.depCl,
    actualStayoversCleaned: a.stoCl,
    actualDNDs: a.dnds,
    actualRefusedService: a.rs,
    actualHoursWorked: a.hrs,
    notes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}

export function buildDemoDNDRecords(): DNDRecord[] {
  const records = [];
  for (let i = 30; i >= 1; i--) {
    const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
    const occ = Math.round(80 + Math.random() * 160);
    const arr = Math.round(occ * 0.4);
    const dep = Math.round(occ * 0.35);
    const sto = occ - arr;
    const dnds = Math.round(sto * (0.1 + Math.random() * 0.15));
    const rs = Math.round(sto * Math.random() * 0.08);
    records.push({ id: `dnd-${i}`, propertyId: DEMO_PROPERTY_ID, date, occupiedRooms: occ, arrivals: arr, departures: dep, dnds, refusedService: rs, createdAt: new Date().toISOString() });
  }
  return records;
}
