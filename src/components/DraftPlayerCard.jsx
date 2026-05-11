import React from 'react';
import { nationalityToIso2 } from '../utils/nationality.js';
import { getCartolaStatusMeta } from '../utils/cartolaStatus.js';
import {
  getDetailedPositionLabel,
  getPlayerPrimaryDetailedPositionId,
  normalizeDetailedPositionId,
} from '../utils/positions.js';

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

const BORDER_COLORS = {
  1: '#3b82f6',
  2: '#22c55e',
  3: '#22c55e',
  4: '#ef4444',
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

const CARD_CLIP_PATH = 'polygon(50% 0%, 57% 4%, 66% 3%, 82% 12%, 96% 25%, 100% 31%, 100% 88%, 88% 94%, 64% 96%, 50% 100%, 36% 96%, 12% 94%, 0% 88%, 0% 31%, 4% 25%, 18% 12%, 34% 3%, 43% 4%)';

export default function DraftPlayerCard({
  player,
  onClick,
  isMyTurn,
  compact = false,
  large = false,
  slotPositionId = null,
  showRoundMatchup = false,
}) {
  const primaryPositionId = getPlayerPrimaryDetailedPositionId(player);
  const normalizedSlotPos = slotPositionId ? normalizeDetailedPositionId(slotPositionId) : null;
  const displayedPositionId = normalizedSlotPos || primaryPositionId;
  const isGoalkeeper = displayedPositionId === 1 || player.detailed_position_id === 1;
  const attrs = isGoalkeeper ? GOALKEEPER_ATTRS : OUTFIELD_ATTRS;
  const scoreValue = Number.isFinite(player.score_value) ? player.score_value : (player.avg_score || 0);
  const avgScore = scoreValue.toFixed(1);
  const displayName = player.display_name || player.name || 'Jogador';
  const iso2 = nationalityToIso2(player.nationality || '');
  const positionLabel = getDetailedPositionLabel(displayedPositionId);
  const cartolaStatus = getCartolaStatusMeta(player.cartola_status_id);
  const roundTeamLogoURL = player.round_team_logo_url || '';
  const roundOpponentLogoURL = player.round_opponent_logo_url || '';
  const roundIsHome = Boolean(player.round_is_home);
  const jersey = TEAM_COLORS[player.team_short_code] || {
    p: BORDER_COLORS[player.position_id] || '#3b82f6',
    s: '#FFFFFF',
  };

  const W = compact ? 140 : large ? 248 : 210;
  const H = compact ? 196 : large ? 348 : 294;
  const scoreFz = compact ? 30 : large ? 54 : 46;
  const posFz = compact ? 15 : large ? 28 : 24;
  const nameFz = compact ? 18 : large ? 33 : 28;
  const attrLabelFz = compact ? 11 : large ? 20 : 17;
  const attrValFz = compact ? 15 : large ? 28 : 24;
  const jerseyH = compact ? '43%' : large ? '48%' : '47%';
  const outerShadow = '0 24px 58px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.28)';

  return (
    <button
      onClick={isMyTurn ? onClick : undefined}
      disabled={!isMyTurn}
      style={{
        width: W,
        height: H,
        flexShrink: 0,
        border: 'none',
        padding: 0,
        background: 'transparent',
        cursor: isMyTurn ? 'pointer' : 'default',
        opacity: isMyTurn ? 1 : 0.84,
        textAlign: 'left',
        transition: 'transform 0.15s, filter 0.15s',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
      onMouseEnter={(e) => {
        if (isMyTurn) {
          e.currentTarget.style.transform = 'translateY(-3px) scale(1.025)';
          e.currentTarget.style.filter = 'brightness(1.04)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.filter = 'brightness(1)';
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          clipPath: CARD_CLIP_PATH,
          color: '#3f2b07',
          background: 'linear-gradient(145deg,#f9e69a 0%,#d8a83c 45%,#fff1aa 100%)',
          boxShadow: outerShadow,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at 36% 8%,rgba(255,255,255,0.46),transparent 27%),linear-gradient(135deg,transparent 0%,transparent 35%,rgba(153,96,17,0.22) 36%,rgba(255,255,255,0.26) 43%,transparent 44%),linear-gradient(160deg,transparent 0%,transparent 54%,rgba(190,122,23,0.34) 55%,transparent 66%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '6%',
            right: '6%',
            top: '42%',
            height: compact ? 34 : large ? 68 : 56,
            transform: 'rotate(-24deg)',
            background: 'linear-gradient(90deg, transparent, rgba(140,84,12,0.28), rgba(255,255,255,0.22), transparent)',
          }}
        />

        {player.team_jersey_url ? (
          <img
            src={player.team_jersey_url}
            alt={player.team_short_code}
            style={{
              position: 'absolute',
              left: '58%',
              bottom: '30%',
              height: jerseyH,
              width: 'auto',
              transform: 'translateX(-50%)',
              objectFit: 'contain',
              filter: 'drop-shadow(0 12px 20px rgba(62,39,6,0.46))',
            }}
          />
        ) : (
          <svg
            viewBox="0 0 120 95"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              position: 'absolute',
              left: '58%',
              bottom: '30%',
              height: jerseyH,
              width: 'auto',
              transform: 'translateX(-50%)',
              filter: 'drop-shadow(0 12px 20px rgba(62,39,6,0.46))',
            }}
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

        <div style={{ position: 'absolute', left: '13%', top: '18%', textAlign: 'center' }}>
          <div style={{ fontSize: scoreFz, fontWeight: 950, lineHeight: 0.92 }}>{avgScore}</div>
          <div style={{ marginTop: compact ? 2 : 4, fontSize: posFz, fontWeight: 900, lineHeight: 1 }}>
            {positionLabel}
          </div>
        </div>

        {cartolaStatus?.label && (
          <div
            style={{
              position: 'absolute',
              left: '15%',
              top: '36%',
              zIndex: 30,
              padding: compact ? '2px 5px' : '3px 7px',
              borderRadius: 999,
              background: cartolaStatus.background,
              border: `1px solid ${cartolaStatus.border}`,
            }}
            title={cartolaStatus.name || undefined}
          >
            <span style={{ color: cartolaStatus.text, fontSize: compact ? 8 : 10, fontWeight: 900, lineHeight: 1 }}>
              {cartolaStatus.label}
            </span>
          </div>
        )}

        {showRoundMatchup && roundTeamLogoURL && roundOpponentLogoURL && (
          <div
            style={{
              position: 'absolute',
              left: '13%',
              top: '46%',
              display: 'flex',
              alignItems: 'center',
              gap: compact ? 4 : 7,
              padding: compact ? '3px 5px' : '4px 7px',
              borderRadius: 10,
              background: 'rgba(255,244,180,0.54)',
              border: '1px solid rgba(63,43,7,0.18)',
            }}
          >
            {(roundIsHome ? [roundTeamLogoURL, roundOpponentLogoURL] : [roundOpponentLogoURL, roundTeamLogoURL]).map((logoURL, index) => (
              <React.Fragment key={`${logoURL}-${index}`}>
                {index === 1 && <span style={{ fontSize: compact ? 8 : 10, fontWeight: 900 }}>x</span>}
                <img
                  src={logoURL}
                  alt=""
                  style={{ width: compact ? 15 : large ? 26 : 22, height: compact ? 15 : large ? 26 : 22, objectFit: 'contain' }}
                />
              </React.Fragment>
            ))}
          </div>
        )}

        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: '24%',
            width: '82%',
            transform: 'translateX(-50%)',
            borderTop: '1px solid rgba(63,43,7,0.22)',
            paddingTop: compact ? 6 : large ? 12 : 10,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: nameFz,
              fontWeight: 950,
              lineHeight: 1.05,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              textTransform: 'capitalize',
            }}
          >
            {displayName}
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: '14%',
            width: '82%',
            transform: 'translateX(-50%)',
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            textAlign: 'center',
          }}
        >
          {attrs.map(([label]) => (
            <div key={label} style={{ fontSize: attrLabelFz, fontWeight: 900, lineHeight: 1 }}>
              {label}
            </div>
          ))}
        </div>

        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: '7.2%',
            width: '82%',
            transform: 'translateX(-50%)',
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            textAlign: 'center',
          }}
        >
          {attrs.map(([label, key]) => (
            <div key={label} style={{ fontSize: attrValFz, fontWeight: 950, lineHeight: 1 }}>
              {Number.isFinite(player[key]) ? Math.round(player[key]) : 0}
            </div>
          ))}
        </div>

        {iso2 && (
          <div style={{ position: 'absolute', bottom: '2.4%', left: '50%', transform: 'translateX(-50%)' }}>
            <span
              className={`fi fi-${iso2}`}
              style={{ display: 'inline-block', width: compact ? 20 : large ? 34 : 28, height: compact ? 14 : large ? 24 : 20 }}
            />
          </div>
        )}
      </div>
    </button>
  );
}
