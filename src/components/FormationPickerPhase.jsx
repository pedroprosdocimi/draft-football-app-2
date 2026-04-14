import React, { useEffect, useRef, useState } from 'react';
import { API_URL } from '../config.js';

const POSITION_LABELS = {
  1: 'GOL',
  2: 'ZAG',
  3: 'LD',
  4: 'LE',
  5: 'VOL',
  6: 'MC',
  7: 'MAT',
  8: 'ME',
  9: 'MD',
  10: 'CA',
  11: 'PE',
  12: 'PD',
  13: '2AT',
};

const ROW_POSITION_ORDER = {
  LE: 1,
  ME: 1,
  PE: 1,
  ZAG: 2,
  VOL: 3,
  MC: 4,
  MAT: 5,
  CA: 6,
  '2AT': 7,
  LD: 8,
  MD: 9,
  PD: 10,
};

const FORMATION_LAYOUTS = {
  '4-2-3-1': [
    ['GOL'],
    ['LE', 'ZAG', 'ZAG', 'LD'],
    ['VOL', 'VOL'],
    ['PE', 'MAT', 'PD'],
    ['CA'],
  ],
  '4-3-3': [
    ['GOL'],
    ['LE', 'ZAG', 'ZAG', 'LD'],
    ['VOL'],
    ['MC', 'MC'],
    ['PE', 'CA', 'PD'],
  ],
  '4-4-2': [
    ['GOL'],
    ['LE', 'ZAG', 'ZAG', 'LD'],
    ['ME', 'MC', 'MC', 'MD'],
    ['CA', '2AT'],
  ],
  '4-1-4-1': [
    ['GOL'],
    ['LE', 'ZAG', 'ZAG', 'LD'],
    ['VOL'],
    ['ME', 'MC', 'MC', 'MD'],
    ['CA'],
  ],
  '3-5-2': [
    ['GOL'],
    ['ZAG', 'ZAG', 'ZAG'],
    ['ME', 'VOL', 'MC', 'VOL', 'MD'],
    ['CA', '2AT'],
  ],
  '3-4-3': [
    ['GOL'],
    ['ZAG', 'ZAG', 'ZAG'],
    ['ME', 'MC', 'MC', 'MD'],
    ['PE', 'CA', 'PD'],
  ],
  '4-3-1-2': [
    ['GOL'],
    ['LE', 'ZAG', 'ZAG', 'LD'],
    ['VOL', 'MC', 'VOL'],
    ['MAT'],
    ['CA', '2AT'],
  ],
  '4-4-1-1': [
    ['GOL'],
    ['LE', 'ZAG', 'ZAG', 'LD'],
    ['ME', 'MC', 'MC', 'MD'],
    ['2AT'],
    ['CA'],
  ],
  '5-3-2': [
    ['GOL'],
    ['LE', 'ZAG', 'ZAG', 'ZAG', 'LD'],
    ['MC', 'VOL', 'MC'],
    ['CA', '2AT'],
  ],
  '5-4-1': [
    ['GOL'],
    ['LE', 'ZAG', 'ZAG', 'ZAG', 'LD'],
    ['ME', 'MC', 'MC', 'MD'],
    ['CA'],
  ],
  '4-5-1': [
    ['GOL'],
    ['LE', 'ZAG', 'ZAG', 'LD'],
    ['ME', 'VOL', 'MC', 'VOL', 'MD'],
    ['CA'],
  ],
  '4-2-2-2': [
    ['GOL'],
    ['LE', 'ZAG', 'ZAG', 'LD'],
    ['VOL', 'VOL'],
    ['MAT', 'MAT'],
    ['CA', '2AT'],
  ],
  '4-3-2-1': [
    ['GOL'],
    ['LE', 'ZAG', 'ZAG', 'LD'],
    ['VOL', 'MC', 'VOL'],
    ['MAT', 'MAT'],
    ['CA'],
  ],
  '4-2-4': [
    ['GOL'],
    ['LE', 'ZAG', 'ZAG', 'LD'],
    ['VOL', 'VOL'],
    ['PE', 'CA', '2AT', 'PD'],
  ],
  '4-2-1-3': [
    ['GOL'],
    ['LE', 'ZAG', 'ZAG', 'LD'],
    ['VOL', 'VOL'],
    ['MAT'],
    ['PE', 'CA', 'PD'],
  ],
};

