import { Property, DayCalcResult, RuleResult } from '../types';

export function getAvgCreditPerRoom(property: Property): number {
  const totalCredits = property.roomTypes.reduce((s, rt) => s + rt.numRooms * rt.credits, 0);
  return property.numRooms > 0 ? totalCredits / property.numRooms : 0;
}

function isRuleApplicable(rule: { seasonStart?: string; seasonEnd?: string }, date: string): boolean {
  if (!rule.seasonStart || !rule.seasonEnd) return true;
  const d = new Date(date + 'T00:00:00');
  const mm = d.getMonth() + 1;
  const dd = d.getDate();
  const cur = mm * 100 + dd;
  const [sm, sd] = rule.seasonStart.split('-').map(Number);
  const [em, ed] = rule.seasonEnd.split('-').map(Number);
  const start = sm * 100 + sd;
  const end = em * 100 + ed;
  if (start <= end) return cur >= start && cur <= end;
  return cur >= start || cur <= end; // wraps year
}

export function calculateDay(params: {
  occupiedRooms: number;
  arrivals: number;
  departures: number;
  carriedOverFromYesterday: number;
  carryOverToTomorrow: number;
  dndPct: number;
  additionalCredits: number;
  rasScheduled?: number | null;
  property: Property;
  date: string;
}): DayCalcResult {
  const {
    occupiedRooms, arrivals, departures,
    carriedOverFromYesterday, carryOverToTomorrow,
    dndPct, additionalCredits, rasScheduled, property, date,
  } = params;

  const stayovers = Math.max(0, occupiedRooms - arrivals);
  const dndRooms = stayovers * dndPct;
  const departuresToClean = Math.max(0, departures + carriedOverFromYesterday - carryOverToTomorrow);
  const stayoversToClean = Math.ceil(Math.max(0, stayovers - dndRooms));
  const totalRoomsToClean = departuresToClean + stayoversToClean;
  const avgCreditPerRoom = getAvgCreditPerRoom(property);
  const estimatedCredits = totalRoomsToClean * avgCreditPerRoom;
  const totalCreditsToConsider = estimatedCredits + additionalCredits;

  // Sort applicable rules by maxCredits descending (Rule 1 = highest)
  const rules = property.contractRules
    .filter(r => isRuleApplicable(r, date))
    .sort((a, b) => b.maxCredits - a.maxCredits);

  if (rules.length === 0) {
    return {
      stayovers, dndRooms, departuresToClean, stayoversToClean, totalRoomsToClean,
      avgCreditPerRoom, estimatedCredits, additionalCredits, totalCreditsToConsider,
      ruleResults: [], rasNeeded: 0, potentialCreditAttainment: 0, potentialHPOR: 0,
    };
  }

  // Rule 1: baseline
  let currentRAs = Math.ceil(totalCreditsToConsider / rules[0].maxCredits);
  const ruleResults: RuleResult[] = [{
    ruleId: rules[0].id,
    maxCredits: rules[0].maxCredits,
    rasNeeded: currentRAs,
    avgDeparturesPerRA: currentRAs > 0 ? departuresToClean / currentRAs : 0,
    applied: true,
  }];

  // Rules 2+: check average departures/RA from previous rule
  for (let i = 1; i < rules.length; i++) {
    const rule = rules[i];
    const avgDep = currentRAs > 0 ? departuresToClean / currentRAs : 0;
    const shouldApply = rule.minDepartures !== null && avgDep >= rule.minDepartures;
    if (shouldApply) currentRAs = Math.ceil(totalCreditsToConsider / rule.maxCredits);
    ruleResults.push({
      ruleId: rule.id,
      maxCredits: rule.maxCredits,
      rasNeeded: currentRAs,
      avgDeparturesPerRA: currentRAs > 0 ? departuresToClean / currentRAs : 0,
      applied: shouldApply,
    });
  }

  const rasNeeded = currentRAs;
  // Credit attainment uses estimatedCredits only (room credits, not additional)
  const potentialCreditAttainment = rasNeeded > 0 ? estimatedCredits / rasNeeded : 0;
  const potentialHPOR = occupiedRooms > 0 ? (rasNeeded * property.shiftHours) / occupiedRooms : 0;

  let scheduledCreditAttainment: number | undefined;
  let scheduledHPOR: number | undefined;
  let variance: number | undefined;

  if (rasScheduled != null && rasScheduled > 0) {
    scheduledCreditAttainment = estimatedCredits / rasScheduled;
    scheduledHPOR = occupiedRooms > 0 ? (rasScheduled * property.shiftHours) / occupiedRooms : 0;
    variance = rasNeeded - rasScheduled;
  }

  return {
    stayovers, dndRooms, departuresToClean, stayoversToClean, totalRoomsToClean,
    avgCreditPerRoom, estimatedCredits, additionalCredits, totalCreditsToConsider,
    ruleResults, rasNeeded, potentialCreditAttainment, potentialHPOR,
    scheduledCreditAttainment, scheduledHPOR, variance,
  };
}

export function fmt2(n: number | undefined | null): string {
  if (n == null || isNaN(n)) return '–';
  return n.toFixed(2);
}

export function fmt1(n: number | undefined | null): string {
  if (n == null || isNaN(n)) return '–';
  return n.toFixed(1);
}

export function fmtPct(n: number | undefined | null): string {
  if (n == null || isNaN(n)) return '–';
  return (n * 100).toFixed(1) + '%';
}

export function fmtInt(n: number | undefined | null): string {
  if (n == null || isNaN(n)) return '–';
  return Math.round(n).toString();
}
