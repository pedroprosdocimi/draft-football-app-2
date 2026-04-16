import React, { useState, useEffect, useMemo } from 'react';
import { API_URL } from '../config.js';
import { getFormationPreviewLayout } from '../components/FormationPreview.jsx';
import FieldPlayerPreview from '../components/FieldPlayerPreview.jsx';
import PlayerStatsModal from '../components/PlayerStatsModal.jsx';
import { getDetailedPositionLabel } from '../utils/positions.js';

const BENCH_SLOTS = [
  { slot: 12, label: 'RES 1' },
  { slot: 13, label: 'RES 2' },
  { slot: 14, label: 'RES 3' },
  { slot: 15, label: 'RES 4' },
  { slot: 16, label: 'RES 5' },
  { slot: 17, label: 'RES 6' },
  { slot: 18, label: 'RES 7' },
];

function normalizePlayer(pick) {
  if (!pick) return null;
  return { ...pick, id: pick.id ?? pick.player_id ?? null };
}

export default function EndScreen({ draftId, onGoHome }) {
  const [draft, setDraft] = useState(null);
  const [formations, setFormations] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('draft_token');
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${API_URL}/drafts/${draftId}`, { headers }).then(r => r.json()),
      fetch(`${API_URL}/formations?include_inactive=true`, { headers }).then(r => r.json()),
    ]).then(([draftData, formData]) => {
      setDraft(draftData);
      setFormations(formData.data || []);
    });
  }, [draftId]);

  const picksBySlot = useMemo(() => {
    const map = {};
    for (const p of draft?.picks || []) map[p.slot_position] = p;
    return map;
  }, [draft]);

  const formationSlots = useMemo(() => {
    if (!formations.length || !draft?.formation) return [];
    const f = formations.find(f => f.name === draft.formation);
    return f ? f.slots : [];
  }, [formations, draft]);

  const starterPlacements = useMemo(() => {
    if (!draft?.formation || !formationSlots.length) return [];
    return getFormationPreviewLayout({ name: draft.formation, slots: formationSlots });
  }, [draft?.formation, formationSlots]);

  if (!draft) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-700 border-t-draft-gold" />
          <p className="text-gray-400">Carregando resultado...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] overflow-hidden flex flex-col p-3 sm:p-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <button onClick={onGoHome} className="text-xs text-gray-600 hover:text-white">&larr; Sair</button>
        <span className="text-xs text-gray-500 font-mono uppercase">
          {draft.formation} · Draft Completo
        </span>
        <span className="text-xs text-gray-600">{(draft.picks || []).length}/{11 + BENCH_SLOTS.length} picks</span>
      </div>

      {/* Field */}
      <div className="flex-1 min-h-0 bg-green-950/40 border border-green-900/30 rounded-2xl p-2.5 sm:p-3">
        <div
          className="relative mx-auto h-full min-h-0 w-full overflow-hidden rounded-[26px] border border-emerald-300/15 bg-emerald-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_20px_60px_rgba(0,0,0,0.35)] sm:rounded-[30px]"
          style={{
            backgroundImage:
              'linear-gradient(180deg, rgba(34,197,94,0.12) 0%, rgba(6,78,59,0.5) 45%, rgba(2,44,34,0.92) 100%), repeating-linear-gradient(180deg, rgba(255,255,255,0.03) 0, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 42px)',
          }}
        >
          {/* Field markings */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(110,231,183,0.14),transparent_34%),radial-gradient(circle_at_bottom,rgba(16,185,129,0.12),transparent_30%)]" />
          <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/8 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/20 to-transparent" />
          <div className="absolute inset-3 rounded-[22px] border border-white/10" />
          <div className="absolute left-6 right-6 top-1/2 h-px -translate-y-1/2 bg-white/10" />
          <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
          <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30" />
          <div className="absolute left-1/2 top-3 h-12 w-28 -translate-x-1/2 rounded-b-[20px] border border-t-0 border-white/10" />
          <div className="absolute left-1/2 bottom-3 h-12 w-28 -translate-x-1/2 rounded-t-[20px] border border-b-0 border-white/10" />
          <div className="absolute left-1/2 top-3 h-6 w-14 -translate-x-1/2 rounded-b-[14px] border border-t-0 border-white/10" />
          <div className="absolute left-1/2 bottom-3 h-6 w-14 -translate-x-1/2 rounded-t-[14px] border border-b-0 border-white/10" />

          {/* Starter player cards */}
          {starterPlacements.map((slot) => {
            const pick = picksBySlot[slot.position];
            const player = normalizePlayer(pick);
            const isCaptain = player && draft.captain_player_id &&
              String(player.id) === String(draft.captain_player_id);
            const posLabel = getDetailedPositionLabel(slot.detailed_position_id) || '?';

            return (
              <div
                key={slot.key}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ top: `${slot.top}%`, left: `${slot.left}%`, zIndex: 20 }}
              >
                {player ? (
                  <div
                    onClick={() => setSelectedCard(player)}
                    style={{ cursor: 'pointer', position: 'relative', touchAction: 'manipulation' }}
                  >
                    {isCaptain && (
                      <div className="absolute -top-2 left-1/2 z-20 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full border border-amber-200/90 bg-amber-400 text-[11px] font-black text-slate-950 shadow-[0_10px_18px_rgba(0,0,0,0.32)]">
                        C
                      </div>
                    )}
                    <FieldPlayerPreview
                      player={player}
                      posLabel={posLabel}
                      slotPositionId={slot.detailed_position_id}
                    />
                  </div>
                ) : (
                  <div className="flex min-w-[5.5rem] flex-col items-center gap-1.5 rounded-[24px] border border-dashed border-white/15 bg-slate-950/30 px-2.5 py-2 text-center opacity-40">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-slate-950/60 text-[11px] font-bold text-white/50">
                      {posLabel}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bench — always-open right panel (mirrors bench drawer) */}
      <aside
        className="pointer-events-auto fixed inset-y-0 right-0 z-40 h-screen w-[min(56vw,11rem)] rounded-l-3xl border border-r-0 border-white/10 bg-slate-500/50 px-3 py-5 shadow-[-24px_0_50px_rgba(0,0,0,0.4)] backdrop-blur-md sm:w-[12rem]"
      >
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            onClick={onGoHome}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/15 text-sm font-black text-emerald-400 transition hover:bg-emerald-500/30"
            title="Voltar"
          >
            ✓
          </button>
        </div>

        <div className="flex h-[calc(100%-4.5rem)] flex-col items-center gap-2 overflow-y-auto pr-1">
          {BENCH_SLOTS.map(({ slot, label }) => {
            const pick = picksBySlot[slot];
            const player = normalizePlayer(pick);
            const posLabel = player ? getDetailedPositionLabel(player.detailed_position_id) : null;

            if (player) {
              return (
                <div
                  key={slot}
                  onClick={() => setSelectedCard(player)}
                  style={{
                    flexShrink: 0,
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    touchAction: 'manipulation',
                  }}
                >
                  <FieldPlayerPreview player={player} posLabel={posLabel} />
                </div>
              );
            }

            return (
              <div
                key={slot}
                className="flex flex-col items-center justify-center gap-1 rounded-[20px] border-2 border-dashed border-gray-700/50 opacity-40"
                style={{ flexShrink: 0, width: '5rem', height: '6.6rem' }}
              >
                <span className="text-[11px] font-bold text-gray-500">{label}</span>
              </div>
            );
          })}
        </div>
      </aside>

      {selectedCard && (
        <PlayerStatsModal player={selectedCard} onClose={() => setSelectedCard(null)} />
      )}
    </div>
  );
}
