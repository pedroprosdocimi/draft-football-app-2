import React from 'react';
import { API_URL } from '../config.js';
import DraftPlayerCard from './DraftPlayerCard.jsx';

const CATEGORY_META = {
  ataque:        { label: 'Ataque',        color: '#f87171' },
  comportamento: { label: 'Comportamento', color: '#fbbf24' },
  criacao:       { label: 'Criação',       color: '#a78bfa' },
  defesa:        { label: 'Defesa',        color: '#4ade80' },
  passes:        { label: 'Passes',        color: '#60a5fa' },
  fisico:        { label: 'Físico',        color: '#22d3ee' },
  goleiro:       { label: 'Goleiro',       color: '#3b82f6' },
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
  shots_blocked: 'Chutes bloq.', big_chances_created: 'Chances criadas',
  big_chances_missed: 'Chances perdidas', expected_goals: 'xG',
  expected_goals_on_target: 'xGOT', shooting_performance: 'Perf. finalização',
  penalties_scored: 'Pênaltis marcados', penalties_missed: 'Pênaltis perdidos',
  penalties_won: 'Pênaltis conquistados', key_passes: 'Passes-chave',
  passes_in_final_third: 'Passes terço final', total_crosses: 'Cruzamentos',
  accurate_crosses: 'Cruzamentos certos', accurate_crosses_pct: '% Cruzamentos',
  passes: 'Passes', accurate_passes: 'Passes certos', accurate_passes_pct: '% Passes',
  backward_passes: 'Passes para trás', long_balls: 'Bolas longas',
  long_balls_won: 'Bolas longas certas', long_balls_won_pct: '% Bolas longas',
  tackles: 'Desarmes', tackles_won: 'Desarmes certos', tackles_won_pct: '% Desarmes',
  tackles_missed: 'Desarmes errados', interceptions: 'Interceptações',
  clearances: 'Cortes', blocked_shots: 'Chutes bloqueados',
  goals_conceded: 'Gols sofridos', dribbled_past: 'Dribles sofridos',
  duels_won: 'Duelos ganhos', duels_lost: 'Duelos perdidos',
  duels_won_pct: '% Duelos', total_duels: 'Duelos totais',
  dribble_attempts: 'Dribles tent.', successful_dribbles: 'Dribles certos',
  ball_recovery: 'Recuperações', possession_lost: 'Posse perdida',
  dispossessed: 'Desarme sofrido', touches: 'Toques',
  aerials: 'Duelos aéreos', aerials_won: 'Aéreos ganhos',
  aerials_lost: 'Aéreos perdidos', aerials_won_pct: '% Aéreos',
  saves: 'Defesas', saves_insidebox: 'Defesas (área)',
  goalkeeper_goals_conceded: 'Gols sofridos (GK)', penalties_saved: 'Pênaltis def.',
  punches: 'Socos', yellowcards: 'Amarelos', redcards: 'Vermelhos',
  yellowred_cards: 'Amarelo-vermelho', fouls: 'Faltas cometidas',
  fouls_drawn: 'Faltas sofridas', penalties_committed: 'Pênaltis cometidos',
  offsides: 'Impedimentos', is_captain: 'Capitão',
};

const NEGATIVE_STATS = new Set([
  'big_chances_missed','penalties_missed','tackles_missed','goals_conceded',
  'dribbled_past','duels_lost','aerials_lost','goalkeeper_goals_conceded',
  'yellowcards','redcards','yellowred_cards','fouls','penalties_committed',
  'offsides','possession_lost','dispossessed',
]);

function fmtRaw(v) {
  if (v == null || v === undefined) return '—';
  return v % 1 === 0 ? String(Math.round(v)) : v.toFixed(2);
}