function pickRandomFormations(formations, limit = 5) {
  const shuffled = [...formations];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, limit);
}

function buildFallbackRows(slots) {
  const grouped = { 1: [], 2: [], 3: [], 4: [] };

  (slots || []).forEach((slot) => {
    const label = POSITION_LABELS[slot.detailed_position_id];
    if (!label) return;

    if (slot.detailed_position_id === 1) grouped[1].push(label);
    else if (slot.detailed_position_id <= 4) grouped[2].push(label);
    else if (slot.detailed_position_id <= 9) grouped[3].push(label);
    else grouped[4].push(label);
  });

  return Object.values(grouped)
    .filter((row) => row.length > 0)
    .map((row) => [...row].sort((a, b) => (ROW_POSITION_ORDER[a] || 99) - (ROW_POSITION_ORDER[b] || 99)));
}

function getFormationRows(formation) {
  return FORMATION_LAYOUTS[formation.name] || buildFallbackRows(formation.slots);
}

function getRowTop(index, rowCount) {
  if (rowCount <= 1) return 50;

  const start = 85;
  const end = 15;
  return start + ((end - start) * index) / (rowCount - 1);
}

function getPlayerLeft(index, count) {
  return ((index + 1) * 100) / (count + 1);
}

function FormationPreview({ formation }) {
  const rows = getFormationRows(formation);

  return (
    <div
      className="relative mx-auto h-72 w-full max-w-[240px] overflow-hidden rounded-[28px] border border-emerald-300/15 bg-emerald-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_20px_60px_rgba(0,0,0,0.35)]"
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
      <div className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
      <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30" />
      <div className="absolute left-1/2 top-3 h-10 w-24 -translate-x-1/2 rounded-b-[18px] border border-t-0 border-white/10" />
      <div className="absolute left-1/2 bottom-3 h-10 w-24 -translate-x-1/2 rounded-t-[18px] border border-b-0 border-white/10" />
      <div className="absolute left-1/2 top-3 h-5 w-12 -translate-x-1/2 rounded-b-[12px] border border-t-0 border-white/10" />
      <div className="absolute left-1/2 bottom-3 h-5 w-12 -translate-x-1/2 rounded-t-[12px] border border-b-0 border-white/10" />
      <div className="absolute left-1/2 top-[52px] h-8 w-16 -translate-x-1/2 rounded-b-full border-b border-white/10" />
      <div className="absolute left-1/2 bottom-[52px] h-8 w-16 -translate-x-1/2 rounded-t-full border-t border-white/10" />
      <div className="absolute left-1/2 top-9 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-white/20" />
      <div className="absolute left-1/2 bottom-9 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-white/20" />
      <div className="absolute inset-y-3 left-3 w-px bg-gradient-to-b from-transparent via-white/6 to-transparent" />
      <div className="absolute inset-y-3 right-3 w-px bg-gradient-to-b from-transparent via-white/6 to-transparent" />

      {rows.map((row, rowIndex) => {
        const top = getRowTop(rowIndex, rows.length);

        return row.map((label, playerIndex) => {
          const left = getPlayerLeft(playerIndex, row.length);

          return (
            <div
              key={`${formation.name}-${rowIndex}-${label}-${playerIndex}`}
              className="absolute flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-slate-950/88 text-[10px] font-black tracking-wide text-white shadow-[0_6px_18px_rgba(0,0,0,0.28)] ring-1 ring-emerald-300/10"
              style={{ top: `${top}%`, left: `${left}%` }}
            >
              <div className="absolute inset-1 rounded-full bg-gradient-to-b from-white/10 to-transparent" />
              <span className="relative z-10">{label}</span>
            </div>
          );
        });
      })}
    </div>
  );
}

