import React from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { CalendarDays, TrendingUp, ClipboardList, BarChart2, Database, ArrowRight, Hammer, CheckCircle2, XCircle } from 'lucide-react';
import { seedLocalSampleData } from '../utils/sampleData';

const features = [
  { icon: CalendarDays, title: 'Weekly Schedule', desc: 'Plan the full week: occupancy, departures, arrivals, DND %. Live staffing recommendations update as you type.', section: 'weekly' },
  { icon: TrendingUp,   title: 'OTB Schedule',    desc: 'Update on-the-books numbers as bookings change. Variance badges instantly show call-in or call-off decisions.', section: 'otb' },
  { icon: ClipboardList,title: 'Daily Actuals',   desc: 'Log end-of-day performance — rooms cleaned, hours, DNDs. Pre-filled from your plan for quick entry.', section: 'actuals' },
  { icon: BarChart2,    title: 'DND Tracker',     desc: 'Build a historical DND & RS log. The tool calculates your average by day of week to improve future forecasts.', section: 'dnd' },
  { icon: Database,     title: 'Database & Export', desc: 'Every forecast, OTB revision, and actual in one place. Export to Excel or CSV in one click.', section: 'database' },
];

const before = [
  'Single workbook — no sharing',
  'Formulas break on copy',
  'No history — overwrites each week',
  'Email/print to distribute',
  'One hotel per file',
];

const after = [
  'Browser-based, shareable via link',
  'Real-time calculations, always correct',
  'Full history — weekly, OTB, actuals',
  'Anyone with the link can view',
  'Multi-property in one tool',
];

