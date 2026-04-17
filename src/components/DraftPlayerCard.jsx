import React from 'react';
import { nationalityToIso2 } from '../utils/nationality.js';
import {
  getDetailedPositionLabel,
  getDetailedPositionPalette,
  getPlayerAlternativeDetailedPositionIds,
  getPlayerPrimaryDetailedPositionId,
  normalizeDetailedPositionId,
} from '../utils/positions.js';

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

export default function DraftPlayerCard({ player, onClick, isMyTurn, compact = false, large = false, slotPositionId = null, showRoundMatchup = false }) {
  const isGoalkeeper = player.detailed_position_id === 1;
  const attrs = isGoalkeeper ? GOALKEEPER_ATTRS : OUTFIELD_ATTRS;
  const borderColor = BORDER_COLORS[player.position_id] || '#6b7280';
  const iso2 = nationalityToIso2(player.nationality || '');
  const displayName = player.display_name || player.name;

  const primaryPositionId = getPlayerPrimaryDetailedPositionId(player);
  const normalizedSlotPos = slotPositionId ? normalizeDetailedPositionId(slotPositionId) : null;
  const rawAltPositions = getPlayerAlternativeDetailedPositionIds(player, 2);
  const altPositions = [...new Set(
    normalizedSlotPos && normalizedSlotPos !== primaryPositionId
      ? [normalizedSlotPos, ...rawAltPositions]
      : rawAltPositions
  )]
    .filter((id) => id !== primaryPositionId)
    .slice(0, 2);
  const primaryPositionPalette = getDetailedPositionPalette(primaryPositionId);
  const scoreValue = Number.isFinite(player.score_value)
    ? player.score_value
    : (player.avg_score || 0);
  const scoreLabel = player.score_label || 'score med.';
  const avgScore = scoreValue.toFixed(1);
  const avgMinutes = Math.round(player.avg_minutes || 0);
  const roundMatchup = player.round_matchup || '';
  const roundTeamLogoURL = player.round_team_logo_url || '';
  const roundOpponentLogoURL = player.round_opponent_logo_url || '';
  const roundIsHome = Boolean(player.round_is_home);
  const jersey = TEAM_COLORS[player.team_short_code] || {
    p: BORDER_COLORS[player.position_id] || '#3b82f6',
    s: '#FFFFFF',
  };

  const W = compact ? 140 : large ? 248 : 210;
  const topH = compact ? 84 : large ? 150 : 126;
  const jerseyW = compact ? 72 : large ? 128 : 108;
  const scoreFz = compact ? 18 : large ? 30 : 26;
  const minutesFz = compact ? 10 : large ? 16 : 14;
  const posFz = compact ? 14 : large ? 24 : 20;
  const nameFz = compact ? 11 : large ? 17 : 15;
  const namePb = compact ? 6 : large ? 11 : 9;
  const attrLabelFz = compact ? 10 : large ? 16 : 14;
  const attrValFz = compact ? 11 : large ? 17 : 15;
  const attrLabelW = compact ? 24 : large ? 40 : 34;
  const attrValW = compact ? 26 : large ? 42 : 36;
  const flagW = compact ? 20 : large ? 32 : 28;
  const flagH = compact ? 14 : large ? 22 : 20;
  const bottomPad = compact ? '8px 9px 12px' : large ? '12px 15px 20px' : '10px 12px 17px';
  const gap = compact ? 7 : large ? 11 : 9;
  const radius = compact ? 18 : large ? 26 : 22;
  const chipPad = compact ? '5px 7px' : large ? '8px 11px' : '6px 8px';
  const chipRadius = compact ? 12 : large ? 16 : 14;
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
          <div style={{ fontSize: 8, color: mutedLabelColor, letterSpacing: '0.04em' }}>{scoreLabel}</div>
        </div>

        {/* Bottom-right: minutes + matches */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            padding: compact ? '3px 5px' : '4px 6px',
            borderRadius: `${chipRadius}px 0 0 0`,
            background: chipBackground,
            border: chipBorder,
            borderRight: 'none',
            borderBottom: 'none',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
            backdropFilter: 'blur(8px)',
            textAlign: 'right',
          }}
        >
          <div style={{ fontSize: compact ? 9 : 11, fontWeight: 700, color: '#d1d5db', lineHeight: 1 }}>
            {avgMinutes}'
          </div>
          <div style={{ fontSize: 7, color: mutedLabelColor }}>med. min.</div>
          <div style={{ fontSize: compact ? 9 : 11, fontWeight: 700, color: '#d1d5db', lineHeight: 1, marginTop: 2 }}>
            {player.matches_played ?? 0}
          </div>
          <div style={{ fontSize: 7, color: mutedLabelColor }}>partidas</div>
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
              color: primaryPositionPalette.text,
              lineHeight: 1,
              letterSpacing: '0.5px',
              textShadow: '0 4px 12px rgba(0,0,0,0.55)',
              padding: chipPad,
              borderRadius: `0 0 0 ${chipRadius}px`,
              background: primaryPositionPalette.background,
              border: `1px solid ${primaryPositionPalette.border}`,
              borderRight: 'none',
              borderTop: 'none',
              backdropFilter: 'blur(8px)',
            }}
          >
            {getDetailedPositionLabel(primaryPositionId)}
          </span>
          {altPositions.map((posID) => (
            <span
              key={posID}
              style={{
                fontSize: 9,
                fontWeight: 600,
                color: getDetailedPositionPalette(posID).text,
                lineHeight: 1,
                padding: `3px ${compact ? 6 : 8}px 3px 6px`,
                borderRadius: `${chipRadius}px 0 0 ${chipRadius}px`,
                background: getDetailedPositionPalette(posID).background,
                border: `1px solid ${getDetailedPositionPalette(posID).border}`,
                borderRight: 'none',
                borderTop: 'none',
                backdropFilter: 'blur(8px)',
              }}
            >
              {getDetailedPositionLabel(posID)}
            </span>
          ))}
        </div>

        {showRoundMatchup && roundTeamLogoURL && roundOpponentLogoURL && (
          <div
            style={{
              position: 'absolute',
              left: compact ? 3 : 4,
              bottom: compact ? 26 : 34,
              display: 'flex',
              alignItems: 'center',
              gap: compact ? 4 : 6,
              padding: compact ? '3px 5px' : '4px 7px',
              borderRadius: compact ? 8 : 10,
              background: 'rgba(2,6,23,0.68)',
              border: '1px solid rgba(255,255,255,0.09)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
              backdropFilter: 'blur(8px)',
            }}
            title={roundMatchup}
          >
            {(roundIsHome ? [roundTeamLogoURL, roundOpponentLogoURL] : [roundOpponentLogoURL, roundTeamLogoURL]).map((logoURL, index) => (
              <React.Fragment key={`${logoURL}-${index}`}>
                {index === 1 && (
                  <span
                    style={{
                      fontSize: compact ? 8 : 9,
                      fontWeight: 800,
                      color: '#e5e7eb',
                      lineHeight: 1,
                    }}
                  >
                    x
                  </span>
                )}
                <img
                  src={logoURL}
                  alt=""
                  style={{
                    width: compact ? 15 : large ? 24 : 19,
                    height: compact ? 15 : large ? 24 : 19,
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.45))',
                  }}
                />
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Bottom-left: flag */}
        {iso2 && (
          <div
            style={{
              position: 'absolute',
              bottom: compact ? 8 : 10,
              left: compact ? 9 : 11,
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
