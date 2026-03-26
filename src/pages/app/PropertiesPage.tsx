import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Property, RoomType, ContractRule } from '../../types';
import { Building2, Plus, Trash2, ChevronRight, Edit2 } from 'lucide-react';

export default function PropertiesPage() {
  const { user } = useAuth();
  const { mode, properties, saveProperty, deleteProperty, setCurrentPropertyId } = useData();
  const navigate = useNavigate();
  const location = useLocation();
  const [showForm, setShowForm] = useState(false);

  const basePath = location.pathname.startsWith('/local') ? '/local' : '/app';
  const effectiveUserId = mode === 'local' ? 'local-user' : (user?.id ?? 'local-user');

  const handleCreate = () => {
    setShowForm(true);
  };

  const handleOpen = (p: Property) => {
    setCurrentPropertyId(p.id);
    navigate(`${basePath}/${p.id}/weekly`);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this property and all its data?')) deleteProperty(id);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#1A3C4A' }}>My Properties</h1>
          <p className="text-sm mt-1" style={{ color: '#3A6878' }}>{user?.name ? `Welcome, ${user.name}` : 'Local Mode — data saved in this browser'}</p>
        </div>
        <button onClick={handleCreate} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Property
        </button>
      </div>

      {properties.length === 0 && !showForm && (
        <div className="card p-10 text-center">
          <Building2 size={40} className="mx-auto mb-3" style={{ color: '#D0DDE2' }} />
          <p className="font-medium mb-1" style={{ color: '#1A3C4A' }}>No properties yet</p>
          <p className="text-sm mb-4" style={{ color: '#3A6878' }}>Add your first hotel to get started.</p>
          <button onClick={handleCreate} className="btn-primary inline-flex items-center gap-2">
            <Plus size={14} /> Add Property
          </button>
        </div>
      )}

      <div className="space-y-3">
        {properties.map(p => (
          <div key={p.id} className="card p-4 flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => handleOpen(p)}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: '#FBE8DC' }}>
                <Building2 size={18} style={{ color: '#C86848' }} />
              </div>
              <div>
                <div className="font-semibold text-sm" style={{ color: '#1A3C4A' }}>{p.name}</div>
                <div className="text-xs" style={{ color: '#3A6878' }}>
                  {p.numRooms} rooms · {p.roomTypes.length} room types · {p.contractRules.length} rules
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setCurrentPropertyId(p.id); navigate(`${basePath}/${p.id}/config`); }}
                className="p-2 rounded hover:bg-gray-100 transition-colors"
                title="Configure"
              >
                <Edit2 size={14} style={{ color: '#3A6878' }} />
              </button>
              <button
                onClick={() => handleDelete(p.id)}
                className="p-2 rounded hover:bg-red-50 transition-colors"
                title="Delete"
              >
                <Trash2 size={14} style={{ color: '#b91c1c' }} />
              </button>
              <button onClick={() => handleOpen(p)} className="p-2 rounded hover:bg-gray-100">
                <ChevronRight size={14} style={{ color: '#3A6878' }} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <PropertyForm
          userId={effectiveUserId}
          onSave={(p) => { saveProperty(p); setShowForm(false); setCurrentPropertyId(p.id); navigate(`${basePath}/${p.id}/config`); }}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

function PropertyForm({ userId, onSave, onCancel }: { userId: string; onSave: (p: Property) => void; onCancel: () => void }) {
  const [name, setName] = useState('');
  const [numRooms, setNumRooms] = useState('');
  const [shiftHours, setShiftHours] = useState('8');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p: Property = {
      id: crypto.randomUUID(),
      userId,
      name: name.trim(),
      numRooms: parseInt(numRooms),
      shiftHours: parseFloat(shiftHours),
      roomTypes: [{ id: crypto.randomUUID(), name: 'Standard', numRooms: parseInt(numRooms), credits: 1 }],
      contractRules: [{ id: crypto.randomUUID(), ruleNumber: 1, minDepartures: null, maxCredits: 13, description: 'Maximum 13 credits at all times' }],
      createdAt: new Date().toISOString(),
    };
    onSave(p);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="card p-6 w-full max-w-md">
        <h2 className="font-bold text-lg mb-4" style={{ color: '#1A3C4A' }}>New Property</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#1A3C4A' }}>Hotel Name</label>
            <input required value={name} onChange={e => setName(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" style={{ borderColor: '#D0DDE2' }} placeholder="Grand Hotel Example" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#1A3C4A' }}>Total Rooms</label>
              <input required type="number" min="1" value={numRooms} onChange={e => setNumRooms(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" style={{ borderColor: '#D0DDE2' }} placeholder="255" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#1A3C4A' }}>Shift Hours</label>
              <input required type="number" min="1" step="0.5" value={shiftHours} onChange={e => setShiftHours(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" style={{ borderColor: '#D0DDE2' }} placeholder="8" />
            </div>
          </div>
          <p className="text-xs" style={{ color: '#3A6878' }}>You can add room types and contract rules in the Configuration page.</p>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
            <button type="submit" className="btn-primary">Create & Configure</button>
          </div>
        </form>
      </div>
    </div>
  );
}
