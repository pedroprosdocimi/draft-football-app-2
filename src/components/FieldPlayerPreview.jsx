import React from 'react';

const DETAILED_LABELS = {
  1:'GOL', 2:'ZAG', 3:'LD', 4:'LE', 5:'VOL',
  6:'MC', 7:'MEI', 8:'ME', 9:'MD', 10:'CA', 11:'PE', 12:'PD', 13:'SA',
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

export default function FieldPlayerPreview({ player, posLabel }) {
  const displayName = player?.display_name || player?.name || 'Jogador';
  const avgScore = Number.isFinite(player?.avg_score) ? player.avg_score.toFixed(1) : '0.0';
  const jerseyColors = {
    p: player?.primary_color || TEAM_COLORS[player?.team_short_code]?.p || '#1e293b',
    s: player?.secondary_color || TEAM_COLORS[player?.team_short_code]?.s || '#f8fafc',
  };
  const altPositions = [...new Set(player?.alt_positions || [])].slice(0, 2);

  return (
    <div className="w-[5.75rem] overflow-hidden rounded-[20px] border border-white/10 bg-slate-950/82 shadow-[0_14px_24px_rgba(0,0,0,0.34)] backdrop-blur-md sm:w-[7.5rem] sm:rounded-[24px] sm:shadow-[0_18px_32px_rgba(0,0,0,0.36)]">
      <div className="relative overflow-hidden bg-[linear-gradient(180deg,rgba(30,41,59,0.98)_0%,rgba(15,23,42,0.96)_100%)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_42%)]" />

        {player?.team_jersey_url ? (
          <img
            src={player.team_jersey_url}
            alt={player.team_short_code}
            className="absolute bottom-[-2%] right-[-6%] h-[88%] w-auto object-contain drop-shadow-[0_8px_18px_rgba(0,0,0,0.55)]"
          />
        ) : (
          <svg
            viewBox="0 0 120 95"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="absolute bottom-[-2%] right-[-6%] h-[88%] w-auto drop-shadow-[0_8px_18px_rgba(0,0,0,0.55)]"
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

        <div className="relative flex min-h-[4.6rem] flex-col justify-between px-1.5 py-1.5 sm:min-h-[5.7rem] sm:px-2 sm:py-2" style={{ width: '55%' }}>
          <div className="rounded-[10px] border border-amber-700 bg-amber-800 px-1.5 py-1 text-center text-[9px] font-black tracking-[0.12em] text-amber-200 sm:rounded-[12px] sm:px-2 sm:text-[10px] sm:tracking-[0.18em]">
            {avgScore}
          </div>
          {altPositions.length > 0 && (
            <div className="flex gap-0.5">
              {altPositions.map((id) => (
                <div key={id} className="rounded-[6px] border border-slate-600 bg-slate-800 px-1 py-0.5 text-center text-[6px] font-semibold uppercase tracking-[0.06em] text-slate-500 sm:text-[7px]">
                  {DETAILED_LABELS[id] || id}
                </div>
              ))}
            </div>
          )}
          <div className="rounded-[10px] border border-slate-500 bg-slate-700 px-1.5 py-1 text-center text-[8px] font-black uppercase tracking-[0.1em] text-white sm:rounded-[12px] sm:px-2 sm:text-[9px] sm:tracking-[0.14em]">
            {posLabel}
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
