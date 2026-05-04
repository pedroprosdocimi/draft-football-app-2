import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { API_URL } from '../config.js';
import { getFormationPreviewLayout } from '../components/FormationPreview.jsx';
import FieldPlayerPreview from '../components/FieldPlayerPreview.jsx';
import PlayerStatsModal from '../components/PlayerStatsModal.jsx';
import { getDetailedPositionLabel, matchesDetailedPositionSlot } from '../utils/positions.js';
import { BENCH_SLOT_IDS, findBenchReassignment } from '../utils/benchSlots.js';

const BENCH_SLOTS = [
  { slot: 12, label: 'RES 1' },
  { slot: 13, label: 'RES 2' },
  { slot: 14, label: 'RES 3' },
  { slot: 15, label: 'RES 4' },
  { slot: 16, label: 'RES 5' },
  { slot: 17, label: 'RES 6' },
  { slot: 18, label: 'RES 7' },
];
const STARTER_SLOT_LIMIT = 11;
const MAX_AUTO_SUBSTITUTIONS = 5;
const CAPTAIN_MULTIPLIER = 1.5;

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

function shouldAutoReplaceStarter(player) {
  if (!player) return false;
  return Number(player.round_minutes || 0) === 0 && Boolean(player.fixture_started);
}

function canBenchPlayerAutoSub(player) {
  if (!player) return false;
  return Number(player.round_minutes || 0) > 0;
}

function buildAutoSubstitutionView(slotPlayers, starterPlacements) {
  const displaySlots = { ...slotPlayers };
  if (!starterPlacements.length) {
    return {
      displaySlots,
      benchSlots: BENCH_SLOTS.map(({ slot, label }) => ({ slot, label, player: slotPlayers[slot] ?? null })),
    };
  }

  const orderedBenchCandidates = BENCH_SLOTS
    .map(({ slot, label }) => ({ slot, label, player: slotPlayers[slot] ?? null }))
    .filter(({ player }) => canBenchPlayerAutoSub(player));

  const usedBenchSlots = new Set();
  let substitutionsCount = 0;

  for (const starterSlot of [...starterPlacements].sort((a, b) => a.position - b.position)) {
    const starter = slotPlayers[starterSlot.position];
    if (!shouldAutoReplaceStarter(starter)) continue;
    if (substitutionsCount >= MAX_AUTO_SUBSTITUTIONS) break;

    const benchCandidate = orderedBenchCandidates.find(({ slot, player }) => (
      !usedBenchSlots.has(slot) &&
      matchesDetailedPositionSlot(player, starterSlot.detailed_position_id)
    ));

    if (!benchCandidate) continue;

    usedBenchSlots.add(benchCandidate.slot);
    substitutionsCount += 1;

    displaySlots[starterSlot.position] = {
      ...benchCandidate.player,
      score_value: (Number(benchCandidate.player.round_score) || 0) / 2,
      score_label: 'rodada/2',
      auto_substitution: {
        type: 'in',
        starter_slot: starterSlot.position,
        bench_slot: benchCandidate.slot,
      },
    };

    displaySlots[benchCandidate.slot] = {
      ...starter,
      score_value: Number(starter.round_score) || 0,
      score_label: 'rodada',
      auto_substitution: {
        type: 'out',
        starter_slot: starterSlot.position,
        bench_slot: benchCandidate.slot,
      },
    };
  }

  return {
    displaySlots,
    benchSlots: BENCH_SLOTS.map(({ slot, label }) => ({ slot, label, player: displaySlots[slot] ?? null })),
  };
}

function SubstitutionBadge({ type }) {
  if (type !== 'in' && type !== 'out') return null;

  const isIn = type === 'in';
  return (
    <div
      className={`absolute -bottom-2 left-1/2 z-20 -translate-x-1/2 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] shadow-[0_10px_18px_rgba(0,0,0,0.32)] ${
        isIn
          ? 'border-emerald-200/90 bg-emerald-400 text-emerald-950'
          : 'border-rose-200/90 bg-rose-400 text-rose-950'
      }`}
    >
      {isIn ? 'Entrou' : 'Saiu'}
    </div>
  );
}

