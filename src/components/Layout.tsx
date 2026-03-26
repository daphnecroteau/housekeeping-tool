import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import {
  CalendarDays, TrendingUp, ClipboardList, BarChart2, Database,
  Settings, Building2, LogOut, Menu, X, ChevronDown, Hammer,
} from 'lucide-react';

const NAV = [
  { label: 'Weekly Schedule', icon: CalendarDays, section: 'weekly' },
  { label: 'Daily Schedule', icon: TrendingUp, section: 'otb' },
  { label: 'Actuals', icon: ClipboardList, section: 'actuals' },
  { label: 'DND Tracker', icon: BarChart2, section: 'dnd' },
  { label: 'Database & Export', icon: Database, section: 'database' },
];

interface LayoutProps {
  children: React.ReactNode;
  isDemo?: boolean;
}

export default function Layout({ children, isDemo = false }: LayoutProps) {
  const { user, logout } = useAuth();
  const { properties, currentPropertyId, setCurrentPropertyId, currentProperty, mode } = useData();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [propMenuOpen, setPropMenuOpen] = useState(false);

  const base = isDemo ? '/demo' : mode === 'local' ? `/local/${currentPropertyId}` : `/app/${currentPropertyId}`;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo / Header */}
      <div className="px-4 py-5 border-b" style={{ borderColor: '#2E6E82' }}>
        <div className="flex items-center gap-2">
          <Building2 size={20} className="text-terracotta" style={{ color: '#C86848' }} />
          <span className="font-bold text-white text-sm leading-tight">Housekeeping<br />RA Tool</span>
        </div>
        {isDemo && (
          <div className="mt-2 text-xs px-2 py-1 rounded" style={{ background: '#C86848', color: 'white' }}>
            Demo Mode
          </div>
        )}
      </div>

      {/* Property Selector */}
      {!isDemo && properties.length > 0 && (
        <div className="px-3 py-3 border-b" style={{ borderColor: '#2E6E82' }}>
          <div className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Property</div>
          <button
            className="w-full flex items-center justify-between text-left text-sm text-white px-2 py-1.5 rounded hover:bg-white/10 transition-colors"
            onClick={() => setPropMenuOpen(v => !v)}
          >
            <span className="truncate">{currentProperty?.name ?? 'Select property'}</span>
            <ChevronDown size={14} className={`flex-shrink-0 transition-transform ${propMenuOpen ? 'rotate-180' : ''}`} />
          </button>
          {propMenuOpen && (
            <div className="mt-1 rounded overflow-hidden" style={{ background: '#2E6E82' }}>
              {properties.map(p => (
                <button
                  key={p.id}
                  className={`w-full text-left text-xs px-3 py-2 hover:bg-white/10 transition-colors ${p.id === currentPropertyId ? 'font-semibold text-white' : 'text-gray-200'}`}
                  onClick={() => { setCurrentPropertyId(p.id); setPropMenuOpen(false); navigate(`/app/${p.id}/weekly`); }}
                >
                  {p.name}
                </button>
              ))}
              <button
                className="w-full text-left text-xs px-3 py-2 text-gray-300 hover:bg-white/10 border-t"
                style={{ borderColor: '#1A3C4A' }}
                onClick={() => { setPropMenuOpen(false); navigate('/app/properties'); }}
              >
                + Manage Properties
              </button>
            </div>
          )}
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ label, icon: Icon, section }) => {
          const to = isDemo ? `/demo/${section}` : `/app/${currentPropertyId}/${section}`;
          const active = location.pathname.includes(`/${section}`);
          return (
            <NavLink
              key={section}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors ${active ? 'text-white font-medium' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}
              style={active ? { background: '#2E6E82' } : {}}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          );
        })}

        {/* Config */}
        <div className="pt-3 mt-3 border-t" style={{ borderColor: '#2E6E82' }}>
          {!isDemo && (
            <NavLink
              to={currentPropertyId ? `${base}/config` : (mode === 'local' ? '/local/properties' : '/app/properties')}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors ${location.pathname.includes('/config') ? 'text-white font-medium' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}
              style={location.pathname.includes('/config') ? { background: '#2E6E82' } : {}}
            >
              <Settings size={16} />
              Configuration
            </NavLink>
          )}
          {isDemo && (
            <NavLink
              to="/demo/config"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors ${location.pathname.includes('/config') ? 'text-white font-medium' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}
              style={location.pathname.includes('/config') ? { background: '#2E6E82' } : {}}
            >
              <Settings size={16} />
              Configuration
            </NavLink>
          )}
          {/* How this was built — always visible */}
          <NavLink
            to="/about"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors mt-1 font-medium"
            style={location.pathname === '/about'
              ? { background: '#C86848', color: 'white' }
              : { background: 'rgba(200,104,72,0.15)', color: '#C86848' }}
          >
            <Hammer size={16} />
            How This Was Built
          </NavLink>
        </div>
      </nav>

      {/* User / Footer */}
      <div className="px-3 py-4 border-t" style={{ borderColor: '#2E6E82' }}>
        {isDemo ? (
          <div className="space-y-2">
            <div className="text-xs text-gray-400">Viewing in demo mode</div>
            <button
              className="w-full text-left text-sm text-white px-3 py-2 rounded hover:bg-white/10 transition-colors"
              onClick={() => navigate('/register')}
            >
              Create Free Account to Save →
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-xs text-gray-300 truncate">{user?.name}</div>
            <div className="text-xs text-gray-500 truncate">{user?.email}</div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors px-1"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-56 flex-shrink-0 transition-transform duration-200 lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: '#1A3C4A' }}
      >
        <SidebarContent />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b" style={{ background: '#1A3C4A', borderColor: '#2E6E82' }}>
          <button onClick={() => setSidebarOpen(true)} className="text-white">
            <Menu size={20} />
          </button>
          <span className="text-white font-semibold text-sm">Housekeeping RA Tool</span>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-auto" style={{ background: '#F5F7F8' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
