import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, TrendingUp, ClipboardList, BarChart2, Database, ArrowRight } from 'lucide-react';

const features = [
  { icon: CalendarDays, title: 'Weekly Schedule', desc: 'Plan your full week with forecasted occupancy, departures and arrivals. Navigate between past and future weeks.' },
  { icon: TrendingUp, title: 'Daily Schedule', desc: 'Update with on-the-book volumes 4–2 days out. Rolling 7-day view shows carry-overs and call-in/call-off recommendations.' },
  { icon: ClipboardList, title: 'Daily Actuals', desc: 'Log end-of-day performance: actual rooms cleaned, hours worked, DNDs. Pre-filled from your plan.' },
  { icon: BarChart2, title: 'DND & RS Tracker', desc: 'Build a historical log of Do-Not-Disturb and Refused Service rooms to improve future forecasting.' },
  { icon: Database, title: 'Database & Export', desc: 'View all historical Forecast, OTB, and Actual records side by side. Export to Excel or CSV.' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ background: '#F5F7F8' }}>
      {/* Hero */}
      <header style={{ background: '#1A3C4A' }} className="px-6 py-4 flex items-center justify-between">
        <span className="text-white font-bold text-lg">Housekeeping RA Tool</span>
        <div className="flex gap-3">
          <button onClick={() => navigate('/login')} className="btn-ghost text-sm" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>
            Sign In
          </button>
          <button onClick={() => navigate('/register')} className="btn-primary text-sm">
            Create Account
          </button>
        </div>
      </header>

      <main>
        {/* Hero section */}
        <section style={{ background: '#1A3C4A' }} className="px-6 pb-20 pt-16 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-6" style={{ background: '#FBE8DC', color: '#C86848' }}>
              Excel → Web · Built with AI
            </div>
            <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
              Room Attendant Scheduling,<br />Reimagined for the Web
            </h1>
            <p className="text-lg mb-8" style={{ color: '#D0DDE2' }}>
              From forecasted volumes to on-the-book revisions and daily actuals — your complete housekeeping planning tool, in your browser.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate('/local/properties')}
                className="btn-primary flex items-center gap-2 justify-center text-base px-6 py-3"
              >
                Use Without Account
                <ArrowRight size={16} />
              </button>
              <button
                onClick={() => navigate('/demo/weekly')}
                className="px-6 py-3 rounded font-medium text-base transition-colors border text-white"
                style={{ borderColor: 'rgba(255,255,255,0.4)' }}
              >
                View read-only demo
              </button>
            </div>
            <p className="mt-2 text-xs" style={{ color: '#3A6878' }}>
              Local mode saves your data in this browser · Account syncs across devices
            </p>
          </div>
        </section>

        {/* Features */}
        <section className="px-6 py-16">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-2" style={{ color: '#1A3C4A' }}>Everything in one place</h2>
            <p className="text-center mb-10 text-sm" style={{ color: '#3A6878' }}>Five integrated views that mirror how a real housekeeping manager thinks</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="card p-5">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: '#FBE8DC' }}>
                    <Icon size={20} style={{ color: '#C86848' }} />
                  </div>
                  <h3 className="font-semibold mb-1 text-sm" style={{ color: '#1A3C4A' }}>{title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: '#3A6878' }}>{desc}</p>
                </div>
              ))}
              {/* CTA card */}
              <div className="card p-5 flex flex-col justify-between" style={{ background: '#1A3C4A' }}>
                <div>
                  <h3 className="font-semibold mb-2 text-white">Ready to get started?</h3>
                  <p className="text-xs leading-relaxed" style={{ color: '#D0DDE2' }}>Create a free account to save your hotel configuration and historical data.</p>
                </div>
                <button
                  onClick={() => navigate('/register')}
                  className="mt-4 btn-primary flex items-center gap-2 justify-center"
                >
                  Get Started <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="px-6 py-12" style={{ background: '#FBE8DC' }}>
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-xl font-bold mb-2" style={{ color: '#1A3C4A' }}>Built from an Excel tool with AI</h2>
            <p className="text-sm leading-relaxed" style={{ color: '#3A6878' }}>
              This web application is a demonstration of how AI can transform a complex Excel-based scheduling tool
              into a modern, shareable web application — preserving all the business logic while adding history,
              multi-property support, and database export capabilities.
            </p>
          </div>
        </section>
      </main>

      <footer className="px-6 py-6 text-center text-xs" style={{ background: '#122830', color: '#3A6878' }}>
        Housekeeping RA Tool · For demonstration purposes only
      </footer>
    </div>
  );
}
