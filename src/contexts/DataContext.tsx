import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Property, WeeklySchedule, OTBEntry, DailyActual, DNDRecord, AppMode } from '../types';
import * as storage from '../utils/storage';
import {
  DEMO_PROPERTY, DEMO_WEEKLY_CURRENT, DEMO_WEEKLY_PREV,
  buildDemoOTBEntries, buildDemoActuals, buildDemoDNDRecords,
} from '../utils/sampleData';

interface DataContextType {
  mode: AppMode;
  // Properties
  properties: Property[];
  currentPropertyId: string | null;
  setCurrentPropertyId: (id: string) => void;
  currentProperty: Property | null;
  saveProperty: (p: Property) => void;
  deleteProperty: (id: string) => void;
  // Weekly
  weeklySchedules: WeeklySchedule[];
  saveWeeklySchedule: (w: WeeklySchedule) => void;
  getWeeklyByWeekStart: (weekStart: string) => WeeklySchedule | undefined;
  // OTB
  otbEntries: OTBEntry[];
  saveOTBEntry: (e: OTBEntry) => void;
  getOTBByDate: (date: string) => OTBEntry | undefined;
  // Actuals
  actuals: DailyActual[];
  saveActual: (a: DailyActual) => void;
  deleteActual: (id: string) => void;
  getActualByDate: (date: string) => DailyActual | undefined;
  // DND
  dndRecords: DNDRecord[];
  saveDNDRecord: (r: DNDRecord) => void;
  deleteDNDRecord: (id: string) => void;
}

const DataContext = createContext<DataContextType | null>(null);

interface Props {
  mode: AppMode;
  userId?: string;
  children: ReactNode;
}

export function DataProvider({ mode, userId, children }: Props) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [currentPropertyId, setCurrentPropertyId] = useState<string | null>(null);
  const [weeklySchedules, setWeeklySchedules] = useState<WeeklySchedule[]>([]);
  const [otbEntries, setOTBEntries] = useState<OTBEntry[]>([]);
  const [actuals, setActuals] = useState<DailyActual[]>([]);
  const [dndRecords, setDNDRecords] = useState<DNDRecord[]>([]);

  const effectiveUserId = mode === 'local' ? 'local-user' : userId;

  // Load data on mount
  useEffect(() => {
    if (mode === 'demo') {
      setProperties([DEMO_PROPERTY]);
      setCurrentPropertyId(DEMO_PROPERTY.id);
      setWeeklySchedules([DEMO_WEEKLY_CURRENT, DEMO_WEEKLY_PREV]);
      setOTBEntries(buildDemoOTBEntries());
      setActuals(buildDemoActuals());
      setDNDRecords(buildDemoDNDRecords());
    } else if (effectiveUserId) {
      const props = storage.getProperties(effectiveUserId);
      setProperties(props);
      if (props.length > 0) setCurrentPropertyId(props[0].id);
    }
  }, [mode, effectiveUserId]);

  // Reload property-specific data when currentPropertyId changes
  useEffect(() => {
    if ((mode === 'auth' || mode === 'local') && currentPropertyId) {
      setWeeklySchedules(storage.getWeeklySchedules(currentPropertyId));
      setOTBEntries(storage.getOTBEntries(currentPropertyId));
      setActuals(storage.getActuals(currentPropertyId));
      setDNDRecords(storage.getDNDRecords(currentPropertyId));
    }
  }, [mode, currentPropertyId]);

  const currentProperty = properties.find(p => p.id === currentPropertyId) ?? null;

  const isPersisted = mode === 'auth' || mode === 'local';

  const savePropertyFn = useCallback((p: Property) => {
    if (isPersisted) storage.saveProperty(p);
    setProperties(prev => {
      const idx = prev.findIndex(x => x.id === p.id);
      if (idx >= 0) { const n = [...prev]; n[idx] = p; return n; }
      return [...prev, p];
    });
  }, [mode]);

  const deletePropertyFn = useCallback((id: string) => {
    if (isPersisted) storage.deleteProperty(id);
    setProperties(prev => prev.filter(p => p.id !== id));
    if (currentPropertyId === id) setCurrentPropertyId(null);
  }, [mode, currentPropertyId]);

  const saveWeeklyFn = useCallback((w: WeeklySchedule) => {
    if (isPersisted) storage.saveWeeklySchedule(w);
    setWeeklySchedules(prev => {
      const idx = prev.findIndex(x => x.id === w.id);
      if (idx >= 0) { const n = [...prev]; n[idx] = w; return n; }
      return [...prev, w];
    });
  }, [mode]);

  const saveOTBFn = useCallback((e: OTBEntry) => {
    if (isPersisted) storage.saveOTBEntry(e);
    setOTBEntries(prev => {
      const idx = prev.findIndex(x => x.id === e.id);
      if (idx >= 0) { const n = [...prev]; n[idx] = e; return n; }
      return [...prev, e];
    });
  }, [mode]);

  const saveActualFn = useCallback((a: DailyActual) => {
    if (isPersisted) storage.saveActual(a);
    setActuals(prev => {
      const idx = prev.findIndex(x => x.id === a.id);
      if (idx >= 0) { const n = [...prev]; n[idx] = a; return n; }
      return [...prev, a];
    });
  }, [mode]);

  const deleteActualFn = useCallback((id: string) => {
    if (isPersisted) storage.deleteActual(id);
    setActuals(prev => prev.filter(a => a.id !== id));
  }, [mode]);

  const saveDNDFn = useCallback((r: DNDRecord) => {
    if (isPersisted) storage.saveDNDRecord(r);
    setDNDRecords(prev => {
      const idx = prev.findIndex(x => x.id === r.id);
      if (idx >= 0) { const n = [...prev]; n[idx] = r; return n; }
      return [...prev, r];
    });
  }, [mode]);

  const deleteDNDFn = useCallback((id: string) => {
    if (isPersisted) storage.deleteDNDRecord(id);
    setDNDRecords(prev => prev.filter(r => r.id !== id));
  }, [mode]);

  return (
    <DataContext.Provider value={{
      mode,
      properties, currentPropertyId, setCurrentPropertyId, currentProperty,
      saveProperty: savePropertyFn, deleteProperty: deletePropertyFn,
      weeklySchedules, saveWeeklySchedule: saveWeeklyFn,
      getWeeklyByWeekStart: (ws) => weeklySchedules.find(w => w.weekStartDate === ws && w.propertyId === currentPropertyId),
      otbEntries, saveOTBEntry: saveOTBFn,
      getOTBByDate: (date) => otbEntries.find(e => e.date === date && e.propertyId === currentPropertyId),
      actuals, saveActual: saveActualFn, deleteActual: deleteActualFn,
      getActualByDate: (date) => actuals.find(a => a.date === date && a.propertyId === currentPropertyId),
      dndRecords, saveDNDRecord: saveDNDFn, deleteDNDRecord: deleteDNDFn,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
