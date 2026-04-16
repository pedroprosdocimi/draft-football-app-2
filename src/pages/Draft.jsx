import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { API_URL } from '../config.js';
import FormationPickerPhase from '../components/FormationPickerPhase.jsx';
import { getFormationPreviewLayout } from '../components/FormationPreview.jsx';
import PickPanel from '../components/PickPanel.jsx';
import FieldPlayerPreview from '../components/FieldPlayerPreview.jsx';
import PlayerStatsModal from '../components/PlayerStatsModal.jsx';
import { getDetailedPositionLabel, matchesDetailedPositionSlot } from '../utils/positions.js';

// Maps detailed_position_id → basic position_id
const DETAILED_TO_BASIC = {
  1:1, 2:2, 3:2, 4:2, 5:3, 6:3, 7:3, 8:3, 9:3, 10:4, 11:4, 12:4, 13:4
};

const SLOT_TONE_CLASSES = {
  GOL: 'border-sky-300/40 bg-sky-950/95 text-sky-100 ring-sky-300/20',
  ZAG: 'border-emerald-300/40 bg-emerald-950/95 text-emerald-100 ring-emerald-300/20',
  LD: 'border-emerald-300/40 bg-emerald-950/95 text-emerald-100 ring-emerald-300/20',
  LE: 'border-emerald-300/40 bg-emerald-950/95 text-emerald-100 ring-emerald-300/20',
  VOL: 'border-emerald-300/40 bg-emerald-950/95 text-emerald-100 ring-emerald-300/20',
  MC: 'border-amber-300/40 bg-amber-950/95 text-amber-100 ring-amber-300/20',
  MD: 'border-amber-300/40 bg-amber-950/95 text-amber-100 ring-amber-300/20',
  ME: 'border-amber-300/40 bg-amber-950/95 text-amber-100 ring-amber-300/20',
  MEI: 'border-amber-300/40 bg-amber-950/95 text-amber-100 ring-amber-300/20',
  PE: 'border-rose-300/40 bg-rose-950/95 text-rose-100 ring-rose-300/20',
  PD: 'border-rose-300/40 bg-rose-950/95 text-rose-100 ring-rose-300/20',
  ATA: 'border-rose-300/40 bg-rose-950/95 text-rose-100 ring-rose-300/20',
};

