import React from 'react';
import { nationalityToIso2 } from '../utils/nationality.js';
import { getDetailedPositionLabel, normalizeDetailedPositionId } from '../utils/positions.js';

// Jersey colors by team short_code: { p: primary, s: secondary }
const TEAM_COLORS = {
  FLA: { p: '#CC0000', s: '#1a1a1a' },  // Flamengo
  PAL: { p: '#006437', s: '#FFFFFF' },  // Palmeiras
  FLU: { p: '#831524', s: '#FFFFFF' },  // Fluminense
  BOT: { p: '#FFFFFF', s: '#1a1a1a' },  // Botafogo
  VAS: { p: '#FFFFFF', s: '#1a1a1a' },  // Vasco
  CAM: { p: '#FFFFFF', s: '#1a1a1a' },  // Atletico MG
  CRU: { p: '#0041A0', s: '#FFFFFF' },  // Cruzeiro
  INT: { p: '#CC0000', s: '#FFFFFF' },  // Internacional
  GRE: { p: '#0041A0', s: '#1a1a1a' },  // Gremio
  SAO: { p: '#CC0000', s: '#1a1a1a' },  // Sao Paulo
  COR: { p: '#FFFFFF', s: '#1a1a1a' },  // Corinthians
  SAN: { p: '#FFFFFF', s: '#1a1a1a' },  // Santos
  BAH: { p: '#003087', s: '#CC0000' },  // Bahia
  CAP: { p: '#CC0000', s: '#1a1a1a' },  // Athletico PR
  BRA: { p: '#CC0000', s: '#FFFFFF' },  // Bragantino
  CFC: { p: '#00612C', s: '#FFFFFF' },  // Coritiba
  VIT: { p: '#CC0000', s: '#1a1a1a' },  // Vitoria
  REM: { p: '#003082', s: '#CC0000' },  // Remo
  MIR: { p: '#F5C400', s: '#0041A0' },  // Mirassol
  CHA: { p: '#1A5C2A', s: '#FFFFFF' },  // Chapecoense
};

const BORDER_COLORS = {
  1: '#3b82f6',
  2: '#22c55e',
  3: '#22c55e',
  4: '#ef4444',
};

const OUTFIELD_ATTRS = [
  ['ATA', '#f87171', 'attr_ata'],
  ['COM', '#fbbf24', 'attr_com'],
  ['CRI', '#a78bfa', 'attr_cri'],
  ['DEF', '#4ade80', 'attr_def'],
  ['PAS', '#60a5fa', 'attr_pas'],
  ['FIS', '#22d3ee', 'attr_fis'],
];

const GOALKEEPER_ATTRS = [
  ['GOL', '#3b82f6', 'attr_gol'],
  ['COM', '#fbbf24', 'attr_com'],
  ['CRI', '#a78bfa', 'attr_cri'],
  ['DEF', '#4ade80', 'attr_def'],
  ['PAS', '#60a5fa', 'attr_pas'],
  ['FIS', '#22d3ee', 'attr_fis'],
];