export default function LandingPage() {
  const navigate = useNavigate();

  const handleExploreDemo = () => {
    navigate('/demo/weekly');
  };

  const handleUseOwnData = () => {
    const propId = seedLocalSampleData();
    navigate(`/local/${propId}/weekly`);
  };

  return (
    <div className="min-h-screen" style={{ background: '#F5F7F8' }}>

      {/* Header */}
      <header style={{ background: '#1A3C4A' }} className="px-6 py-4 flex items-center justify-between">
        <span className="text-white font-bold text-lg">Housekeeping RA Tool</span>
        <button
          onClick={() => navigate('/login')}
          className="text-sm px-3 py-1.5 rounded border transition-colors hover:bg-white/10"
          style={{ color: '#D0DDE2', borderColor: 'rgba(255,255,255,0.2)' }}
        >
          Sign In
        </button>
      </header>

      <main>
        {/* ── Hero ── */}
        <section style={{ background: '#1A3C4A' }} className="px-6 pb-20 pt-14 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full mb-6" style={{ background: '#FBE8DC', color: '#C86848' }}>
              <Hammer size={12} /> Excel → Web · Built with Claude AI
            </div>
            <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
              Room Attendant Scheduling,<br />Reimagined for the Web
            </h1>
            <p className="text-lg mb-3" style={{ color: '#D0DDE2' }}>
              A complex hotel housekeeping workbook — rebuilt as a modern web app.
              All the business logic, none of the Excel friction.
            </p>
            <p className="text-sm mb-8" style={{ color: '#3A6878' }}>
              Explore freely — demo is fully interactive and resets on refresh.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
              <button
                onClick={handleExploreDemo}
                className="btn-primary flex items-center gap-2 justify-center text-base px-7 py-3"
              >
                Explore the demo <ArrowRight size={16} />
              </button>
              <button
                onClick={handleUseOwnData}
                className="px-6 py-3 rounded font-medium text-base transition-colors border"
                style={{ borderColor: 'rgba(255,255,255,0.4)', color: 'white' }}
              >
                Use with your own data
              </button>
            </div>

            <NavLink
              to="/about"
              className="inline-flex items-center gap-1.5 text-sm hover:underline"
              style={{ color: '#C86848' }}
            >
              <Hammer size={13} /> How this was built with AI →
            </NavLink>
          </div>
        </section>

        {/* ── Excel → Web comparison ── */}
        <section className="px-6 py-14" style={{ background: '#1A3C4A' }}>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-bold text-center text-white mb-2">What changed from Excel to Web?</h2>
            <p className="text-center text-sm mb-10" style={{ color: '#3A6878' }}>Same business logic. Completely new experience.</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#9ca3af' }}>Excel (before)</div>
                <ul className="space-y-2">
                  {before.map(b => (
                    <li key={b} className="flex items-start gap-2 text-sm" style={{ color: '#D0DDE2' }}>
                      <XCircle size={14} className="flex-shrink-0 mt-0.5" style={{ color: '#ef4444' }} /> {b}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl p-5" style={{ background: 'rgba(200,104,72,0.15)', border: '1px solid rgba(200,104,72,0.3)' }}>
                <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#C86848' }}>Web app (now)</div>
                <ul className="space-y-2">
                  {after.map(a => (
                    <li key={a} className="flex items-start gap-2 text-sm text-white">
                      <CheckCircle2 size={14} className="flex-shrink-0 mt-0.5" style={{ color: '#34d399' }} /> {a}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── Feature cards ── */}
        <section className="px-6 py-16">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-2" style={{ color: '#1A3C4A' }}>Five integrated views</h2>
            <p className="text-center mb-2 text-sm" style={{ color: '#3A6878' }}>Click any card to jump into the live demo</p>
            <p className="text-center mb-10 text-xs" style={{ color: '#9ca3af' }}>All pre-loaded with realistic hotel data — no setup needed</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map(({ icon: Icon, title, desc, section }) => (
                <button
                  key={title}
                  onClick={() => navigate(`/demo/${section}`)}
                  className="card p-5 text-left hover:shadow-lg transition-shadow group"
                  style={{ cursor: 'pointer' }}
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: '#FBE8DC' }}>
                    <Icon size={20} style={{ color: '#C86848' }} />
                  </div>
                  <h3 className="font-semibold mb-1 text-sm" style={{ color: '#1A3C4A' }}>{title}</h3>
                  <p className="text-xs leading-relaxed mb-3" style={{ color: '#3A6878' }}>{desc}</p>
                  <span className="text-xs font-semibold group-hover:underline" style={{ color: '#2E6E82' }}>
                    See it live →
                  </span>
                </button>
              ))}

              {/* How it was built card */}
              <NavLink
                to="/about"
                className="card p-5 flex flex-col justify-between hover:shadow-lg transition-shadow group"
                style={{ background: '#1A3C4A', textDecoration: 'none' }}
              >
                <div>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: 'rgba(200,104,72,0.2)' }}>
                    <Hammer size={20} style={{ color: '#C86848' }} />
                  </div>
                  <h3 className="font-semibold mb-1 text-sm text-white">How This Was Built</h3>
                  <p className="text-xs leading-relaxed" style={{ color: '#D0DDE2' }}>
                    Prompts, architecture decisions, and lessons learned from building a real tool with Claude AI.
                  </p>
                </div>
                <span className="mt-4 text-xs font-semibold group-hover:underline" style={{ color: '#C86848' }}>
                  Read the breakdown →
                </span>
              </NavLink>
            </div>
          </div>
        </section>

        {/* ── Footer CTA ── */}
        <section className="px-6 py-12 text-center" style={{ background: '#FBE8DC' }}>
          <h2 className="text-lg font-bold mb-2" style={{ color: '#1A3C4A' }}>Ready to use it for your hotel?</h2>
          <p className="text-sm mb-5" style={{ color: '#3A6878' }}>
            Create a free account to save your configuration and history across sessions and devices.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button onClick={() => navigate('/register')} className="btn-primary flex items-center gap-2">
              Create Free Account <ArrowRight size={14} />
            </button>
            <button onClick={handleUseOwnData} className="btn-ghost text-sm">
              Try without an account
            </button>
          </div>
        </section>
      </main>

      <footer className="px-6 py-6 text-center text-xs" style={{ background: '#122830', color: '#3A6878' }}>
        Housekeeping RA Tool · Built with Claude AI · For demonstration purposes
      </footer>
    </div>
  );
}
