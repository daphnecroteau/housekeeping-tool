import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hammer, FileSpreadsheet, Code2, Database, Layers, ArrowLeft, Download, ExternalLink } from 'lucide-react';

const steps = [
  {
    num: '01',
    title: 'Start with the Source Excel Tool',
    desc: 'The project began with a fully operational Excel workbook built by a housekeeping manager. The workbook included a weekly scheduling tab with forecasted volumes (occupied rooms, arrivals, departures), carry-over logic, DND % estimates, contract-rule-based RA calculations, and a daily OTB revision tab for updating volumes 2–4 days out.',
    icon: FileSpreadsheet,
  },
  {
    num: '02',
    title: 'Describe the Business Logic to Claude',
    desc: 'The Excel formulas and layout were shared with Claude.ai. Each calculation was described in plain language: how "Departures to Clean" equals departures + carry-over from yesterday − carry-over to tomorrow, how contract rules determine RA headcount, and how DND % applies to stayovers. Claude translated these rules into TypeScript calculation functions.',
    icon: Code2,
  },
  {
    num: '03',
    title: 'Define the Data Model',
    desc: 'Claude helped design a typed data model in TypeScript: properties, room types, contract rules, weekly schedules, OTB records, actuals, and DND records. The schema was built to support multiple properties per user and historical lookups by week or date.',
    icon: Database,
  },
  {
    num: '04',
    title: 'Build the UI Screen by Screen',
    desc: 'Each page was built iteratively: Weekly Schedule first (mirroring the Excel tab), then Daily Schedule (OTB revisions), then Actuals, then DND Tracker, then Database & Export. Claude generated the React + TypeScript component code, Tailwind CSS styling, and wired up the state management through a DataContext.',
    icon: Layers,
  },
  {
    num: '05',
    title: 'Add Persistence and Multi-Property Support',
    desc: 'Data persistence was added in layers: first in-memory for demo mode, then localStorage for local mode (no account required), then an auth layer with per-user data saved by user ID. The same DataContext supports all three modes via an "AppMode" type flag.',
    icon: Database,
  },
  {
    num: '06',
    title: 'Refine the UX Through Conversation',
    desc: 'UX improvements were made through natural conversation: right-aligning numbers so digits stack for comparison, fixing tooltip z-index with React portals so overlays don\'t get clipped by sticky table cells, aligning row heights by always rendering "Plan:" labels (even when empty), and adding prominent + buttons for Actuals and DND data entry.',
    icon: Hammer,
  },
];

const tech = [
  { label: 'React 18 + TypeScript', desc: 'Component framework and type safety' },
  { label: 'Vite', desc: 'Dev server and build tool' },
  { label: 'Tailwind CSS', desc: 'Utility-first styling' },
  { label: 'React Router v6', desc: 'Client-side routing (demo / local / auth modes)' },
  { label: 'lucide-react', desc: 'Icon library' },
  { label: 'xlsx (SheetJS)', desc: 'Excel export from the Database page' },
  { label: 'LocalStorage', desc: 'Client-side persistence for local mode' },
  { label: 'Claude.ai', desc: 'AI pair programmer throughout the entire build' },
];

function DownloadExcelButton() {
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/housekeeping-ra-tool.xlsx', { method: 'HEAD' })
      .then(r => setAvailable(r.ok))
      .catch(() => setAvailable(false));
  }, []);

  if (available === null) return null;

  if (!available) {
    return (
      <p className="text-sm italic" style={{ color: '#9ca3af' }}>
        Excel file coming soon — connect on LinkedIn below to request a copy.
      </p>
    );
  }

  return (
    <a href="/housekeeping-ra-tool.xlsx" download className="inline-flex items-center gap-2 btn-primary text-sm">
      <Download size={14} /> Download Excel Source File
    </a>
  );
}

export default function HowBuiltPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ background: '#F5F7F8' }}>
      {/* Header */}
      <div className="px-6 py-4 border-b" style={{ background: '#1A3C4A', borderColor: '#2E6E82' }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Hammer size={20} style={{ color: '#C86848' }} />
            <span className="text-white font-bold text-lg">How This Was Built</span>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft size={14} /> Back
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">

        {/* Intro */}
        <div className="card p-6">
          <div className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4" style={{ background: '#FBE8DC', color: '#C86848' }}>
            Excel → Web · Built with AI
          </div>
          <h1 className="text-2xl font-bold mb-3" style={{ color: '#1A3C4A' }}>
            From Excel Spreadsheet to Web Application
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: '#3A6878' }}>
            This web application is a direct conversion of a real Excel-based housekeeping scheduling tool used by a hotel manager.
            The entire build was done in collaboration with Claude.ai — no traditional development agency, no design team.
            Just a business expert, their Excel file, and an AI pair programmer.
          </p>
          <p className="text-sm leading-relaxed mt-3" style={{ color: '#3A6878' }}>
            The result is a multi-property, multi-mode web app that preserves every formula and business rule from the original spreadsheet,
            while adding features that Excel simply can't offer: historical records, device-synced accounts, and a clean interface
            for the whole housekeeping team.
          </p>
        </div>

        {/* Source Excel File */}
        <div className="card p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#FBE8DC' }}>
              <FileSpreadsheet size={22} style={{ color: '#C86848' }} />
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-base mb-1" style={{ color: '#1A3C4A' }}>Source Excel File</h2>
              <p className="text-sm mb-4" style={{ color: '#3A6878' }}>
                Download the original Excel workbook that served as the blueprint for this application.
                It contains the full weekly scheduling model, OTB revision logic, and contract-rule calculations.
              </p>
              <DownloadExcelButton />
            </div>
          </div>
        </div>

        {/* Steps */}
        <div>
          <h2 className="text-lg font-bold mb-5" style={{ color: '#1A3C4A' }}>Step-by-Step Build Process</h2>
          <div className="space-y-4">
            {steps.map(({ num, title, desc, icon: Icon }) => (
              <div key={num} className="card p-5 flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: '#1A3C4A', color: '#C86848' }}>
                    {num}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon size={15} style={{ color: '#2E6E82' }} />
                    <h3 className="font-semibold text-sm" style={{ color: '#1A3C4A' }}>{title}</h3>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: '#3A6878' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tech Stack */}
        <div>
          <h2 className="text-lg font-bold mb-5" style={{ color: '#1A3C4A' }}>Tech Stack</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {tech.map(({ label, desc }) => (
              <div key={label} className="card p-4 flex items-start gap-3">
                <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: '#C86848' }} />
                <div>
                  <div className="font-semibold text-sm" style={{ color: '#1A3C4A' }}>{label}</div>
                  <div className="text-xs mt-0.5" style={{ color: '#3A6878' }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact / LinkedIn */}
        <div className="card p-6" style={{ background: '#1A3C4A' }}>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(200,104,72,0.2)' }}>
              <Hammer size={18} style={{ color: '#C86848' }} />
            </div>
            <div>
              <h3 className="font-bold text-white mb-2">Get in touch</h3>
              <p className="text-sm mb-4" style={{ color: '#D0DDE2' }}>
                Interested in building a web application from your own spreadsheet-based tool?
                Connect on LinkedIn to discuss how AI-assisted development can bring your workflows to the web.
              </p>
              <a
                href="https://www.linkedin.com/in/daphnecroteau/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 btn-primary text-sm"
              >
                Connect on LinkedIn <ExternalLink size={13} />
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