// Bench slot definitions
const BENCH_SLOTS = [
  { slot: 12, label: 'GOL RES',   sub: 'Goleiro' },
  { slot: 13, label: 'DEF RES 1', sub: 'Defensor' },
  { slot: 14, label: 'DEF RES 2', sub: 'Defensor' },
  { slot: 15, label: 'M/A RES 1', sub: 'Meia ou Atacante' },
  { slot: 16, label: 'M/A RES 2', sub: 'Meia ou Atacante' },
  { slot: 17, label: 'M/A RES 3', sub: 'Meia ou Atacante' },
  { slot: 18, label: 'M/A RES 4', sub: 'Meia ou Atacante' },
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

function normalizeDraftPlayer(player) {
  if (!player) return null;
  return {
    ...player,
    id: player.id ?? player.player_id ?? null,
  };
}

export default function Draft({ draftId, user, onGoHome, onComplete }) {
  const [draft, setDraft] = useState(null);
  const [formations, setFormations] = useState(null);
  const [options, setOptions] = useState(null);
  const [activeSlot, setActiveSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [swapError, setSwapError] = useState(null);

  const [pendingPick, setPendingPick] = useState(null);
  // { player: PlayerObject, slotPosition: number }
  const [pickedPlayers, setPickedPlayers] = useState({});
  // { [slotPosition]: PlayerObject } — persists cards for rendering after API confirms
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [poppingSlot, setPoppingSlot] = useState(null);
  const [draggingSlot, setDraggingSlot] = useState(null); // slot being drag-swapped
  const [dropTargetSlot, setDropTargetSlot] = useState(null); // highlighted drop target
  const [selectedSwapSlot, setSelectedSwapSlot] = useState(null); // tap-to-swap selection
  const [selectedCard, setSelectedCard] = useState(null);
  const animTimeoutsRef = React.useRef([]);
  const fieldRef = React.useRef(null);
  const fieldGestureRef = React.useRef(null);
  const swapErrorTimeoutRef = React.useRef(null);

  // Map slotPosition → pick for quick lookup
  const picksBySlot = useMemo(() => {
    const map = {};
    for (const p of draft?.picks || []) {
      map[p.slot_position] = p;
    }
    return map;
  }, [draft]);

  // Formation slots indexed 1-11
  const formationSlots = useMemo(() => {
    if (!formations || !draft?.formation) return [];
    const f = formations.find(f => f.name === draft.formation);
    return f ? f.slots : [];
  }, [formations, draft]);

  const starterPlacements = useMemo(() => {
    if (!draft?.formation || formationSlots.length === 0) return [];

    return getFormationPreviewLayout({
      name: draft.formation,
      slots: formationSlots,
    });
  }, [draft?.formation, formationSlots]);

  const activeSlotDetailedPositionId = useMemo(() => {
    if (!activeSlot || activeSlot > 11) return null;

    return (
      starterPlacements.find((slot) => slot.position === activeSlot)?.detailed_position_id ??
      formationSlots.find((slot) => slot.position === activeSlot)?.detailed_position_id ??
      null
    );
  }, [activeSlot, starterPlacements, formationSlots]);

  const loadDraft = useCallback(async () => {
    try {
      const res = await authFetch(`${API_URL}/drafts/${draftId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDraft(data);
      if (data.status === 'complete') onComplete(draftId);
    } catch (e) {
      setError(e.message);
    }
  }, [draftId, onComplete]);

  const loadFormations = useCallback(async () => {
    try {
      const res = await authFetch(`${API_URL}/formations?include_inactive=true`);
      const data = await res.json();
      setFormations(data.data || []);
    } catch {}
  }, []);

  useEffect(() => {
    loadDraft();
    loadFormations();
  }, [loadDraft, loadFormations]);

  useEffect(() => () => {
    animTimeoutsRef.current.forEach(clearTimeout);
    if (swapErrorTimeoutRef.current) clearTimeout(swapErrorTimeoutRef.current);
  }, []);

  const showSwapError = useCallback((message) => {
    if (swapErrorTimeoutRef.current) clearTimeout(swapErrorTimeoutRef.current);
    setSwapError(message);
    swapErrorTimeoutRef.current = setTimeout(() => {
      setSwapError(null);
      swapErrorTimeoutRef.current = null;
    }, 5000);
  }, []);

  const handleSetFormation = async (formationName) => {
    setLoading(true);
    try {
      const res = await authFetch(`${API_URL}/drafts/${draftId}/formation`, {
        method: 'POST',
        body: JSON.stringify({ formation: formationName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await loadDraft();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const getSlotAtPoint = useCallback((clientX, clientY) => {
    const rect = fieldRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const xPct = ((clientX - rect.left) / rect.width) * 100;
    const yPct = ((clientY - rect.top) / rect.height) * 100;
    let closest = null;
    let minDist = 12;
    starterPlacements.forEach((slot) => {
      const dist = Math.hypot(slot.left - xPct, slot.top - yPct);
      if (dist < minDist) { minDist = dist; closest = slot.position; }
    });
    return closest;
  }, [starterPlacements]);

  const handleOpenPlayerStats = useCallback((player) => {
    const normalizedPlayer = normalizeDraftPlayer(player);
    if (!normalizedPlayer?.id) return;
    setSelectedCard(normalizedPlayer);
  }, []);

  const handleFieldPointerDown = useCallback((e, slotPosition, player) => {
    if (!normalizeDraftPlayer(player)?.id) return;
    e.preventDefault();
    fieldGestureRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
      slotPosition,
    };
    setDraggingSlot(slotPosition);
    if (typeof e.currentTarget?.setPointerCapture === 'function') {
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  }, []);

  const isSwapValid = useCallback((slotA, slotB) => {
    // Bench slots (≥12): position validation is delegated to the backend
    if (slotA >= 12 || slotB >= 12) return true;
    const playerA = pickedPlayers[slotA] || null;
    const playerB = pickedPlayers[slotB] || null;
    if (!playerA || !playerB) return true; // not enough data to validate
    const slotADef = starterPlacements.find(s => s.position === slotA);
    const slotBDef = starterPlacements.find(s => s.position === slotB);
    if (!slotADef || !slotBDef) return true;
    return (
      matchesDetailedPositionSlot(playerA, slotBDef.detailed_position_id) &&
      matchesDetailedPositionSlot(playerB, slotADef.detailed_position_id)
    );
  }, [pickedPlayers, starterPlacements]);

  const handleOccupiedSlotClick = useCallback((slot) => {
    const hasPlayer = pickedPlayers[slot] || picksBySlot[slot];
    if (!hasPlayer) return;
    if (selectedSwapSlot === null) {
      setSelectedSwapSlot(slot);
    } else if (selectedSwapSlot === slot) {
      setSelectedSwapSlot(null);
    } else {
      handleSwap(selectedSwapSlot, slot);
      setSelectedSwapSlot(null);
    }
  }, [selectedSwapSlot, pickedPlayers, picksBySlot]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFieldPointerMove = useCallback((e) => {
    if (draggingSlot === null) return;
    if (fieldGestureRef.current?.pointerId != null && e.pointerId !== fieldGestureRef.current.pointerId) return;
    if (fieldGestureRef.current && !fieldGestureRef.current.moved) {
      const deltaX = e.clientX - fieldGestureRef.current.startX;
      const deltaY = e.clientY - fieldGestureRef.current.startY;
      if (Math.hypot(deltaX, deltaY) > 8) {
        fieldGestureRef.current = { ...fieldGestureRef.current, moved: true };
      }
    }
    if (!fieldGestureRef.current?.moved) {
      setDropTargetSlot(null);
      return;
    }
    const target = getSlotAtPoint(e.clientX, e.clientY);
    if (!target || target === draggingSlot) { setDropTargetSlot(null); return; }
    const hasPlayer = pickedPlayers[target] || picksBySlot[target];
    setDropTargetSlot(hasPlayer && isSwapValid(draggingSlot, target) ? target : null);
  }, [draggingSlot, getSlotAtPoint, pickedPlayers, picksBySlot, isSwapValid]);

  const handleFieldPointerUp = useCallback((e) => {
    if (draggingSlot === null) return;
    if (fieldGestureRef.current?.pointerId != null && e.pointerId !== fieldGestureRef.current.pointerId) return;
    const activePlayer = normalizeDraftPlayer(pickedPlayers[draggingSlot] || picksBySlot[draggingSlot]);
    if (fieldGestureRef.current && !fieldGestureRef.current.moved) {
      if (selectedSwapSlot !== null) {
        if (selectedSwapSlot === draggingSlot) {
          setSelectedSwapSlot(null);
        } else {
          handleSwap(selectedSwapSlot, draggingSlot);
          setSelectedSwapSlot(null);
        }
      } else if (activePlayer) {
        handleOpenPlayerStats(activePlayer);
      }
      fieldGestureRef.current = null;
      setDraggingSlot(null);
      setDropTargetSlot(null);
      return;
    }
    const target = getSlotAtPoint(e.clientX, e.clientY);
    if (target && target !== draggingSlot && (pickedPlayers[target] || picksBySlot[target])) {
      handleSwap(draggingSlot, target);
    }
    fieldGestureRef.current = null;
    setDraggingSlot(null);
    setDropTargetSlot(null);
  }, [draggingSlot, getSlotAtPoint, pickedPlayers, picksBySlot, handleOpenPlayerStats, selectedSwapSlot]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (draggingSlot === null) return undefined;

    const handleWindowPointerMove = (e) => {
      handleFieldPointerMove(e);
    };

    const handleWindowPointerUp = (e) => {
      handleFieldPointerUp(e);
    };

    const handleWindowPointerCancel = () => {
      fieldGestureRef.current = null;
      setDraggingSlot(null);
      setDropTargetSlot(null);
    };

    window.addEventListener('pointermove', handleWindowPointerMove, { passive: true });
    window.addEventListener('pointerup', handleWindowPointerUp);
    window.addEventListener('pointercancel', handleWindowPointerCancel);

    return () => {
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerUp);
      window.removeEventListener('pointercancel', handleWindowPointerCancel);
    };
  }, [draggingSlot, handleFieldPointerMove, handleFieldPointerUp]);

  const handleSwap = async (slotA, slotB) => {
    const playerAId = pickedPlayers[slotA]?.id || picksBySlot[slotA]?.player_id;
    const playerBId = pickedPlayers[slotB]?.id || picksBySlot[slotB]?.player_id;
    if (!playerAId || !playerBId) return;

    if (!isSwapValid(slotA, slotB)) {
      showSwapError('Troca inválida: um ou ambos os jogadores não podem atuar nessa posição.');
      return;
    }

    // Optimistic swap
    setPickedPlayers((prev) => {
      const next = { ...prev };
      const a = prev[slotA];
      const b = prev[slotB];
      if (a !== undefined) next[slotB] = a; else delete next[slotB];
      if (b !== undefined) next[slotA] = b; else delete next[slotA];
      return next;
    });

    try {
      setLoading(true);
      const r1 = await authFetch(`${API_URL}/drafts/${draftId}/picks`, {
        method: 'PUT',
        body: JSON.stringify({ player_id: playerBId, slot_position: slotA }),
      });
      const d1 = await r1.json();
      if (!r1.ok) throw new Error(d1.error);

      const r2 = await authFetch(`${API_URL}/drafts/${draftId}/picks`, {
        method: 'PUT',
        body: JSON.stringify({ player_id: playerAId, slot_position: slotB }),
      });
      const d2 = await r2.json();
      if (!r2.ok) throw new Error(d2.error);

      await loadDraft();
    } catch (e) {
      showSwapError(e.message);
      // Revert
      setPickedPlayers((prev) => {
        const next = { ...prev };
        const a = prev[slotA];
        const b = prev[slotB];
        if (a !== undefined) next[slotB] = a; else delete next[slotB];
        if (b !== undefined) next[slotA] = b; else delete next[slotA];
        return next;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSlotClick = async (slotPosition) => {
    if (picksBySlot[slotPosition] || pickedPlayers[slotPosition]) return;
    setActiveSlot(slotPosition);
    setLoading(true);
    try {
      const res = await authFetch(`${API_URL}/drafts/${draftId}/slots/${slotPosition}/options`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOptions(data.options || []);
    } catch (e) {
      setError(e.message);
      setActiveSlot(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePickPlayer = (player) => {
    const slotPosition = activeSlot;
    let optimisticApplied = false;

    // 1. Keep the picked player pending while the panel fades out.
    setPendingPick({ player, slotPosition });

    // 2. Start overlay fade-out
    setIsAnimatingOut(true);

    // 3. After the overlay is gone, render the card directly in its final slot.
    const t1 = setTimeout(() => {
      animTimeoutsRef.current = animTimeoutsRef.current.filter(id => id !== t1);
      optimisticApplied = true;
      setPickedPlayers(prev => ({ ...prev, [slotPosition]: player }));
      setPoppingSlot(slotPosition);
      setOptions(null);
      setActiveSlot(null);
      setIsAnimatingOut(false);
      setPendingPick(null);
      const t2 = setTimeout(() => {
        setPoppingSlot(null);
        animTimeoutsRef.current = animTimeoutsRef.current.filter(id => id !== t2);
      }, 500);
      animTimeoutsRef.current.push(t2);
    }, 300);
    animTimeoutsRef.current.push(t1);

    // 4. Call API in parallel
    setLoading(true);
    authFetch(`${API_URL}/drafts/${draftId}/picks`, {
      method: 'POST',
      body: JSON.stringify({ player_id: player.id, slot_position: slotPosition }),
    })
      .then(res => res.json().then(data => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.error);
        return loadDraft();
      })
      .catch(e => {
        setError(e.message);
        if (!optimisticApplied) {
          clearTimeout(t1);
          animTimeoutsRef.current = animTimeoutsRef.current.filter(id => id !== t1);
          setOptions(null);
          setActiveSlot(null);
          setIsAnimatingOut(false);
          setPendingPick((current) => (
            current?.slotPosition === slotPosition ? null : current
          ));
        } else {
          setPendingPick((current) => (
            current?.slotPosition === slotPosition ? null : current
          ));
          setPickedPlayers(prev => {
            const next = { ...prev };
            delete next[slotPosition];
            return next;
          });
        }
      })
      .finally(() => setLoading(false));
  };

  const handleCaptain = async (playerId) => {
    setLoading(true);
    try {
      const res = await authFetch(`${API_URL}/drafts/${draftId}/captain`, {
        method: 'POST',
        body: JSON.stringify({ player_id: playerId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await loadDraft();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!draft) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⚽</div>
          <p className="text-gray-400">Carregando draft...</p>
        </div>
      </div>
    );
  }

  // Formation pick phase
  if (draft.status === 'formation_pick') {
    return <FormationPickerPhase onPick={handleSetFormation} />;
  }

  // Captain pick phase — show starters as selectable cards
  if (draft.status === 'captain_pick') {
    const starterPicks = (draft.picks || []).filter(p => p.slot_position <= 11);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <h2 className="text-xl font-bold text-white text-center mb-2">Escolha seu Capitão</h2>
          <p className="text-gray-400 text-sm text-center mb-6">
            O capitão multiplica sua pontuação
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {starterPicks.map(pick => {
              const posLabel = getDetailedPositionLabel(pick.detailed_position_id);
              return (
                <button key={pick.slot_position}
                  onClick={() => handleCaptain(pick.player_id)}
                  className="bg-gray-800 border border-gray-700 hover:border-draft-gold hover:bg-gray-700 rounded-xl p-3 text-left transition-all">
                  <div className="text-xs text-gray-500 mb-1">Slot {pick.slot_position} · {posLabel}</div>
                  <div className="text-sm font-semibold text-white truncate">{pick.player_id.slice(0,8)}…</div>
                </button>
              );
            })}
          </div>
        </div>
        {error && <p className="text-red-400 text-sm mt-4 text-center">{error}</p>}
      </div>
    );
  }

  // Main drafting / bench drafting
  const isBenchPhase = draft.status === 'bench_drafting';
  const starterSlots = formationSlots;

  return (
    <div className="min-h-screen flex flex-col p-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onGoHome} className="text-xs text-gray-600 hover:text-white">← Sair</button>
        <span className="text-xs text-gray-500 font-mono uppercase">
          {isBenchPhase ? 'Reservas' : 'Titulares'} · {draft.formation}
        </span>
        <span className="text-xs text-gray-600">{(draft.picks || []).length}/{11 + BENCH_SLOTS.length} picks</span>
      </div>

      {error && (
        <div className="mb-4 bg-red-900/30 border border-red-700 text-red-300 text-sm rounded-lg px-4 py-2">
          {error}
        </div>
      )}

      {swapError && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center px-5 sm:hidden">
          <div className="w-full max-w-sm rounded-2xl border border-red-400/35 bg-slate-950/96 px-5 py-4 text-center shadow-[0_24px_60px_rgba(0,0,0,0.5)] ring-1 ring-red-300/15 backdrop-blur-md">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-red-300/80">
              Erro
            </div>
            <p className="mt-2 text-sm font-medium leading-5 text-red-100">
              {swapError}
            </p>
          </div>
        </div>
      )}


      {/* Field — always visible during starter and bench drafting */}
      <style>{`
        @keyframes card-pop {
          0%   { transform: scale(0.3); opacity: 0; }
          60%  { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1);   opacity: 1; }
        }
      `}</style>
      <div className="bg-green-950/40 border border-green-900/30 rounded-2xl p-3 mb-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">Campo titular</p>
            <p className="text-xs text-emerald-100/60">
              Escolha as cartas diretamente na distribuicao da formacao
            </p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-100/70">
            {starterSlots.length}/11 slots
          </span>
        </div>

        <div
          ref={fieldRef}
          className="relative mx-auto h-[40rem] w-full overflow-hidden rounded-[30px] border border-emerald-300/15 bg-emerald-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_20px_60px_rgba(0,0,0,0.35)] sm:h-[44rem]"
          style={{
            backgroundImage:
              'linear-gradient(180deg, rgba(34,197,94,0.12) 0%, rgba(6,78,59,0.5) 45%, rgba(2,44,34,0.92) 100%), repeating-linear-gradient(180deg, rgba(255,255,255,0.03) 0, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 42px)',
            cursor: draggingSlot !== null ? 'grabbing' : 'default',
            touchAction: draggingSlot !== null ? 'none' : 'pan-y',
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
            const posLabel = getDetailedPositionLabel(slot.detailed_position_id) || slot.label || '?';
            const toneClasses = SLOT_TONE_CLASSES[posLabel] || 'border-white/15 bg-slate-950/88 text-white ring-white/10';
            const playerObj = normalizeDraftPlayer(pickedPlayers[slot.position] ?? null);
            const confirmedPick = picksBySlot[slot.position];
            const cardPlayer = playerObj ?? normalizeDraftPlayer(confirmedPick);
            const isLocked = isBenchPhase && !playerObj && !confirmedPick;
            const showFieldCard = Boolean(playerObj);
            const cardAnimationStyle = poppingSlot === slot.position
              ? { animation: 'card-pop 0.45s cubic-bezier(0.34,1.56,0.64,1) both' }
              : undefined;

            const slotBody = (
              <>
                <div className={`relative flex h-14 w-14 items-center justify-center rounded-full border font-black tracking-wide shadow-[0_6px_18px_rgba(0,0,0,0.28)] ring-1 ${toneClasses}`}>
                  <div className="absolute inset-1 rounded-full bg-gradient-to-b from-white/10 to-transparent" />
                  <span className="relative z-10 text-[11px]">{posLabel}</span>
                </div>

                {confirmedPick ? (
                  <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
                    Confirmado
                  </div>
                ) : isLocked ? (
                  <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Fechado
                  </div>
                ) : (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-white/80">
                    +
                  </div>
                )}
              </>
            );

            return (
              <div
                key={slot.key}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{
                  top: `${slot.top}%`,
                  left: `${slot.left}%`,
                  zIndex: showFieldCard ? 20 : 10,
                }}
              >
                {showFieldCard || confirmedPick ? (
                  <div
                    onPointerDown={(e) => handleFieldPointerDown(e, slot.position, cardPlayer)}
                    style={{
                      ...cardAnimationStyle,
                      touchAction: 'none',
                      cursor: draggingSlot === slot.position ? 'grabbing' : 'grab',
                      opacity: draggingSlot === slot.position ? 0.5 : 1,
                      outline: selectedSwapSlot === slot.position
                        ? '2px solid rgba(250,204,21,0.95)'
                        : dropTargetSlot === slot.position
                          ? '2px solid rgba(110,231,183,0.8)'
                          : 'none',
                      borderRadius: '20px',
                      transition: 'opacity 0.15s, outline 0.1s',
                    }}
                  >
                    <FieldPlayerPreview player={cardPlayer} posLabel={posLabel} slotPositionId={slot.detailed_position_id} />
                  </div>
                ) : isLocked ? (
                  <div className="flex min-w-[5.5rem] flex-col items-center gap-1.5 rounded-[24px] border border-white/10 bg-slate-950/60 px-2.5 py-2 text-center shadow-[0_14px_28px_rgba(0,0,0,0.24)] backdrop-blur-sm">
                    {slotBody}
                  </div>
                ) : (
                  <button
                    onClick={() => handleSlotClick(slot.position)}
                    className="flex min-w-[5.5rem] flex-col items-center gap-1.5 rounded-[24px] border border-dashed border-white/20 bg-slate-950/30 px-2.5 py-2 text-center shadow-[0_14px_28px_rgba(0,0,0,0.18)] transition-all hover:border-emerald-300/40 hover:bg-emerald-300/10"
                    style={{ touchAction: 'manipulation' }}
                  >
                    {slotBody}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bench slots — only during bench phase */}
      {isBenchPhase && (
        <div className="mb-4">
          <p className="text-sm font-semibold text-white mb-3">Reservas</p>
          <div className="flex flex-wrap gap-2">
            {BENCH_SLOTS.map(({ slot, label, sub }) => {
              const playerObj = normalizeDraftPlayer(pickedPlayers[slot] ?? null);
              const confirmedPick = picksBySlot[slot];
              const cardPlayer = playerObj ?? normalizeDraftPlayer(confirmedPick);
              const posLabel = playerObj
                ? getDetailedPositionLabel(playerObj.detailed_position_id)
                : confirmedPick
                  ? getDetailedPositionLabel(confirmedPick.detailed_position_id)
                  : null;

              const isSelected = selectedSwapSlot === slot;

              if (playerObj || confirmedPick) {
                return (
                  <div
                    key={slot}
                    onClick={() => handleOccupiedSlotClick(slot)}
                    style={{
                      ...(poppingSlot === slot ? { animation: 'card-pop 0.45s cubic-bezier(0.34,1.56,0.64,1) both' } : {}),
                      flexShrink: 0,
                      cursor: 'pointer',
                      outline: isSelected ? '2px solid rgba(250,204,21,0.95)' : selectedSwapSlot !== null ? '2px solid rgba(110,231,183,0.35)' : 'none',
                      borderRadius: '20px',
                      transition: 'outline 0.1s',
                    }}
                  >
                    <FieldPlayerPreview player={cardPlayer} posLabel={posLabel} />
                  </div>
                );
              }

              return (
                <button
                  key={slot}
                  onClick={() => handleSlotClick(slot)}
                  className="flex w-[5.75rem] flex-col items-center justify-center gap-1 rounded-[20px] border-2 border-dashed border-gray-600 py-6 transition-all hover:border-emerald-400/50 hover:bg-emerald-300/10 sm:w-[7.5rem] sm:rounded-[24px]"
                  style={{ flexShrink: 0 }}
                >
                  <span className="text-[11px] font-bold text-gray-300">{label}</span>
                  <span className="text-[9px] text-gray-500">{sub}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Player options overlay */}
      {options && (
        <PickPanel
          options={options}
          slotDetailedPositionId={activeSlotDetailedPositionId}
          slotPosition={activeSlot}
          onPickPlayer={handlePickPlayer}
          onClose={() => { setOptions(null); setActiveSlot(null); }}
          fadingOut={isAnimatingOut}
        />
      )}

      {selectedCard && (
        <PlayerStatsModal
          player={selectedCard}
          onClose={() => setSelectedCard(null)}
        />
      )}
    </div>
  );
}
