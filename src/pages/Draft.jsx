import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { API_URL } from '../config.js';
import FormationPickerPhase from '../components/FormationPickerPhase.jsx';
import PickPanel from '../components/PickPanel.jsx';
import DraftPlayerCard from '../components/DraftPlayerCard.jsx';

// Maps detailed_position_id → basic position_id
const DETAILED_TO_BASIC = {
  1:1, 2:2, 3:2, 4:2, 5:3, 6:3, 7:3, 8:3, 9:3, 10:4, 11:4, 12:4, 13:4
};

const DETAILED_LABELS = {
  1:'GOL', 2:'ZAG', 3:'LD', 4:'LE', 5:'VOL',
  6:'MEI', 7:'MAT', 8:'ME', 9:'MD', 10:'CA', 11:'PE', 12:'PD', 13:'2AT'
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
      const res = await authFetch(`${API_URL}/formations`);
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
        <div className="flex flex-col gap-3">
          {[4, 3, 2, 1].map(basicPos => {
            const rowSlots = starterSlots.filter(s =>
              DETAILED_TO_BASIC[s.detailed_position_id] === basicPos
            );
            if (rowSlots.length === 0) return null;
            return (
              <div key={basicPos} className="flex gap-2 justify-center overflow-x-auto pb-1">
                {rowSlots.map(s => {
                  const posLabel = DETAILED_LABELS[s.detailed_position_id] || '?';
                  const playerObj = pickedPlayers[s.position] ?? null;
                  const confirmedPick = picksBySlot[s.position];

                  if (playerObj) {
                    return (
                      <div
                        key={s.position}
                        style={poppingSlot === s.position
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
                      <div key={s.position} style={{ width: 140, minHeight: 182, flexShrink: 0, borderRadius: 10, overflow: 'hidden', border: '1.5px solid #22c55e', background: '#111827', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: "'Inter', system-ui, sans-serif" }}>
                        <span style={{ fontSize: 16, fontWeight: 900, color: '#f9fafb' }}>{posLabel}</span>
                        <span style={{ fontSize: 9, color: '#4ade80', fontWeight: 700 }}>✓ Confirmado</span>
                      </div>
                    );
                  }

                  // During bench phase, starter slots are already filled — show empty placeholder
                  if (isBenchPhase) {
                    return (
                      <div key={s.position} style={{ width: 140, minHeight: 182, flexShrink: 0, borderRadius: 10, border: '1.5px solid #374151', background: '#111827', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#6b7280' }}>{posLabel}</span>
                      </div>
                    );
                  }

                  return (
                    <button
                      key={s.position}
                      onClick={() => handleSlotClick(s.position)}
                      style={{ width: 140, minHeight: 182, flexShrink: 0 }}
                      className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-600 hover:border-draft-green hover:bg-draft-green/10 transition-all"
                    >
                      <span className="text-sm font-bold text-gray-400">{posLabel}</span>
                      <span className="text-gray-600 mt-1 text-lg">+</span>
                    </button>
                  );
                })}
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
