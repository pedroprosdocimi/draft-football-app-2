import React from 'react';
import { API_URL } from '../config.js';

const CATEGORY_META = {
  ataque:        { label: 'Ataque',         color: '#f87171' },
  comportamento: { label: 'Comportamento',  color: '#fbbf24' },
  criacao:       { label: 'Criação',        color: '#a78bfa' },
  defesa:        { label: 'Defesa',         color: '#4ade80' },
  passes:        { label: 'Passes',         color: '#60a5fa' },
  fisico:        { label: 'Físico',         color: '#22d3ee' },
  goleiro:       { label: 'Goleiro',        color: '#3b82f6' },
};

const CATEGORY_ORDER = ['ataque', 'comportamento', 'criacao', 'defesa', 'passes', 'fisico', 'goleiro'];

const CATEGORY_SCORE_KEY = {
  ataque:        'score_ataque',
  comportamento: 'score_comportamento',
  criacao:       'score_criacao',
  defesa:        'score_defesa',
  passes:        'score_passes',
  fisico:        'score_fisico',
  goleiro:       'score_goleiro',
};

const STAT_LABELS = {
  goals: 'Gols', assists: 'Assistências', shots_total: 'Chutes',
  shots_on_target: 'Chutes no alvo', shots_off_target: 'Chutes fora',
  shots_blocked: 'Chutes bloqueados', big_chances_created: 'Grandes chances criadas',
  big_chances_missed: 'Grandes chances perdidas', expected_goals: 'xG',
  expected_goals_on_target: 'xGOT', shooting_performance: 'Perf. finalização',
  penalties_scored: 'Pênaltis marcados', penalties_missed: 'Pênaltis perdidos',
  penalties_won: 'Pênaltis conquistados', key_passes: 'Passes-chave',
  passes_in_final_third: 'Passes no terço final', total_crosses: 'Cruzamentos',
  accurate_crosses: 'Cruzamentos certos', accurate_crosses_pct: '% Cruzamentos',
  passes: 'Passes', accurate_passes: 'Passes certos', accurate_passes_pct: '% Passes',
  backward_passes: 'Passes para trás', long_balls: 'Bolas longas',
  long_balls_won: 'Bolas longas certas', long_balls_won_pct: '% Bolas longas',
  tackles: 'Desarmes', tackles_won: 'Desarmes certos', tackles_won_pct: '% Desarmes',
  tackles_missed: 'Desarmes errados', interceptions: 'Interceptações',
  clearances: 'Cortes', blocked_shots: 'Chutes bloqueados',
  goals_conceded: 'Gols sofridos', dribbled_past: 'Dribles sofridos',
  duels_won: 'Duelos ganhos', duels_lost: 'Duelos perdidos',
  duels_won_pct: '% Duelos ganhos', total_duels: 'Duelos totais',
  dribble_attempts: 'Dribles tentados', successful_dribbles: 'Dribles certos',
  ball_recovery: 'Recuperações', possession_lost: 'Posse perdida',
  dispossessed: 'Desarme sofrido', touches: 'Toques',
  aerials: 'Duelos aéreos', aerials_won: 'Aéreos ganhos',
  aerials_lost: 'Aéreos perdidos', aerials_won_pct: '% Aéreos',
  saves: 'Defesas', saves_insidebox: 'Defesas (área)',
  goalkeeper_goals_conceded: 'Gols sofridos (GK)', penalties_saved: 'Pênaltis defendidos',
  punches: 'Socos', yellowcards: 'Amarelos', redcards: 'Vermelhos',
  yellowred_cards: 'Amarelo-vermelho', fouls: 'Faltas cometidas',
  fouls_drawn: 'Faltas sofridas', penalties_committed: 'Pênaltis cometidos',
  offsides: 'Impedimentos', is_captain: 'Capitão',
};

// Stats where contribution is penalizing (raw value is positive but pts negative)
const NEGATIVE_STATS = new Set([
  'big_chances_missed','penalties_missed','tackles_missed','goals_conceded',
  'dribbled_past','duels_lost','aerials_lost','goalkeeper_goals_conceded',
  'yellowcards','redcards','yellowred_cards','fouls','penalties_committed',
  'offsides','possession_lost','dispossessed',
]);

function fmtRaw(v) {
  if (v == null) return '—';
  if (v % 1 === 0) return String(Math.round(v));
  return v.toFixed(2);
}

function fmtPts(v) {
  if (v == null) return '—';
  const s = v.toFixed(2);
  return v > 0 ? `+${s}` : s;
}

function groupByRound(data) {
  const rounds = {};
  for (const row of data) {
    const rn = row.round_number;
    if (!rounds[rn]) {
      rounds[rn] = {
        round_number: rn,
        round_name: row.round_name,
        minutes_played: row.minutes_played,
        score_total: row.score_total,
        score_ataque: row.score_ataque,
        score_comportamento: row.score_comportamento,
        score_criacao: row.score_criacao,
        score_defesa: row.score_defesa,
        score_passes: row.score_passes,
        score_fisico: row.score_fisico,
        score_goleiro: row.score_goleiro,
        byCategory: {},
      };
    }
    const cat = row.category;
    if (!rounds[rn].byCategory[cat]) rounds[rn].byCategory[cat] = [];
    rounds[rn].byCategory[cat].push(row);
  }
  return rounds;
}

