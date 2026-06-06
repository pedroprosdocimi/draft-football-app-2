import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { API_URL } from '../config.js';
import FormationPickerPhase from '../components/FormationPickerPhase.jsx';
import { getFormationPreviewLayout } from '../components/FormationPreview.jsx';
import PickPanel from '../components/PickPanel.jsx';
import FieldPlayerPreview from '../components/FieldPlayerPreview.jsx';
import PlayerStatsModal from '../components/PlayerStatsModal.jsx';
import FixturesBrowser from '../components/FixturesBrowser.jsx';
import { getDetailedPositionLabel, matchesDetailedPositionSlot } from '../utils/positions.js';
import PlayerFigure, { NATIONAL_KITS } from '../components/PlayerFigure.jsx';
import { nationalityToIso2 } from '../utils/nationality.js';

// Maps detailed_position_id to basic position_id
const DETAILED_TO_BASIC = {
  1:1, 2:2, 3:2, 4:2, 5:3, 6:3, 7:3, 8:3, 9:3, 10:4, 11:4, 12:4, 13:4
};

const GRAY_KIT = NATIONAL_KITS['_'];

const POS_FULL = {
  GOL: 'Goleiro', ZAG: 'Zagueiro', LD: 'Lateral Dir.', LE: 'Lateral Esq.',
  VOL: 'Volante', MC: 'Meio-campo', MEI: 'Meia', MD: 'Meia Dir.', ME: 'Meia Esq.',
  PD: 'Ponta Dir.', PE: 'Ponta Esq.', ATA: 'Centroavante',
};

const DRAFT_DETAIL_TO_LINE = {
  1: 'var(--c-gk)',
  2: 'var(--c-def)', 3: 'var(--c-def)', 4: 'var(--c-def)',
  5: 'var(--c-mid)', 6: 'var(--c-mid)', 7: 'var(--c-mid)', 8: 'var(--c-mid)', 9: 'var(--c-mid)',
  10: 'var(--c-att)', 11: 'var(--c-att)', 12: 'var(--c-att)', 13: 'var(--c-att)',
};

// Bench slot definitions
const BENCH_SLOTS = [
  { slot: 12, label: 'RES 1' },
  { slot: 13, label: 'RES 2' },
  { slot: 14, label: 'RES 3' },
  { slot: 15, label: 'RES 4' },
  { slot: 16, label: 'RES 5' },
  { slot: 17, label: 'RES 6' },
  { slot: 18, label: 'RES 7' },
];

const Emblem = ({ s = 30 }) => (
  <span className="demblem" dangerouslySetInnerHTML={{ __html:
    `<svg width="${s}" height="${s}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="tg${s}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1f7a46"/><stop offset="1" stop-color="#0b3a20"/></linearGradient>
      <clipPath id="tc${s}"><rect x="3" y="3" width="94" height="94" rx="26"/></clipPath></defs>
      <rect x="3" y="3" width="94" height="94" rx="26" fill="url(#tg${s})"/>
      <g clip-path="url(#tc${s})">
        <rect x="3" y="3" width="15.666" height="94" fill="#ffffff" opacity="0.05"/>
        <rect x="18.666" y="3" width="15.666" height="94" fill="#06351c" opacity="0.30"/>
        <rect x="34.333" y="3" width="15.666" height="94" fill="#ffffff" opacity="0.05"/>
        <rect x="50" y="3" width="15.666" height="94" fill="#06351c" opacity="0.30"/>
        <rect x="65.666" y="3" width="15.666" height="94" fill="#ffffff" opacity="0.05"/>
        <rect x="81.333" y="3" width="15.666" height="94" fill="#06351c" opacity="0.30"/>
        <rect x="3" y="3" width="94" height="48" rx="26" fill="#ffffff" opacity="0.05"/>
      </g>
      <rect x="7" y="7" width="86" height="86" rx="22" fill="none" stroke="#fbd07a" stroke-width="0.9" opacity="0.55"/>
      <text x="50" y="49" text-anchor="middle" dominant-baseline="central" font-family="'Bricolage Grotesque',sans-serif" font-weight="800" font-size="44" letter-spacing="-2" fill="#f6f8f6">11</text>
      <text x="50" y="72" text-anchor="middle" font-family="'Bricolage Grotesque',sans-serif" font-weight="700" font-size="8" letter-spacing="4" fill="#fbd07a">DRAFT</text>
    </svg>`
  }} />
);

const ArrowR = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>
  </svg>
);

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

function getPlayerDisplayName(player) {
  return player?.display_name || player?.name || 'Este jogador';
}

