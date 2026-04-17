import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { API_URL } from '../config.js';
import { getFormationPreviewLayout } from '../components/FormationPreview.jsx';
import FieldPlayerPreview from '../components/FieldPlayerPreview.jsx';
import PlayerStatsModal from '../components/PlayerStatsModal.jsx';
import { getDetailedPositionLabel, matchesDetailedPositionSlot } from '../utils/positions.js';

const BENCH_SLOTS = [
  { slot: 12, label: 'RES 1' },
  { slot: 13, label: 'RES 2' },
  { slot: 14, label: 'RES 3' },
  { slot: 15, label: 'RES 4' },
  { slot: 16, label: 'RES 5' },
  { slot: 17, label: 'RES 6' },
  { slot: 18, label: 'RES 7' },
];

function authFetch(url, options = {}) {
  const token = localStorage.getItem('draft_token');
  return fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}

function normalizePlayer(pick) {
  if (!pick) return null;
  const roundScore = Number.isFinite(pick.round_score) ? pick.round_score : null;
  return {
    ...pick,
    id: pick.id ?? pick.player_id ?? null,
    score_value: roundScore ?? pick.avg_score ?? 0,
    score_label: 'rodada',
  };
}

function getPlayerDisplayName(player) {
  return player?.display_name || player?.name || 'Este jogador';
}

