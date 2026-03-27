import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { Property, RoomType, ContractRule } from '../../types';
import { Plus, Trash2, Save, Info } from 'lucide-react';

function uuid() { return crypto.randomUUID(); }

export default function ConfigPage() {
  const { currentProperty, saveProperty, mode } = useData();
  const [prop, setProp] = useState<Property | null>(null);
  const [saved, setSaved] = useState(false);
  const [hasUnsaved, setHasUnsaved] = useState(false);

  useEffect(() => {
    if (currentProperty) { setProp(JSON.parse(JSON.stringify(currentProperty))); setHasUnsaved(false); }
  }, [currentProperty?.id]);

  if (!prop) return (
    <div className="p-6 text-sm space-y-2" style={{ color: '#3A6878' }}>
      <div className="font-semibold" style={{ color: '#1A3C4A' }}>No property found</div>
      <div>Use the sidebar to select an existing property, or go to <strong>Manage Properties</strong> to create one.</div>
    </div>
  );

  const totalRooms = prop.roomTypes.reduce((s, r) => s + r.numRooms, 0);
  const totalCredits = prop.roomTypes.reduce((s, r) => s + r.numRooms * r.credits, 0);
  const avgCredit = totalRooms > 0 ? totalCredits / totalRooms : 0;

  const handleSave = () => {
    if (mode === 'demo') { return; }
    saveProperty({ ...prop, numRooms: totalRooms });
    setSaved(true);
    setHasUnsaved(false);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateRoom = (id: string, field: keyof RoomType, value: string) => {
    setHasUnsaved(true);
    setProp(p => p ? ({
      ...p,
      roomTypes: p.roomTypes.map(r => r.id === id ? { ...r, [field]: field === 'name' ? value : parseFloat(value) || 0 } : r)
    }) : p);
  };

  const addRoom = () => { setHasUnsaved(true); setProp(p => p ? ({ ...p, roomTypes: [...p.roomTypes, { id: uuid(), name: `Type ${p.roomTypes.length + 1}`, numRooms: 0, credits: 1 }] }) : p); };
  const removeRoom = (id: string) => { setHasUnsaved(true); setProp(p => p ? ({ ...p, roomTypes: p.roomTypes.filter(r => r.id !== id) }) : p); };

  const updateRule = (id: string, field: keyof ContractRule, value: string) => {
    setHasUnsaved(true);
    setProp(p => p ? ({
      ...p,
      contractRules: p.contractRules.map(r => {
        if (r.id !== id) return r;
        if (field === 'description') return { ...r, description: value };
        if (field === 'seasonStart' || field === 'seasonEnd') return { ...r, [field]: value || undefined };
        if (field === 'minDepartures') return { ...r, minDepartures: value === '' ? null : parseInt(value) };
        return { ...r, [field]: parseFloat(value) || 0 };
      })
    }) : p);
  };

  const addRule = () => {
    setHasUnsaved(true);
    const ruleNumber = prop.contractRules.length + 1;
    setProp(p => p ? ({
      ...p,
      contractRules: [...p.contractRules, { id: uuid(), ruleNumber, minDepartures: null, maxCredits: 13, description: '' }]
    }) : p);
  };
  const removeRule = (id: string) => { setHasUnsaved(true); setProp(p => p ? ({ ...p, contractRules: p.contractRules.filter(r => r.id !== id) }) : p); };

  const sortedRules = [...prop.contractRules].sort((a, b) => b.maxCredits - a.maxCredits);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#1A3C4A' }}>Configuration</h1>
          <p className="text-sm mt-0.5" style={{ color: '#3A6878' }}>{prop.name}</p>
        </div>
        <div className="flex items-center gap-3">
          {hasUnsaved && mode !== 'demo' && (
            <span className="text-xs flex items-center gap-1.5" style={{ color: '#b45309' }}>
              <span className="inline-block w-2 h-2 rounded-full" style={{ background: '#f59e0b' }}></span>
              Unsaved changes
            </span>
          )}
          <button onClick={handleSave} disabled={mode === 'demo'} className={`btn-primary flex items-center gap-2 ${saved ? 'opacity-80' : ''} ${mode === 'demo' ? 'opacity-50 cursor-not-allowed' : ''}`} title={mode === 'demo' ? 'Create a free account to save data' : undefined}>
            <Save size={14} /> {mode === 'demo' ? 'Create Account to Save' : saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* General */}
      <div className="card p-5">
        <h2 className="font-semibold text-sm mb-4" style={{ color: '#1A3C4A' }}>General Settings</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="sm:col-span-1">
            <label className="block text-xs font-medium mb-1" style={{ color: '#1A3C4A' }}>Hotel Name</label>
            <input
              value={prop.name}
              onChange={e => { setHasUnsaved(true); setProp(p => p ? { ...p, name: e.target.value } : p); }}
              className="w-full border rounded px-3 py-2 text-sm" style={{ borderColor: '#D0DDE2' }}
              disabled={false}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#1A3C4A' }}>Shift Length (hours)</label>
            <input
              type="number" min="1" step="0.5"
              value={prop.shiftHours}
              onChange={e => { setHasUnsaved(true); setProp(p => p ? { ...p, shiftHours: parseFloat(e.target.value) || 8 } : p); }}
              className="w-full border rounded px-3 py-2 text-sm" style={{ borderColor: '#D0DDE2' }}
              disabled={false}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#1A3C4A' }}>Total Rooms (auto)</label>
            <div className="border rounded px-3 py-2 text-sm font-medium" style={{ borderColor: '#D0DDE2', background: '#F5F7F8', color: '#1A3C4A' }}>
              {totalRooms}
            </div>
          </div>
        </div>
      </div>

      {/* Room Types */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-sm" style={{ color: '#1A3C4A' }}>Room Types & Credits</h2>
            <p className="text-xs mt-0.5" style={{ color: '#3A6878' }}>
              Avg credit/room: <strong>{avgCredit.toFixed(3)}</strong> · Total credits: <strong>{totalCredits.toFixed(1)}</strong>
            </p>
          </div>
          <button onClick={addRoom} className="btn-ghost flex items-center gap-1 text-xs">
            <Plus size={12} /> Add Type
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#F5F7F8' }}>
                <th className="text-left px-2 py-2 text-xs font-semibold" style={{ color: '#3A6878' }}>Room Type</th>
                <th className="text-right px-2 py-2 text-xs font-semibold" style={{ color: '#3A6878' }}># of Rooms</th>
                <th className="text-right px-2 py-2 text-xs font-semibold" style={{ color: '#3A6878' }}>Credits / Room</th>
                <th className="text-right px-2 py-2 text-xs font-semibold" style={{ color: '#3A6878' }}>Total Credits</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {prop.roomTypes.map((rt) => (
                <tr key={rt.id} className="border-t" style={{ borderColor: '#D0DDE2' }}>
                  <td className="px-2 py-1.5">
                    <input value={rt.name} onChange={e => updateRoom(rt.id, 'name', e.target.value)} className="border rounded px-2 py-1 text-xs w-full" style={{ borderColor: '#D0DDE2' }} disabled={false} />
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    <input type="number" min="0" value={rt.numRooms} onChange={e => updateRoom(rt.id, 'numRooms', e.target.value)} className="border rounded px-2 py-1 text-xs w-20 text-right" style={{ borderColor: '#D0DDE2' }} disabled={false} />
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    <input type="number" min="0" step="0.25" value={rt.credits} onChange={e => updateRoom(rt.id, 'credits', e.target.value)} className="border rounded px-2 py-1 text-xs w-20 text-right" style={{ borderColor: '#D0DDE2' }} disabled={false} />
                  </td>
                  <td className="px-2 py-1.5 text-right text-xs font-medium" style={{ color: '#1A3C4A' }}>
                    {(rt.numRooms * rt.credits).toFixed(1)}
                  </td>
                  <td className="px-2 py-1.5">
                    <button onClick={() => removeRoom(rt.id)} className="text-red-400 hover:text-red-600">
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
              <tr className="border-t font-semibold" style={{ borderColor: '#D0DDE2', background: '#FBE8DC' }}>
                <td className="px-2 py-1.5 text-xs">Total</td>
                <td className="px-2 py-1.5 text-right text-xs">{totalRooms}</td>
                <td className="px-2 py-1.5"></td>
                <td className="px-2 py-1.5 text-right text-xs">{totalCredits.toFixed(1)}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Contract Rules */}
      <div className="card p-5">
        <div className="mb-4">
          <h2 className="font-semibold text-sm" style={{ color: '#1A3C4A' }}>Departure Drop Rules</h2>
          <p className="text-xs mt-0.5 mb-3" style={{ color: '#3A6878' }}>Rules are applied in order from highest to lowest max credits.</p>
          <div className="flex items-start gap-2 p-3 rounded text-xs" style={{ background: '#e0f2fe', color: '#0369a1' }}>
            <Info size={14} className="flex-shrink-0 mt-0.5" />
            <div>
              <strong>How rules work:</strong> Rule 1 sets the baseline max credits per RA. Each additional rule triggers when departures per RA exceed a threshold — lowering max credits raises the RA count for heavy departure days.
              Optionally set a season (MM-DD format, e.g. 06-01) to activate a rule only during certain months.
            </div>
          </div>
        </div>
        <div className="flex justify-end mb-3">
          <button onClick={addRule} className="btn-ghost flex items-center gap-1 text-xs">
            <Plus size={12} /> Add Rule
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#F5F7F8' }}>
                <th className="text-left px-2 py-2 text-xs font-semibold" style={{ color: '#3A6878' }}>Rule</th>
                <th className="text-right px-2 py-2 text-xs font-semibold" style={{ color: '#3A6878' }}>Min Dep/RA</th>
                <th className="text-right px-2 py-2 text-xs font-semibold" style={{ color: '#3A6878' }}>Max Credits</th>
                <th className="text-left px-2 py-2 text-xs font-semibold" style={{ color: '#3A6878' }}>Description</th>
                <th className="text-center px-2 py-2 text-xs font-semibold" style={{ color: '#3A6878' }}>Season Start</th>
                <th className="text-center px-2 py-2 text-xs font-semibold" style={{ color: '#3A6878' }}>Season End</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {sortedRules.map((rule, idx) => (
                <tr key={rule.id} className="border-t" style={{ borderColor: '#D0DDE2' }}>
                  <td className="px-2 py-1.5 text-xs font-medium" style={{ color: '#3A6878' }}>Rule {idx + 1}</td>
                  <td className="px-2 py-1.5 text-right">
                    <input
                      type="number" min="1"
                      value={rule.minDepartures ?? ''}
                      onChange={e => updateRule(rule.id, 'minDepartures', e.target.value)}
                      className="border rounded px-2 py-1 text-xs w-16 text-right"
                      style={{ borderColor: '#D0DDE2' }}
                      placeholder="—"
                      disabled={false}
                    />
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    <input
                      type="number" min="1" step="0.5"
                      value={rule.maxCredits}
                      onChange={e => updateRule(rule.id, 'maxCredits', e.target.value)}
                      className="border rounded px-2 py-1 text-xs w-16 text-right"
                      style={{ borderColor: '#D0DDE2' }}
                      disabled={false}
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      value={rule.description}
                      onChange={e => updateRule(rule.id, 'description', e.target.value)}
                      className="border rounded px-2 py-1 text-xs w-full"
                      style={{ borderColor: '#D0DDE2' }}
                      disabled={false}
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      value={rule.seasonStart ?? ''}
                      onChange={e => updateRule(rule.id, 'seasonStart', e.target.value)}
                      className="border rounded px-2 py-1 text-xs w-20"
                      style={{ borderColor: '#D0DDE2' }}
                      placeholder="MM-DD"
                      disabled={false}
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      value={rule.seasonEnd ?? ''}
                      onChange={e => updateRule(rule.id, 'seasonEnd', e.target.value)}
                      className="border rounded px-2 py-1 text-xs w-20"
                      style={{ borderColor: '#D0DDE2' }}
                      placeholder="MM-DD"
                      disabled={false}
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <button onClick={() => removeRule(rule.id)} className="text-red-400 hover:text-red-600">
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        {hasUnsaved && mode !== 'demo' && (
          <span className="text-xs flex items-center gap-1.5" style={{ color: '#b45309' }}>
            <span className="inline-block w-2 h-2 rounded-full" style={{ background: '#f59e0b' }}></span>
            Unsaved changes
          </span>
        )}
        <button onClick={handleSave} disabled={mode === 'demo'} className={`btn-primary flex items-center gap-2 ${saved ? 'opacity-80' : ''} ${mode === 'demo' ? 'opacity-50 cursor-not-allowed' : ''}`} title={mode === 'demo' ? 'Create a free account to save data' : undefined}>
          <Save size={14} /> {mode === 'demo' ? 'Create Account to Save' : saved ? 'Saved!' : 'Save All Changes'}
        </button>
      </div>
    </div>
  );
}
