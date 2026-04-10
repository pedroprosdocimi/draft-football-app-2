import React from 'react';
import { nationalityToIso2 } from '../utils/nationality.js';

// Maps detailed_position_id → abbreviated label (Portuguese)
const DETAILED_LABELS = {
  1:'GOL', 2:'ZAG', 3:'LD', 4:'LE', 5:'VOL',
  6:'MEI', 7:'MAT', 8:'ME', 9:'MD', 10:'CA', 11:'PE', 12:'PD', 13:'2AT'
};

// Card border color keyed to basic position_id
// 1=GK(blue), 2=DEF(green), 3=MID(green), 4=ATT(red)
const BORDER_COLORS = {
  1: '#3b82f6',
  2: '#22c55e',
  3: '#22c55e',
  4: '#ef4444',
};

// Attribute row config: [label, color, valueKey]
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

function AttrRow({ label, color, value, maxValue }) {
  const pct = maxValue > 0 ? Math.min((value / maxValue) * 100, 100) : 0;
  return (
    <div style={{ display:'flex', alignItems:'center', gap:4 }}>
      <span style={{
        fontSize:13, fontWeight:800, textTransform:'uppercase',
        width:34, flexShrink:0, color
      }}>{label}</span>
      <div style={{
        flex:1, height:4, background:'rgba(255,255,255,0.08)',
        borderRadius:2, overflow:'hidden'
      }}>
        <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:2 }} />
      </div>
      <span style={{ fontSize:13, fontWeight:900, width:32, textAlign:'right', color }}>
        {Number.isFinite(value) ? value.toFixed(1) : '0.0'}
      </span>
    </div>
  );
}

export default function DraftPlayerCard({ player, onClick, isMyTurn }) {
  const isGoalkeeper = player.detailed_position_id === 1;
  const attrs = isGoalkeeper ? GOALKEEPER_ATTRS : OUTFIELD_ATTRS;
  const borderColor = BORDER_COLORS[player.position_id] || '#6b7280';
  const iso2 = nationalityToIso2(player.nationality || '');
  const displayName = player.display_name || player.name;
  const altPositions = [...new Set((player.alt_positions || []))].slice(0, 2);
  const avgScore = (player.avg_score || 0).toFixed(1);
  const avgMinutes = Math.round(player.avg_minutes || 0);
  const primaryColor = player.primary_color || '#1a1a1a';
  // secondary_color stripe pattern deferred from MVP — only solid fill for now

  return (
    <button
      onClick={isMyTurn ? onClick : undefined}
      disabled={!isMyTurn}
      style={{
        width: 210,
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
        height: 120,
        background: '#1a2234',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Jersey — centered, bottom-aligned */}
        <div style={{
          position:'absolute', inset:0,
          display:'flex', alignItems:'flex-end', justifyContent:'center'
        }}>
          <svg viewBox="0 0 120 95" width={108} fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 4px 14px rgba(0,0,0,0.7))' }}>
            <defs>
              <clipPath id={`jersey-${player.id}`}>
                <path d="M38 6 C36 6 24 9 6 20 L13 46 C19 40 25 38 30 38 L30 95 L90 95 L90 38 C95 38 101 40 107 46 L114 20 C96 9 84 6 82 6 C80 1 74 0 74 3 Q60 13 46 3 C46 0 40 1 38 6 Z"/>
              </clipPath>
            </defs>
            <g clipPath={`url(#jersey-${player.id})`}>
              <rect x="0" y="0" width="120" height="95" fill={primaryColor}/>
            </g>
          </svg>
        </div>

        {/* Top-left: score */}
        <div style={{ position:'absolute', top:9, left:11 }}>
          <div style={{ fontSize:26, fontWeight:800, color:'#fbbf24', lineHeight:1.05 }}>
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
            <div style={{ fontSize:14, fontWeight:700, color:'#d1d5db', lineHeight:1 }}>
              {avgMinutes}'
            </div>
            <div style={{ fontSize:8, color:'#6b7280' }}>méd. min.</div>
            <div style={{ fontSize:14, fontWeight:700, color:'#d1d5db', lineHeight:1, marginTop:4 }}>
              {player.matches_played ?? 0}
            </div>
            <div style={{ fontSize:8, color:'#6b7280' }}>partidas</div>
          </div>
          {iso2 && (
            <span
              className={`fi fi-${iso2}`}
              style={{ display:'inline-block', width:28, height:20, borderRadius:3, boxShadow:'0 1px 4px rgba(0,0,0,0.5)' }}
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
          <span style={{ fontSize:20, fontWeight:900, color:'#f9fafb', lineHeight:1, letterSpacing:'0.5px', marginTop:1 }}>
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
        padding:'8px 12px 17px',
        display:'flex', flexDirection:'column', gap:8,
      }}>
        {/* Player name */}
        <div style={{
          fontSize:15, fontWeight:800, color:'#f9fafb',
          textTransform:'uppercase', letterSpacing:'0.5px', textAlign:'center',
          whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
          paddingBottom:8, borderBottom:'1px solid rgba(255,255,255,0.08)'
        }}>
          {displayName}
        </div>

        {/* Attribute grid — 3×2 */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px 10px' }}>
          {attrs.map(([label, color, key]) => (
            <AttrRow key={label} label={label} color={color} value={player[key] || 0} maxValue={player.avg_score} />
          ))}
        </div>
      </div>
    </button>
  );
}
