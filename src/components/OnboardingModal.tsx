import React, { useState, useEffect } from 'react';
import { CalendarDays, TrendingUp, ClipboardList, X, ArrowRight } from 'lucide-react';

const STORAGE_KEY = 'hk_onboarding_seen_v1';

const STEPS = [
  {
    icon: CalendarDays,
    color: '#2E6E82',
    title: 'Weekly Schedule',
    subtitle: 'Start here every week',
    desc: 'Enter your forecast: occupied rooms, arrivals, departures, and DND % for each day. The tool calculates how many Room Attendants (RAs) you need based on your contract rules.',
  },
  {
    icon: TrendingUp,
    color: '#3A6878',
    title: 'OTB Schedule',
    subtitle: 'Update daily as bookings change',
    desc: 'As your On-The-Books numbers change throughout the week, update them here. The tool recalculates staffing and shows you the variance against your weekly plan — call in or call off RAs accordingly.',
  },
  {
    icon: ClipboardList,
    color: '#C86848',
    title: 'Daily Actuals + DND Tracker',
    subtitle: 'Record what actually happened',
    desc: 'After each day, log actual rooms cleaned, hours worked, and DND/Refused Service counts. Over time, the DND Tracker builds historical averages by day of week to improve your weekly forecast.',
  },
];

export default function OnboardingModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setOpen(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setOpen(false);
  };

  if (!open) return null;

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(26,60,74,0.7)' }}>
      <div className="relative w-full max-w-md mx-4 rounded-xl shadow-2xl overflow-hidden" style={{ background: 'white' }}>
        {/* Header */}
        <div className="px-6 py-5" style={{ background: '#1A3C4A' }}>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#C86848' }}>
                How this tool works
              </div>
              <h2 className="text-lg font-bold text-white">Welcome to the Housekeeping RA Tool</h2>
            </div>
            <button onClick={dismiss} className="text-gray-400 hover:text-white ml-4 flex-shrink-0 mt-0.5">
              <X size={18} />
            </button>
          </div>
          {/* Step dots */}
          <div className="flex gap-1.5 mt-4">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className="rounded-full transition-all"
                style={{
                  width: i === step ? 20 : 8,
                  height: 8,
                  background: i === step ? '#C86848' : 'rgba(255,255,255,0.3)',
                }}
              />
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="px-6 py-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: current.color }}>
              <Icon size={20} color="white" />
            </div>
            <div>
              <div className="font-bold text-sm" style={{ color: '#1A3C4A' }}>{current.title}</div>
              <div className="text-xs" style={{ color: '#C86848' }}>{current.subtitle}</div>
            </div>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: '#3A6878' }}>{current.desc}</p>

          {/* Abbreviation glossary on last step */}
          {isLast && (
            <div className="mt-4 p-3 rounded-lg text-xs space-y-1" style={{ background: '#F5F7F8', color: '#3A6878' }}>
              <div className="font-semibold mb-1.5" style={{ color: '#1A3C4A' }}>Quick glossary</div>
              <div><strong>RA</strong> — Room Attendant (housekeeper)</div>
              <div><strong>DND</strong> — Do Not Disturb (guest declined service)</div>
              <div><strong>RS</strong> — Refused Service</div>
              <div><strong>OTB</strong> — On-The-Books (current live booking numbers)</div>
              <div><strong>HPOR</strong> — Hours Per Occupied Room (efficiency metric)</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex items-center justify-between">
          <button
            onClick={dismiss}
            className="text-xs"
            style={{ color: '#9ca3af' }}
          >
            Skip intro
          </button>
          <button
            onClick={() => isLast ? dismiss() : setStep(s => s + 1)}
            className="flex items-center gap-2 text-sm font-semibold px-5 py-2 rounded-lg transition-opacity hover:opacity-90"
            style={{ background: '#2E6E82', color: 'white' }}
          >
            {isLast ? 'Get started' : 'Next'}
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
