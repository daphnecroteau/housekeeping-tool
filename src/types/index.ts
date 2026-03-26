export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
}

export interface RoomType {
  id: string;
  name: string;
  numRooms: number;
  credits: number;
}

export interface ContractRule {
  id: string;
  ruleNumber: number;
  minDepartures: number | null; // null = Rule 1 (always applies, no dep threshold)
  maxCredits: number;
  description: string;
  seasonStart?: string; // "MM-DD"
  seasonEnd?: string;   // "MM-DD"
}

export interface Property {
  id: string;
  userId: string;
  name: string;
  numRooms: number;
  shiftHours: number;
  roomTypes: RoomType[];
  contractRules: ContractRule[];
  createdAt: string;
}

export interface DailyForecast {
  date: string; // YYYY-MM-DD
  occupiedRooms: number | null;
  arrivals: number | null;
  departures: number | null;
  carriedOverFromYesterday: number;
  carryOverToTomorrow: number;
  dndPct: number; // 0–1
  additionalCredits: number;
  rasScheduled: number | null;
  notes: string;
}

export interface WeeklySchedule {
  id: string;
  propertyId: string;
  weekStartDate: string; // YYYY-MM-DD (Monday)
  days: DailyForecast[]; // 7 entries
  createdAt: string;
  updatedAt: string;
}

export interface OTBEntry {
  id: string;
  propertyId: string;
  date: string;
  otbOccupiedRooms: number | null;
  otbArrivals: number | null;
  otbDepartures: number | null;
  carriedOverFromYesterday: number;
  carryOverToTomorrow: number;
  dndPct: number;
  additionalCredits: number;
  rasScheduledOverride: number | null; // null = use weekly schedule value
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface DailyActual {
  id: string;
  propertyId: string;
  date: string;
  actualOccupiedRooms: number | null;
  actualArrivals: number | null;
  actualDepartures: number | null;
  actualDeparturesCleaned: number | null;
  actualStayoversCleaned: number | null;
  actualDNDs: number | null;
  actualRefusedService: number | null;
  actualHoursWorked: number | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface DNDRecord {
  id: string;
  propertyId: string;
  date: string;
  occupiedRooms: number | null;
  arrivals: number | null;
  departures: number | null;
  dnds: number | null;
  refusedService: number | null;
  createdAt: string;
}

export interface RuleResult {
  ruleId: string;
  maxCredits: number;
  rasNeeded: number;
  avgDeparturesPerRA: number;
  applied: boolean;
}

export interface DayCalcResult {
  stayovers: number;
  dndRooms: number;
  departuresToClean: number;
  stayoversToClean: number;
  totalRoomsToClean: number;
  avgCreditPerRoom: number;
  estimatedCredits: number;
  additionalCredits: number;
  totalCreditsToConsider: number;
  ruleResults: RuleResult[];
  rasNeeded: number;
  potentialCreditAttainment: number;
  potentialHPOR: number;
  scheduledCreditAttainment?: number;
  scheduledHPOR?: number;
  variance?: number;
}

export type AppMode = 'demo' | 'auth' | 'local';