function fmtPts(v) {
  if (v == null || v === undefined) return '—';
  const s = Math.abs(v).toFixed(2);
  return v >= 0 ? `+${s}` : `−${s}`;
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
  const catScore = roundData[CATEGORY_SCORE_KEY[catKey]];
  const displayScore = catScore != null ? catScore : stats.reduce((s, r) => s + (r.contribution || 0), 0);

  return (
    <div style={{ marginBottom: 8 }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 12px',
        background: `${meta.color}18`,
        borderLeft: `3px solid ${meta.color}`,
      }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: meta.color, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          {meta.label}
        </span>
        <span style={{ fontSize: 13, fontWeight: 800, color: meta.color }}>
          {displayScore >= 0 ? `+${displayScore.toFixed(2)}` : displayScore.toFixed(2)}
        </span>
      </div>

      {/* Column labels */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 48px 38px 40px 56px',
        padding: '3px 12px',
        background: '#0c1322',
      }}>
        {['Estatística', 'Valor', 'SW', 'Pos', 'Pts'].map((h, i) => (
          <span key={h} style={{
            fontSize: 9, fontWeight: 700, color: '#374151', textTransform: 'uppercase',
            textAlign: i === 0 ? 'left' : 'right',
          }}>{h}</span>
        ))}
      </div>

      {/* Rows */}
      {stats.map((row, i) => {
        const isNeg = NEGATIVE_STATS.has(row.stat_name);
        const pts = row.contribution || 0;
        const ptsColor = pts > 0.001 ? '#4ade80' : pts < -0.001 ? '#f87171' : '#4b5563';
        return (
          <div key={row.stat_name} style={{
            display: 'grid', gridTemplateColumns: '1fr 48px 38px 40px 56px',
            padding: '5px 12px',
            background: i % 2 === 0 ? '#0f172a' : '#0c1322',
            alignItems: 'center',
          }}>
            <span style={{ fontSize: 11, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 3, minWidth: 0 }}>
              {isNeg && <span style={{ color: '#f87171', fontSize: 8, flexShrink: 0 }}>▼</span>}
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {STAT_LABELS[row.stat_name] || row.stat_name}
              </span>
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#f9fafb', textAlign: 'right' }}>
              {fmtRaw(row.raw_value)}
            </span>
            <span style={{ fontSize: 11, color: '#4b5563', textAlign: 'right' }}>
              {row.stat_weight.toFixed(1)}
            </span>
            <span style={{ fontSize: 11, color: '#4b5563', textAlign: 'right' }}>
              {row.position_weight.toFixed(2)}
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: ptsColor, textAlign: 'right' }}>
              {fmtPts(pts)}
            </span>
          </div>
        );
      })}
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
          setSelectedRound(Math.max(...rows.map(r => r.round_number)));
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
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div style={{
        width: '100%', maxWidth: 520,
        maxHeight: '90vh',
        background: '#111827',
        borderRadius: 16,
        boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Close row */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 12px 0', flexShrink: 0 }}>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.07)', border: 'none',
              color: '#9ca3af', fontSize: 16, cursor: 'pointer',
              borderRadius: 8, width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >✕</button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: 'auto', padding: '8px 16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Card */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <DraftPlayerCard player={player} isMyTurn={false} />
          </div>

          {/* Round dropdown */}
          <select
            value={selectedRound ?? ''}
            onChange={e => setSelectedRound(Number(e.target.value))}
            style={{
              width: '100%',
              background: '#1f2937', color: '#f9fafb',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10, padding: '10px 14px',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
              appearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath fill='%236b7280' d='M5 7L0 2h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 14px center',
              paddingRight: 38,
            }}
          >
            {roundNumbers.map(rn => (
              <option key={rn} value={rn}>Rodada {rn}</option>
            ))}
          </select>

          {/* Breakdown */}
          {loading ? (
            <div style={{ color: '#4b5563', textAlign: 'center', padding: 24 }}>Carregando...</div>
          ) : data.length === 0 ? (
            <div style={{ color: '#4b5563', textAlign: 'center', padding: 24 }}>Nenhum dado encontrado.</div>
          ) : currentRound ? (
            <div style={{ background: '#0f172a', borderRadius: 12, overflow: 'hidden' }}>
              {/* Round header */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 14px',
                background: '#1a2234',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div>
                  <div style={{ fontSize: 9, color: '#4b5563', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Minutos</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#f9fafb' }}>{currentRound.minutes_played ?? '—'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 9, color: '#4b5563', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Score total</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#fbbf24', lineHeight: 1.1 }}>
                    {currentRound.score_total != null ? currentRound.score_total.toFixed(2) : '—'}
                  </div>
                </div>
              </div>

              {/* Hint */}
              <div style={{ fontSize: 9, color: '#374151', padding: '4px 12px', textAlign: 'right', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                SW = peso do stat · Pos = peso da posição · Pts = pontos
              </div>

              {/* Categories */}
              <div style={{ paddingTop: 6, paddingBottom: 4 }}>
                {CATEGORY_ORDER.map(cat => {
                  const stats = currentRound.byCategory[cat];
                  if (!stats || stats.length === 0) return null;
                  return <CategoryBlock key={cat} catKey={cat} stats={stats} roundData={currentRound} />;
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
