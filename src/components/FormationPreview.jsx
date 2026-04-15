import React from 'react';
import { getDetailedPositionLabel } from '../utils/positions.js';

const POSITION_BADGE_STYLES = {
  GOL: 'border-sky-300/40 bg-sky-950/90 text-sky-100 ring-sky-300/20',
  ZAG: 'border-emerald-300/40 bg-emerald-950/90 text-emerald-100 ring-emerald-300/20',
  LD: 'border-emerald-300/40 bg-emerald-950/90 text-emerald-100 ring-emerald-300/20',
  LE: 'border-emerald-300/40 bg-emerald-950/90 text-emerald-100 ring-emerald-300/20',
  VOL: 'border-emerald-300/40 bg-emerald-950/90 text-emerald-100 ring-emerald-300/20',
  MC: 'border-amber-300/40 bg-amber-950/90 text-amber-100 ring-amber-300/20',
  MD: 'border-amber-300/40 bg-amber-950/90 text-amber-100 ring-amber-300/20',
  ME: 'border-amber-300/40 bg-amber-950/90 text-amber-100 ring-amber-300/20',
  MEI: 'border-amber-300/40 bg-amber-950/90 text-amber-100 ring-amber-300/20',
  PE: 'border-rose-300/40 bg-rose-950/90 text-rose-100 ring-rose-300/20',
  PD: 'border-rose-300/40 bg-rose-950/90 text-rose-100 ring-rose-300/20',
  ATA: 'border-rose-300/40 bg-rose-950/90 text-rose-100 ring-rose-300/20',
};

const PREVIEW_ROWS = [
  { key: 'attack', labels: ['ATA'], half: 'attack' },
  { key: 'wings', labels: ['PE', 'PD'], half: 'attack' },
  { key: 'attackMid', labels: ['MEI'], half: 'attack' },
  { key: 'midfield', labels: ['ME', 'MC', 'MD'], half: 'attack' },
  { key: 'defMid', labels: ['VOL'], half: 'defense' },
  { key: 'fullBack', labels: ['LE', 'LD'], half: 'defense' },
  { key: 'centerBack', labels: ['ZAG'], half: 'defense' },
  { key: 'goal', labels: ['GOL'], half: 'defense' },
];

function countPositionLabels(slots) {
  return (slots || []).reduce((accumulator, slot) => {
    const label = getDetailedPositionLabel(slot.detailed_position_id);
    if (!label) return accumulator;

    accumulator[label] = (accumulator[label] || 0) + 1;
    return accumulator;
  }, {});
}

function distributeHalf(count, start, end) {
  if (count <= 0) return [];
  if (count === 1) return [(start + end) / 2];

  const step = (end - start) / (count - 1);
  return Array.from({ length: count }, (_, index) => start + (step * index));
}

function spreadAcross(count, start, end) {
  if (count <= 0) return [];
  if (count === 1) return [(start + end) / 2];

  const step = (end - start) / (count - 1);
  return Array.from({ length: count }, (_, index) => start + (step * index));
}

function assignRowTops(rows) {
  const attackRows = rows.filter((row) => row.half === 'attack');
  const defenseRows = rows.filter((row) => row.half === 'defense');

  const attackTops = distributeHalf(attackRows.length, 12, 46);
  const defenseTops = distributeHalf(defenseRows.length, 58, 90);

  let attackIndex = 0;
  let defenseIndex = 0;

  return rows.map((row) => {
    if (row.half === 'attack') {
      const top = attackTops[attackIndex];
      attackIndex += 1;
      return { ...row, top };
    }

    const top = defenseTops[defenseIndex];
    defenseIndex += 1;
    return { ...row, top };
  });
}

function buildPreviewRows(slots) {
  const rows = PREVIEW_ROWS.map((row) => ({
    ...row,
    slots: row.labels.flatMap((label) => (
      (slots || [])
        .filter((slot) => getDetailedPositionLabel(slot.detailed_position_id) === label)
        .map((slot) => ({ ...slot, label }))
    )),
  })).filter((row) => row.slots.length > 0);

  return assignRowTops(rows);
}

