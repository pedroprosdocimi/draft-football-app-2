import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { API_URL } from '../config.js';
import FormationPickerPhase from '../components/FormationPickerPhase.jsx';
import { getFormationPreviewLayout } from '../components/FormationPreview.jsx';
import PickPanel from '../components/PickPanel.jsx';
import DraftPlayerCard from '../components/DraftPlayerCard.jsx';

// Maps detailed_position_id → basic position_id
const DETAILED_TO_BASIC = {
  1:1, 2:2, 3:2, 4:2, 5:3, 6:3, 7:3, 8:3, 9:3, 10:4, 11:4, 12:4, 13:4
};

const DETAILED_LABELS = {
  1:'GOL', 2:'ZAG', 3:'LD', 4:'LE', 5:'VOL',
  6:'MC', 7:'MAT', 8:'ME', 9:'MD', 10:'CA', 11:'PE', 12:'PD', 13:'2AT'
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
  MAT: 'border-amber-300/40 bg-amber-950/95 text-amber-100 ring-amber-300/20',
  PE: 'border-rose-300/40 bg-rose-950/95 text-rose-100 ring-rose-300/20',
  PD: 'border-rose-300/40 bg-rose-950/95 text-rose-100 ring-rose-300/20',
  CA: 'border-rose-300/40 bg-rose-950/95 text-rose-100 ring-rose-300/20',
  '2AT': 'border-rose-300/40 bg-rose-950/95 text-rose-100 ring-rose-300/20',
};

const TEAM_COLORS = {
  FLA: { p: '#CC0000', s: '#1a1a1a' },
  PAL: { p: '#006437', s: '#FFFFFF' },
  FLU: { p: '#831524', s: '#FFFFFF' },
  BOT: { p: '#FFFFFF', s: '#1a1a1a' },
  VAS: { p: '#FFFFFF', s: '#1a1a1a' },
  CAM: { p: '#FFFFFF', s: '#1a1a1a' },
  CRU: { p: '#0041A0', s: '#FFFFFF' },
  INT: { p: '#CC0000', s: '#FFFFFF' },
  GRE: { p: '#0041A0', s: '#1a1a1a' },
  SAO: { p: '#CC0000', s: '#1a1a1a' },
  COR: { p: '#FFFFFF', s: '#1a1a1a' },
  SAN: { p: '#FFFFFF', s: '#1a1a1a' },
  BAH: { p: '#003087', s: '#CC0000' },
  CAP: { p: '#CC0000', s: '#1a1a1a' },
  BRA: { p: '#CC0000', s: '#FFFFFF' },
  CFC: { p: '#00612C', s: '#FFFFFF' },
  VIT: { p: '#CC0000', s: '#1a1a1a' },
  REM: { p: '#003082', s: '#CC0000' },
  MIR: { p: '#F5C400', s: '#0041A0' },
  CHA: { p: '#1A5C2A', s: '#FFFFFF' },
};