export default function EndScreen({ draftId, user, onGoHome }) {
  const [draft, setDraft] = useState(null);
  const [formations, setFormations] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [isBenchDrawerOpen, setIsBenchDrawerOpen] = useState(false);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [selectedSwapSlot, setSelectedSwapSlot] = useState(null);
  const [swapError, setSwapError] = useState(null);
  const [savingSwap, setSavingSwap] = useState(false);
  const [slotPlayers, setSlotPlayers] = useState({});

  const loadData = useCallback(() => {
    const token = localStorage.getItem('draft_token');
    const headers = { Authorization: `Bearer ${token}` };

    return Promise.all([
      fetch(`${API_URL}/drafts/${draftId}`, { headers }).then((r) => r.json()),
      fetch(`${API_URL}/formations?include_inactive=true`, { headers }).then((r) => r.json()),
    ]).then(([draftData, formData]) => {
      setDraft(draftData);
      setFormations(formData.data || []);
    });
  }, [draftId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const picksBySlot = useMemo(() => {
    const map = {};
    for (const pick of draft?.picks || []) map[pick.slot_position] = normalizePlayer(pick);
    return map;
  }, [draft]);

  useEffect(() => {
    setSlotPlayers(picksBySlot);
  }, [picksBySlot]);

  const formationSlots = useMemo(() => {
    if (!formations.length || !draft?.formation) return [];
    const formation = formations.find((item) => item.name === draft.formation);
    return formation ? formation.slots : [];
  }, [formations, draft]);

  const starterPlacements = useMemo(() => {
    if (!draft?.formation || !formationSlots.length) return [];
    return getFormationPreviewLayout({ name: draft.formation, slots: formationSlots });
  }, [draft?.formation, formationSlots]);

  const canEdit = Boolean(user?.id && draft?.user_id && String(user.id) === String(draft.user_id));

  const showTemporaryError = useCallback((message) => {
    setSwapError(message);
    window.clearTimeout(window.__endScreenSwapErrorTimeout);
    window.__endScreenSwapErrorTimeout = window.setTimeout(() => {
      setSwapError(null);
    }, 5000);
  }, []);

  const isSwapValid = useCallback((slotA, slotB) => {
    if (slotA >= 12 || slotB >= 12) return true;

    const playerA = slotPlayers[slotA];
    const playerB = slotPlayers[slotB];
    if (!playerA || !playerB) return true;

    const slotADef = starterPlacements.find((slot) => slot.position === slotA);
    const slotBDef = starterPlacements.find((slot) => slot.position === slotB);
    if (!slotADef || !slotBDef) return true;

    return (
      matchesDetailedPositionSlot(playerA, slotBDef.detailed_position_id) &&
      matchesDetailedPositionSlot(playerB, slotADef.detailed_position_id)
    );
  }, [slotPlayers, starterPlacements]);

  const getSwapInvalidReason = useCallback((slotA, slotB) => {
    if (slotA >= 12 || slotB >= 12) return null;

    const playerA = slotPlayers[slotA];
    const playerB = slotPlayers[slotB];
    if (!playerA || !playerB) return null;

    const slotADef = starterPlacements.find((slot) => slot.position === slotA);
    const slotBDef = starterPlacements.find((slot) => slot.position === slotB);
    if (!slotADef || !slotBDef) return null;

    if (!matchesDetailedPositionSlot(playerA, slotBDef.detailed_position_id)) {
      return `O jogador ${getPlayerDisplayName(playerA)} não pode jogar na posição ${getDetailedPositionLabel(slotBDef.detailed_position_id)}.`;
    }

    if (!matchesDetailedPositionSlot(playerB, slotADef.detailed_position_id)) {
      return `O jogador ${getPlayerDisplayName(playerB)} não pode jogar na posição ${getDetailedPositionLabel(slotADef.detailed_position_id)}.`;
    }

    return null;
  }, [slotPlayers, starterPlacements]);

  const performSwap = useCallback(async (slotA, slotB) => {
    const playerA = slotPlayers[slotA];
    const playerB = slotPlayers[slotB];
    if (!playerA?.player_id || !playerB?.player_id) return;

    if (!isSwapValid(slotA, slotB)) {
      showTemporaryError(getSwapInvalidReason(slotA, slotB) || 'Troca inválida.');
      return;
    }

    const previous = { ...slotPlayers };
    setSlotPlayers((current) => ({
      ...current,
      [slotA]: playerB,
      [slotB]: playerA,
    }));

    try {
      setSavingSwap(true);
      const firstResponse = await authFetch(`${API_URL}/drafts/${draftId}/picks`, {
        method: 'PUT',
        body: JSON.stringify({ player_id: playerB.player_id, slot_position: slotA }),
      });
      const firstData = await firstResponse.json();
      if (!firstResponse.ok) throw new Error(firstData.error || 'Não foi possível trocar os jogadores.');

      const secondResponse = await authFetch(`${API_URL}/drafts/${draftId}/picks`, {
        method: 'PUT',
        body: JSON.stringify({ player_id: playerA.player_id, slot_position: slotB }),
      });
      const secondData = await secondResponse.json();
      if (!secondResponse.ok) throw new Error(secondData.error || 'Não foi possível trocar os jogadores.');

      await loadData();
    } catch (error) {
      setSlotPlayers(previous);
      showTemporaryError(error.message || 'Não foi possível trocar os jogadores.');
    } finally {
      setSavingSwap(false);
      setSelectedSwapSlot(null);
    }
  }, [draftId, getSwapInvalidReason, isSwapValid, loadData, showTemporaryError, slotPlayers]);

  const handlePlayerClick = useCallback((slotPosition) => {
    const player = slotPlayers[slotPosition];
    if (!player) return;

    if (!canEdit || !isReorderMode) {
      setSelectedCard(player);
      return;
    }

    if (selectedSwapSlot === null) {
      setSelectedSwapSlot(slotPosition);
      return;
    }

    if (selectedSwapSlot === slotPosition) {
      setSelectedSwapSlot(null);
      return;
    }

    performSwap(selectedSwapSlot, slotPosition);
  }, [canEdit, isReorderMode, performSwap, selectedSwapSlot, slotPlayers]);

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
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <button onClick={onGoHome} className="text-xs text-gray-600 hover:text-white">&larr; Voltar</button>
        <span className="text-xs text-gray-500 font-mono uppercase text-center">
          {draft.formation} · Draft Completo
        </span>
        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              type="button"
              onClick={() => {
                setIsReorderMode((current) => !current);
                setSelectedSwapSlot(null);
                setSelectedCard(null);
              }}
              className={`rounded-xl border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] transition ${
                isReorderMode
                  ? 'border-amber-300/40 bg-amber-400/15 text-amber-200'
                  : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/20 hover:text-white'
              }`}
            >
              {isReorderMode ? 'Concluir' : 'Organizar'}
            </button>
          )}
          <span className="text-xs text-gray-600">{(draft.picks || []).length}/{11 + BENCH_SLOTS.length} picks</span>
        </div>
      </div>

      {swapError && (
        <div className="mb-3 rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-2 text-sm text-red-200">
          {swapError}
        </div>
      )}

      {canEdit && isReorderMode && (
        <div className="mb-3 rounded-xl border border-amber-300/20 bg-amber-400/10 px-4 py-2 text-xs text-amber-100">
          Toque em um jogador e depois em outro para trocar as posições.
        </div>
      )}

      <div className="flex-1 min-h-0 bg-green-950/40 border border-green-900/30 rounded-2xl p-2.5 sm:p-3">
        <div
          className="relative mx-auto h-full min-h-0 w-full overflow-hidden rounded-[26px] border border-emerald-300/15 bg-emerald-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_20px_60px_rgba(0,0,0,0.35)] sm:rounded-[30px]"
          style={{
            backgroundImage:
              'linear-gradient(180deg, rgba(34,197,94,0.12) 0%, rgba(6,78,59,0.5) 45%, rgba(2,44,34,0.92) 100%), repeating-linear-gradient(180deg, rgba(255,255,255,0.03) 0, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 42px)',
          }}
        >
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

          {starterPlacements.map((slot) => {
            const player = slotPlayers[slot.position];
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
                    onClick={() => handlePlayerClick(slot.position)}
                    style={{
                      cursor: canEdit && isReorderMode ? 'pointer' : 'pointer',
                      position: 'relative',
                      touchAction: 'manipulation',
                      outline: selectedSwapSlot === slot.position ? '2px solid rgba(250,204,21,0.95)' : 'none',
                      borderRadius: '20px',
                    }}
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

      {isBenchDrawerOpen && (
        <button
          type="button"
          aria-label="Fechar reservas"
          onClick={() => setIsBenchDrawerOpen(false)}
          className="fixed inset-0 z-30 bg-black/45 backdrop-blur-[1px]"
        />
      )}

      {!isBenchDrawerOpen && (
        <div className="pointer-events-none fixed bottom-6 right-0 z-40">
          <button
            type="button"
            onClick={() => setIsBenchDrawerOpen(true)}
            className="pointer-events-auto flex h-36 w-12 items-center justify-center rounded-l-3xl border border-r-0 border-white/10 bg-slate-500/50 px-2 shadow-[0_20px_45px_rgba(0,0,0,0.35)]"
          >
            <span className="[writing-mode:vertical-rl] rotate-180 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-100/80">
              Reservas
            </span>
          </button>
        </div>
      )}

      <aside
        className={`pointer-events-auto fixed inset-y-0 right-0 z-40 h-screen w-[min(56vw,11rem)] rounded-l-3xl border border-r-0 border-white/10 bg-slate-500/50 px-3 py-5 shadow-[-24px_0_50px_rgba(0,0,0,0.4)] backdrop-blur-md transition-transform duration-300 sm:w-[12rem] ${isBenchDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300/70">Reservas</span>
          <button
            type="button"
            onClick={() => setIsBenchDrawerOpen(false)}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-red-500/40 bg-red-500/15 text-sm font-black text-red-400 transition hover:bg-red-500/30"
          >
            X
          </button>
        </div>

        <div className="flex h-[calc(100%-4.5rem)] flex-col items-center gap-2 overflow-y-auto pr-1">
          {BENCH_SLOTS.map(({ slot, label }) => {
            const player = slotPlayers[slot];
            const posLabel = player ? getDetailedPositionLabel(player.detailed_position_id) : null;

            if (player) {
              return (
                <div
                  key={slot}
                  onClick={() => handlePlayerClick(slot)}
                  style={{
                    flexShrink: 0,
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    touchAction: 'manipulation',
                    outline: selectedSwapSlot === slot ? '2px solid rgba(250,204,21,0.95)' : 'none',
                    borderRadius: '20px',
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
        <PlayerStatsModal
          player={selectedCard}
          lockedRoundNumber={draft?.round?.number ?? null}
          onClose={() => setSelectedCard(null)}
        />
      )}

      {savingSwap && (
        <div className="fixed inset-0 z-[70] bg-black/25 pointer-events-none" />
      )}
    </div>
  );
}
