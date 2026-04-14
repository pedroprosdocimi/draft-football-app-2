import React from 'react';

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

const POSITION_BADGE_STYLES = {
  GOL: 'border-sky-300/40 bg-sky-950/90 text-sky-100 ring-sky-300/20',
  ZAG: 'border-emerald-300/40 bg-emerald-950/90 text-emerald-100 ring-emerald-300/20',
  LD: 'border-emerald-300/40 bg-emerald-950/90 text-emerald-100 ring-emerald-300/20',
  LE: 'border-emerald-300/40 bg-emerald-950/90 text-emerald-100 ring-emerald-300/20',
  VOL: 'border-emerald-300/40 bg-emerald-950/90 text-emerald-100 ring-emerald-300/20',
  MC: 'border-amber-300/40 bg-amber-950/90 text-amber-100 ring-amber-300/20',
  MD: 'border-amber-300/40 bg-amber-950/90 text-amber-100 ring-amber-300/20',
  ME: 'border-amber-300/40 bg-amber-950/90 text-amber-100 ring-amber-300/20',
  MAT: 'border-amber-300/40 bg-amber-950/90 text-amber-100 ring-amber-300/20',
  PE: 'border-rose-300/40 bg-rose-950/90 text-rose-100 ring-rose-300/20',
  PD: 'border-rose-300/40 bg-rose-950/90 text-rose-100 ring-rose-300/20',
  CA: 'border-rose-300/40 bg-rose-950/90 text-rose-100 ring-rose-300/20',
  '2AT': 'border-rose-300/40 bg-rose-950/90 text-rose-100 ring-rose-300/20',
};

const PREVIEW_ROWS = [
  { key: 'striker', labels: ['CA'], half: 'attack' },
  { key: 'support', labels: ['2AT'], half: 'attack' },
  { key: 'wings', labels: ['PE', 'PD'], half: 'attack' },
  { key: 'attackMid', labels: ['MAT'], half: 'attack' },
  { key: 'midfield', labels: ['ME', 'MC', 'MD'], half: 'attack' },
  { key: 'defMid', labels: ['VOL'], half: 'defense' },
  { key: 'fullBack', labels: ['LE', 'LD'], half: 'defense' },
  { key: 'centerBack', labels: ['ZAG'], half: 'defense' },
  { key: 'goal', labels: ['GOL'], half: 'defense' },
];

function countPositionLabels(slots) {
  return (slots || []).reduce((accumulator, slot) => {
    const label = POSITION_LABELS[slot.detailed_position_id];
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
  const counts = countPositionLabels(slots);

  const rows = PREVIEW_ROWS.map((row) => ({
    ...row,
    labels: row.labels.flatMap((label) => Array.from({ length: counts[label] || 0 }, () => label)),
  })).filter((row) => row.labels.length > 0);

  return assignRowTops(rows);
}

function getPreviewPlacements(row, rows) {
  const hasSupportStrikerPair =
    rows.some((currentRow) => currentRow.key === 'support' && currentRow.labels.length > 0) &&
    rows.some((currentRow) => currentRow.key === 'striker' && currentRow.labels.length > 0);

  if (row.key === 'striker' && hasSupportStrikerPair) {
    return row.labels.map((label) => ({ label, left: 56 }));
  }

  if (row.key === 'support' && hasSupportStrikerPair) {
    return row.labels.map((label) => ({ label, left: 44 }));
  }

  if (row.key === 'goal' || row.key === 'striker' || row.key === 'support') {
    return row.labels.map((label, index) => ({
      label,
      left: spreadAcross(row.labels.length, 44, 56)[index],
    }));
  }

  if (row.key === 'centerBack') {
    return row.labels.map((label, index) => ({
      label,
      left: spreadAcross(row.labels.length, 34, 66)[index],
    }));
  }

  if (row.key === 'fullBack') {
    return [...row.labels]
      .sort((a, b) => (a === 'LE' ? -1 : 1) - (b === 'LE' ? -1 : 1))
      .map((label) => ({
        label,
        left: label === 'LE' ? 18 : 82,
      }));
  }

  if (row.key === 'defMid') {
    return row.labels.map((label, index) => ({
      label,
      left: spreadAcross(row.labels.length, 38, 62)[index],
    }));
  }

  if (row.key === 'midfield') {
    const midfielders = row.labels.filter((label) => label === 'MC');
    const mcPlacements = spreadAcross(midfielders.length, 38, 62);
    let mcIndex = 0;

    return [...row.labels]
      .sort((a, b) => {
        const order = { ME: 1, MC: 2, MD: 3 };
        return order[a] - order[b];
      })
      .map((label) => {
        if (label === 'ME') return { label, left: 18 };
        if (label === 'MD') return { label, left: 82 };

        const left = mcPlacements[mcIndex];
        mcIndex += 1;
        return { label, left };
      });
  }

  if (row.key === 'attackMid') {
    return row.labels.map((label, index) => ({
      label,
      left: spreadAcross(row.labels.length, 42, 58)[index],
    }));
  }

  if (row.key === 'wings') {
    return [...row.labels]
      .sort((a, b) => {
        const order = { PE: 1, PD: 2 };
        return order[a] - order[b];
      })
      .map((label) => ({
        label,
        left: label === 'PE' ? 22 : 78,
      }));
  }

  return row.labels.map((label, index) => ({
    label,
    left: spreadAcross(row.labels.length, 30, 70)[index],
  }));
}

export default function FormationPreview({
  formation,
  containerClassName = 'h-[30rem] max-w-[340px]',
  badgeClassName = 'h-11 w-11 text-[10px]',
}) {
  const rows = buildPreviewRows(formation.slots);

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

      {rows.map((row) => {
        const placements = getPreviewPlacements(row, rows);

        return placements.map(({ label, left }, playerIndex) => {
          const badgeStyles = POSITION_BADGE_STYLES[label] || 'border-white/15 bg-slate-950/88 text-white ring-white/10';

          return (
            <div
              key={`${formation.name}-${row.key}-${label}-${playerIndex}`}
              className={`absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border font-black tracking-wide shadow-[0_6px_18px_rgba(0,0,0,0.28)] ring-1 ${badgeClassName} ${badgeStyles}`}
              style={{ top: `${row.top}%`, left: `${left}%` }}
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
