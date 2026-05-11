import React from 'react';
import {
  getDetailedPositionLabel,
  getPlayerAlternativeDetailedPositionIds,
  getPlayerPrimaryDetailedPositionId,
  normalizeDetailedPositionId,
} from '../utils/positions.js';
import { nationalityToIso2 } from '../utils/nationality.js';
import { getCartolaStatusMeta } from '../utils/cartolaStatus.js';

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

const OUTFIELD_ATTRS = [
  ['ATA', 'attr_ata'],
  ['COM', 'attr_com'],
  ['CRI', 'attr_cri'],
  ['DEF', 'attr_def'],
  ['PAS', 'attr_pas'],
  ['FIS', 'attr_fis'],
];

const GOALKEEPER_ATTRS = [
  ['GOL', 'attr_gol'],
  ['COM', 'attr_com'],
  ['CRI', 'attr_cri'],
  ['DEF', 'attr_def'],
  ['PAS', 'attr_pas'],
  ['FIS', 'attr_fis'],
];

const CARD_CLIP_PATH = 'polygon(50% 5%, 93% 13%, 93% 87%, 50% 95%, 7% 87%, 7% 13%)';

function formatName(name) {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return name;
  const abbreviated = `${parts[0][0]}. ${parts.slice(1).join(' ')}`;
  if (abbreviated.length > 12) {
    const last = parts[parts.length - 1];
    return `${parts[0][0]}. ${last}`;
  }
  return abbreviated;
}

export default function FieldPlayerPreview({ player, posLabel, slotPositionId = null }) {
  const rawName = player?.display_name || player?.name || 'Jogador';
  const displayName = rawName.includes(' ') ? formatName(rawName) : rawName;
  const displayScoreValue = Number.isFinite(player?.score_value)
    ? player.score_value
    : Number.isFinite(player?.avg_score)
      ? player.avg_score
      : 0;
  const avgScore = displayScoreValue.toFixed(1);
  const jerseyColors = {
    p: player?.primary_color || TEAM_COLORS[player?.team_short_code]?.p || '#1e293b',
    s: player?.secondary_color || TEAM_COLORS[player?.team_short_code]?.s || '#f8fafc',
  };

  const normalizedPlayerPos = getPlayerPrimaryDetailedPositionId(player);
  const normalizedSlotPos = slotPositionId ? normalizeDetailedPositionId(slotPositionId) : null;
  const rawAltPositions = getPlayerAlternativeDetailedPositionIds(player, 2);
  const displayedPrimaryPositionId = normalizedSlotPos || normalizedPlayerPos;
  const isGoalkeeper = displayedPrimaryPositionId === 1 || player?.detailed_position_id === 1;
  const attrs = isGoalkeeper ? GOALKEEPER_ATTRS : OUTFIELD_ATTRS;
  const iso2 = nationalityToIso2(player?.nationality || '');
  const cartolaStatus = getCartolaStatusMeta(player?.cartola_status_id);
  const positionLabel = getDetailedPositionLabel(displayedPrimaryPositionId) || posLabel;
  const nameFontSize = displayName.length > 12 ? 8 : displayName.length > 9 ? 9 : 10;

  return (
    <div
      className="relative w-[5.35rem] overflow-hidden shadow-[0_14px_24px_rgba(0,0,0,0.34)] sm:w-[6.85rem] sm:shadow-[0_18px_32px_rgba(0,0,0,0.36)]"
      style={{
        clipPath: CARD_CLIP_PATH,
        background: 'linear-gradient(145deg,#f9e69a 0%,#d8a83c 45%,#fff1aa 100%)',
      }}
    >
      <div className="relative min-h-[7.05rem] overflow-hidden text-[#3f2b07] sm:min-h-[8.7rem]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_36%_8%,rgba(255,255,255,0.45),transparent_26%),linear-gradient(135deg,transparent_0%,transparent_36%,rgba(153,96,17,0.22)_37%,rgba(255,255,255,0.24)_43%,transparent_44%),linear-gradient(160deg,transparent_0%,transparent_53%,rgba(190,122,23,0.32)_54%,transparent_65%)]" />
        <div className="absolute inset-x-2 top-[42%] h-8 -rotate-[24deg] bg-gradient-to-r from-transparent via-yellow-700/30 to-transparent sm:h-10" />

        {player?.team_jersey_url ? (
          <img
            src={player.team_jersey_url}
            alt={player.team_short_code}
            className="absolute bottom-[37%] left-[63%] h-[46%] w-auto -translate-x-1/2 object-contain drop-shadow-[0_8px_14px_rgba(62,39,6,0.45)] sm:bottom-[36%] sm:h-[48%]"
          />
        ) : (
          <svg
            viewBox="0 0 120 95"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="absolute bottom-[37%] left-[63%] h-[46%] w-auto -translate-x-1/2 drop-shadow-[0_8px_14px_rgba(62,39,6,0.45)] sm:bottom-[36%] sm:h-[48%]"
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

        <div className="absolute left-[9%] top-[12%] w-[2rem] text-center sm:w-[2.6rem]">
          <div className="text-[20px] font-black leading-none sm:text-[26px]">{avgScore}</div>
          <div className="mt-0.5 text-[10px] font-black uppercase leading-none sm:text-[12px]">
            {positionLabel}
          </div>
        </div>

        {cartolaStatus?.label && (
          <div
            className="absolute left-[15%] top-[36%] z-30 rounded-full px-1.5 py-0.5"
            style={{ background: cartolaStatus.background, border: `1px solid ${cartolaStatus.border}` }}
            title={cartolaStatus.name || undefined}
          >
            <div className="text-[7px] font-black leading-none" style={{ color: cartolaStatus.text }}>
              {cartolaStatus.label}
            </div>
          </div>
        )}

        <div className="absolute bottom-[28%] left-1/2 w-[82%] -translate-x-1/2 border-t border-yellow-900/20 pt-1 text-center sm:pt-1.5">
          <div
            style={{
              fontSize: nameFontSize,
              fontWeight: 900,
              textTransform: 'uppercase',
              color: '#3f2b07',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.1,
            }}
          >
            {displayName}
          </div>
        </div>

        <div className="absolute bottom-[20%] left-1/2 grid w-[82%] -translate-x-1/2 grid-cols-6 text-center">
          {attrs.map(([label]) => (
            <div key={label} className="text-[5px] font-black leading-none sm:text-[6px]">{label}</div>
          ))}
        </div>
        <div className="absolute bottom-[13%] left-1/2 grid w-[82%] -translate-x-1/2 grid-cols-6 text-center">
          {attrs.map(([label, key]) => (
            <div key={label} className="text-[7px] font-black leading-none sm:text-[9px]">
              {Number.isFinite(player?.[key]) ? Math.round(player[key]) : 0}
            </div>
          ))}
        </div>

        {iso2 && (
          <div className="absolute bottom-[32%] left-[14%]">
            <span className={`fi fi-${iso2}`} style={{ display: 'inline-block', width: 13, height: 9 }} />
          </div>
        )}
      </div>
    </div>
  );
}
