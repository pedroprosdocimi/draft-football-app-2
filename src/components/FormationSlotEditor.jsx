import React, { useCallback, useEffect, useRef, useState } from 'react';
import { API_URL } from '../config.js';
import { getFormationPreviewLayout } from './FormationPreview.jsx';

// detailed_position_id → label
const POSITION_LABELS = {
  1: 'GOL', 2: 'ZAG', 3: 'LD', 4: 'LE', 5: 'VOL',
  6: 'MC', 7: 'MEI', 8: 'ME', 9: 'MD', 10: 'CA', 11: 'PE', 12: 'PD', 13: 'SA',
};

const BADGE_STYLES = {
  GOL: 'border-sky-400 bg-sky-900 text-sky-100',
  ZAG: 'border-emerald-400 bg-emerald-900 text-emerald-100',
  LD:  'border-emerald-400 bg-emerald-900 text-emerald-100',
  LE:  'border-emerald-400 bg-emerald-900 text-emerald-100',
  VOL: 'border-emerald-400 bg-emerald-900 text-emerald-100',
  MC:  'border-amber-400 bg-amber-900 text-amber-100',
  MEI: 'border-amber-400 bg-amber-900 text-amber-100',
  ME:  'border-amber-400 bg-amber-900 text-amber-100',
  MD:  'border-amber-400 bg-amber-900 text-amber-100',
  CA:  'border-rose-400 bg-rose-900 text-rose-100',
  PE:  'border-rose-400 bg-rose-900 text-rose-100',
  PD:  'border-rose-400 bg-rose-900 text-rose-100',
  SA:  'border-rose-400 bg-rose-900 text-rose-100',
};

function buildDefaultPositions(formation) {
  const layout = getFormationPreviewLayout(formation);
  const positions = {};
  layout.forEach(({ position, left, top }) => {
    positions[position] = { x: left, y: top };
  });
  return positions;
}

function initPositions(formation) {
  const defaults = buildDefaultPositions(formation);
  const result = {};
  (formation.slots || []).forEach((slot) => {
    const stored = slot.x !== 0 || slot.y !== 0
      ? { x: slot.x, y: slot.y }
      : defaults[slot.position] || { x: 50, y: 50 };
    result[slot.position] = stored;
  });
  return result;
}

export default function FormationSlotEditor({ formation, onClose, onSaved }) {
  const fieldRef = useRef(null);
  const [positions, setPositions] = useState(() => initPositions(formation));
  const [dragging, setDragging] = useState(null); // slot position number being dragged
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const getFieldRect = () => fieldRef.current?.getBoundingClientRect();

  const handlePointerDown = useCallback((e, slotPosition) => {
    e.preventDefault();
    setDragging(slotPosition);
    fieldRef.current?.setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e) => {
    if (dragging === null) return;
    const rect = getFieldRect();
    if (!rect) return;
    const x = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));
    setPositions((prev) => ({ ...prev, [dragging]: { x, y } }));
  }, [dragging]);

  const handlePointerUp = useCallback(() => {
    setDragging(null);
  }, []);

  const handleReset = () => {
    setPositions(buildDefaultPositions(formation));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const slots = (formation.slots || []).map((slot) => ({
      position: slot.position,
      x: positions[slot.position]?.x ?? 50,
      y: positions[slot.position]?.y ?? 50,
    }));
    try {
      const token = localStorage.getItem('draft_token');
      const res = await fetch(
        `${API_URL}/admin/formations/${encodeURIComponent(formation.name)}/slots`,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ slots }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar posicoes.');
      onSaved(formation.name, slots);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-2xl flex-col gap-4 rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
        {/* header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-white">{formation.name}</h2>
            <p className="text-xs text-slate-400">Arraste as bolinhas para reposicionar os jogadores no campo.</p>
          </div>
          <button onClick={onClose} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-400 hover:border-white/30 hover:text-white">
            Fechar
          </button>
        </div>

        {/* field */}
        <div
          ref={fieldRef}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="relative mx-auto w-full select-none overflow-hidden rounded-2xl border border-emerald-300/15 bg-emerald-950"
          style={{
            aspectRatio: '2 / 3',
            maxHeight: '60vh',
            backgroundImage:
              'linear-gradient(180deg, rgba(34,197,94,0.12) 0%, rgba(6,78,59,0.5) 45%, rgba(2,44,34,0.92) 100%), repeating-linear-gradient(180deg, rgba(255,255,255,0.03) 0, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 42px)',
            cursor: dragging !== null ? 'grabbing' : 'default',
          }}
        >
          {/* field markings */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(110,231,183,0.14),transparent_34%),radial-gradient(circle_at_bottom,rgba(16,185,129,0.12),transparent_30%)]" />
          <div className="pointer-events-none absolute inset-3 rounded-[18px] border border-white/10" />
          <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/10" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute left-1/2 top-3 h-8 w-20 -translate-x-1/2 rounded-b-[14px] border border-t-0 border-white/10" />
          <div className="pointer-events-none absolute bottom-3 left-1/2 h-8 w-20 -translate-x-1/2 rounded-t-[14px] border border-b-0 border-white/10" />
          <div className="pointer-events-none absolute left-1/2 top-3 h-4 w-10 -translate-x-1/2 rounded-b-[8px] border border-t-0 border-white/10" />
          <div className="pointer-events-none absolute bottom-3 left-1/2 h-4 w-10 -translate-x-1/2 rounded-t-[8px] border border-b-0 border-white/10" />

          {/* player badges */}
          {(formation.slots || []).map((slot) => {
            const label = POSITION_LABELS[slot.detailed_position_id] || '?';
            const badgeStyle = BADGE_STYLES[label] || 'border-white/20 bg-slate-800 text-white';
            const pos = positions[slot.position] || { x: 50, y: 50 };
            const isDragging = dragging === slot.position;

            return (
              <div
                key={slot.position}
                onPointerDown={(e) => handlePointerDown(e, slot.position)}
                className={`absolute flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 cursor-grab items-center justify-center rounded-full border-2 text-[10px] font-black shadow-lg transition-shadow ${badgeStyle} ${isDragging ? 'scale-110 cursor-grabbing shadow-2xl ring-2 ring-white/40' : 'hover:scale-105 hover:ring-1 hover:ring-white/20'}`}
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  touchAction: 'none',
                  zIndex: isDragging ? 10 : 1,
                  transition: isDragging ? 'none' : 'transform 0.1s',
                }}
              >
                {label}
              </div>
            );
          })}
        </div>

        {/* footer */}
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={handleReset}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-400 hover:border-white/30 hover:text-white"
          >
            Resetar posicoes
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar posicoes'}
          </button>
        </div>
      </div>
    </div>
  );
}