export default function EndScreen({ draftId, user, onGoHome }) {
  const [draft, setDraft] = useState(null);
  const [formations, setFormations] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [isBenchDrawerOpen, setIsBenchDrawerOpen] = useState(false);
  const [swapError, setSwapError] = useState(null);
  const [savingSwap, setSavingSwap] = useState(false);
  const [slotPlayers, setSlotPlayers] = useState({});

  // Drag state
  const [hasActiveGesture, setHasActiveGesture] = useState(false); // pointerdown held, drag may not have started yet
  const [draggingSlot, setDraggingSlot] = useState(null);
  const [dropTargetSlot, setDropTargetSlot] = useState(null);
  const [dragPointer, setDragPointer] = useState(null);

  const fieldRef = useRef(null);
  const fieldGestureRef = useRef(null);
  const longPressTimeoutRef = useRef(null);
  const swapErrorTimeoutRef = useRef(null);
  const suppressNextClickRef = useRef(false); // set when pointer moved; suppresses the following onClick

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

  // Lock scroll for the entire screen lifetime
  useEffect(() => {
    const body = document.body;
    const root = document.documentElement;
    const prevBodyOverflow = body.style.overflow;
    const prevRootOverflow = root.style.overflow;
    const prevBodyOverscroll = body.style.overscrollBehaviorY;
    const prevRootOverscroll = root.style.overscrollBehaviorY;
    body.style.overflow = 'hidden';
    root.style.overflow = 'hidden';
    body.style.overscrollBehaviorY = 'none';
    root.style.overscrollBehaviorY = 'none';
    return () => {
      body.style.overflow = prevBodyOverflow;
      root.style.overflow = prevRootOverflow;
      body.style.overscrollBehaviorY = prevBodyOverscroll;
      root.style.overscrollBehaviorY = prevRootOverscroll;
    };
  }, []);

  useEffect(() => () => {
    if (swapErrorTimeoutRef.current) clearTimeout(swapErrorTimeoutRef.current);
    if (longPressTimeoutRef.current) clearTimeout(longPressTimeoutRef.current);
  }, []);

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

  const autoSubstitutionView = useMemo(() => (
    buildAutoSubstitutionView(slotPlayers, starterPlacements)
  ), [slotPlayers, starterPlacements]);

  const captainSlotPosition = useMemo(() => {
    const captainPlayerId = draft?.captain_player_id;
    if (!captainPlayerId) return null;

    for (const [slot, player] of Object.entries(slotPlayers)) {
      if (Number(slot) > STARTER_SLOT_LIMIT) continue;
      if (String(player?.id ?? player?.player_id ?? '') === String(captainPlayerId)) {
        return Number(slot);
      }
    }

    return null;
  }, [draft?.captain_player_id, slotPlayers]);

  const visualSlotPlayers = useMemo(() => {
    const next = { ...autoSubstitutionView.displaySlots };
    if (captainSlotPosition == null || !next[captainSlotPosition]) return next;

    next[captainSlotPosition] = {
      ...next[captainSlotPosition],
      score_value: (Number(next[captainSlotPosition].score_value) || 0) * CAPTAIN_MULTIPLIER,
      score_label: `${next[captainSlotPosition].score_label || 'rodada'} x1.5`,
    };

    return next;
  }, [autoSubstitutionView.displaySlots, captainSlotPosition]);

  const visualBenchSlots = useMemo(() => (
    autoSubstitutionView.benchSlots.map((item) => ({
      ...item,
      isCaptainSlot: false,
    }))
  ), [autoSubstitutionView.benchSlots]);

  const autoSubstitutionCount = useMemo(() => (
    visualBenchSlots.reduce((count, item) => (
      count + (item.player?.auto_substitution?.type === 'out' ? 1 : 0)
    ), 0)
  ), [visualBenchSlots]);

  const canEdit = Boolean(
    user?.id &&
    draft?.user_id &&
    String(user.id) === String(draft.user_id) &&
    (!draft.edit_deadline || new Date() < new Date(draft.edit_deadline))
  );

  // Lock body scroll while dragging
  useEffect(() => {
    if (draggingSlot === null) return undefined;
    const body = document.body;
    const root = document.documentElement;
    const prevBodyOverflow = body.style.overflow;
    const prevRootOverflow = root.style.overflow;
    const prevBodyTouchAction = body.style.touchAction;
    body.style.overflow = 'hidden';
    root.style.overflow = 'hidden';
    body.style.touchAction = 'none';
    return () => {
      body.style.overflow = prevBodyOverflow;
      root.style.overflow = prevRootOverflow;
      body.style.touchAction = prevBodyTouchAction;
    };
  }, [draggingSlot]);

  useEffect(() => {
    if (draggingSlot !== null) return;
    setDragPointer(null);
  }, [draggingSlot]);

  const showSwapError = useCallback((message) => {
    if (swapErrorTimeoutRef.current) clearTimeout(swapErrorTimeoutRef.current);
    setSwapError(message);
    swapErrorTimeoutRef.current = setTimeout(() => {
      setSwapError(null);
      swapErrorTimeoutRef.current = null;
    }, 5000);
  }, []);

  const clearLongPressTimeout = useCallback(() => {
    if (!longPressTimeoutRef.current) return;
    clearTimeout(longPressTimeoutRef.current);
    longPressTimeoutRef.current = null;
  }, []);

  const draggingPlayer = useMemo(() => {
    if (draggingSlot === null) return null;
    return slotPlayers[draggingSlot] ?? null;
  }, [draggingSlot, slotPlayers]);

  const draggingPosLabel = useMemo(() => {
    if (draggingSlot === null) return null;
    if (draggingSlot <= STARTER_SLOT_LIMIT) {
      const slotDef = starterPlacements.find((s) => s.position === draggingSlot);
      return getDetailedPositionLabel(slotDef?.detailed_position_id) || null;
    }
    return getDetailedPositionLabel(draggingPlayer?.detailed_position_id) || null;
  }, [draggingSlot, draggingPlayer, starterPlacements]);

  const isSwapValid = useCallback((slotA, slotB) => {
    if (slotA > STARTER_SLOT_LIMIT || slotB > STARTER_SLOT_LIMIT) return true;
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
    if (slotA > STARTER_SLOT_LIMIT || slotB > STARTER_SLOT_LIMIT) return null;
    const playerA = slotPlayers[slotA];
    const playerB = slotPlayers[slotB];
    if (!playerA || !playerB) return null;
    const slotADef = starterPlacements.find((slot) => slot.position === slotA);
    const slotBDef = starterPlacements.find((slot) => slot.position === slotB);
    if (!slotADef || !slotBDef) return null;
    if (!matchesDetailedPositionSlot(playerA, slotBDef.detailed_position_id)) {
      return `${getPlayerDisplayName(playerA)} não pode jogar como ${getDetailedPositionLabel(slotBDef.detailed_position_id)}.`;
    }
    if (!matchesDetailedPositionSlot(playerB, slotADef.detailed_position_id)) {
      return `${getPlayerDisplayName(playerB)} não pode jogar como ${getDetailedPositionLabel(slotADef.detailed_position_id)}.`;
    }
    return null;
  }, [slotPlayers, starterPlacements]);

  const isCaptainSlot = useCallback((slot) => {
    const player = slotPlayers[slot];
    return Boolean(player && draft?.captain_player_id && String(player.id) === String(draft.captain_player_id));
  }, [slotPlayers, draft?.captain_player_id]);

  const isCaptainFieldSlot = useCallback((slotPosition) => (
    captainSlotPosition != null && Number(slotPosition) === Number(captainSlotPosition)
  ), [captainSlotPosition]);

  const performSwap = useCallback(async (slotA, slotB) => {
    const playerA = slotPlayers[slotA];
    const playerB = slotPlayers[slotB];
    if (!playerA?.player_id || !playerB?.player_id) return;

    if (isCaptainSlot(slotA) || isCaptainSlot(slotB)) {
      showSwapError('O capitão não pode ser movido de posição.');
      return;
    }

    if (!isSwapValid(slotA, slotB)) {
      showSwapError(getSwapInvalidReason(slotA, slotB) || 'Troca inválida.');
      return;
    }

    const putPick = async (playerId, slotPosition) => {
      const r = await authFetch(`${API_URL}/drafts/${draftId}/picks`, {
        method: 'PUT',
        body: JSON.stringify({ player_id: playerId, slot_position: slotPosition }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'NÃ£o foi possÃ­vel trocar.');
      return d;
    };

    const isBenchA = slotA > STARTER_SLOT_LIMIT;
    const isBenchB = slotB > STARTER_SLOT_LIMIT;

    // Starter <-> bench swaps: keep bench constraints valid by rebalancing the bench if needed.
    if (isBenchA !== isBenchB) {
      const benchSlot = isBenchA ? slotA : slotB;
      const starterSlot = isBenchA ? slotB : slotA;
      const benchPlayer = isBenchA ? playerA : playerB;
      const starterPlayer = isBenchA ? playerB : playerA;

      const starterDef = starterPlacements.find((s) => s.position === starterSlot) || null;
      if (starterDef?.detailed_position_id && !matchesDetailedPositionSlot(benchPlayer, starterDef.detailed_position_id)) {
        showSwapError(
          `${getPlayerDisplayName(benchPlayer)} nÃ£o pode jogar como ${getDetailedPositionLabel(starterDef.detailed_position_id)}.`
        );
        return;
      }

      const benchPlayersBySlot = {};
      for (const s of BENCH_SLOT_IDS) {
        benchPlayersBySlot[s] = slotPlayers[s] ?? null;
      }

      const nextBench = findBenchReassignment(benchPlayersBySlot, benchSlot, starterPlayer);
      if (!nextBench) {
        showSwapError('NÃ£o foi possÃ­vel reorganizar os reservas para concluir essa troca.');
        return;
      }

      const previousBench = { ...slotPlayers };
      setSlotPlayers((current) => {
        const next = { ...current };
        next[starterSlot] = benchPlayer;
        for (const s of BENCH_SLOT_IDS) next[s] = nextBench[s];
        return next;
      });

      try {
        setSavingSwap(true);

        await putPick(benchPlayer.player_id, starterSlot);

        for (const s of BENCH_SLOT_IDS) {
          const desired = nextBench[s];
          const desiredId = desired?.player_id || null;
          const current = benchPlayersBySlot[s];
          const currentId = current?.player_id || null;
          if (!desiredId || desiredId === currentId) continue;
          await putPick(desiredId, s);
        }
      } catch (error) {
        setSlotPlayers(previousBench);
        showSwapError(error.message || 'NÃ£o foi possÃ­vel trocar os jogadores.');
      } finally {
        setSavingSwap(false);
      }

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
      const r1 = await authFetch(`${API_URL}/drafts/${draftId}/picks`, {
        method: 'PUT',
        body: JSON.stringify({ player_id: playerB.player_id, slot_position: slotA }),
      });
      const d1 = await r1.json();
      if (!r1.ok) throw new Error(d1.error || 'Não foi possível trocar.');

      const r2 = await authFetch(`${API_URL}/drafts/${draftId}/picks`, {
        method: 'PUT',
        body: JSON.stringify({ player_id: playerA.player_id, slot_position: slotB }),
      });
      const d2 = await r2.json();
      if (!r2.ok) throw new Error(d2.error || 'Não foi possível trocar.');
    } catch (error) {
      setSlotPlayers(previous);
      showSwapError(error.message || 'Não foi possível trocar os jogadores.');
    } finally {
      setSavingSwap(false);
    }
  }, [draftId, getSwapInvalidReason, isSwapValid, isCaptainSlot, showSwapError, slotPlayers, starterPlacements]);

  // ── Drag & drop ────────────────────────────────────────────────────────────

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

  const handleFieldPointerDown = useCallback((e, slotPosition) => {
    if (!canEdit) return;
    const player = slotPlayers[slotPosition];
    if (!player) return;
    if (isCaptainSlot(slotPosition)) return; // captain is fixed

    const isTouchPointer = e.pointerType === 'touch' || e.pointerType === 'pen';
    const isBenchSlot = slotPosition >= 12;

    if (!isTouchPointer) e.preventDefault();

    fieldGestureRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
      slotPosition,
      pointerType: e.pointerType,
      dragStarted: false,
    };

    // Register window listeners immediately so we can detect movement before drag starts
    setHasActiveGesture(true);
    suppressNextClickRef.current = false;

    if (isTouchPointer) {
      // Touch: long press (150ms) activates drag
      clearLongPressTimeout();
      longPressTimeoutRef.current = setTimeout(() => {
        if (
          fieldGestureRef.current?.pointerId === e.pointerId &&
          fieldGestureRef.current?.slotPosition === slotPosition &&
          !fieldGestureRef.current?.moved
        ) {
          fieldGestureRef.current = { ...fieldGestureRef.current, dragStarted: true };
          if (isBenchSlot) setIsBenchDrawerOpen(false);
          setDragPointer({ x: fieldGestureRef.current.startX, y: fieldGestureRef.current.startY });
          setDraggingSlot(slotPosition);
        }
        longPressTimeoutRef.current = null;
      }, 150);
    }
    // Mouse: drag starts on first movement (handled in handleFieldPointerMove)

    if (typeof e.currentTarget?.setPointerCapture === 'function') {
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  }, [canEdit, clearLongPressTimeout, slotPlayers]);

  const handleFieldPointerMove = useCallback((e) => {
    if (fieldGestureRef.current?.pointerId != null && e.pointerId !== fieldGestureRef.current.pointerId) return;
    if (!fieldGestureRef.current) return;

    const deltaX = e.clientX - fieldGestureRef.current.startX;
    const deltaY = e.clientY - fieldGestureRef.current.startY;
    const movedEnough = Math.hypot(deltaX, deltaY) > 6;

    if (movedEnough && !fieldGestureRef.current.moved) {
      fieldGestureRef.current = { ...fieldGestureRef.current, moved: true };
      suppressNextClickRef.current = true; // pointer moved → suppress the upcoming onClick
      clearLongPressTimeout();
    }

    // Mouse: start drag the moment the pointer moves enough (no long-press needed)
    if (
      movedEnough &&
      !fieldGestureRef.current.dragStarted &&
      fieldGestureRef.current.pointerType === 'mouse'
    ) {
      const { slotPosition } = fieldGestureRef.current;
      fieldGestureRef.current = { ...fieldGestureRef.current, dragStarted: true };
      if (slotPosition >= 12) setIsBenchDrawerOpen(false);
      setDraggingSlot(slotPosition);
    }

    if (!fieldGestureRef.current.dragStarted) return;

    setDragPointer({ x: e.clientX, y: e.clientY });
    const activeDraggingSlot = fieldGestureRef.current.slotPosition;
    const target = getSlotAtPoint(e.clientX, e.clientY);
    if (!target || target === activeDraggingSlot) { setDropTargetSlot(null); return; }
    const hasPlayer = slotPlayers[target];
    setDropTargetSlot(hasPlayer && !isCaptainSlot(target) && isSwapValid(activeDraggingSlot, target) ? target : null);
  }, [clearLongPressTimeout, getSlotAtPoint, isSwapValid, slotPlayers]);

  const handlePlayerTap = useCallback((player) => {
    if (!player) return;
    setSelectedCard(player);
  }, []);

  const handleFieldPointerUp = useCallback((e) => {
    if (fieldGestureRef.current?.pointerId != null && e.pointerId !== fieldGestureRef.current.pointerId) return;
    const gesture = fieldGestureRef.current;
    if (!gesture) return;
    clearLongPressTimeout();
    fieldGestureRef.current = null;
    setHasActiveGesture(false);

    if (!gesture.dragStarted) {
      // No drag — onClick will handle opening stats
      setDropTargetSlot(null);
      return;
    }

    // Drag was active — complete the swap
    const target = getSlotAtPoint(e.clientX, e.clientY);
    if (target && target !== gesture.slotPosition && slotPlayers[target]) {
      performSwap(gesture.slotPosition, target);
    }
    setDraggingSlot(null);
    setDragPointer(null);
    setDropTargetSlot(null);
  }, [clearLongPressTimeout, getSlotAtPoint, handlePlayerTap, performSwap, slotPlayers]);

  // Global pointer listeners — active from pointerdown until pointerup/cancel
  useEffect(() => {
    if (!hasActiveGesture && draggingSlot === null) return undefined;

    const onMove = (e) => handleFieldPointerMove(e);
    const onUp = (e) => handleFieldPointerUp(e);
    const onCancel = () => {
      clearLongPressTimeout();
      fieldGestureRef.current = null;
      setHasActiveGesture(false);
      setDraggingSlot(null);
      setDragPointer(null);
      setDropTargetSlot(null);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
    };
  }, [clearLongPressTimeout, hasActiveGesture, draggingSlot, handleFieldPointerMove, handleFieldPointerUp]);

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
        <span className="text-xs text-gray-600">{(draft.picks || []).length}/{11 + BENCH_SLOTS.length} picks</span>
      </div>

      {swapError && (
        <div className="mb-3 rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-2 text-sm text-red-200">
          {swapError}
        </div>
      )}

      {autoSubstitutionCount > 0 && (
        <div className="mb-3 rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-100">
          {autoSubstitutionCount} substitui{autoSubstitutionCount > 1 ? 'coes automáticas aplicadas' : 'ção automática aplicada'} nesta rodada.
        </div>
      )}


      <div className="flex-1 min-h-0 bg-green-950/40 border border-green-900/30 rounded-2xl p-2.5 sm:p-3">
        <div
          ref={fieldRef}
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
            const player = visualSlotPlayers[slot.position];
            const isCaptain = isCaptainFieldSlot(slot.position);
            const posLabel = getDetailedPositionLabel(slot.detailed_position_id) || '?';
            const isDragging = draggingSlot === slot.position;
            // captain slot cannot be a drop target
            const isDropTarget = dropTargetSlot === slot.position && !isCaptain;
            const substitutionType = player?.auto_substitution?.type ?? null;

            return (
              <div
                key={slot.key}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ top: `${slot.top}%`, left: `${slot.left}%`, zIndex: 20 }}
              >
                {player ? (
                  <div
                    onPointerDown={(e) => handleFieldPointerDown(e, slot.position)}
                    onClick={() => {
                      if (suppressNextClickRef.current) { suppressNextClickRef.current = false; return; }
                      handlePlayerTap(player);
                    }}
                    style={{
                      cursor: isCaptain ? 'pointer' : canEdit ? 'grab' : 'pointer',
                      position: 'relative',
                      touchAction: 'manipulation',
                      opacity: isDragging ? 0.3 : 1,
                      outline: isDropTarget ? '2px solid rgba(34,197,94,0.9)' : 'none',
                      borderRadius: '20px',
                      transition: isDragging ? 'none' : 'opacity 0.15s',
                    }}
                  >
                    {isCaptain && (
                      <div className="absolute -top-2 left-1/2 z-20 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full border border-amber-200/90 bg-amber-400 text-[11px] font-black text-slate-950 shadow-[0_10px_18px_rgba(0,0,0,0.32)]">
                        C
                      </div>
                    )}
                    <SubstitutionBadge type={substitutionType} />
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

      {/* Bench drawer backdrop */}
      {isBenchDrawerOpen && (
        <button
          type="button"
          aria-label="Fechar reservas"
          onClick={() => setIsBenchDrawerOpen(false)}
          className="fixed inset-0 z-30 bg-black/45 backdrop-blur-[1px]"
        />
      )}

      {/* Bench toggle tab */}
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

      {/* Bench drawer */}
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
          {visualBenchSlots.map(({ slot, label, player }) => {
            const posLabel = player ? getDetailedPositionLabel(player.detailed_position_id) : null;
            const isDragging = draggingSlot === slot;
            const substitutionType = player?.auto_substitution?.type ?? null;

            if (player) {
              return (
                <div
                  key={slot}
                  onPointerDown={(e) => handleFieldPointerDown(e, slot)}
                  onClick={() => {
                    if (suppressNextClickRef.current) { suppressNextClickRef.current = false; return; }
                    handlePlayerTap(player);
                  }}
                  style={{
                    flexShrink: 0,
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    cursor: canEdit ? 'grab' : 'pointer',
                    touchAction: 'manipulation',
                    opacity: isDragging ? 0.3 : 1,
                    borderRadius: '20px',
                    transition: isDragging ? 'none' : 'opacity 0.15s',
                    position: 'relative',
                  }}
                >
                  <SubstitutionBadge type={substitutionType} />
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

      {/* Drag preview */}
      {draggingSlot !== null && draggingPlayer && dragPointer && (
        <div
          className="pointer-events-none fixed z-[80]"
          style={{
            left: dragPointer.x,
            top: dragPointer.y,
            transform: 'translate(-50%, -50%) scale(1.08)',
            opacity: 0.92,
            filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.5))',
          }}
        >
          <FieldPlayerPreview
            player={draggingPlayer}
            posLabel={draggingPosLabel}
            slotPositionId={
              draggingSlot <= STARTER_SLOT_LIMIT
                ? starterPlacements.find((s) => s.position === draggingSlot)?.detailed_position_id ?? null
                : null
            }
          />
        </div>
      )}

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
