import React, { useState, useRef } from 'react';
import { X, ClipboardPaste, CheckCircle, AlertCircle, Copy } from 'lucide-react';

export interface ColDef {
  key: string;
  label: string;
  type: 'date' | 'int' | 'float' | 'pct' | 'text';
  required?: boolean;
}

interface ParsedRow {
  values: Record<string, string | number | null>;
  errors: string[];
}

interface Props {
  title: string;
  columns: ColDef[];
  onImport: (rows: Record<string, string | number | null>[]) => void;
  onClose: () => void;
}

function parseCell(raw: string, type: ColDef['type']): string | number | null {
  const s = raw.trim();
  if (s === '' || s === '-' || s === '–' || s.toLowerCase() === 'n/a') return null;
  if (type === 'date') {
    // Accept YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const parts = s.split(/[\/\-\.]/);
    if (parts.length === 3) {
      const [a, b, c] = parts.map(Number);
      if (c > 31) return `${c}-${String(b).padStart(2,'0')}-${String(a).padStart(2,'0')}`;
      if (a > 31) return `${a}-${String(b).padStart(2,'0')}-${String(c).padStart(2,'0')}`;
    }
    return null;
  }
  if (type === 'pct') {
    const n = parseFloat(s.replace('%', ''));
    if (isNaN(n)) return null;
    return s.includes('%') ? n / 100 : n;
  }
  if (type === 'int') {
    const n = parseInt(s);
    return isNaN(n) ? null : n;
  }
  if (type === 'float') {
    const n = parseFloat(s);
    return isNaN(n) ? null : n;
  }
  return s; // text
}

function parseRows(text: string, columns: ColDef[]): ParsedRow[] {
  const lines = text.split('\n').map(l => l.trimEnd()).filter(l => l.trim() !== '');
  if (lines.length === 0) return [];

  // Auto-detect if first row is a header
  const firstCells = lines[0].split('\t');
  const looksLikeHeader = firstCells.some(c =>
    columns.some(col => col.label.toLowerCase() === c.trim().toLowerCase() || col.key.toLowerCase() === c.trim().toLowerCase())
  );
  const dataLines = looksLikeHeader ? lines.slice(1) : lines;

  return dataLines.map(line => {
    const cells = line.split('\t');
    const values: Record<string, string | number | null> = {};
    const errors: string[] = [];

    columns.forEach((col, i) => {
      const raw = cells[i] ?? '';
      const parsed = parseCell(raw, col.type);
      if (col.required && parsed === null) {
        errors.push(`${col.label} is required`);
      }
      values[col.key] = parsed;
    });

    return { values, errors };
  });
}