export default function DraftPlayerCard({ player, onClick, isMyTurn, compact = false }) {
  const isGoalkeeper = player.detailed_position_id === 1;
  const attrs = isGoalkeeper ? GOALKEEPER_ATTRS : OUTFIELD_ATTRS;
  const borderColor = BORDER_COLORS[player.position_id] || '#6b7280';
  const iso2 = nationalityToIso2(player.nationality || '');
  const displayName = player.display_name || player.name;
  const altPositions = [...new Set((player.alt_positions || []).map((positionId) => normalizeDetailedPositionId(positionId)))].slice(0, 2);
  const avgScore = (player.avg_score || 0).toFixed(1);
  const avgMinutes = Math.round(player.avg_minutes || 0);
  const jersey = TEAM_COLORS[player.team_short_code] || {
    p: BORDER_COLORS[player.position_id] || '#3b82f6',
    s: '#FFFFFF',
  };

  const W = compact ? 140 : 210;
  const topH = compact ? 84 : 126;
  const jerseyW = compact ? 72 : 108;
  const scoreFz = compact ? 18 : 26;
  const minutesFz = compact ? 10 : 14;
  const posFz = compact ? 14 : 20;
  const nameFz = compact ? 11 : 15;
  const namePb = compact ? 6 : 9;
  const attrLabelFz = compact ? 10 : 14;
  const attrValFz = compact ? 11 : 15;
  const attrLabelW = compact ? 24 : 34;
  const attrValW = compact ? 26 : 36;
  const flagW = compact ? 20 : 28;
  const flagH = compact ? 14 : 20;
  const bottomPad = compact ? '8px 9px 12px' : '10px 12px 17px';
  const gap = compact ? 7 : 9;
  const radius = compact ? 18 : 22;
  const chipPad = compact ? '5px 7px' : '6px 8px';
  const chipRadius = compact ? 12 : 14;
  const mutedLabelColor = 'rgba(203,213,225,0.56)';
  const shellBackground = 'linear-gradient(180deg, rgba(7,12,21,0.98) 0%, rgba(3,7,16,1) 100%)';
  const topBackground = `radial-gradient(circle at top, ${borderColor}22 0%, transparent 34%), linear-gradient(180deg, rgba(21,31,51,0.97) 0%, rgba(12,20,36,0.98) 52%, rgba(6,12,24,1) 100%)`;
  const bottomBackground = 'linear-gradient(180deg, rgba(15,23,42,0.98) 0%, rgba(8,13,25,1) 100%)';
  const chipBackground = 'rgba(2,6,23,0.62)';
  const chipBorder = '1px solid rgba(255,255,255,0.09)';
  const outerShadow = `0 20px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04) inset, 0 0 0 1px ${borderColor}55`;

  return (
    <button
      onClick={isMyTurn ? onClick : undefined}
      disabled={!isMyTurn}
      style={{
        width: W,
        flexShrink: 0,
        borderRadius: radius,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: outerShadow,
        background: shellBackground,
        cursor: isMyTurn ? 'pointer' : 'default',
        opacity: isMyTurn ? 1 : 0.8,
        textAlign: 'left',
        transition: 'transform 0.15s, box-shadow 0.15s',
        fontFamily: "'Inter', system-ui, sans-serif",
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        if (isMyTurn) {
          e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)';
          e.currentTarget.style.boxShadow = `0 26px 58px rgba(0,0,0,0.56), 0 0 0 1px rgba(255,255,255,0.05) inset, 0 0 0 1px ${borderColor}88`;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = outerShadow;
      }}
    >
      <div
        style={{
          height: topH,
          background: topBackground,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 50% 10%, rgba(255,255,255,0.12), transparent 32%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: compact ? 10 : 12,
            right: compact ? 10 : 12,
            bottom: compact ? 11 : 13,
            height: 1,
            background: `linear-gradient(90deg, transparent 0%, ${borderColor}50 18%, rgba(255,255,255,0.12) 50%, ${borderColor}50 82%, transparent 100%)`,
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
        >
          {player.team_jersey_url ? (
            <img
              src={player.team_jersey_url}
              alt={player.team_short_code}
              width={jerseyW}
              style={{
                objectFit: 'contain',
                filter: 'drop-shadow(0 8px 18px rgba(0,0,0,0.72))',
              }}
            />
          ) : (
            <svg
              viewBox="0 0 120 95"
              width={jerseyW}
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ filter: 'drop-shadow(0 8px 18px rgba(0,0,0,0.72))' }}
            >
              <defs>
                <clipPath id={`jersey-${player.id}`}>
                  <path d="M38 6 C36 6 24 9 6 20 L13 46 C19 40 25 38 30 38 L30 95 L90 95 L90 38 C95 38 101 40 107 46 L114 20 C96 9 84 6 82 6 C80 1 74 0 74 3 Q60 13 46 3 C46 0 40 1 38 6 Z" />
                </clipPath>
              </defs>
              <g clipPath={`url(#jersey-${player.id})`}>
                <rect x="0" y="0" width="120" height="95" fill={jersey.p} />
                <rect x="45" y="0" width="30" height="95" fill={jersey.s} opacity="0.85" />
              </g>
            </svg>
          )}
        </div>

        {/* Top-left: score */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            padding: chipPad,
            borderRadius: `0 0 ${chipRadius}px 0`,
            background: chipBackground,
            border: chipBorder,
            borderLeft: 'none',
            borderTop: 'none',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div style={{ fontSize: scoreFz, fontWeight: 900, color: '#fbbf24', lineHeight: 1.02 }}>
            {avgScore}
          </div>
          <div style={{ fontSize: 8, color: mutedLabelColor, letterSpacing: '0.04em' }}>score med.</div>
        </div>

        {/* Left: minutes + matches — below score */}
        <div
          style={{
            position: 'absolute',
            top: compact ? 44 : 58,
            left: 0,
            padding: chipPad,
            borderRadius: `0 ${chipRadius}px ${chipRadius}px 0`,
            background: chipBackground,
            border: chipBorder,
            borderLeft: 'none',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div style={{ fontSize: minutesFz, fontWeight: 700, color: '#d1d5db', lineHeight: 1 }}>
            {avgMinutes}'
          </div>
          <div style={{ fontSize: 8, color: mutedLabelColor }}>med. min.</div>
          <div style={{ fontSize: minutesFz, fontWeight: 700, color: '#d1d5db', lineHeight: 1, marginTop: 3 }}>
            {player.matches_played ?? 0}
          </div>
          <div style={{ fontSize: 8, color: mutedLabelColor }}>partidas</div>
        </div>

        {/* Top-right: main position + alt positions stacked */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
          }}
        >
          <span
            style={{
              fontSize: posFz,
              fontWeight: 900,
              color: '#f9fafb',
              lineHeight: 1,
              letterSpacing: '0.5px',
              textShadow: '0 4px 12px rgba(0,0,0,0.55)',
              padding: chipPad,
              borderRadius: `0 0 0 ${chipRadius}px`,
              background: chipBackground,
              border: chipBorder,
              borderRight: 'none',
              borderTop: 'none',
              backdropFilter: 'blur(8px)',
            }}
          >
            {getDetailedPositionLabel(player.detailed_position_id)}
          </span>
          {altPositions.map((posID) => (
            <span
              key={posID}
              style={{
                fontSize: 9,
                fontWeight: 600,
                color: '#9ca3af',
                lineHeight: 1,
                padding: `3px ${compact ? 6 : 8}px 3px 6px`,
                borderRadius: `${chipRadius}px 0 0 ${chipRadius}px`,
                background: chipBackground,
                border: chipBorder,
                borderRight: 'none',
                borderTop: 'none',
                backdropFilter: 'blur(8px)',
              }}
            >
              {getDetailedPositionLabel(posID)}
            </span>
          ))}
        </div>

        {/* Bottom-right: flag */}
        {iso2 && (
          <div
            style={{
              position: 'absolute',
              bottom: compact ? 8 : 10,
              right: compact ? 9 : 11,
            }}
          >
            <span
              className={`fi fi-${iso2}`}
              style={{
                display: 'inline-block',
                width: flagW,
                height: flagH,
              }}
            />
          </div>
        )}

        {/* Bottom-right: next opponent logo — disabled */}

      </div>

      <div
        style={{
          background: bottomBackground,
          padding: bottomPad,
          display: 'flex',
          flexDirection: 'column',
          gap,
          position: 'relative',
          borderTop: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(180deg, ${borderColor}14 0%, transparent 18%)`,
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            fontSize: nameFz,
            fontWeight: 800,
            color: '#f9fafb',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            textAlign: 'center',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            paddingBottom: namePb,
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            position: 'relative',
          }}
        >
          {displayName}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '4px 8px',
            position: 'relative',
          }}
        >
          {attrs.map(([label, color, key]) => (
            <div
              key={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                padding: '2px 0',
              }}
            >
              <span
                style={{
                  fontSize: attrLabelFz,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  width: attrLabelW,
                  flexShrink: 0,
                  color,
                }}
              >
                {label}
              </span>
              <span
                style={{
                  fontSize: attrValFz,
                  fontWeight: 900,
                  width: attrValW,
                  textAlign: 'right',
                  color,
                }}
              >
                {Number.isFinite(player[key]) ? player[key].toFixed(1) : '0.0'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </button>
  );
}
