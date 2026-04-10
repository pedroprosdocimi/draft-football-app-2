import React from 'react';
import { nationalityToIso2 } from '../utils/nationality.js';

// Jersey colors by team short_code: { p: primary, s: secondary }
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

const DETAILED_LABELS = {
  1:'GOL', 2:'ZAG', 3:'LD', 4:'LE', 5:'VOL',
  6:'MEI', 7:'MAT', 8:'ME', 9:'MD', 10:'CA', 11:'PE', 12:'PD', 13:'2AT'
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
  const altPositions = [...new Set((player.alt_positions || []))].slice(0, 2);
  const avgScore = (player.avg_score || 0).toFixed(1);
  const avgMinutes = Math.round(player.avg_minutes || 0);
  const jersey = TEAM_COLORS[player.team_short_code] || { p: BORDER_COLORS[player.position_id] || '#3b82f6', s: '#FFFFFF' };

  const W = compact ? 140 : 210;
  const topH = compact ? 80 : 120;
  const jerseyW = compact ? 72 : 108;
  const scoreFz = compact ? 18 : 26;
  const minutesFz = compact ? 10 : 14;
  const posFz = compact ? 14 : 20;
  const nameFz = compact ? 11 : 15;
  const attrLabelFz = compact ? 10 : 14;
  const attrValFz = compact ? 11 : 15;
  const attrLabelW = compact ? 24 : 34;
  const attrValW = compact ? 26 : 36;
  const flagW = compact ? 20 : 28;
  const flagH = compact ? 14 : 20;
  const bottomPad = compact ? '6px 8px 12px' : '8px 12px 17px';
  const gap = compact ? 6 : 8;

  return (
    <button
      onClick={isMyTurn ? onClick : undefined}
      disabled={!isMyTurn}
      style={{
        width: W,
        flexShrink: 0,
        borderRadius: 14,
        overflow: 'hidden',
        border: `1.5px solid ${borderColor}`,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        background: 'transparent',
        cursor: isMyTurn ? 'pointer' : 'default',
        opacity: isMyTurn ? 1 : 0.8,
        textAlign: 'left',
        transition: 'transform 0.15s, box-shadow 0.15s',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
      onMouseEnter={e => { if (isMyTurn) e.currentTarget.style.transform = 'scale(1.04)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      {/* ── TOP ── */}
      <div style={{
        height: topH,
        background: '#1a2234',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Jersey */}
        <div style={{
          position:'absolute', inset:0,
          display:'flex', alignItems:'flex-end', justifyContent:'center'
        }}>
          <svg viewBox="0 0 120 95" width={jerseyW} fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 4px 14px rgba(0,0,0,0.7))' }}>
            <defs>
              <clipPath id={`jersey-${player.id}`}>
                <path d="M38 6 C36 6 24 9 6 20 L13 46 C19 40 25 38 30 38 L30 95 L90 95 L90 38 C95 38 101 40 107 46 L114 20 C96 9 84 6 82 6 C80 1 74 0 74 3 Q60 13 46 3 C46 0 40 1 38 6 Z"/>
              </clipPath>
            </defs>
            <g clipPath={`url(#jersey-${player.id})`}>
              <rect x="0" y="0" width="120" height="95" fill={jersey.p}/>
              <rect x="45" y="0" width="30" height="95" fill={jersey.s} opacity="0.85"/>
            </g>
          </svg>
        </div>

        {/* Top-left: score */}
        <div style={{ position:'absolute', top:9, left:11 }}>
          <div style={{ fontSize:scoreFz, fontWeight:800, color:'#fbbf24', lineHeight:1.05 }}>
            {avgScore}
          </div>
          <div style={{ fontSize:8, color:'#6b7280' }}>score méd.</div>
        </div>

        {/* Top-right: minutes + flag */}
        <div style={{
          position:'absolute', top:9, right:11,
          display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8
        }}>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:minutesFz, fontWeight:700, color:'#d1d5db', lineHeight:1 }}>
              {avgMinutes}'
            </div>
            <div style={{ fontSize:8, color:'#6b7280' }}>méd. min.</div>
            <div style={{ fontSize:minutesFz, fontWeight:700, color:'#d1d5db', lineHeight:1, marginTop:4 }}>
              {player.matches_played ?? 0}
            </div>
            <div style={{ fontSize:8, color:'#6b7280' }}>partidas</div>
          </div>
          {iso2 && (
            <span
              className={`fi fi-${iso2}`}
              style={{ display:'inline-block', width:flagW, height:flagH, borderRadius:3, boxShadow:'0 1px 4px rgba(0,0,0,0.5)' }}
            />
          )}
        </div>

        {/* Bottom-left: alt positions + main position */}
        <div style={{
          position:'absolute', bottom:9, left:11,
          display:'flex', flexDirection:'column', alignItems:'flex-start', gap:2
        }}>
          {altPositions.map(posID => (
            <span key={posID} style={{
              fontSize:9, fontWeight:600, color:'#9ca3af',
              background:'rgba(255,255,255,0.08)',
              borderRadius:3, padding:'1px 5px', lineHeight:1.5, display:'block'
            }}>
              {DETAILED_LABELS[posID] || posID}
            </span>
          ))}
          <span style={{ fontSize:posFz, fontWeight:900, color:'#f9fafb', lineHeight:1, letterSpacing:'0.5px', marginTop:1 }}>
            {DETAILED_LABELS[player.detailed_position_id] || '?'}
          </span>
        </div>

        {/* Bottom-right: team code */}
        <div style={{ position:'absolute', bottom:9, right:11 }}>
          <span style={{ fontSize:11, fontWeight:700, color:'#6b7280', letterSpacing:'0.5px' }}>
            {player.team_short_code || '—'}
          </span>
        </div>
      </div>

      {/* ── BOTTOM ── */}
      <div style={{
        background:'#111827',
        padding: bottomPad,
        display:'flex', flexDirection:'column', gap,
      }}>
        {/* Player name */}
        <div style={{
          fontSize:nameFz, fontWeight:800, color:'#f9fafb',
          textTransform:'uppercase', letterSpacing:'0.5px', textAlign:'center',
          whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
          paddingBottom: compact ? 5 : 8,
          borderBottom:'1px solid rgba(255,255,255,0.08)'
        }}>
          {displayName}
        </div>

        {/* Attribute grid — 3×2 */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'3px 8px' }}>
          {attrs.map(([label, color, key]) => (
            <div key={label} style={{ display:'flex', alignItems:'center', gap:3 }}>
              <span style={{
                fontSize:attrLabelFz, fontWeight:800, textTransform:'uppercase',
                width:attrLabelW, flexShrink:0, color
              }}>{label}</span>
              <span style={{ fontSize:attrValFz, fontWeight:900, width:attrValW, textAlign:'right', color }}>
                {Number.isFinite(player[key] || 0) ? (player[key] || 0).toFixed(1) : '0.0'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </button>
  );
}