function FieldPlayerPreview({ player, posLabel }) {
  const displayName = player?.display_name || player?.name || 'Jogador';
  const teamLabel = player?.team_short_code || '-';
  const avgScore = Number.isFinite(player?.avg_score) ? player.avg_score.toFixed(1) : '0.0';
  const jerseyColors = {
    p: player?.primary_color || TEAM_COLORS[player?.team_short_code]?.p || '#1e293b',
    s: player?.secondary_color || TEAM_COLORS[player?.team_short_code]?.s || '#f8fafc',
  };

  return (
    <div className="w-[4.75rem] overflow-hidden rounded-[20px] border border-white/10 bg-slate-950/82 shadow-[0_14px_24px_rgba(0,0,0,0.34)] backdrop-blur-md sm:w-[6.5rem] sm:rounded-[24px] sm:shadow-[0_18px_32px_rgba(0,0,0,0.36)]">
      <div className="relative overflow-hidden bg-[linear-gradient(180deg,rgba(30,41,59,0.98)_0%,rgba(15,23,42,0.96)_100%)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_42%)]" />
        <div className="relative grid min-h-[4.6rem] grid-cols-[1fr_1fr] gap-1.5 px-1.5 py-1.5 sm:min-h-[5.7rem] sm:gap-2 sm:px-2 sm:py-2">
          <div className="flex min-w-0 flex-col justify-between">
            <div className="rounded-[10px] border border-amber-300/25 bg-amber-400/10 px-1.5 py-1 text-center text-[9px] font-black tracking-[0.12em] text-amber-200 sm:rounded-[12px] sm:px-2 sm:text-[10px] sm:tracking-[0.18em]">
              {avgScore}
            </div>
            <div className="rounded-[10px] border border-white/10 bg-slate-950/65 px-1.5 py-1 text-center text-[8px] font-black uppercase tracking-[0.1em] text-slate-100 sm:rounded-[12px] sm:px-2 sm:text-[9px] sm:tracking-[0.14em]">
              {posLabel}
            </div>
            <div className="rounded-[10px] border border-emerald-200/10 bg-emerald-400/10 px-1.5 py-1 text-center text-[8px] font-bold uppercase tracking-[0.08em] text-emerald-100/85 sm:rounded-[12px] sm:px-2 sm:text-[9px] sm:tracking-[0.12em]">
              {teamLabel}
            </div>
          </div>

          <div className="relative overflow-hidden">
            {player?.team_jersey_url ? (
              <img
                src={player.team_jersey_url}
                alt={player.team_short_code}
                className="absolute bottom-0 right-[-18%] h-[4.6rem] w-auto object-contain drop-shadow-[0_8px_18px_rgba(0,0,0,0.55)] sm:h-[5.7rem]"
              />
            ) : (
              <svg
                viewBox="0 0 120 95"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="absolute bottom-0 right-[-18%] h-[4.6rem] w-auto drop-shadow-[0_8px_18px_rgba(0,0,0,0.55)] sm:h-[5.7rem]"
                aria-label={`Camisa de ${displayName}`}
              >
                <defs>
                  <clipPath id={`field-jersey-${player?.id || displayName}`}>
                    <path d="M38 6 C36 6 24 9 6 20 L13 46 C19 40 25 38 30 38 L30 95 L90 95 L90 38 C95 38 101 40 107 46 L114 20 C96 9 84 6 82 6 C80 1 74 0 74 3 Q60 13 46 3 C46 0 40 1 38 6 Z" />
                  </clipPath>
                </defs>
                <g clipPath={`url(#field-jersey-${player?.id || displayName})`}>
                  <rect x="0" y="0" width="120" height="95" fill={jerseyColors.p} />
                  <rect x="45" y="0" width="30" height="95" fill={jerseyColors.s} opacity="0.85" />
                </g>
              </svg>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-white/8 bg-[linear-gradient(180deg,rgba(8,13,25,0.98)_0%,rgba(2,6,23,1)_100%)] px-1.5 py-1.5 text-center sm:px-2.5 sm:py-2">
        <div className="text-[9px] font-extrabold uppercase leading-tight tracking-[0.02em] text-white sm:text-[11px] sm:tracking-[0.04em]">
          {displayName}
        </div>
      </div>
    </div>
  );
}

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

export default function Draft({ draftId, user, onGoHome, onComplete }) {
  const [draft, setDraft] = useState(null);
  const [formations, setFormations] = useState(null);
  const [options, setOptions] = useState(null);
  const [activeSlot, setActiveSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [pendingPick, setPendingPick] = useState(null);
  // { player: PlayerObject, slotPosition: number }
  const [pickedPlayers, setPickedPlayers] = useState({});
  // { [slotPosition]: PlayerObject } — persists cards for rendering after API confirms
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [poppingSlot, setPoppingSlot] = useState(null);
  const animTimeoutsRef = React.useRef([]);

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

  useEffect(() => () => animTimeoutsRef.current.forEach(clearTimeout), []);

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

    // 1. Store player optimistically
    setPickedPlayers(prev => ({ ...prev, [slotPosition]: player }));
    setPendingPick({ player, slotPosition });
    setPoppingSlot(slotPosition);

    // 2. Start overlay fade-out
    setIsAnimatingOut(true);

    // 3. After 300ms, unmount overlay and trigger pop
    const t1 = setTimeout(() => {
      animTimeoutsRef.current = animTimeoutsRef.current.filter(id => id !== t1);
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
        // Revert optimistic UI on error
        setPickedPlayers(prev => {
          const next = { ...prev };
          delete next[slotPosition];
          return next;
        });
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
              const posLabel = DETAILED_LABELS[pick.detailed_position_id] || '?';
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

      {loading && (
        <div className="text-center text-gray-500 text-sm py-4 animate-pulse">Carregando...</div>
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
          className="relative mx-auto h-[40rem] w-full overflow-hidden rounded-[30px] border border-emerald-300/15 bg-emerald-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_20px_60px_rgba(0,0,0,0.35)] sm:h-[44rem]"
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
            const posLabel = DETAILED_LABELS[slot.detailed_position_id] || slot.label || '?';
            const toneClasses = SLOT_TONE_CLASSES[posLabel] || 'border-white/15 bg-slate-950/88 text-white ring-white/10';
            const playerObj = pickedPlayers[slot.position] ?? null;
            const confirmedPick = picksBySlot[slot.position];
            const isLocked = isBenchPhase && !playerObj && !confirmedPick;
            const showFieldCard = Boolean(playerObj);
            const animationStyle = poppingSlot === slot.position
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
                  ...animationStyle,
                }}
              >
                {showFieldCard ? (
                  <FieldPlayerPreview player={playerObj} posLabel={posLabel} />
                ) : confirmedPick || isLocked ? (
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
              const playerObj = pickedPlayers[slot] ?? null;
              const confirmedPick = picksBySlot[slot];

              if (playerObj) {
                return (
                  <div
                    key={slot}
                    style={poppingSlot === slot
                      ? { animation: 'card-pop 0.45s cubic-bezier(0.34,1.56,0.64,1) both', flexShrink: 0 }
                      : { flexShrink: 0 }
                    }
                  >
                    <DraftPlayerCard player={playerObj} compact isMyTurn={false} />
                  </div>
                );
              }

              if (confirmedPick) {
                return (
                  <div key={slot} style={{ width: 140, minHeight: 182, flexShrink: 0, borderRadius: 10, border: '1.5px solid #22c55e', background: '#111827', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: "'Inter', system-ui, sans-serif" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#f9fafb' }}>{label}</span>
                    <span style={{ fontSize: 9, color: '#4ade80', fontWeight: 700 }}>✓ Confirmado</span>
                  </div>
                );
              }

              return (
                <button key={slot}
                  onClick={() => handleSlotClick(slot)}
                  style={{ width: 140, minHeight: 182, flexShrink: 0 }}
                  className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-600 hover:border-draft-green hover:bg-draft-green/10 transition-all"
                >
                  <span className="text-sm font-bold text-gray-300">{label}</span>
                  <span className="text-xs text-gray-500 mt-1">{sub}</span>
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
          slotDetailedPositionId={
            activeSlot > 11
              ? null
              : (formationSlots[activeSlot - 1]?.detailed_position_id ?? null)
          }
          onPickPlayer={handlePickPlayer}
          onClose={() => { setOptions(null); setActiveSlot(null); }}
          fadingOut={isAnimatingOut}
        />
      )}
    </div>
  );
}