export default function Draft({ draftId, user, onGoHome, onComplete }) {
  const [draft, setDraft] = useState(null);
  const [formations, setFormations] = useState(null);
  const [options, setOptions] = useState(null);
  const [activeSlot, setActiveSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [swapError, setSwapError] = useState(null);
  const [isBenchDrawerOpen, setIsBenchDrawerOpen] = useState(false);
  const [isCaptainSelectionMode, setIsCaptainSelectionMode] = useState(false);
  const [showConfirmDraftModal, setShowConfirmDraftModal] = useState(false);
  const [showFixturesModal, setShowFixturesModal] = useState(false);
  const [captainCandidateId, setCaptainCandidateId] = useState(null);

  const [pendingPick, setPendingPick] = useState(null);
  // { player: PlayerObject, slotPosition: number }
  const [pickedPlayers, setPickedPlayers] = useState({});
  // { [slotPosition]: PlayerObject } - persists cards for rendering after API confirms
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [poppingSlot, setPoppingSlot] = useState(null);
  const [draggingSlot, setDraggingSlot] = useState(null); // slot being drag-swapped
  const [dropTargetSlot, setDropTargetSlot] = useState(null); // highlighted drop target
  const [dragPointer, setDragPointer] = useState(null); // pointer position for drag preview
  const [selectedSwapSlot, setSelectedSwapSlot] = useState(null); // tap-to-swap selection
  const [selectedCard, setSelectedCard] = useState(null);
  const animTimeoutsRef = React.useRef([]);
  const fieldRef = React.useRef(null);
  const fieldGestureRef = React.useRef(null);
  const swapErrorTimeoutRef = React.useRef(null);
  const longPressTimeoutRef = React.useRef(null);
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= 1024
  );
  const isBenchPhase = draft?.status === 'bench_drafting';
  const isCaptainPhase = draft?.status === 'captain_pick';

  // Map slotPosition to pick for quick lookup
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

  const draggingPlayer = useMemo(() => {
    if (draggingSlot === null) return null;
    return normalizeDraftPlayer(pickedPlayers[draggingSlot] ?? picksBySlot[draggingSlot] ?? null);
  }, [draggingSlot, pickedPlayers, picksBySlot]);

  const draggingSlotDetails = useMemo(() => {
    if (draggingSlot === null) return { posLabel: null, slotPositionId: null };

    if (draggingSlot <= 11) {
      const slotDef = starterPlacements.find((slot) => slot.position === draggingSlot)
        ?? formationSlots.find((slot) => slot.position === draggingSlot);
      const slotPositionId = slotDef?.detailed_position_id ?? null;
      return {
        posLabel: getDetailedPositionLabel(slotPositionId) || getDetailedPositionLabel(draggingPlayer?.detailed_position_id) || null,
        slotPositionId,
      };
    }

    return {
      posLabel: getDetailedPositionLabel(draggingPlayer?.detailed_position_id) || null,
      slotPositionId: null,
    };
  }, [draggingPlayer?.detailed_position_id, draggingSlot, formationSlots, starterPlacements]);

  const activeNextSlot = useMemo(() => {
    if (draft?.status !== 'drafting') return null;
    return starterPlacements.find(
      (s) => !picksBySlot[s.position] && !pickedPlayers[s.position]
    ) ?? null;
  }, [draft?.status, starterPlacements, picksBySlot, pickedPlayers]);

  const pickedFlags = useMemo(() => {
    return [...new Set(
      (draft?.picks ?? [])
        .map((p) => nationalityToIso2(p.nationality ?? ''))
        .filter(Boolean)
    )];
  }, [draft?.picks]);

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
    if (longPressTimeoutRef.current) clearTimeout(longPressTimeoutRef.current);
  }, []);

  useEffect(() => {
    const fn = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
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

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

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

  useEffect(() => {
    if (!isBenchPhase && !isCaptainPhase) {
      setIsBenchDrawerOpen(false);
      return;
    }

    setIsBenchDrawerOpen(true);

    if (draggingSlot !== null && draggingSlot >= 12) {
      setIsBenchDrawerOpen(false);
    }
  }, [draggingSlot, isBenchPhase, isCaptainPhase]);

  useEffect(() => {
    if (!isCaptainPhase) {
      setIsCaptainSelectionMode(false);
      setCaptainCandidateId(null);
      return;
    }

    if (draft?.captain_player_id) {
      setCaptainCandidateId(String(draft.captain_player_id));
    }
  }, [draft?.captain_player_id, isCaptainPhase]);

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
    clearLongPressTimeout();
    fieldGestureRef.current = null;
    setSelectedCard(normalizedPlayer);
  }, [clearLongPressTimeout]);

  const handleOccupiedSlotTap = useCallback((slotPosition, player) => {
    const normalizedPlayer = normalizeDraftPlayer(player);
    if (!normalizedPlayer?.id) return;

    if (selectedSwapSlot !== null) {
      if (selectedSwapSlot === slotPosition) {
        setSelectedSwapSlot(null);
      } else {
        handleSwap(selectedSwapSlot, slotPosition);
        setSelectedSwapSlot(null);
      }
      return;
    }

    if (isBenchPhase) {
      setSelectedSwapSlot(slotPosition);
      return;
    }

    handleOpenPlayerStats(normalizedPlayer);
  }, [handleOpenPlayerStats, isBenchPhase, selectedSwapSlot]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFieldPointerDown = useCallback((e, slotPosition, player) => {
    if (!normalizeDraftPlayer(player)?.id) return;
    const isTouchPointer = e.pointerType === 'touch' || e.pointerType === 'pen';
    const isBenchSlot = slotPosition >= 12;
    if (!isTouchPointer) {
      e.preventDefault();
    }
    fieldGestureRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
      slotPosition,
      pointerType: e.pointerType,
      dragReady: !isTouchPointer,
    };
    if (!isTouchPointer) {
      if (isBenchSlot) {
        setIsBenchDrawerOpen(false);
      }
      setDraggingSlot(slotPosition);
    } else {
      clearLongPressTimeout();
      longPressTimeoutRef.current = setTimeout(() => {
        if (
          fieldGestureRef.current?.pointerId === e.pointerId &&
          fieldGestureRef.current?.slotPosition === slotPosition &&
          !fieldGestureRef.current?.moved
        ) {
          fieldGestureRef.current = {
            ...fieldGestureRef.current,
            dragReady: true,
          };
          if (isBenchSlot) {
            setIsBenchDrawerOpen(false);
          }
          setDragPointer({
            x: fieldGestureRef.current.startX,
            y: fieldGestureRef.current.startY,
          });
          setDraggingSlot(slotPosition);
        }
        longPressTimeoutRef.current = null;
      }, 150);
    }
    if (!isTouchPointer && typeof e.currentTarget?.setPointerCapture === 'function') {
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  }, [clearLongPressTimeout]);

  const isSwapValid = useCallback((slotA, slotB) => {
    const isBenchA = slotA >= 12;
    const isBenchB = slotB >= 12;

    // Bench <-> bench: always valid (no slot constraints).
    if (isBenchA && isBenchB) return true;

    const playerA = normalizeDraftPlayer(pickedPlayers[slotA] || picksBySlot[slotA]);
    const playerB = normalizeDraftPlayer(pickedPlayers[slotB] || picksBySlot[slotB]);
    if (!playerA || !playerB) return true; // not enough data to validate

    // Starter <-> starter: both directions must match.
    if (!isBenchA && !isBenchB) {
      const slotADef = starterPlacements.find(s => s.position === slotA);
      const slotBDef = starterPlacements.find(s => s.position === slotB);
      if (!slotADef || !slotBDef) return true;
      return (
        matchesDetailedPositionSlot(playerA, slotBDef.detailed_position_id) &&
        matchesDetailedPositionSlot(playerB, slotADef.detailed_position_id)
      );
    }

    // Starter <-> bench: only validate the player that would end up in the starter slot.
    const starterSlot = isBenchA ? slotB : slotA;
    const incomingToStarter = isBenchA ? playerA : playerB;
    const starterDef = starterPlacements.find(s => s.position === starterSlot);
    if (!starterDef) return true;
    return matchesDetailedPositionSlot(incomingToStarter, starterDef.detailed_position_id);
  }, [pickedPlayers, picksBySlot, starterPlacements]);

  const getSwapInvalidReason = useCallback((slotA, slotB) => {
    const isBenchA = slotA >= 12;
    const isBenchB = slotB >= 12;
    if (isBenchA && isBenchB) return null;

    const playerA = normalizeDraftPlayer(pickedPlayers[slotA] || picksBySlot[slotA]);
    const playerB = normalizeDraftPlayer(pickedPlayers[slotB] || picksBySlot[slotB]);
    if (!playerA || !playerB) return null;

    // Starter <-> starter: explain either side.
    if (!isBenchA && !isBenchB) {
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
    }

    // Starter <-> bench: explain why the bench player can't enter that starter slot.
    const starterSlot = isBenchA ? slotB : slotA;
    const incomingToStarter = isBenchA ? playerA : playerB;
    const starterDef = starterPlacements.find((slot) => slot.position === starterSlot);
    if (!starterDef) return null;
    if (!matchesDetailedPositionSlot(incomingToStarter, starterDef.detailed_position_id)) {
      return `O jogador ${getPlayerDisplayName(incomingToStarter)} não pode jogar na posição ${getDetailedPositionLabel(starterDef.detailed_position_id)}.`;
    }
    return null;
  }, [pickedPlayers, picksBySlot, starterPlacements]);

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
    if (fieldGestureRef.current?.pointerId != null && e.pointerId !== fieldGestureRef.current.pointerId) return;
    if (!fieldGestureRef.current) return;

    if (draggingSlot === null) {
      const deltaX = e.clientX - fieldGestureRef.current.startX;
      const deltaY = e.clientY - fieldGestureRef.current.startY;
      if (Math.hypot(deltaX, deltaY) > 8) {
        fieldGestureRef.current = { ...fieldGestureRef.current, moved: true };
        clearLongPressTimeout();
      }
      return;
    }

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
    setDragPointer({ x: e.clientX, y: e.clientY });
    const target = getSlotAtPoint(e.clientX, e.clientY);
    if (!target || target === draggingSlot) { setDropTargetSlot(null); return; }
    const hasPlayer = pickedPlayers[target] || picksBySlot[target];
    setDropTargetSlot(hasPlayer && isSwapValid(draggingSlot, target) ? target : null);
  }, [clearLongPressTimeout, draggingSlot, getSlotAtPoint, pickedPlayers, picksBySlot, isSwapValid]);

  const handleFieldPointerUp = useCallback((e) => {
    if (fieldGestureRef.current?.pointerId != null && e.pointerId !== fieldGestureRef.current.pointerId) return;
    const gesture = fieldGestureRef.current;
    if (!gesture) return;
    clearLongPressTimeout();

    const activePlayer = normalizeDraftPlayer(pickedPlayers[draggingSlot] || picksBySlot[draggingSlot]);
    if (draggingSlot === null) {
      if (!gesture.moved) {
        const tappedPlayer = normalizeDraftPlayer(pickedPlayers[gesture.slotPosition] || picksBySlot[gesture.slotPosition]);
        handleOccupiedSlotTap(gesture.slotPosition, tappedPlayer);
      }
      fieldGestureRef.current = null;
      setDropTargetSlot(null);
      return;
    }

    if (fieldGestureRef.current && !fieldGestureRef.current.moved) {
      if (gesture.pointerType === 'mouse') {
        handleOccupiedSlotTap(draggingSlot, activePlayer);
      }
      fieldGestureRef.current = null;
      setDraggingSlot(null);
      setDragPointer(null);
      setDropTargetSlot(null);
      return;
    }
    const target = getSlotAtPoint(e.clientX, e.clientY);
    if (target && target !== draggingSlot && (pickedPlayers[target] || picksBySlot[target])) {
      handleSwap(draggingSlot, target);
    }
    fieldGestureRef.current = null;
    setDraggingSlot(null);
    setDragPointer(null);
    setDropTargetSlot(null);
  }, [clearLongPressTimeout, draggingSlot, getSlotAtPoint, handleOccupiedSlotTap, pickedPlayers, picksBySlot]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (draggingSlot === null) return undefined;

    const handleWindowPointerMove = (e) => {
      handleFieldPointerMove(e);
    };

    const handleWindowPointerUp = (e) => {
      handleFieldPointerUp(e);
    };

    const handleWindowPointerCancel = () => {
      clearLongPressTimeout();
      fieldGestureRef.current = null;
      setDraggingSlot(null);
      setDragPointer(null);
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
  }, [clearLongPressTimeout, draggingSlot, handleFieldPointerMove, handleFieldPointerUp]);

  const handleSwap = async (slotA, slotB) => {
    const playerA = normalizeDraftPlayer(pickedPlayers[slotA] || picksBySlot[slotA]);
    const playerB = normalizeDraftPlayer(pickedPlayers[slotB] || picksBySlot[slotB]);
    const playerAId = playerA?.id || null;
    const playerBId = playerB?.id || null;
    if (!playerAId || !playerBId) return;

    const putPick = async (playerId, slotPosition) => {
      const r = await authFetch(`${API_URL}/drafts/${draftId}/picks`, {
        method: 'PUT',
        body: JSON.stringify({ player_id: playerId, slot_position: slotPosition }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Não foi possível trocar.');
      return d;
    };

    if (!isSwapValid(slotA, slotB)) {
      showSwapError(getSwapInvalidReason(slotA, slotB) || 'Troca inválida.');
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

      const isBenchA = slotA >= 12;
      const isBenchB = slotB >= 12;

      // If swapping bench <-> starter, write the starter slot first (it can fail validation),
      // so we don't end up with a partial server state.
      if (isBenchA !== isBenchB) {
        const starterSlot = isBenchA ? slotB : slotA;
        const benchSlot = isBenchA ? slotA : slotB;
        const benchPlayerId = isBenchA ? playerAId : playerBId;
        const starterPlayerId = isBenchA ? playerBId : playerAId;

        await putPick(benchPlayerId, starterSlot);
        await putPick(starterPlayerId, benchSlot);
      } else {
        await putPick(playerBId, slotA);
        await putPick(playerAId, slotB);
      }

      await loadDraft();
    } catch (e) {
      showSwapError(e.message);
      // Reload to ensure we don't keep a partial swap if the server accepted one PUT and rejected the other.
      await loadDraft();
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

  const handleCaptainModeButton = useCallback(() => {
    if (!isCaptainSelectionMode) {
      setIsCaptainSelectionMode(true);
      setSelectedCard(null);
      setSelectedSwapSlot(null);
      setOptions(null);
      setActiveSlot(null);
      return;
    }

    if (captainCandidateId) {
      setShowConfirmDraftModal(true);
    }
  }, [captainCandidateId, isCaptainSelectionMode]);

  const handleCaptainFieldClick = useCallback((slotPosition, player) => {
    const normalizedPlayer = normalizeDraftPlayer(player);
    if (!normalizedPlayer?.id || slotPosition > 11) return;

    if (!isCaptainSelectionMode) {
      handleOpenPlayerStats(normalizedPlayer);
      return;
    }

    setCaptainCandidateId(String(normalizedPlayer.id));
  }, [handleOpenPlayerStats, isCaptainSelectionMode]);

  if (!draft) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-700 border-t-draft-gold" />
          <p className="text-gray-400">Carregando draft...</p>
        </div>
      </div>
    );
  }

  // Formation pick phase
  if (draft.status === 'formation_pick') {
    return <FormationPickerPhase onPick={handleSetFormation} />;
  }

  const phaseLabel = isCaptainPhase ? 'Capitão' : isBenchPhase ? 'Reservas' : 'Titulares';
  const pickedCount = draft.picks?.length ?? 0;
  const totalSlots = isBenchPhase ? 11 + BENCH_SLOTS.length : 11;
  const pct = totalSlots > 0 ? (pickedCount / totalSlots) * 100 : 0;

  const renderPitch = () => {
    return (
      <div
        className="pitch"
        data-theme="stadium"
        ref={fieldRef}
        style={{
          cursor: draggingSlot !== null ? 'grabbing' : 'default',
          touchAction: draggingSlot !== null ? 'none' : 'auto',
        }}
      >
        {isCaptainSelectionMode && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 5, background: 'rgba(0,0,0,0.34)' }} />
        )}
        <div className="pl pl-frame" />
        <div className="pl pl-half" />
        <div className="pl pl-circle" />
        <div className="pl pl-spot" />
        <div className="pl pl-boxT" />
        <div className="pl pl-boxB" />
        <div className="pl pl-gaT" />
        <div className="pl pl-gaB" />

        {starterPlacements.map((slot) => {
          const posLabel = getDetailedPositionLabel(slot.detailed_position_id) || slot.label || '?';
          const lineColor = DRAFT_DETAIL_TO_LINE[slot.detailed_position_id] ?? 'var(--c-mid)';
          const playerObj = normalizeDraftPlayer(pickedPlayers[slot.position] ?? null);
          const confirmedPick = picksBySlot[slot.position];
          const cardPlayer = playerObj ?? normalizeDraftPlayer(confirmedPick);
          const isLocked = isBenchPhase && !playerObj && !confirmedPick;
          const showFieldCard = Boolean(playerObj || confirmedPick);
          const isCaptainSelected = isCaptainPhase && captainCandidateId &&
            String(cardPlayer?.id) === String(captainCandidateId);
          const isNextPick = !isBenchPhase && !isCaptainPhase &&
            activeNextSlot?.position === slot.position;
          const cardAnimationStyle = poppingSlot === slot.position
            ? { animation: 'card-pop 0.45s cubic-bezier(0.34,1.56,0.64,1) both' }
            : undefined;
          const posFullLabel = POS_FULL[posLabel] ?? posLabel;

          return (
            <div
              key={slot.key}
              className="slot"
              data-filled={showFieldCard ? 'true' : undefined}
              style={{ top: `${slot.top}%`, left: `${slot.left}%` }}
            >
              {showFieldCard ? (
                <div
                  onPointerDown={isCaptainPhase ? undefined : (e) => handleFieldPointerDown(e, slot.position, cardPlayer)}
                  onClick={
                    isCaptainPhase
                      ? () => handleCaptainFieldClick(slot.position, cardPlayer)
                      : () => {
                          if (!fieldGestureRef.current?.moved) {
                            clearLongPressTimeout();
                            fieldGestureRef.current = null;
                            setDraggingSlot(null);
                            setDragPointer(null);
                            handleOpenPlayerStats(cardPlayer);
                          }
                        }
                  }
                  style={{
                    ...cardAnimationStyle,
                    touchAction: isCaptainPhase ? 'manipulation' : 'none',
                    cursor: isCaptainPhase ? 'pointer' : draggingSlot === slot.position ? 'grabbing' : 'grab',
                    opacity: draggingSlot === slot.position ? 0.5 : 1,
                    outline: isCaptainSelected
                      ? '3px solid rgba(250,204,21,0.98)'
                      : isCaptainSelectionMode
                        ? '2px solid rgba(255,255,255,0.38)'
                        : selectedSwapSlot === slot.position
                          ? '2px solid rgba(250,204,21,0.95)'
                          : dropTargetSlot === slot.position
                            ? '2px solid rgba(110,231,183,0.8)'
                            : 'none',
                    borderRadius: '12px',
                    transition: 'opacity 0.15s, outline 0.1s, transform 0.16s',
                    transform: isCaptainSelectionMode ? 'scale(1.03)' : undefined,
                    position: 'relative',
                    zIndex: isCaptainSelectionMode ? 25 : undefined,
                  }}
                >
                  <FieldPlayerPreview
                    player={cardPlayer}
                    posLabel={posLabel}
                    slotPositionId={slot.detailed_position_id}
                    captainPlayerId={draft.captain_player_id}
                  />
                </div>
              ) : isLocked ? (
                <div
                  className="fcard is-empty"
                  style={{ '--line-c': lineColor, opacity: 0.4, pointerEvents: 'none' }}
                >
                  <div className="fcard-veil" />
                  <PlayerFigure kit={GRAY_KIT} number="" surname="" uid={`lock-${slot.position}`} className="sil" />
                  <div className="fcard-body">
                    <div className="fcard-head">
                      <span />
                      <span className="fcard-pos">{posLabel}</span>
                    </div>
                  </div>
                  <div className="e-label">Fechado</div>
                </div>
              ) : (
                <div
                  className={`fcard is-empty${isNextPick ? ' is-active' : ''}`}
                  style={{ '--line-c': lineColor }}
                  onClick={() => handleSlotClick(slot.position)}
                >
                  <div className="fcard-veil" />
                  <PlayerFigure kit={GRAY_KIT} number="" surname="" uid={`sil-${slot.position}`} className="sil" />
                  {isNextPick && <div className="nexttag">PRÓXIMA</div>}
                  <div className="fcard-body">
                    <div className="fcard-head">
                      <span />
                      <span className="fcard-pos">{posLabel}</span>
                    </div>
                  </div>
                  <div className="e-plus">+</div>
                  <div className="e-label">{posFullLabel}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderMobile = () => (
    <>
      <div className="dhead">
        <div className="dhead-brand">
          <span className="wm bricol">
            <Emblem s={26} />
            draft<span className="g">11</span>
          </span>
          <span className="wc-tag"><span className="star">★</span> COPA 2026</span>
        </div>
        <div className="dhead-ctrl">
          <button className="dback" onClick={onGoHome}>‹ Sair</button>
          <span className="dphase">
            {phaseLabel} <span className="fmt">· {draft.formation}</span>
          </span>
          <button className="dpill" onClick={() => setShowFixturesModal(true)}>Partidas</button>
        </div>
        <div className="dprog">
          <span className="lab">{pickedCount}/{totalSlots}</span>
          <div className="bar">
            <div className="fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <div className="dfieldwrap">
        {renderPitch()}
      </div>

      {activeNextSlot && draft.status === 'drafting' && (() => {
        const lc = DRAFT_DETAIL_TO_LINE[activeNextSlot.detailed_position_id] ?? 'var(--c-mid)';
        const pfl = POS_FULL[getDetailedPositionLabel(activeNextSlot.detailed_position_id)] ??
          getDetailedPositionLabel(activeNextSlot.detailed_position_id) ?? '?';
        return (
          <div className="ddock">
            <div className="ddock-inner">
              <div
                className="fcard is-empty is-active"
                style={{ '--line-c': lc, '--fcw': '50px', flexShrink: 0 }}
                onClick={() => handleSlotClick(activeNextSlot.position)}
              >
                <div className="fcard-veil" />
                <PlayerFigure kit={GRAY_KIT} number="" surname="" uid="dock-next" className="sil" />
                <div className="nexttag">PRÓXIMA</div>
                <div className="fcard-body"><div className="fcard-head"><span /></div></div>
                <div className="e-plus">+</div>
              </div>
              <div className="grow">
                <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 15, color: 'var(--text)' }}>
                  {pfl}
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 2 }}>
                  Toque na carta para escolher o jogador
                </div>
              </div>
              <button
                className="btn-pick"
                style={{ margin: 0, width: 'auto', padding: '0 18px', height: 42, whiteSpace: 'nowrap' }}
                onClick={() => handleSlotClick(activeNextSlot.position)}
              >
                Escolher <ArrowR />
              </button>
            </div>
          </div>
        );
      })()}
    </>
  );

  const renderDesktop = () => {
    const nextSlot = activeNextSlot;
    const nextLc = nextSlot
      ? (DRAFT_DETAIL_TO_LINE[nextSlot.detailed_position_id] ?? 'var(--c-mid)')
      : 'var(--c-mid)';
    const nextPosLabel = nextSlot
      ? (POS_FULL[getDetailedPositionLabel(nextSlot.detailed_position_id)] ??
         getDetailedPositionLabel(nextSlot.detailed_position_id) ?? '?')
      : '?';

    return (
      <>
        <div className="rail rail-l">
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <Emblem s={34} />
            <span className="bricol" style={{ fontWeight: 800, fontSize: 20, color: 'var(--text)' }}>
              draft<span style={{ color: 'var(--gold)' }}>11</span>
            </span>
          </div>
          <span className="wc-tag"><span className="star">★</span> COPA DO MUNDO 2026</span>
          <div className="rcard">
            <h4>Seu Draft</h4>
            <div className="rrow">
              <span className="k">Rodada</span>
              <span className="v">{draft.round_id}</span>
            </div>
            <div className="rrow">
              <span className="k">Formação</span>
              <span className="v gold">{draft.formation}</span>
            </div>
            <div className="rrow">
              <span className="k">Fase</span>
              <span className="v">{phaseLabel}</span>
            </div>
            <div className="rrow">
              <span className="k">Escalados</span>
              <span className="v">{pickedCount} / {totalSlots}</span>
            </div>
          </div>
          <div className="rcard">
            <h4>Progresso</h4>
            <div className="dprog">
              <span className="lab">{pickedCount}/{totalSlots}</span>
              <div className="bar"><div className="fill" style={{ width: `${pct}%` }} /></div>
            </div>
          </div>
          <div className="rail-spacer" />
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="dpill"
              style={{ flex: 1, justifyContent: 'center', height: 38 }}
              onClick={() => setShowFixturesModal(true)}
            >Partidas</button>
            <button
              className="dpill"
              style={{ flex: 1, justifyContent: 'center', height: 38 }}
              onClick={onGoHome}
            >Sair</button>
          </div>
        </div>

        <div className="pitch-center">
          {renderPitch()}
        </div>

        <div className="rail rail-r">
          {nextSlot && draft.status === 'drafting' && (
            <div className="nextpick" style={{ '--puck': nextLc }}>
              <div className="eyebrow">Próxima escolha</div>
              <div className="np-row">
                <div
                  className="fcard is-empty is-active"
                  style={{ '--line-c': nextLc, '--fcw': '68px', flexShrink: 0 }}
                  onClick={() => handleSlotClick(nextSlot.position)}
                >
                  <div className="fcard-veil" />
                  <PlayerFigure kit={GRAY_KIT} number="" surname="" uid="rail-next" className="sil" />
                  <div className="nexttag">PRÓXIMA</div>
                  <div className="fcard-body"><div className="fcard-head"><span /></div></div>
                  <div className="e-plus">+</div>
                </div>
                <div>
                  <div className="np-name">{nextPosLabel}</div>
                  <div className="np-sub">{options?.length ?? '–'} jogadores disponíveis</div>
                </div>
              </div>
              <button className="btn-pick" onClick={() => handleSlotClick(nextSlot.position)}>
                Escolher jogador <ArrowR />
              </button>
            </div>
          )}
          <div className="rcard">
            <h4>Posições</h4>
            <div className="legend">
              <div className="li"><span className="sw" style={{ background: 'var(--c-gk)' }} /> Goleiro</div>
              <div className="li"><span className="sw" style={{ background: 'var(--c-def)' }} /> Defesa</div>
              <div className="li"><span className="sw" style={{ background: 'var(--c-mid)' }} /> Meio-campo</div>
              <div className="li"><span className="sw" style={{ background: 'var(--c-att)' }} /> Ataque</div>
            </div>
          </div>
          {pickedFlags.length > 0 && (
            <div className="rcard">
              <h4>Seleções no pote</h4>
              <div className="rail-flags">
                {pickedFlags.map((iso) => (
                  <span key={iso} className={`fi fi-${iso}`} />
                ))}
              </div>
            </div>
          )}
          <div className="rail-spacer" />
        </div>
      </>
    );
  };

  return (
    <>
      <style>{`
        @keyframes card-pop {
          0%   { transform: scale(0.3); opacity: 0; }
          60%  { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1);   opacity: 1; }
        }
        @keyframes captain-cta-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(252,211,77,0.18); opacity: 1; }
          50%       { box-shadow: 0 0 0 10px rgba(252,211,77,0); opacity: 0.78; }
        }
      `}</style>

      {/* Fixed overlays */}
      {showFixturesModal && (
        <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm">
          <div className="mx-auto h-full w-full max-w-xl">
            <FixturesBrowser
              embedded
              initialRoundNumber={draft?.round?.number || null}
              backLabel="Fechar"
              onBack={() => setShowFixturesModal(false)}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="fixed inset-x-0 top-4 z-[90] flex justify-center px-4 pointer-events-none">
          <div className="w-full max-w-sm rounded-2xl border border-red-700 bg-red-900/30 px-4 py-2 text-sm text-red-300 shadow-lg">
            {error}
          </div>
        </div>
      )}

      {swapError && (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-5 pt-6 sm:hidden">
          <div className="w-full max-w-sm rounded-2xl border border-red-400/35 bg-slate-950/96 px-5 py-4 text-center shadow-[0_24px_60px_rgba(0,0,0,0.5)] ring-1 ring-red-300/15 backdrop-blur-md">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-red-300/80">Erro</div>
            <p className="mt-2 text-sm font-medium leading-5 text-red-100">{swapError}</p>
          </div>
        </div>
      )}

      {isCaptainPhase && (
        <div style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 50 }}>
          <button
            type="button"
            onClick={handleCaptainModeButton}
            disabled={loading || (isCaptainSelectionMode && !captainCandidateId)}
            className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
              captainCandidateId
                ? 'border-amber-300/50 bg-amber-400/20 text-amber-100'
                : 'border-white/10 bg-white/5 text-slate-100'
            } ${loading || (isCaptainSelectionMode && !captainCandidateId) ? 'opacity-60' : 'hover:border-amber-300/40 hover:bg-amber-300/10'}`}
            style={{
              animation: !isCaptainSelectionMode && !captainCandidateId
                ? 'captain-cta-pulse 1.15s ease-in-out infinite'
                : 'none',
            }}
          >
            {captainCandidateId ? 'Confirmar Draft' : 'Escolher capitão'}
          </button>
        </div>
      )}

      {/* Bench drawer */}
      {(isBenchPhase || isCaptainPhase) && (
        <>
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
              >✕</button>
            </div>
            <div className="flex h-[calc(100%-4.5rem)] flex-col items-center gap-2 overflow-y-auto pr-1">
              {BENCH_SLOTS.map(({ slot, label }) => {
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
                      onPointerDown={(e) => handleFieldPointerDown(e, slot, cardPlayer)}
                      onClick={() => {
                        if (!fieldGestureRef.current?.moved) {
                          clearLongPressTimeout();
                          fieldGestureRef.current = null;
                          setDraggingSlot(null);
                          setDragPointer(null);
                          handleOpenPlayerStats(cardPlayer);
                        }
                      }}
                      style={{
                        ...(poppingSlot === slot ? { animation: 'card-pop 0.45s cubic-bezier(0.34,1.56,0.64,1) both' } : {}),
                        flexShrink: 0,
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        cursor: draggingSlot === slot ? 'grabbing' : 'pointer',
                        opacity: draggingSlot === slot ? 0.5 : 1,
                        outline: isSelected
                          ? '2px solid rgba(250,204,21,0.95)'
                          : selectedSwapSlot !== null
                            ? '2px solid rgba(110,231,183,0.35)'
                            : 'none',
                        borderRadius: '12px',
                        transition: 'outline 0.1s, opacity 0.15s',
                        touchAction: draggingSlot === slot ? 'none' : 'manipulation',
                      }}
                    >
                      <FieldPlayerPreview
                        player={cardPlayer}
                        posLabel={posLabel}
                        captainPlayerId={draft.captain_player_id}
                      />
                    </div>
                  );
                }

                return (
                  <div
                    key={slot}
                    className="fcard is-empty"
                    style={{ '--line-c': 'var(--text-3)', '--fcw': '76px', flexShrink: 0 }}
                    onClick={() => handleSlotClick(slot)}
                  >
                    <div className="fcard-veil" />
                    <PlayerFigure kit={GRAY_KIT} number="" surname="" uid={`bench-sil-${slot}`} className="sil" />
                    <div className="fcard-body">
                      <div className="fcard-head"><span /><span className="fcard-pos">{label}</span></div>
                    </div>
                    <div className="e-plus">+</div>
                    <div className="e-label">{label}</div>
                  </div>
                );
              })}
            </div>
          </aside>
        </>
      )}

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

      {draggingPlayer && dragPointer && (
        <div
          className="pointer-events-none fixed left-0 top-0 z-[70]"
          style={{ transform: `translate(${dragPointer.x}px, ${dragPointer.y}px)` }}
        >
          <div style={{ transform: 'translate(-50%, -50%) scale(1.03) rotate(-4deg)' }}>
            <FieldPlayerPreview
              player={draggingPlayer}
              posLabel={draggingSlotDetails.posLabel}
              slotPositionId={draggingSlotDetails.slotPositionId}
              captainPlayerId={draft.captain_player_id}
            />
          </div>
        </div>
      )}

      {selectedCard && (
        <PlayerStatsModal player={selectedCard} onClose={() => setSelectedCard(null)} />
      )}

      {showConfirmDraftModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-xs rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.5)]">
            <p className="text-center text-base font-semibold text-white leading-snug mb-2">
              Deseja confirmar seu draft?
            </p>
            <p className="text-center text-sm text-gray-400 mb-6">
              Você não poderá editar após isso.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmDraftModal(false)}
                className="flex-1 rounded-xl border border-white/15 bg-white/5 py-2.5 text-sm font-semibold text-gray-300 transition hover:bg-white/10"
              >Voltar</button>
              <button
                type="button"
                disabled={loading}
                onClick={() => { setShowConfirmDraftModal(false); handleCaptain(captainCandidateId); }}
                className="flex-1 rounded-xl border border-emerald-400/40 bg-emerald-500/20 py-2.5 text-sm font-bold text-emerald-300 transition hover:bg-emerald-500/35 disabled:opacity-60"
              >Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* Main layout shell */}
      <div className="dscreen" data-device={isDesktop ? 'desktop' : 'mobile'}>
        {isDesktop ? renderDesktop() : renderMobile()}
      </div>
    </>
  );
}
