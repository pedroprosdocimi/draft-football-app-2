import React from 'react';
import {
  getDetailedPositionLabel,
  getDetailedPositionPalette,
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

function formatName(name) {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return name;
  // Always abbreviate first name, keep rest
  const abbreviated = `${parts[0][0]}. ${parts.slice(1).join(' ')}`;
  // If still long, abbreviate all but last word
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
  const nameFontSize = displayName.length > 12 ? 7 : displayName.length > 9 ? 8 : 9;
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
  const altPositions = [...new Set(
    displayedPrimaryPositionId !== normalizedPlayerPos
      ? [normalizedPlayerPos, ...rawAltPositions]
      : rawAltPositions
  )]
    .filter((id) => id !== displayedPrimaryPositionId)
    .slice(0, 2);
  const primaryPositionPalette = getDetailedPositionPalette(displayedPrimaryPositionId);

  const iso2 = nationalityToIso2(player?.nationality || '');
  const cartolaStatus = getCartolaStatusMeta(player?.cartola_status_id);

  return (
    <div className="w-[5rem] overflow-hidden rounded-[20px] border border-white/10 bg-slate-950/82 shadow-[0_14px_24px_rgba(0,0,0,0.34)] backdrop-blur-md sm:w-[6.5rem] sm:rounded-[24px] sm:shadow-[0_18px_32px_rgba(0,0,0,0.36)]">
      <div className="relative overflow-hidden bg-[linear-gradient(180deg,rgba(30,41,59,0.98)_0%,rgba(15,23,42,0.96)_100%)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_42%)]" />

        {/* Jersey — centered */}
        {player?.team_jersey_url ? (
          <img
            src={player.team_jersey_url}
            alt={player.team_short_code}
            className="absolute bottom-[-2%] left-1/2 h-[72%] w-auto -translate-x-1/2 object-contain drop-shadow-[0_8px_18px_rgba(0,0,0,0.55)]"
          />
        ) : (
          <svg
            viewBox="0 0 120 95"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="absolute bottom-[-2%] left-1/2 h-[72%] w-auto -translate-x-1/2 drop-shadow-[0_8px_18px_rgba(0,0,0,0.55)]"
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

        <div className="relative min-h-[4.6rem] sm:min-h-[5.7rem]">
          {/* Score — left edge, slightly below top */}
          <div
            style={{
              position: 'absolute',
              top: 2,
              left: 0,
              padding: '3px 5px',
              borderRadius: '0 8px 8px 0',
              background: 'rgba(2,6,23,0.62)',
              border: '1px solid rgba(255,255,255,0.09)',
              borderLeft: 'none',
              backdropFilter: 'blur(8px)',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 900, color: '#fbbf24', lineHeight: 1 }}>
              {avgScore}
            </div>
          </div>

          {/* Cartola status - bottom-right */}
          {cartolaStatus?.label && (
            <div
              style={{
                position: 'absolute',
                bottom: 2,
                right: 0,
                zIndex: 30,
                padding: '3px 6px',
                borderRadius: '8px 0 0 8px',
                background: cartolaStatus.background,
                border: `1px solid ${cartolaStatus.border}`,
                borderRight: 'none',
                backdropFilter: 'blur(8px)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
              }}
              title={cartolaStatus.name || undefined}
            >
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 900,
                  letterSpacing: '0.06em',
                  color: cartolaStatus.text,
                  lineHeight: 1,
                }}
              >
                {cartolaStatus.label}
              </div>
            </div>
          )}

          {/* Main position + alt positions — right edge, slightly below top */}
          <div
            style={{
              position: 'absolute',
              top: 5,
              right: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
            }}
          >
            <div
              style={{
                padding: '3px 5px',
              borderRadius: '8px 0 0 8px',
                background: primaryPositionPalette.background,
                border: `1px solid ${primaryPositionPalette.border}`,
                borderRight: 'none',
                backdropFilter: 'blur(8px)',
                fontSize: 9,
                fontWeight: 900,
                color: primaryPositionPalette.text,
                lineHeight: 1,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
              }}
            >
              {getDetailedPositionLabel(displayedPrimaryPositionId) || posLabel}
            </div>
            {altPositions.map((id) => (
              <div
                key={id}
                style={{
                  padding: '2px 5px 2px 4px',
                  borderRadius: '6px 0 0 6px',
                  background: getDetailedPositionPalette(id).background,
                  border: `1px solid ${getDetailedPositionPalette(id).border}`,
                  borderRight: 'none',
                  borderTop: 'none',
                  backdropFilter: 'blur(8px)',
                  fontSize: 7,
                  fontWeight: 600,
                  color: getDetailedPositionPalette(id).text,
                  lineHeight: 1,
                  textTransform: 'uppercase',
                }}
              >
                {getDetailedPositionLabel(id)}
              </div>
            ))}
          </div>

          {/* Flag — bottom-left */}
          {iso2 && (
            <div style={{ position: 'absolute', bottom: 2, left: 4 }}>
              <span
                className={`fi fi-${iso2}`}
                style={{
                  display: 'inline-block',
                  width: 18,
                  height: 13,
                }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-white/8 bg-[linear-gradient(180deg,rgba(247,212,110,0.95)_0%,rgba(180,132,38,0.98)_100%)] px-1.5 pt-1.5 pb-2 text-center text-amber-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] sm:px-2.5 sm:pt-2 sm:pb-2.5">
        <div
          style={{
            fontSize: nameFontSize,
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0',
            color: '#3f2b07',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1.2,
            paddingBottom: 4,
            borderBottom: '1px solid rgba(63,43,7,0.22)',
          }}
        >
          {displayName}
        </div>

        <div className="mt-1 grid grid-cols-3 gap-x-1 gap-y-0.5 sm:mt-1.5 sm:gap-x-1.5">
          {attrs.map(([label, key]) => (
            <div key={label} className="flex items-baseline justify-center gap-0.5 leading-none">
              <span className="text-[7px] font-black text-amber-950/70 sm:text-[8px]">
                {label}
              </span>
              <span className="text-[8px] font-black text-amber-950 sm:text-[10px]">
                {Number.isFinite(player?.[key]) ? Math.round(player[key]) : 0}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
