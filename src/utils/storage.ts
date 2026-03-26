import {
  User, Property, WeeklySchedule, OTBEntry, DailyActual, DNDRecord,
} from '../types';

const KEYS = {
  users: 'hk_users',
  currentUser: 'hk_current_user',
  properties: 'hk_properties',
  weekly: 'hk_weekly_schedules',
  otb: 'hk_otb_entries',
  actuals: 'hk_actuals',
  dnd: 'hk_dnd_records',
};

function get<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}
function set<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}
function upsert<T extends { id: string }>(key: string, item: T) {
  const list = get<T>(key);
  const idx = list.findIndex(x => x.id === item.id);
  if (idx >= 0) list[idx] = item; else list.push(item);
  set(key, list);
}
function remove(key: string, id: string) {
  set(key, get<{ id: string }>(key).filter(x => x.id !== id));
}

// AUTH
export function getUsers(): User[] { return get<User>(KEYS.users); }
export function saveUser(u: User) { upsert(KEYS.users, u); }
export function getUserById(id: string): User | undefined {
  return getUsers().find(u => u.id === id);
}
export function getUserByEmail(email: string): User | undefined {
  return getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
}
export function getCurrentUserId(): string | null {
  return localStorage.getItem(KEYS.currentUser);
}
export function setCurrentUserId(id: string | null) {
  if (id) localStorage.setItem(KEYS.currentUser, id);
  else localStorage.removeItem(KEYS.currentUser);
}

// PROPERTIES
export function getProperties(userId: string): Property[] {
  return get<Property>(KEYS.properties).filter(p => p.userId === userId);
}
export function saveProperty(p: Property) { upsert(KEYS.properties, p); }
export function deleteProperty(id: string) {
  remove(KEYS.properties, id);
  // Cascade delete
  set(KEYS.weekly, get<WeeklySchedule>(KEYS.weekly).filter(x => x.propertyId !== id));
  set(KEYS.otb, get<OTBEntry>(KEYS.otb).filter(x => x.propertyId !== id));
  set(KEYS.actuals, get<DailyActual>(KEYS.actuals).filter(x => x.propertyId !== id));
  set(KEYS.dnd, get<DNDRecord>(KEYS.dnd).filter(x => x.propertyId !== id));
}

// WEEKLY SCHEDULES
export function getWeeklySchedules(propertyId: string): WeeklySchedule[] {
  return get<WeeklySchedule>(KEYS.weekly).filter(w => w.propertyId === propertyId);
}
export function getWeeklyScheduleByWeek(propertyId: string, weekStart: string): WeeklySchedule | undefined {
  return get<WeeklySchedule>(KEYS.weekly).find(
    w => w.propertyId === propertyId && w.weekStartDate === weekStart
  );
}
export function saveWeeklySchedule(w: WeeklySchedule) { upsert(KEYS.weekly, w); }

// OTB ENTRIES
export function getOTBEntries(propertyId: string): OTBEntry[] {
  return get<OTBEntry>(KEYS.otb).filter(e => e.propertyId === propertyId);
}
export function getOTBEntry(propertyId: string, date: string): OTBEntry | undefined {
  return get<OTBEntry>(KEYS.otb).find(e => e.propertyId === propertyId && e.date === date);
}
export function saveOTBEntry(e: OTBEntry) { upsert(KEYS.otb, e); }

// ACTUALS
export function getActuals(propertyId: string): DailyActual[] {
  return get<DailyActual>(KEYS.actuals)
    .filter(a => a.propertyId === propertyId)
    .sort((a, b) => b.date.localeCompare(a.date));
}
export function getActualByDate(propertyId: string, date: string): DailyActual | undefined {
  return get<DailyActual>(KEYS.actuals).find(a => a.propertyId === propertyId && a.date === date);
}
export function saveActual(a: DailyActual) { upsert(KEYS.actuals, a); }
export function deleteActual(id: string) { remove(KEYS.actuals, id); }

// DND RECORDS
export function getDNDRecords(propertyId: string): DNDRecord[] {
  return get<DNDRecord>(KEYS.dnd)
    .filter(r => r.propertyId === propertyId)
    .sort((a, b) => b.date.localeCompare(a.date));
}
export function saveDNDRecord(r: DNDRecord) { upsert(KEYS.dnd, r); }
export function deleteDNDRecord(id: string) { remove(KEYS.dnd, id); }