export default function PasteImportModal({ title, columns, onImport, onClose }: Props) {
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const rows = text.trim() ? parseRows(text, columns) : [];
  const validRows = rows.filter(r => r.errors.length === 0);
  const hasErrors = rows.some(r => r.errors.length > 0);

  const templateHeader = columns.map(c => c.label).join('\t');

  const copyTemplate = () => {
    navigator.clipboard.writeText(templateHeader).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleImport = () => {
    if (validRows.length === 0) return;
    onImport(validRows.map(r => r.values));
    onClose();
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4 flex flex-col" style={{ maxHeight: '90vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#D0DDE2' }}>
          <div className="flex items-center gap-2">
            <ClipboardPaste size={18} style={{ color: '#3A6878' }} />
            <h2 className="font-semibold text-sm" style={{ color: '#1A3C4A' }}>Import from Excel — {title}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Step 1 — Template */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#3A6878' }}>
              Step 1 — Copy this header row into Excel, fill in your data, then copy all rows
            </p>
            <div className="flex items-center gap-2 p-3 rounded text-xs font-mono overflow-x-auto" style={{ background: '#F5F7F8', color: '#1A3C4A' }}>
              <span className="flex-1 select-all">{templateHeader}</span>
              <button
                onClick={copyTemplate}
                className="flex-shrink-0 flex items-center gap-1 text-xs px-2 py-1 rounded"
                style={{ background: copied ? '#e8f7ef' : '#D0DDE2', color: copied ? '#065f46' : '#1A3C4A' }}
              >
                {copied ? <CheckCircle size={12} /> : <Copy size={12} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {columns.map(col => (
                <span key={col.key} className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                  <strong>{col.label}</strong>
                  {col.required ? ' *' : ''}
                  {' — '}
                  {col.type === 'date' ? 'YYYY-MM-DD'
                    : col.type === 'pct' ? '0.15 or 15%'
                    : col.type === 'int' ? 'whole number'
                    : col.type === 'float' ? 'decimal'
                    : 'text'}
                </span>
              ))}
            </div>
          </div>

          {/* Step 2 — Paste */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#3A6878' }}>
              Step 2 — Paste your Excel data here (Ctrl+V / Cmd+V)
            </p>
            <textarea
              ref={textareaRef}
              value={text}
              onChange={e => setText(e.target.value)}
              className="w-full border rounded px-3 py-2 text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-teal-500"
              style={{ borderColor: '#D0DDE2', height: 120, background: text ? '#fff' : '#fafafa' }}
              placeholder={`Paste Excel rows here…\n\nExample:\n2026-03-25\t120\t35\t40\t…`}
              autoFocus
            />
          </div>

          {/* Preview */}
          {rows.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#3A6878' }}>
                Step 3 — Preview ({rows.length} row{rows.length !== 1 ? 's' : ''} detected
                {hasErrors ? `, ${rows.filter(r => r.errors.length > 0).length} with errors` : ', all valid'})
              </p>
              <div className="overflow-x-auto rounded border" style={{ borderColor: '#D0DDE2' }}>
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ background: '#F5F7F8' }}>
                      <th className="px-2 py-1.5 text-left font-semibold w-6" style={{ color: '#3A6878' }}>#</th>
                      {columns.map(c => (
                        <th key={c.key} className="px-2 py-1.5 text-right font-semibold first:text-left" style={{ color: '#3A6878' }}>{c.label}</th>
                      ))}
                      <th className="px-2 py-1.5 w-20"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr
                        key={i}
                        className="border-t"
                        style={{
                          borderColor: '#D0DDE2',
                          background: row.errors.length > 0 ? '#fef2f2' : i % 2 === 0 ? '#fff' : '#fafafa'
                        }}
                      >
                        <td className="px-2 py-1 text-gray-400">{i + 1}</td>
                        {columns.map(c => (
                          <td key={c.key} className={`px-2 py-1 ${c.type === 'text' || c.type === 'date' ? 'text-left' : 'text-right'}`} style={{ color: '#1A3C4A' }}>
                            {row.values[c.key] == null ? <span style={{ color: '#9ca3af' }}>–</span> : String(row.values[c.key])}
                          </td>
                        ))}
                        <td className="px-2 py-1">
                          {row.errors.length > 0
                            ? <span className="flex items-center gap-1 text-red-500"><AlertCircle size={11} />{row.errors[0]}</span>
                            : <span className="flex items-center gap-1" style={{ color: '#065f46' }}><CheckCircle size={11} />OK</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t" style={{ borderColor: '#D0DDE2' }}>
          <span className="text-xs" style={{ color: '#9ca3af' }}>
            {validRows.length > 0
              ? `${validRows.length} row${validRows.length !== 1 ? 's' : ''} ready to import`
              : 'Paste data above to preview'}
          </span>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="btn-ghost text-sm px-3 py-1.5">Cancel</button>
            <button
              onClick={handleImport}
              disabled={validRows.length === 0}
              className="btn-primary text-sm px-4 py-1.5"
              style={{ opacity: validRows.length === 0 ? 0.4 : 1 }}
            >
              Import {validRows.length > 0 ? `${validRows.length} row${validRows.length !== 1 ? 's' : ''}` : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