function getPreviewPlacements(row, rows) {
  if (row.key === 'attack' && row.slots.length === 2) {
    return row.slots.map((slot, index) => ({ ...slot, left: index === 0 ? 44 : 56 }));
  }

  if (row.key === 'goal' || row.key === 'attack') {
    return row.slots.map((slot, index) => ({
      ...slot,
      left: spreadAcross(row.slots.length, 44, 56)[index],
    }));
  }

  if (row.key === 'centerBack') {
    return row.slots.map((slot, index) => ({
      ...slot,
      left: spreadAcross(row.slots.length, 34, 66)[index],
    }));
  }

  if (row.key === 'fullBack') {
    return [...row.slots]
      .sort((a, b) => (a.label === 'LE' ? -1 : 1) - (b.label === 'LE' ? -1 : 1))
      .map((slot) => ({
        ...slot,
        left: slot.label === 'LE' ? 18 : 82,
      }));
  }

  if (row.key === 'defMid') {
    return row.slots.map((slot, index) => ({
      ...slot,
      left: spreadAcross(row.slots.length, 38, 62)[index],
    }));
  }

  if (row.key === 'midfield') {
    const midfielders = row.slots.filter((slot) => slot.label === 'MC');
    const mcPlacements = spreadAcross(midfielders.length, 38, 62);
    let mcIndex = 0;

    return [...row.slots]
      .sort((a, b) => {
        const order = { ME: 1, MC: 2, MD: 3 };
        return order[a.label] - order[b.label];
      })
      .map((slot) => {
        if (slot.label === 'ME') return { ...slot, left: 18 };
        if (slot.label === 'MD') return { ...slot, left: 82 };

        const left = mcPlacements[mcIndex];
        mcIndex += 1;
        return { ...slot, left };
      });
  }

  if (row.key === 'attackMid') {
    return row.slots.map((slot, index) => ({
      ...slot,
      left: spreadAcross(row.slots.length, 42, 58)[index],
    }));
  }

  if (row.key === 'wings') {
    return [...row.slots]
      .sort((a, b) => {
        const order = { PE: 1, PD: 2 };
        return order[a.label] - order[b.label];
      })
      .map((slot) => ({
        ...slot,
        left: slot.label === 'PE' ? 22 : 78,
      }));
  }

  return row.slots.map((slot, index) => ({
    ...slot,
    left: spreadAcross(row.slots.length, 30, 70)[index],
  }));
}

export function getFormationPreviewLayout(formation) {
  const rows = buildPreviewRows(formation?.slots || []);

  // Build default computed placements
  const computed = rows.flatMap((row) => (
    getPreviewPlacements(row, rows).map((slot, index) => ({
      ...slot,
      top: row.top,
      key: `${formation?.name || 'formation'}-${row.key}-${slot.position || index}-${slot.label}-${index}`,
    }))
  ));

  // Override with stored x/y when available (x !== 0 || y !== 0)
  const storedByPosition = {};
  (formation?.slots || []).forEach((s) => {
    if (s.x != null && s.y != null && (s.x !== 0 || s.y !== 0)) {
      storedByPosition[s.position] = { left: s.x, top: s.y };
    }
  });

  return computed.map((placement) => {
    const override = storedByPosition[placement.position];
    return override ? { ...placement, left: override.left, top: override.top } : placement;
  });
}

export default function FormationPreview({
  formation,
  containerClassName = 'h-[30rem] max-w-[340px]',
  badgeClassName = 'h-11 w-11 text-[10px]',
}) {
  const placements = getFormationPreviewLayout(formation);

  return (
    <div
      className={`relative mx-auto w-full overflow-hidden rounded-[30px] border border-emerald-300/15 bg-emerald-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_20px_60px_rgba(0,0,0,0.35)] ${containerClassName}`}
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

      {placements.map(({ key, label, left, top }) => {
          const badgeStyles = POSITION_BADGE_STYLES[label] || 'border-white/15 bg-slate-950/88 text-white ring-white/10';

          return (
            <div
              key={key}
              className={`absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border font-black tracking-wide shadow-[0_6px_18px_rgba(0,0,0,0.28)] ring-1 ${badgeClassName} ${badgeStyles}`}
              style={{ top: `${top}%`, left: `${left}%` }}
            >
              <div className="absolute inset-1 rounded-full bg-gradient-to-b from-white/10 to-transparent" />
              <span className="relative z-10">{label}</span>
            </div>
          );
        })}
    </div>
  );
}