function FormationCard({ formation, chosen, onPick }) {
  const isChosen = chosen === formation.name;
  const isDisabled = !!chosen;
  const touchStateRef = useRef({ startX: 0, startY: 0, moved: false });

  const handleTouchStart = (event) => {
    const touch = event.touches[0];
    if (!touch) return;

    touchStateRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      moved: false,
    };
  };

  const handleTouchMove = (event) => {
    const touch = event.touches[0];
    if (!touch) return;

    const deltaX = Math.abs(touch.clientX - touchStateRef.current.startX);
    const deltaY = Math.abs(touch.clientY - touchStateRef.current.startY);

    if (deltaX > 10 || deltaY > 10) {
      touchStateRef.current.moved = true;
    }
  };

  const handlePick = () => {
    if (touchStateRef.current.moved) {
      touchStateRef.current.moved = false;
      return;
    }

    onPick(formation.name);
  };

  return (
    <button
      type="button"
      onClick={handlePick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      disabled={isDisabled}
      className={`group relative overflow-hidden rounded-[32px] border p-5 text-left transition-all duration-200 ${
        isChosen
          ? 'border-draft-green bg-emerald-500/10 shadow-[0_0_0_1px_rgba(34,197,94,0.15),0_24px_60px_rgba(6,95,70,0.25)]'
          : isDisabled
            ? 'border-gray-800 bg-gray-900/70 opacity-50'
            : 'border-gray-800 bg-gray-900/90 hover:-translate-y-1 hover:border-emerald-400/40 hover:bg-gray-900'
      }`}
      style={{ touchAction: 'pan-x' }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.06),transparent_28%)]" />
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/5 to-transparent" />
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="relative z-10">
          <p className="text-[10px] uppercase tracking-[0.28em] text-emerald-300/70">
            Formacao
          </p>
          <h2 className="mt-2 font-mono text-3xl font-black text-white">
            {formation.name}
          </h2>
        </div>
        {isChosen && (
          <span className="relative z-10 rounded-full border border-draft-green/60 bg-draft-green/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-draft-green">
            Escolhida
          </span>
        )}
      </div>

      <div className="relative z-10">
        <FormationPreview formation={formation} />
      </div>

      <p className="relative z-10 mt-4 text-sm text-gray-400">
        {isChosen
          ? 'Preparando seu draft com essa distribuicao.'
          : 'Toque para escolher essa distribuicao em campo.'}
      </p>
    </button>
  );
}

export default function FormationPickerPhase({ onPick }) {
  const [formations, setFormations] = useState([]);
  const [chosen, setChosen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('draft_token');

    fetch(`${API_URL}/formations`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Nao foi possivel carregar as formacoes.');
        }
        setFormations(pickRandomFormations(data.data || []));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handlePick = (name) => {
    if (chosen) return;
    setChosen(name);
    onPick(name);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 animate-pulse">Carregando formacoes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="rounded-2xl border border-red-800 bg-red-950/40 px-6 py-5 text-center">
          <p className="text-sm font-semibold text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <p className="text-[11px] uppercase tracking-[0.4em] text-emerald-300/70">
            Draft setup
          </p>
          <h1 className="mt-4 text-3xl font-black text-white sm:text-4xl">
            Escolha 1 entre 5 formacoes aleatorias
          </h1>
          <p className="mt-3 text-sm text-gray-400 sm:text-base">
            Cada card mostra o desenho tatico da equipe antes do primeiro pick.
          </p>
        </div>

        <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 snap-x snap-mandatory md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 xl:grid-cols-3">
          {formations.map((formation) => (
            <div key={formation.name} className="min-w-[280px] max-w-[280px] flex-none snap-center md:min-w-0 md:max-w-none">
              <FormationCard
                formation={formation}
                chosen={chosen}
                onPick={handlePick}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
