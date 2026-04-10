import React from 'react';
import { API_URL } from '../config.js';

const fmt = v => (v == null ? '—' : v);
const fmtF = v => (v == null ? '—' : Number(v).toFixed(1));

const SCORE_COLS = [
  ['Score', 'score_total', '#fbbf24'],
  ['ATA', 'score_ataque', '#f87171'],
  ['COM', 'score_comportamento', '#fbbf24'],
  ['CRI', 'score_criacao', '#a78bfa'],
  ['DEF', 'score_defesa', '#4ade80'],
  ['PAS', 'score_passes', '#60a5fa'],
  ['FIS', 'score_fisico', '#22d3ee'],
  ['GOL', 'score_goleiro', '#3b82f6'],
];

const STAT_COLS = [
  ['Min', 'minutes_played'],
  ['Gols', 'goals'],
  ['Ast', 'assists'],
  ['Chutes', 'shots_total'],
  ['No alvo', 'shots_on_target'],
  ['Passes', 'passes'],
  ['Passes certos', 'accurate_passes'],
  ['% Passes', 'accurate_passes_pct'],
  ['Passes chave', 'key_passes'],
  ['Cruzamentos', 'total_crosses'],
  ['Cruzamentos certos', 'accurate_crosses'],
  ['Dribles tent.', 'dribble_attempts'],
  ['Dribles certos', 'successful_dribbles'],
  ['Duelos ganhos', 'duels_won'],
  ['Duelos perdidos', 'duels_lost'],
  ['Aéreos ganhos', 'aerials_won'],
  ['Desarmes', 'tackles'],
  ['Desarmes certos', 'tackles_won'],
  ['Interceptações', 'interceptions'],
  ['Cortes', 'clearances'],
  ['Chances criadas', 'big_chances_created'],
  ['Chances perdidas', 'big_chances_missed'],
  ['Recuperações', 'ball_recovery'],
  ['Posse perdida', 'possession_lost'],
  ['Toques', 'touches'],
  ['Faltas cometidas', 'fouls'],
  ['Faltas sofridas', 'fouls_drawn'],
  ['Amarelos', 'yellowcards'],
  ['Vermelhos', 'redcards'],
  ['Defesas (GK)', 'saves'],
  ['Gols sofridos (GK)', 'goals_conceded'],
  ['Pens. marcados', 'penalties_scored'],
  ['Pens. perdidos', 'penalties_missed'],
  ['Pens. conquistados', 'penalties_won'],
];

export default function PlayerStatsModal({ player, onClose }) {
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const token = localStorage.getItem('draft_token');
    fetch(`${API_URL}/admin/players/${player.id}/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => { setRows(data.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [player.id]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', flexDirection: 'column',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: '#111827', margin: 'auto',
        borderRadius: 16, overflow: 'hidden',
        width: '95vw', maxWidth: 1100, maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#f9fafb', textTransform: 'uppercase' }}>
              {player.display_name || player.name}
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
              {player.team_short_code} · Stats por rodada
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: 22, cursor: 'pointer', padding: 4 }}
          >✕</button>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ color: '#6b7280', padding: 32, textAlign: 'center' }}>Carregando...</div>
          ) : rows.length === 0 ? (
            <div style={{ color: '#6b7280', padding: 32, textAlign: 'center' }}>Nenhum dado encontrado.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, whiteSpace: 'nowrap' }}>
              <thead>
                <tr style={{ background: '#1f2937', position: 'sticky', top: 0, zIndex: 1 }}>
                  <th style={thStyle}>Rodada</th>
                  {SCORE_COLS.map(([label,, color]) => (
                    <th key={label} style={{ ...thStyle, color }}>{label}</th>
                  ))}
                  {STAT_COLS.map(([label]) => (
                    <th key={label} style={thStyle}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#111827' : '#1a2234' }}>
                    <td style={{ ...tdStyle, fontWeight: 700, color: '#f9fafb' }}>
                      R{row.round_number}
                    </td>
                    {SCORE_COLS.map(([, key, color]) => (
                      <td key={key} style={{ ...tdStyle, color, fontWeight: 600 }}>
                        {fmtF(row[key])}
                      </td>
                    ))}
                    {STAT_COLS.map(([, key]) => (
                      <td key={key} style={tdStyle}>{fmt(row[key])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

const thStyle = {
  padding: '8px 10px', textAlign: 'right', color: '#9ca3af',
  fontWeight: 700, textTransform: 'uppercase', fontSize: 10,
  borderBottom: '1px solid rgba(255,255,255,0.08)',
};
const tdStyle = {
  padding: '6px 10px', textAlign: 'right', color: '#d1d5db',
  borderBottom: '1px solid rgba(255,255,255,0.04)',
};
