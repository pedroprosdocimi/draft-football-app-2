import React from 'react';
import { getDetailedPositionLabel, normalizeDetailedPositionId } from '../utils/positions.js';
import { nationalityToIso2 } from '../utils/nationality.js';

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

function formatName(name) {
  if (name.length <= 11) return name;
  const parts = name.split(' ');
  if (parts.length < 2) return name;
  return `${parts[0][0]}. ${parts.slice(1).join(' ')}`;
}

export default function FieldPlayerPreview({ player, posLabel }) {
  const rawName = player?.display_name || player?.name || 'Jogador';
  const displayName = formatName(rawName);
  const avgScore = Number.isFinite(player?.avg_score) ? player.avg_score.toFixed(1) : '0.0';
  const nameFontSize = displayName.length > 14 ? 7 : displayName.length > 10 ? 8 : 9;
  const jerseyColors = {
    p: player?.primary_color || TEAM_COLORS[player?.team_short_code]?.p || '#1e293b',
    s: player?.secondary_color || TEAM_COLORS[player?.team_short_code]?.s || '#f8fafc',
  };
  const altPositions = [...new Set((player?.alt_positions || []).map((positionId) => normalizeDetailedPositionId(positionId)))].slice(0, 2);
  const iso2 = nationalityToIso2(player?.nationality || '');

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
                background: 'rgba(2,6,23,0.62)',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRight: 'none',
                backdropFilter: 'blur(8px)',
                fontSize: 9,
                fontWeight: 900,
                color: '#f9fafb',
                lineHeight: 1,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
              }}
            >
              {posLabel}
            </div>
            {altPositions.map((id) => (
              <div
                key={id}
                style={{
                  padding: '2px 5px 2px 4px',
                  borderRadius: '6px 0 0 6px',
                  background: 'rgba(2,6,23,0.62)',
                  border: '1px solid rgba(255,255,255,0.09)',
                  borderRight: 'none',
                  borderTop: 'none',
                  backdropFilter: 'blur(8px)',
                  fontSize: 7,
                  fontWeight: 600,
                  color: '#9ca3af',
                  lineHeight: 1,
                  textTransform: 'uppercase',
                }}
              >
                {getDetailedPositionLabel(id)}
              </div>
            ))}
          </div>

          {/* Flag — bottom-right */}
          {iso2 && (
            <div style={{ position: 'absolute', bottom: 2, right: 4 }}>
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

      <div className="border-t border-white/8 bg-[linear-gradient(180deg,rgba(8,13,25,0.98)_0%,rgba(2,6,23,1)_100%)] px-1.5 py-1.5 text-center sm:px-2.5 sm:py-2">
        <div
          style={{
            fontSize: nameFontSize,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
            color: '#ffffff',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1.2,
          }}
        >
          {displayName}
        </div>
      </div>
    </div>
  );
}