function CategoryBlock({ catKey, stats, roundData }) {
  const meta = CATEGORY_META[catKey] || { label: catKey, color: '#9ca3af' };
  const scoreKey = CATEGORY_SCORE_KEY[catKey];
  const catScore = roundData[scoreKey];
  const catTotal = stats.reduce((s, r) => s + (r.contribution || 0), 0);

  return (
    <div style={{ marginBottom: 12 }}>
      {/* Category header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 12px',
        background: `${meta.color}18`,
        borderLeft: `3px solid ${meta.color}`,
        borderRadius: '0 6px 6px 0',
        marginBottom: 2,
      }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: meta.color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {meta.label}
        </span>
        <span style={{ fontSize: 13, fontWeight: 800, color: meta.color }}>
          {catScore != null ? (catScore >= 0 ? `+${catScore.toFixed(2)}` : catScore.toFixed(2)) : catTotal.toFixed(2)}
        </span>
      </div>

      {/* Stat rows */}
      <div style={{ background: '#0f172a', borderRadius: '0 0 6px 6px', overflow: 'hidden' }}>
        {/* Column headers */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 52px 44px 44px 60px',
          padding: '4px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          {['Stat','Valor','SW','Pos','Pts'].map(h => (
            <span key={h} style={{ fontSize: 9, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', textAlign: h === 'Stat' ? 'left' : 'right' }}>{h}</span>
          ))}
        </div>

        {stats.map((row, i) => {
          const isNeg = NEGATIVE_STATS.has(row.stat_name);
          const pts = row.contribution || 0;
          const ptsColor = pts > 0.001 ? '#4ade80' : pts < -0.001 ? '#f87171' : '#6b7280';
          return (
            <div key={row.stat_name} style={{
              display: 'grid', gridTemplateColumns: '1fr 52px 44px 44px 60px',
              padding: '5px 10px',
              background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
              alignItems: 'center',
            }}>
              <span style={{ fontSize: 11, color: '#d1d5db', display: 'flex', alignItems: 'center', gap: 4 }}>
                {isNeg && <span style={{ color: '#f87171', fontSize: 9 }}>▼</span>}
                {STAT_LABELS[row.stat_name] || row.stat_name}
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#f9fafb', textAlign: 'right' }}>
                {fmtRaw(row.raw_value)}
              </span>
              <span style={{ fontSize: 11, color: '#6b7280', textAlign: 'right' }}>
                {row.stat_weight.toFixed(1)}
              </span>
              <span style={{ fontSize: 11, color: '#6b7280', textAlign: 'right' }}>
                {row.position_weight.toFixed(2)}
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: ptsColor, textAlign: 'right' }}>
                {fmtPts(pts)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function PlayerStatsModal({ player, onClose }) {
  const [data, setData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedRound, setSelectedRound] = React.useState(null);

  React.useEffect(() => {
    const token = localStorage.getItem('draft_token');
    fetch(`${API_URL}/admin/players/${player.id}/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        const rows = d.data || [];
        setData(rows);
        if (rows.length > 0) {
          // default to last round
          const maxRound = Math.max(...rows.map(r => r.round_number));
          setSelectedRound(maxRound);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [player.id]);

  const rounds = React.useMemo(() => groupByRound(data), [data]);
  const roundNumbers = Object.keys(rounds).map(Number).sort((a, b) => a - b);
  const currentRound = rounds[selectedRound];

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.88)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        overflowY: 'auto',
        padding: '16px 8px 32px',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div style={{
        width: '100%', maxWidth: 480,
        background: '#111827',
        borderRadius: 16,
        boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '14px 16px 10px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          gap: 12,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#f9fafb', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {player.display_name || player.name}
            </div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
              {player.team_short_code}
            </div>
          </div>

          {/* Round dropdown */}
          <select
            value={selectedRound ?? ''}
            onChange={e => setSelectedRound(Number(e.target.value))}
            style={{
              background: '#1f2937', color: '#f9fafb', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8, padding: '6px 10px', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', flexShrink: 0,
            }}
          >
            {roundNumbers.map(rn => (
              <option key={rn} value={rn}>Rodada {rn}</option>
            ))}
          </select>

          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: 20, cursor: 'pointer', padding: '2px 4px', flexShrink: 0, lineHeight: 1 }}
          >✕</button>
        </div>

        {/* Content */}
        <div style={{ padding: '12px 12px 16px', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ color: '#6b7280', padding: 32, textAlign: 'center' }}>Carregando...</div>
          ) : data.length === 0 ? (
            <div style={{ color: '#6b7280', padding: 32, textAlign: 'center' }}>Nenhum dado encontrado.</div>
          ) : currentRound ? (
            <>
              {/* Round summary */}
              <div style={{
                display: 'flex', gap: 8, marginBottom: 14,
                background: '#1f2937', borderRadius: 10, padding: '10px 14px',
                alignItems: 'center',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>Minutos</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#f9fafb' }}>
                    {currentRound.minutes_played ?? '—'}
                  </div>
                </div>
                <div style={{ width: 1, background: 'rgba(255,255,255,0.08)', alignSelf: 'stretch' }} />
                <div style={{ flex: 1, textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>Score total</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#fbbf24', lineHeight: 1.1 }}>
                    {currentRound.score_total != null ? currentRound.score_total.toFixed(2) : '—'}
                  </div>
                </div>
              </div>

              {/* Category legend */}
              <div style={{ fontSize: 10, color: '#4b5563', marginBottom: 8, paddingLeft: 2 }}>
                SW = peso do stat &nbsp;·&nbsp; Pos = peso da posição &nbsp;·&nbsp; Pts = contribuição
              </div>

              {/* Categories */}
              {CATEGORY_ORDER.map(cat => {
                const stats = currentRound.byCategory[cat];
                if (!stats || stats.length === 0) return null;
                return <CategoryBlock key={cat} catKey={cat} stats={stats} roundData={currentRound} />;
              })}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
