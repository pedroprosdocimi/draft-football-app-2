import React, { useCallback, useEffect, useRef, useState } from 'react';
import { API_URL } from '../config.js';
import { getFormationPreviewLayout } from './FormationPreview.jsx';
import FieldPlayerPreview from './FieldPlayerPreview.jsx';
import { getDetailedPositionLabel } from '../utils/positions.js';

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
  // playersByDetailedPos: { [detailed_position_id]: PoolPlayer }
  const [playersByPos, setPlayersByPos] = useState({});
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [dragging, setDragging] = useState(null); // slot position number
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Fetch one best player per unique detailed_position_id
  useEffect(() => {
    const uniqueIds = [...new Set((formation.slots || []).map((s) => s.detailed_position_id))];
    const token = localStorage.getItem('draft_token');

    Promise.all(
      uniqueIds.map((id) =>
        fetch(`${API_URL}/admin/player-cards?detailed_position_id=${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((r) => r.json())
          .then((data) => ({ id, players: data.players || [] }))
          .catch(() => ({ id, players: [] }))
      )
    ).then((results) => {
      const map = {};
      results.forEach(({ id, players }) => {
        // Pick the player with the highest avg_score
        if (players.length > 0) {
          map[id] = players.reduce((best, p) =>
            (p.avg_score || 0) > (best.avg_score || 0) ? p : best
          , players[0]);
        }
      });
      setPlayersByPos(map);
      setLoadingPlayers(false);
    });
  }, [formation]);

  const handlePointerDown = useCallback((e, slotPosition) => {
    e.preventDefault();
    setDragging(slotPosition);
    fieldRef.current?.setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e) => {
    if (dragging === null) return;
    const rect = fieldRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));
    setPositions((prev) => ({ ...prev, [dragging]: { x, y } }));
  }, [dragging]);

  const handlePointerUp = useCallback(() => setDragging(null), []);

  const handleReset = () => setPositions(buildDefaultPositions(formation));

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

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-4xl flex-col gap-4 rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
        {/* header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-white">{formation.name}</h2>
            <p className="text-xs text-slate-400">
              Arraste os cards para reposicionar os jogadores no campo.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-400 hover:border-white/30 hover:text-white"
          >
            Fechar
          </button>
        </div>

        {/* field */}
        <div
          ref={fieldRef}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="relative mx-auto w-full select-none overflow-visible rounded-2xl border border-emerald-300/15 bg-emerald-950"
          style={{
            aspectRatio: '3 / 4',
            maxHeight: '70vh',
            backgroundImage:
              'linear-gradient(180deg, rgba(34,197,94,0.12) 0%, rgba(6,78,59,0.5) 45%, rgba(2,44,34,0.92) 100%), repeating-linear-gradient(180deg, rgba(255,255,255,0.03) 0, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 42px)',
            cursor: dragging !== null ? 'grabbing' : 'default',
          }}
        >
          {/* field markings */}
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_top,rgba(110,231,183,0.14),transparent_34%),radial-gradient(circle_at_bottom,rgba(16,185,129,0.12),transparent_30%)]" />
          <div className="pointer-events-none absolute inset-3 rounded-[18px] border border-white/10" />
          <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/10" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute left-1/2 top-3 h-10 w-24 -translate-x-1/2 rounded-b-[16px] border border-t-0 border-white/10" />
          <div className="pointer-events-none absolute bottom-3 left-1/2 h-10 w-24 -translate-x-1/2 rounded-t-[16px] border border-b-0 border-white/10" />
          <div className="pointer-events-none absolute left-1/2 top-3 h-5 w-12 -translate-x-1/2 rounded-b-[10px] border border-t-0 border-white/10" />
          <div className="pointer-events-none absolute bottom-3 left-1/2 h-5 w-12 -translate-x-1/2 rounded-t-[10px] border border-b-0 border-white/10" />

          {/* player cards */}
          {loadingPlayers ? (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-emerald-300/60">
              Carregando jogadores...
            </div>
          ) : (
            (formation.slots || []).map((slot) => {
              const pos = positions[slot.position] || { x: 50, y: 50 };
              const isDragging = dragging === slot.position;
              const player = playersByPos[slot.detailed_position_id] || null;
              const posLabel = getDetailedPositionLabel(slot.detailed_position_id);

              return (
                <div
                  key={slot.position}
                  onPointerDown={(e) => handlePointerDown(e, slot.position)}
                  style={{
                    position: 'absolute',
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    transform: 'translate(-50%, -50%)',
                    touchAction: 'none',
                    zIndex: isDragging ? 20 : 1,
                    cursor: isDragging ? 'grabbing' : 'grab',
                    filter: isDragging ? 'drop-shadow(0 12px 28px rgba(0,0,0,0.7))' : undefined,
                    transition: isDragging ? 'none' : 'filter 0.15s',
                  }}
                >
                  <FieldPlayerPreview player={player} posLabel={posLabel} />
                </div>
              );
            })
          )}
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
