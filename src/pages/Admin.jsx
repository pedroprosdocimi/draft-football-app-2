import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { API_URL } from '../config.js';
import DraftHistory from '../components/DraftHistory.jsx';

const POS_LABELS = { 1: 'GOL', 2: 'LAT', 3: 'ZAG', 4: 'MEI', 5: 'ATA' };
const POS_ORDER = [1, 2, 3, 4, 5];
const POS_SORT = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 };
const POS_COLORS = {
  1: 'bg-blue-700', 2: 'bg-green-700', 3: 'bg-green-700',
  4: 'bg-yellow-600', 5: 'bg-red-600',
};

const STAT_LABELS = {
  aerials:                  'Disputas aéreas',
  aerials_lost:             'Disputas aéreas perdidas',
  aerials_won:              'Disputas aéreas ganhas',
  aerials_won_pct:          '% Disputas aéreas ganhas',
  assists:                  'Assistências',
  accurate_crosses:         'Cruzamentos certos',
  accurate_crosses_pct:     '% Cruzamentos certos',
  accurate_passes:          'Passes certos',
  accurate_passes_pct:      '% Passes certos',
  backward_passes:          'Passes para trás',
  ball_recovery:            'Recuperações de bola',
  big_chances_created:      'Grandes chances criadas',
  big_chances_missed:       'Grandes chances perdidas',
  blocked_shots:            'Chutes bloqueados (def.)',
  clearances:               'Cortes',
  dispossessed:             'Perdas de posse',
  dribble_attempts:         'Tentativas de drible',
  dribbled_past:            'Driblado',
  duels_lost:               'Duelos perdidos',
  duels_won:                'Duelos ganhos',
  duels_won_pct:            '% Duelos ganhos',
  expected_goals:           'Gols esperados (xG)',
  expected_goals_on_target: 'xG no alvo',
  fouls:                    'Faltas cometidas',
  fouls_drawn:              'Faltas sofridas',
  goalkeeper_goals_conceded:'Gols sofridos (goleiro)',
  goals:                    'Gols',
  goals_conceded:           'Gols sofridos',
  interceptions:            'Interceptações',
  is_captain:               'É capitão',
  key_passes:               'Passes decisivos',
  long_balls:               'Bolas longas',
  long_balls_won:           'Bolas longas ganhas',
  long_balls_won_pct:       '% Bolas longas ganhas',
  minutes_played:           'Minutos jogados',
  offsides:                 'Impedimentos',
  passes:                   'Passes',
  passes_in_final_third:    'Passes no terço final',
  penalties_committed:      'Pênaltis cometidos',
  penalties_missed:         'Pênaltis perdidos',
  penalties_saved:          'Pênaltis defendidos',
  penalties_scored:         'Pênaltis convertidos',
  penalties_won:            'Pênaltis conquistados',
  possession_lost:          'Posse perdida',
  punches:                  'Socos (goleiro)',
  rating:                   'Nota',
  redcards:                 'Cartões vermelhos',
  saves:                    'Defesas',
  saves_insidebox:          'Defesas dentro da área',
  shooting_performance:     'Desempenho no chute',
  shots_blocked:            'Chutes bloqueados (ata.)',
  shots_off_target:         'Chutes fora do alvo',
  shots_on_target:          'Chutes no alvo',
  shots_total:              'Chutes totais',
  successful_dribbles:      'Dribles bem-sucedidos',
  tackles:                  'Desarmes',
  tackles_won:              'Desarmes certos',
  tackles_won_pct:          '% Desarmes certos',
  total_crosses:            'Cruzamentos totais',
  total_duels:              'Duelos totais',
  touches:                  'Toques na bola',
  yellowcards:              'Cartões amarelos',
  yellowred_cards:          'Cartão amarelo-vermelho',
};

const STAT_COLS = [
  'minutes_played','rating','is_captain',
  'goals','assists',
  'shots_total','shots_on_target','shots_off_target','shots_blocked',
  'big_chances_created','big_chances_missed',
  'expected_goals','expected_goals_on_target','shooting_performance',
  'dribble_attempts','successful_dribbles','dribbled_past','dispossessed',
  'total_crosses','accurate_crosses','accurate_crosses_pct',
  'passes','accurate_passes','accurate_passes_pct','key_passes',
  'long_balls','long_balls_won','long_balls_won_pct',
  'passes_in_final_third','backward_passes',
  'total_duels','duels_won','duels_lost','duels_won_pct',
  'aerials','aerials_won','aerials_lost','aerials_won_pct',
  'tackles','tackles_won','tackles_won_pct',
  'interceptions','clearances','blocked_shots',
  'fouls','fouls_drawn',
  'touches','ball_recovery','possession_lost',
  'saves','saves_insidebox','goals_conceded','goalkeeper_goals_conceded',
  'penalties_saved','punches',
  'penalties_scored','penalties_missed','penalties_committed','penalties_won',
  'yellowcards','redcards','yellowred_cards','offsides',
];

const DETAILED_POSITIONS_FILTER = [
  { id: 1,  label: 'Goleiro' },
  { id: 2,  label: 'Zagueiro Central' },
  { id: 3,  label: 'Lateral Direito' },
  { id: 4,  label: 'Lateral Esquerdo' },
  { id: 5,  label: 'Volante' },
  { id: 6,  label: 'Meio-campista Central' },
  { id: 7,  label: 'Meia Atacante' },
  { id: 8,  label: 'Meia Esquerda' },
  { id: 9,  label: 'Meia Direita' },
  { id: 10, label: 'Centroavante' },
  { id: 11, label: 'Ponta Esquerda' },
  { id: 12, label: 'Ponta Direita' },
  { id: 13, label: 'Segundo Atacante' },
];

function fmtStat(key, value) {
  if (value === null || value === undefined) return '—';
  if (key === 'is_captain') return value ? '✓' : '—';
  if (key === 'rating') return Number(value).toFixed(2);
  if (key.endsWith('_pct')) return `${Number(value).toFixed(1)}%`;
  if (key.startsWith('expected_') || key === 'shooting_performance') return Number(value).toFixed(3);
  return value;
}

const STATUS_INFO = {
  7: { label: 'Provável',   bg: 'bg-green-900/40',  text: 'text-green-300'  },
  2: { label: 'Dúvida',     bg: 'bg-yellow-900/40', text: 'text-yellow-300' },
  3: { label: 'Suspenso',   bg: 'bg-red-900/40',    text: 'text-red-300'    },
  5: { label: 'Contundido', bg: 'bg-orange-900/40', text: 'text-orange-300' },
  6: { label: 'Nulo',       bg: 'bg-gray-800',      text: 'text-gray-500'   },
};

// Status options for the "não cotados" table (excludes Provável)
const OUTROS_STATUS_ORDER = [2, 5, 3, 6];

function sortByPos(list, getEligible) {
  return [...list].sort((a, b) => {
    const pa = POS_SORT[a.position_id] ?? 9;
    const pb = POS_SORT[b.position_id] ?? 9;
    if (pa !== pb) return pa - pb;
    if (getEligible) {
      const ea = getEligible(a) ? 0 : 1;
      const eb = getEligible(b) ? 0 : 1;
      if (ea !== eb) return ea - eb;
    }
    return (b.average_score || 0) - (a.average_score || 0);
  });
}

function StatusBadge({ statusId }) {
  const info = STATUS_INFO[statusId];
  if (!info) return null;
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded ${info.bg} ${info.text} font-medium flex-shrink-0`}>
      {info.label}
    </span>
  );
}

function scoreColor(score) {
  if (score >= 6) return 'text-green-400';
  if (score >= 3) return 'text-draft-gold';
  return 'text-red-400';
}

// Grid template: photo | name | pos | status | rd×N | avg | action
function colTemplate(nRounds) {
  return `36px minmax(120px, 220px) 50px 90px repeat(${nRounds}, 54px) 54px 90px`;
}

const STATUS_SORT_ORDER = { 7: 0, 2: 1, 5: 2, 3: 3, 6: 4 };

function applySort(list, { col, dir }) {
  if (!col) return list;
  return [...list].sort((a, b) => {
    if (col === 'name') return dir * (a.nickname || '').localeCompare(b.nickname || '');
    let va, vb;
    if (col === 'position') {
      va = POS_SORT[a.position_id] ?? 9;
      vb = POS_SORT[b.position_id] ?? 9;
    } else if (col === 'status') {
      va = STATUS_SORT_ORDER[a.status_id] ?? 9;
      vb = STATUS_SORT_ORDER[b.status_id] ?? 9;
    } else if (col === 'avg') {
      va = a.average_score || 0;
      vb = b.average_score || 0;
    } else if (col.startsWith('round_')) {
      const round = Number(col.slice(6));
      va = a.recentScores?.find(s => s.round === round)?.score ?? 0;
      vb = b.recentScores?.find(s => s.round === round)?.score ?? 0;
    } else {
      return 0;
    }
    return dir * (va > vb ? 1 : va < vb ? -1 : 0);
  });
}

function SortTh({ col, children, sort, onSort, defaultDir = 1, align = 'center' }) {
  const active = sort.col === col;
  return (
    <button
      type="button"
      onClick={() => onSort({ col, dir: active ? -sort.dir : defaultDir })}
      className={`w-full text-${align} text-xs font-semibold uppercase tracking-wide cursor-pointer select-none transition-colors hover:text-gray-200 ${active ? 'text-white' : 'text-gray-500'}`}
    >
      {children}
      <span className="ml-0.5 opacity-60">{active ? (sort.dir === 1 ? '↑' : '↓') : ''}</span>
    </button>
  );
}

function RoundsHeader({ recentRounds, sort, onSort }) {
  return (
    <div
      className="grid items-center gap-x-2 px-3 py-1.5 border-b border-gray-700"
      style={{ gridTemplateColumns: colTemplate(recentRounds.length) }}
    >
      <div />
      <SortTh col="name" sort={sort} onSort={onSort} defaultDir={1} align="left">Jogador</SortTh>
      <SortTh col="position" sort={sort} onSort={onSort} defaultDir={1}>Pos</SortTh>
      <SortTh col="status" sort={sort} onSort={onSort} defaultDir={1}>Status</SortTh>
      {recentRounds.map(r => (
        <SortTh key={r} col={`round_${r}`} sort={sort} onSort={onSort} defaultDir={-1}>Rd {r}</SortTh>
      ))}
      <SortTh col="avg" sort={sort} onSort={onSort} defaultDir={-1}>Méd</SortTh>
      <div />
    </div>
  );
}

function PlayerRow({ player, match, action, recentRounds = [] }) {
  const posColor = POS_COLORS[player.position_id] || 'bg-gray-600';
  return (
    <div
      className="grid items-center gap-x-2 px-3 py-2 hover:bg-gray-800/50 rounded-lg border-b border-gray-800/40 last:border-0"
      style={{ gridTemplateColumns: colTemplate(recentRounds.length) }}
    >
      {/* Photo */}
      <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden">
        {player.photo
          ? <img src={player.photo} alt={player.nickname} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">?</div>}
      </div>

      {/* Name + club + match */}
      <div className="min-w-0 pl-1">
        <div className="font-medium text-sm text-white truncate">{player.nickname}</div>
        <div className="text-xs text-gray-500 truncate">
          {player.club?.abbreviation || `Clube ${player.club_id}`}
          {match && <span className="text-gray-600 ml-1">· {match}</span>}
        </div>
      </div>

      {/* Position */}
      <div className="flex justify-center">
        <span className={`${posColor} text-white text-xs font-bold px-1.5 py-0.5 rounded`}>
          {POS_LABELS[player.position_id]}
        </span>
      </div>

      {/* Status */}
      <div className="flex justify-center">
        <StatusBadge statusId={player.status_id} />
      </div>

      {/* Last N rounds */}
      {recentRounds.map(round => {
        const s = player.recentScores?.find(e => e.round === round);
        const score = s?.score ?? 0;
        return (
          <div key={round} className={`text-center text-sm font-semibold ${scoreColor(score)}`}>
            {score.toFixed(1)}
          </div>
        );
      })}

      {/* Average */}
      <div className="text-center text-sm text-gray-400 font-medium">
        {(player.average_score || 0).toFixed(1)}
      </div>

      {/* Action */}
      <div className="flex justify-center">{action}</div>
    </div>
  );
}

const PAGE_SIZE = 10;

function Pagination({ page, total, onChange }) {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  if (totalPages <= 1) return null;
  const start = page * PAGE_SIZE + 1;
  const end = Math.min((page + 1) * PAGE_SIZE, total);
  return (
    <div className="flex items-center justify-between px-3 pt-2 pb-1 border-t border-gray-800 mt-1">
      <span className="text-xs text-gray-600">{start}–{end} de {total}</span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(0)}
          disabled={page === 0}
          className="px-1.5 py-1 text-xs text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >«</button>
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 0}
          className="px-2 py-1 text-xs text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >‹</button>
        <span className="text-xs text-gray-400 px-2 font-medium">{page + 1} / {totalPages}</span>
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages - 1}
          className="px-2 py-1 text-xs text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >›</button>
        <button
          onClick={() => onChange(totalPages - 1)}
          disabled={page >= totalPages - 1}
          className="px-1.5 py-1 text-xs text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >»</button>
      </div>
    </div>
  );
}

// Reusable position tab row
function PosFilter({ value, onChange, players, countStatus }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-0.5">
      <button
        onClick={() => onChange(0)}
        className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
          value === 0 ? 'bg-draft-green text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
        }`}
      >
        Todas pos.
      </button>
      {POS_ORDER.map(id => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            value === id ? 'bg-draft-green text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          {POS_LABELS[id]}
          <span className="ml-1 opacity-50">
            ({players.filter(p => p.position_id === id && (countStatus == null || p.status_id === countStatus)).length})
          </span>
        </button>
      ))}
    </div>
  );
}

// Reusable club dropdown
function ClubSelect({ value, onChange, clubs }) {
  return (
    <select
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      className="bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-draft-green cursor-pointer"
    >
      <option value={0}>Todos os times</option>
      {clubs.map(c => (
        <option key={c.id} value={c.id}>
          {c.name && c.name !== c.abbreviation ? `${c.abbreviation} — ${c.name}` : c.abbreviation}
        </option>
      ))}
    </select>
  );
}

export default function Admin({ onBack }) {
  const [players, setPlayers] = useState([]);
  const [clubMatches, setClubMatches] = useState({});
  const [syncStatus, setSyncStatus] = useState(null);
  const [eligibleIds, setEligibleIds] = useState(new Set());
  const [excludedIds, setExcludedIds] = useState(new Set()); // prováveis excluídos manualmente do pool

  // Table 1 (titulares) filters + sort + page
  const [tPos, setTPos] = useState(0);
  const [tClub, setTClub] = useState(0);
  const [tSort, setTSort] = useState({ col: 'position', dir: 1 });
  const [tPage, setTPage] = useState(0);

  // Table 2 (outros) filters + sort + page
  const [oPos, setOPos] = useState(0);
  const [oStatus, setOStatus] = useState(0);
  const [oClub, setOClub] = useState(0);
  const [oSort, setOSort] = useState({ col: 'position', dir: 1 });
  const [oPage, setOPage] = useState(0);

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncingScores, setSyncingScores] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [error, setError] = useState(null);
  const [syncResult, setSyncResult] = useState(null);
  const [scoreSyncResult, setScoreSyncResult] = useState(null);

  // Users / coins management
  const [users, setUsers] = useState([]);
  const [coinDelta, setCoinDelta] = useState({});
  const [adjustingUserId, setAdjustingUserId] = useState(null);
  const [coinError, setCoinError] = useState(null);

  // Coin transactions history
  const [coinTx, setCoinTx] = useState([]);
  const [coinTxLoading, setCoinTxLoading] = useState(false);
  const [coinTxFilter, setCoinTxFilter] = useState(0); // 0 = todos, userId = filtro

  // Active round control
  const [rounds, setRounds] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [activeRoundId, setActiveRoundId] = useState('');
  const [roundMsg, setRoundMsg] = useState(null);
  const [loadingRound, setLoadingRound] = useState(false);

  // Position stat weights
  const [posStatPosId, setPosStatPosId] = useState('');
  const [posStatWeights, setPosStatWeights] = useState({});   // { stat_name: weight }
  const [posStatMsg, setPosStatMsg] = useState(null);
  const [savingPosStats, setSavingPosStats] = useState(false);
  const [loadingPosStats, setLoadingPosStats] = useState(false);

  // Stat weights
  const [statWeights, setStatWeights] = useState([]);
  const [statWeightMsg, setStatWeightMsg] = useState(null);
  const [savingWeights, setSavingWeights] = useState(false);

  // Player stats viewer
  const [statsSeasons, setStatsSeasons] = useState([]);
  const [statsRounds, setStatsRounds] = useState([]);
  const [statsRoundId, setStatsRoundId] = useState('');
  const [statsTeams, setStatsTeams] = useState([]);
  const [statsTeamId, setStatsTeamId] = useState('');
  const [statsPosId, setStatsPosId] = useState('');
  const [playerStats, setPlayerStats] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [statsOnlyPlayed, setStatsOnlyPlayed] = useState(false);
  const [statsSort, setStatsSort] = useState({ col: null, dir: 1 });
  const statsTopScrollRef = useRef(null);
  const statsTableScrollRef = useRef(null);
  const [manageStatsOpen, setManageStatsOpen] = useState(false);
  const [statWeightsOpen, setStatWeightsOpen] = useState(false);
  const [scoreTooltip, setScoreTooltip] = useState(null);

  const token = localStorage.getItem('draft_token');
  const headers = { Authorization: `Bearer ${token}` };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [playersRes, statusRes, eligibleRes, usersRes] = await Promise.all([
        fetch(`${API_URL}/api/players`, { headers }),
        fetch(`${API_URL}/api/sync/status`, { headers }),
        fetch(`${API_URL}/api/admin/eligible`, { headers }),
        fetch(`${API_URL}/api/admin/users`, { headers }),
      ]);
      const playersData = await playersRes.json();
      const statusData = await statusRes.json();
      const eligibleData = await eligibleRes.json();
      const usersData = await usersRes.json();

      if (playersData.players) setPlayers(playersData.players);
      if (playersData.clubMatches) setClubMatches(playersData.clubMatches);
      if (statusData.ok !== false) setSyncStatus(statusData);
      if (eligibleData.eligible) setEligibleIds(new Set(eligibleData.eligible));
      if (usersData.users) setUsers(usersData.users);
    } catch {
      setError('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadData(); }, [loadData]);

  const loadCoinTransactions = useCallback(async (userId = 0) => {
    setCoinTxLoading(true);
    try {
      const url = userId
        ? `${API_URL}/api/admin/coin-transactions?user_id=${userId}`
        : `${API_URL}/api/admin/coin-transactions`;
      const res = await fetch(url, { headers });
      const data = await res.json();
      if (data.transactions) setCoinTx(data.transactions);
    } catch {
      // silently fail
    } finally {
      setCoinTxLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadCoinTransactions(coinTxFilter); }, [coinTxFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAdjustCoins = async (userId, delta) => {
    if (!delta || delta === 0) return;
    setAdjustingUserId(userId);
    setCoinError(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}/coins`, {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta })
      });
      const data = await res.json();
      if (data.ok) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, coins: data.coins } : u));
        setCoinDelta(prev => ({ ...prev, [userId]: 0 }));
        loadCoinTransactions(coinTxFilter);
      } else {
        setCoinError(data.error || 'Erro ao ajustar moedas.');
      }
    } catch {
      setCoinError('Erro de conexão.');
    } finally {
      setAdjustingUserId(null);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/sync`, { method: 'POST', headers });
      const data = await res.json();
      if (data.ok) {
        setSyncResult(data);
        await loadData();
      } else {
        setError(data.error || 'Erro no sync.');
      }
    } catch {
      setError('Erro de conexão.');
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncScores = async () => {
    setSyncingScores(true);
    setScoreSyncResult(null);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/sync/scores`, { method: 'POST', headers });
      const data = await res.json();
      if (data.ok) {
        setScoreSyncResult(data);
      } else {
        setError(data.error || 'Erro ao buscar pontuações.');
      }
    } catch {
      setError('Erro de conexão.');
    } finally {
      setSyncingScores(false);
    }
  };

  const handleToggleEligible = async (playerId) => {
    setTogglingId(playerId);
    const isEligible = eligibleIds.has(playerId);
    try {
      const res = await fetch(`${API_URL}/api/admin/eligible/${playerId}`, {
        method: isEligible ? 'DELETE' : 'POST',
        headers,
      });
      if (res.ok) {
        setEligibleIds(prev => {
          const next = new Set(prev);
          isEligible ? next.delete(playerId) : next.add(playerId);
          return next;
        });
      }
    } catch {
      setError('Erro ao atualizar jogador.');
    } finally {
      setTogglingId(null);
    }
  };

  const handleRemoveFromPool = (playerId) => {
    if (eligibleIds.has(playerId)) {
      handleToggleEligible(playerId); // remove from eligible list (persisted)
    } else {
      setExcludedIds(prev => new Set([...prev, playerId])); // exclude probable locally
    }
  };

  const handleRestoreToPool = (playerId) => {
    setExcludedIds(prev => { const next = new Set(prev); next.delete(playerId); return next; });
  };

  // Top 3 most recent round numbers across all players
  const recentRounds = useMemo(() => {
    const roundSet = new Set();
    for (const p of players) {
      for (const s of p.recentScores || []) roundSet.add(s.round);
    }
    return [...roundSet].sort((a, b) => b - a).slice(0, 3);
  }, [players]);

  // Clubs list sorted alphabetically
  const clubs = useMemo(() => {
    const seen = new Set();
    return players
      .map(p => p.club)
      .filter(c => c && !seen.has(c.id) && seen.add(c.id))
      .sort((a, b) => (a.abbreviation || '').localeCompare(b.abbreviation || ''));
  }, [players]);

  // Table 1: pool do draft = prováveis (status_id=7) + adicionados manualmente, exceto excluídos
  const poolDraft = useMemo(() => {
    const list = players
      .filter(p => (p.status_id === 7 || eligibleIds.has(p.player_id)) && !excludedIds.has(p.player_id))
      .filter(p => tPos === 0  || p.position_id === tPos)
      .filter(p => tClub === 0 || p.club_id === tClub);
    return applySort(list, tSort);
  }, [players, eligibleIds, excludedIds, tPos, tClub, tSort]);

  // Club counts for the pool draft sidebar (respects tPos + tClub filters)
  // Shows ALL clubs (even those with 0 after filtering)
  const clubCounts = useMemo(() => {
    const countMap = {};
    for (const p of poolDraft) {
      countMap[p.club_id] = (countMap[p.club_id] || 0) + 1;
    }
    return clubs
      .map(c => ({ name: c.name || c.abbreviation, count: countMap[c.id] || 0 }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [poolDraft, clubs]);

  // Table 2: não cotados que ainda NÃO foram adicionados ao pool (+ prováveis excluídos manualmente)
  const outros = useMemo(() => {
    const list = players
      .filter(p => (p.status_id !== 7 || excludedIds.has(p.player_id)) && !eligibleIds.has(p.player_id))
      .filter(p => oPos === 0    || p.position_id === oPos)
      .filter(p => oStatus === 0 || p.status_id === oStatus)
      .filter(p => oClub === 0   || p.club_id === oClub);
    return applySort(list, oSort);
  }, [players, eligibleIds, excludedIds, oPos, oStatus, oClub, oSort]);

  useEffect(() => {
    const token = localStorage.getItem('draft_token');
    fetch(`${API_URL}/admin/seasons`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setSeasons(data.data || []));
  }, []);

  // Reset pages when filters or sort change
  useEffect(() => { setTPage(0); }, [tPos, tClub, tSort, eligibleIds, excludedIds]);
  useEffect(() => { setOPage(0); }, [oPos, oStatus, oClub, oSort, eligibleIds, excludedIds]);

  const loadRounds = (seasonId) => {
    const token = localStorage.getItem('draft_token');
    fetch(`${API_URL}/admin/rounds?season_id=${seasonId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setRounds(data.data || []));
  };

  const handleSetActiveRound = async () => {
    if (!activeRoundId) return;
    setLoadingRound(true);
    setRoundMsg(null);
    const token = localStorage.getItem('draft_token');
    try {
      const res = await fetch(`${API_URL}/admin/config/active-round`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ round_id: activeRoundId }),
      });
      const data = await res.json();
      setRoundMsg(res.ok ? '✅ Rodada ativa definida!' : `❌ ${data.error}`);
    } catch {
      setRoundMsg('❌ Erro de conexão');
    } finally {
      setLoadingRound(false);
    }
  };

  const [allPosStatWeights, setAllPosStatWeights] = useState({}); // { detailedPosId: { stat_name: weight } }

  useEffect(() => {
    const token = localStorage.getItem('draft_token');
    const authHeaders = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${API_URL}/admin/seasons`, { headers: authHeaders }).then(r => r.json()),
      fetch(`${API_URL}/admin/teams`, { headers: authHeaders }).then(r => r.json()),
      fetch(`${API_URL}/admin/position-stat-weights`, { headers: authHeaders }).then(r => r.json()),
    ]).then(([seasonsData, teamsData, posWeightsData]) => {
      setStatsSeasons(seasonsData.data || []);
      setStatsTeams(teamsData.data || []);
      // Build lookup: { detailedPosId: { stat_name: weight } }
      const map = {};
      for (const w of (posWeightsData.data || [])) {
        if (!map[w.detailed_position_id]) map[w.detailed_position_id] = {};
        map[w.detailed_position_id][w.stat_name] = w.weight;
      }
      setAllPosStatWeights(map);
    });
  }, []);

  const loadStatsRounds = (seasonId) => {
    const token = localStorage.getItem('draft_token');
    fetch(`${API_URL}/admin/rounds?season_id=${seasonId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        const sorted = (data.data || []).slice().sort((a, b) => a.number - b.number);
        setStatsRounds(sorted);
        setStatsRoundId('');
      });
  };

  const handleLoadPlayerStats = async () => {
    if (!statsRoundId) return;
    setLoadingStats(true);
    setPlayerStats([]);
    const token = localStorage.getItem('draft_token');
    const params = new URLSearchParams({ round_id: statsRoundId });
    if (statsTeamId) params.set('team_id', statsTeamId);
    if (statsPosId) params.set('detailed_position_id', statsPosId);
    try {
      const res = await fetch(`${API_URL}/admin/player-stats?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setPlayerStats(data.data || []);
    } catch {
      // silently fail
    } finally {
      setLoadingStats(false);
    }
  };

  const loadPosStatWeights = async (posId) => {
    if (!posId) return;
    setLoadingPosStats(true);
    setPosStatMsg(null);
    const token = localStorage.getItem('draft_token');
    try {
      const res = await fetch(`${API_URL}/admin/position-stat-weights?detailed_position_id=${posId}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      const map = {};
      for (const w of (data.data || [])) map[w.stat_name] = w.weight;
      setPosStatWeights(map);
    } finally {
      setLoadingPosStats(false);
    }
  };

  const handleSavePosStatWeights = async () => {
    if (!posStatPosId) return;
    setSavingPosStats(true);
    setPosStatMsg(null);
    const token = localStorage.getItem('draft_token');
    try {
      const body = STAT_COLS.map(stat => ({ detailed_position_id: Number(posStatPosId), stat_name: stat, weight: posStatWeights[stat] ?? 100 }));
      const res = await fetch(`${API_URL}/admin/position-stat-weights`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setPosStatMsg(res.ok ? '✅ Pesos salvos!' : `❌ ${data.error}`);
    } catch {
      setPosStatMsg('❌ Erro de conexão');
    } finally {
      setSavingPosStats(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('draft_token');
    fetch(`${API_URL}/admin/stat-weights`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setStatWeights(data.data || []));
  }, []);

  const handleSaveWeights = async () => {
    setSavingWeights(true);
    setStatWeightMsg(null);
    const token = localStorage.getItem('draft_token');
    try {
      const body = statWeights.map(w => ({ stat_name: w.stat_name, weight: w.weight, enabled: w.enabled, active: w.active, category: w.category || 'outro' }));
      const res = await fetch(`${API_URL}/admin/stat-weights`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setStatWeightMsg(res.ok ? '✅ Pesos salvos!' : `❌ ${data.error}`);
    } catch {
      setStatWeightMsg('❌ Erro de conexão');
    } finally {
      setSavingWeights(false);
    }
  };

  return (
    <div className="min-h-screen p-4 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pt-4">
        <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors text-sm">
          ← Voltar
        </button>
        <h1 className="text-xl font-bold text-white">Painel Admin</h1>
      </div>

      {/* Active round control */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">🔵 Rodada Ativa do Draft</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Temporada</label>
            <select className="input-field" onChange={e => loadRounds(e.target.value)}>
              <option value="">Selecionar...</option>
              {seasons.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.year})</option>
              ))}
            </select>
          </div>
          {rounds.length > 0 && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">Rodada</label>
              <select className="input-field" value={activeRoundId} onChange={e => setActiveRoundId(e.target.value)}>
                <option value="">Selecionar...</option>
                {rounds.map(r => (
                  <option key={r.id} value={r.id}>{r.name} (#{r.number})</option>
                ))}
              </select>
            </div>
          )}
          <button onClick={handleSetActiveRound} disabled={!activeRoundId || loadingRound}
            className="btn-primary w-full disabled:opacity-40">
            {loadingRound ? 'Salvando...' : 'Definir Rodada Ativa'}
          </button>
          {roundMsg && <p className="text-sm mt-2">{roundMsg}</p>}
        </div>
      </div>

      {/* Stat management table */}
      {statWeights.length > 0 && (() => {
        const CATEGORY_OPTIONS = [
          { value: 'ataque',        label: '⚔️ Ataque'        },
          { value: 'criacao',       label: '🎨 Criação'       },
          { value: 'defesa',        label: '🛡️ Defesa'        },
          { value: 'fisico',        label: '💪 Físico'        },
          { value: 'goleiro',       label: '🧤 Goleiro'       },
          { value: 'comportamento', label: '🟨 Comportamento' },
          { value: 'outro',         label: '📋 Outro'         },
        ];
        const handleStatField = (idx, field, value) =>
          setStatWeights(prev => prev.map((x, i) => i === idx ? { ...x, [field]: value } : x));

        return (
          <div className="card mb-6 overflow-hidden">
            <div className="flex items-center justify-between cursor-pointer select-none" onClick={() => setManageStatsOpen(o => !o)}>
              <h2 className="text-lg font-semibold text-white">📋 Gerenciar Estatísticas</h2>
              <span className="text-gray-400 text-sm">{manageStatsOpen ? '▲' : '▼'}</span>
            </div>
            {manageStatsOpen && <>
            <div className="flex items-center justify-between mt-3 mb-3">
              <div />
              <button onClick={e => { e.stopPropagation(); handleSaveWeights(); }} disabled={savingWeights} className="btn-primary disabled:opacity-40 text-sm px-4 py-1.5">
                {savingWeights ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
            {statWeightMsg && <p className="text-sm mb-3">{statWeightMsg}</p>}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b border-gray-800">
                    <th className="pb-2 pr-4 font-medium">Estatística</th>
                    <th className="pb-2 pr-3 font-medium w-36">Tipo</th>
                    <th className="pb-2 font-medium w-32">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/40">
                  {statWeights.map((w, i) => (
                    <tr key={w.stat_name} className="hover:bg-gray-800/30">
                      <td className="py-1.5 pr-4 text-gray-300">{STAT_LABELS[w.stat_name] || w.stat_name}</td>
                      <td className="py-1.5 pr-3">
                        <select
                          value={w.category || 'outro'}
                          onChange={e => handleStatField(i, 'category', e.target.value)}
                          className="w-full bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded px-2 py-1 focus:outline-none focus:border-draft-green cursor-pointer"
                        >
                          {CATEGORY_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-1.5">
                        <select
                          value={w.active ? 'ativo' : 'inativo'}
                          onChange={e => handleStatField(i, 'active', e.target.value === 'ativo')}
                          className={`w-full bg-gray-800 border text-xs rounded px-2 py-1 focus:outline-none cursor-pointer ${w.active ? 'border-green-700 text-green-400' : 'border-gray-700 text-gray-500'}`}
                        >
                          <option value="ativo">✅ Ativo</option>
                          <option value="inativo">⛔ Inativo</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>}
          </div>
        );
      })()}

      {/* Stat weights */}
      <div className="card mb-6">
        <div className="flex items-center justify-between cursor-pointer select-none" onClick={() => setStatWeightsOpen(o => !o)}>
          <h2 className="text-lg font-semibold text-white">⚖️ Pesos das Estatísticas</h2>
          <span className="text-gray-400 text-sm">{statWeightsOpen ? '▲' : '▼'}</span>
        </div>
        {statWeightsOpen && (statWeights.length === 0 ? (
          <p className="text-gray-600 text-sm mt-4">Carregando...</p>
        ) : (() => {
          const CATEGORY_LABELS = {
            ataque:       { label: '⚔️ Ataque',      color: 'text-red-400',    border: 'border-red-900/50'    },
            criacao:      { label: '🎨 Criação',     color: 'text-blue-400',   border: 'border-blue-900/50'   },
            defesa:       { label: '🛡️ Defesa',      color: 'text-green-400',  border: 'border-green-900/50'  },
            fisico:       { label: '💪 Físico',      color: 'text-yellow-400', border: 'border-yellow-900/50' },
            goleiro:      { label: '🧤 Goleiro',     color: 'text-cyan-400',   border: 'border-cyan-900/50'   },
            comportamento:{ label: '🟨 Comportamento',color: 'text-orange-400', border: 'border-orange-900/50' },
            outro:        { label: '📋 Outro',       color: 'text-gray-400',   border: 'border-gray-700'      },
          };
          const ORDER = ['ataque','criacao','defesa','fisico','goleiro','comportamento','outro'];
          const grouped = {};
          statWeights.forEach((w, i) => {
            if (!w.active) return;
            const cat = w.category || 'outro';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push({ ...w, _idx: i });
          });
          return (
            <>
              {ORDER.filter(cat => grouped[cat]?.length).map(cat => {
                const info = CATEGORY_LABELS[cat];
                return (
                  <div key={cat} className="mb-5">
                    <h3 className={`text-sm font-bold ${info.color} mb-2 pb-1 border-b ${info.border}`}>{info.label}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                      {grouped[cat].map(w => (
                        <div key={w.stat_name} className="flex items-center gap-3 py-1 border-b border-gray-800/30">
                          <input type="checkbox" checked={w.enabled}
                            onChange={e => setStatWeights(prev => prev.map((x, j) => j === w._idx ? { ...x, enabled: e.target.checked } : x))}
                            className="accent-draft-green w-4 h-4 flex-shrink-0 cursor-pointer"
                          />
                          <span className={`flex-1 text-sm truncate ${w.enabled ? 'text-white' : 'text-gray-500'}`}>
                            {STAT_LABELS[w.stat_name] || w.stat_name}
                          </span>
                          <input type="number" step="0.1"
                            value={Number(w.weight).toFixed(1)}
                            onChange={e => setStatWeights(prev => prev.map((x, j) => j === w._idx ? { ...x, weight: Math.round(parseFloat(e.target.value) * 10) / 10 || 0 } : x))}
                            className="w-20 bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded px-2 py-1 focus:outline-none focus:border-draft-green font-mono text-center"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              <button onClick={handleSaveWeights} disabled={savingWeights} className="btn-primary w-full disabled:opacity-40 mt-2">
                {savingWeights ? 'Salvando...' : 'Salvar Pesos'}
              </button>
              {statWeightMsg && <p className="text-sm mt-2">{statWeightMsg}</p>}
            </>
          );
        })())}
      </div>

      {/* Position stat weights */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">🎯 Pontuação por Posição</h2>
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-1">Posição Detalhada</label>
          <select className="input-field" value={posStatPosId} onChange={e => { setPosStatPosId(e.target.value); loadPosStatWeights(e.target.value); }}>
            <option value="">Selecionar...</option>
            {DETAILED_POSITIONS_FILTER.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </div>

        {posStatPosId && (
          loadingPosStats ? (
            <p className="text-gray-600 text-sm">Carregando...</p>
          ) : (
            <>
              {(() => {
                const CATEGORY_LABELS = {
                  ataque:       { label: '⚔️ Ataque',       color: 'text-red-400',    border: 'border-red-900/50'    },
                  criacao:      { label: '🎨 Criação',      color: 'text-blue-400',   border: 'border-blue-900/50'   },
                  defesa:       { label: '🛡️ Defesa',       color: 'text-green-400',  border: 'border-green-900/50'  },
                  fisico:       { label: '💪 Físico',       color: 'text-yellow-400', border: 'border-yellow-900/50' },
                  goleiro:      { label: '🧤 Goleiro',      color: 'text-cyan-400',   border: 'border-cyan-900/50'   },
                  comportamento:{ label: '🟨 Comportamento', color: 'text-orange-400', border: 'border-orange-900/50' },
                  outro:        { label: '📋 Outro',        color: 'text-gray-400',   border: 'border-gray-700'      },
                };
                const ORDER = ['ataque','criacao','defesa','fisico','goleiro','comportamento','outro'];
                const grouped = {};
                statWeights.forEach(w => {
                  if (!w.active) return;
                  const cat = w.category || 'outro';
                  if (!grouped[cat]) grouped[cat] = [];
                  grouped[cat].push(w.stat_name);
                });
                return ORDER.filter(cat => grouped[cat]?.length).map(cat => {
                  const info = CATEGORY_LABELS[cat];
                  return (
                    <div key={cat} className="mb-4">
                      <h3 className={`text-sm font-bold ${info.color} mb-2 pb-1 border-b ${info.border}`}>{info.label}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                        {grouped[cat].map(stat => (
                          <div key={stat} className="flex items-center gap-3 py-1 border-b border-gray-800/30">
                            <span className="flex-1 text-sm text-white truncate">{STAT_LABELS[stat] || stat}</span>
                            <input
                              type="number"
                              step="0.1"
                              value={Number(posStatWeights[stat] ?? 100).toFixed(1)}
                              onChange={e => setPosStatWeights(prev => ({ ...prev, [stat]: Math.round(parseFloat(e.target.value) * 10) / 10 || 0 }))}
                              className="w-20 bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded px-2 py-1 focus:outline-none focus:border-draft-green font-mono text-center"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                });
              })()}
              <button onClick={handleSavePosStatWeights} disabled={savingPosStats} className="btn-primary w-full disabled:opacity-40">
                {savingPosStats ? 'Salvando...' : 'Salvar Pontuação da Posição'}
              </button>
              {posStatMsg && <p className="text-sm mt-2">{posStatMsg}</p>}
            </>
          )
        )}
      </div>

      {/* Player stats viewer */}
      <div className="card mb-6 overflow-hidden">
        <h2 className="text-lg font-semibold text-white mb-4">📊 Estatísticas dos Jogadores</h2>

        {/* Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Temporada</label>
            <select className="input-field text-sm" onChange={e => loadStatsRounds(e.target.value)}>
              <option value="">Selecionar...</option>
              {statsSeasons.map(s => <option key={s.id} value={s.id}>{s.name} ({s.year})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Rodada</label>
            <select className="input-field text-sm" value={statsRoundId} onChange={e => setStatsRoundId(e.target.value)} disabled={statsRounds.length === 0}>
              <option value="">Selecionar...</option>
              {statsRounds.map(r => <option key={r.id} value={r.id}>{r.name} (#{r.number})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Time</label>
            <select className="input-field text-sm" value={statsTeamId} onChange={e => setStatsTeamId(e.target.value)}>
              <option value="">Todos</option>
              {statsTeams.map(t => <option key={t.id} value={t.id}>{t.short_code} — {t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Posição Detalhada</label>
            <select className="input-field text-sm" value={statsPosId} onChange={e => setStatsPosId(e.target.value)}>
              <option value="">Todas</option>
              {DETAILED_POSITIONS_FILTER.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>
        </div>

        <label className="flex items-center gap-2 mb-4 cursor-pointer w-fit">
          <input type="checkbox" checked={statsOnlyPlayed} onChange={e => setStatsOnlyPlayed(e.target.checked)} className="accent-draft-green w-4 h-4" />
          <span className="text-sm text-gray-300">Apenas jogadores com minutos jogados</span>
        </label>

        <button onClick={handleLoadPlayerStats} disabled={!statsRoundId || loadingStats} className="btn-primary mb-4 disabled:opacity-40">
          {loadingStats ? 'Carregando...' : 'Buscar Estatísticas'}
        </button>

        {playerStats.length > 0 && (() => {
          // Build stat weight lookup: { stat_name: { weight, enabled } }
          const swMap = {};
          for (const w of statWeights) swMap[w.stat_name] = w;
          const activeStatCols = STAT_COLS.filter(s => swMap[s]?.active === true);
          const nonEmptyCols = activeStatCols.filter(col =>
            playerStats.some(p => p[col] != null)
          );

          const calcScore = (p) => {
            const posWeights = allPosStatWeights[p.detailed_position_id] || {};
            let total = 0;
            const breakdown = [];
            for (const stat of STAT_COLS) {
              const val = p[stat];
              if (val == null) continue;
              const sw = swMap[stat];
              if (!sw || !sw.enabled) continue;
              const numVal = stat === 'is_captain' ? (val ? 1 : 0) : Number(val);
              const posW = (posWeights[stat] ?? 100) / 100;
              const contribution = numVal * sw.weight * posW;
              if (contribution !== 0) breakdown.push({ stat, numVal, weight: sw.weight, posW, contribution });
              total += contribution;
            }
            breakdown.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
            return { total, breakdown };
          };

          const TEXT_COLS = new Set(['display_name', 'team_short_code', 'position_name']);
          const handleStatsSort = (col) => setStatsSort(prev => ({ col, dir: prev.col === col ? -prev.dir : 1 }));
          const sortIndicator = (col) => statsSort.col === col ? (statsSort.dir === 1 ? ' ↑' : ' ↓') : '';

          let visibleStats = playerStats
            .filter(p => !statsOnlyPlayed || (p.minutes_played != null && p.minutes_played > 0))
            .map(p => { const { total, breakdown } = calcScore(p); return { ...p, _score: total, _breakdown: breakdown }; });
          if (statsSort.col) {
            const col = statsSort.col;
            const dir = statsSort.dir;
            visibleStats = [...visibleStats].sort((a, b) => {
              const va = col === '_score' ? a._score : (a[col] ?? (TEXT_COLS.has(col) ? '' : -Infinity));
              const vb = col === '_score' ? b._score : (b[col] ?? (TEXT_COLS.has(col) ? '' : -Infinity));
              if (TEXT_COLS.has(col)) return dir * String(va).localeCompare(String(vb));
              return dir * (Number(va) - Number(vb));
            });
          }

          const syncFromTop = () => { if (statsTableScrollRef.current) statsTableScrollRef.current.scrollLeft = statsTopScrollRef.current.scrollLeft; };
          const syncFromTable = () => { if (statsTopScrollRef.current) statsTopScrollRef.current.scrollLeft = statsTableScrollRef.current.scrollLeft; };
          return (
            <>
              {/* Top scrollbar */}
              <div ref={statsTopScrollRef} onScroll={syncFromTop} className="overflow-x-auto rounded-t-lg border-x border-t border-gray-800" style={{ overflowY: 'hidden', height: 16 }}>
                <div style={{ width: statsTableScrollRef.current?.scrollWidth || 9999, height: 1 }} />
              </div>
              {/* Table */}
              <div ref={statsTableScrollRef} onScroll={syncFromTable} className="overflow-x-auto rounded-b-lg border border-gray-800">
                <table className="text-xs whitespace-nowrap">
                  <thead className="bg-gray-900 sticky top-0">
                    <tr>
                      <th onClick={() => handleStatsSort('display_name')} className="sticky left-0 z-10 bg-gray-900 px-3 py-2 text-left font-semibold text-gray-300 border-r border-gray-700 min-w-[160px] cursor-pointer hover:text-white select-none">
                        Jogador{sortIndicator('display_name')}
                      </th>
                      <th onClick={() => handleStatsSort('team_short_code')} className="sticky left-[160px] z-10 bg-gray-900 px-2 py-2 text-left font-semibold text-gray-300 border-r border-gray-700 cursor-pointer hover:text-white select-none whitespace-nowrap" style={{ minWidth: 56 }}>
                        Time{sortIndicator('team_short_code')}
                      </th>
                      <th onClick={() => handleStatsSort('_score')} className="sticky left-[216px] z-10 bg-gray-900 px-2 py-2 text-center font-semibold text-yellow-400 border-r border-gray-600 cursor-pointer hover:text-yellow-200 select-none whitespace-nowrap" style={{ minWidth: 72 }}>
                        Score{sortIndicator('_score')}
                      </th>
                      {nonEmptyCols.map(col => (
                        <th key={col} onClick={() => handleStatsSort(col)} className="px-2 py-2 text-center font-semibold text-gray-400 border-r border-gray-800/50 min-w-[60px] cursor-pointer hover:text-white select-none whitespace-nowrap">
                          {STAT_LABELS[col] || col}{sortIndicator(col)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50">
                    {visibleStats.map(p => (
                      <tr key={p.player_id} className="hover:bg-gray-800/40">
                        <td className="sticky left-0 z-10 bg-gray-900 px-3 py-2 font-medium text-white border-r border-gray-700">
                          {p.display_name}
                          <div className="text-gray-500 text-xs font-normal">{p.detailed_position_name}</div>
                        </td>
                        <td className="sticky left-[160px] z-10 bg-gray-900 px-2 py-2 text-gray-300 border-r border-gray-700" style={{ minWidth: 56 }}>{p.team_short_code}</td>
                        <td
                          className="sticky left-[216px] z-10 bg-gray-900 px-2 py-2 text-center font-bold text-yellow-400 border-r border-gray-600 cursor-default"
                          style={{ minWidth: 72 }}
                          onMouseEnter={e => p._breakdown.length > 0 && setScoreTooltip({ x: e.clientX, y: e.clientY, breakdown: p._breakdown })}
                          onMouseMove={e => scoreTooltip && setScoreTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)}
                          onMouseLeave={() => setScoreTooltip(null)}
                        >
                          {p._score.toFixed(2)}
                        </td>
                        {nonEmptyCols.map(col => (
                          <td key={col} className={`px-2 py-2 text-center border-r border-gray-800/50 ${p[col] !== null && p[col] !== undefined ? 'text-white' : 'text-gray-700'}`}>
                            {fmtStat(col, p[col])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          );
        })()}

        {scoreTooltip && (
          <div
            className="fixed z-[9999] bg-gray-950 border border-gray-700 rounded-lg shadow-xl p-3 min-w-[260px] max-h-72 overflow-y-auto pointer-events-none"
            style={{ top: scoreTooltip.y + 16, left: scoreTooltip.x + 60, fontSize: 11 }}
          >
            <div className="text-gray-400 font-semibold mb-2 text-xs">Extrato do Score</div>
            {scoreTooltip.breakdown.map(({ stat, numVal, weight, posW, contribution }) => (
              <div key={stat} className={`flex justify-between gap-4 py-0.5 border-b border-gray-800/40 ${contribution > 0 ? 'text-green-400' : 'text-red-400'}`}>
                <span className="truncate max-w-[140px] text-gray-300">{STAT_LABELS[stat] || stat}</span>
                <span className="font-mono whitespace-nowrap">{numVal} × {weight.toFixed(2)} × {(posW * 100).toFixed(0)}% = <span className="font-bold">{contribution.toFixed(2)}</span></span>
              </div>
            ))}
          </div>
        )}

        {!loadingStats && playerStats.length === 0 && statsRoundId && (
          <p className="text-gray-600 text-sm text-center py-4">Nenhum dado para os filtros selecionados.</p>
        )}
      </div>

      {/* Sync card */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="font-semibold text-gray-300 mb-2">Status do Banco</h2>
            {loading && players.length === 0 ? (
              <p className="text-gray-600 text-sm">Carregando...</p>
            ) : syncStatus?.playerCount > 0 ? (
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <span className="text-gray-400">
                  Rodada <span className="text-white font-bold">{syncStatus.debug?.latestRoundNumber ?? '–'}</span>
                </span>
                <span className="text-gray-400">
                  <span className="text-white font-bold">{syncStatus.playerCount}</span> jogadores
                </span>
                <span className="text-gray-400">
                  <span className="text-green-400 font-bold">{syncStatus.probableCount}</span> prováveis titulares
                </span>
                <span className="text-gray-400">
                  <span className="text-orange-400 font-bold">
                    {(syncStatus.playerCount || 0) - (syncStatus.probableCount || 0)}
                  </span> não cotados
                </span>
                <span className="text-gray-400">
                  <span className="text-blue-400 font-bold">{eligibleIds.size}</span> adicionados manualmente
                </span>
                <span className="text-gray-400">
                  <span className="text-white font-bold">{syncStatus.matchCount}</span> jogos na rodada
                </span>
              </div>
            ) : (
              <p className="text-gray-600 text-sm">Banco vazio — sincronize para importar os jogadores.</p>
            )}
            {syncResult && (
              <p className="mt-2 text-green-400 text-sm">
                ✓ Sync concluído — rodada {syncResult.roundNumber}, {syncResult.playerCount} jogadores, {syncResult.matchCount} partidas
              </p>
            )}
            {scoreSyncResult && (
              <p className="mt-2 text-blue-400 text-sm">
                ✓ Pontuações atualizadas — rodada {scoreSyncResult.roundNumber}, {scoreSyncResult.count} jogadores
              </p>
            )}
            {error && (
              <p className="mt-2 text-red-400 text-sm bg-red-900/20 border border-red-800 rounded px-3 py-1.5">
                {error}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2 flex-shrink-0">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="btn-primary flex items-center gap-2"
            >
              <span className={syncing ? 'animate-spin inline-block' : ''}>🔄</span>
              {syncing ? 'Sincronizando...' : 'Sincronizar Draft Football'}
            </button>
            <button
              onClick={handleSyncScores}
              disabled={syncingScores}
              className="flex items-center gap-2 justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-blue-900/40 text-blue-300 hover:bg-blue-900/60 border border-blue-700 disabled:opacity-50"
            >
              <span className={syncingScores ? 'animate-spin inline-block' : ''}>⚽</span>
              {syncingScores ? 'Buscando...' : 'Buscar Pontuações'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Gerenciamento de Usuários / Moedas ── */}
      <div className="card mb-6">
        <h2 className="font-semibold text-gray-300 mb-4 flex items-center gap-2">
          🪙 Usuários &amp; Moedas
        </h2>
        {coinError && (
          <p className="text-red-400 text-sm mb-3 bg-red-900/20 border border-red-800 rounded px-3 py-1.5">{coinError}</p>
        )}
        {users.length === 0 ? (
          <p className="text-gray-600 text-sm">Nenhum usuário encontrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-800">
                  <th className="pb-2 pr-4 font-medium">Usuário</th>
                  <th className="pb-2 pr-4 font-medium">Time</th>
                  <th className="pb-2 pr-4 font-medium text-center">Moedas</th>
                  <th className="pb-2 font-medium">Ajustar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {users.map(u => {
                  const delta = coinDelta[u.id] ?? 0;
                  return (
                    <tr key={u.id}>
                      <td className="py-2 pr-4">
                        <span className="text-white font-medium">{u.username}</span>
                        {u.is_admin && (
                          <span className="ml-1.5 text-xs text-draft-gold">admin</span>
                        )}
                      </td>
                      <td className="py-2 pr-4 text-gray-400">{u.nome_time}</td>
                      <td className="py-2 pr-4 text-center">
                        <span className="font-mono font-bold text-yellow-300">{u.coins}</span>
                      </td>
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={delta}
                            onChange={e => setCoinDelta(prev => ({ ...prev, [u.id]: parseInt(e.target.value) || 0 }))}
                            className="w-20 bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded px-2 py-1 focus:outline-none focus:border-draft-green font-mono text-center"
                            placeholder="0"
                          />
                          <button
                            onClick={() => handleAdjustCoins(u.id, delta)}
                            disabled={delta === 0 || adjustingUserId === u.id}
                            className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-40 border border-gray-700 hover:border-draft-green text-gray-400 hover:text-white"
                          >
                            {adjustingUserId === u.id ? '...' : delta >= 0 ? '+ Adicionar' : '− Remover'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Histórico de Transações de Moedas ── */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="font-semibold text-gray-300 flex items-center gap-2">
            📜 Histórico de Moedas
            <span className="text-xs text-gray-600 font-normal">({coinTx.length})</span>
          </h2>
          <div className="flex items-center gap-2">
            <select
              value={coinTxFilter}
              onChange={e => setCoinTxFilter(Number(e.target.value))}
              className="bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-draft-green"
            >
              <option value={0}>Todos os usuários</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.username}</option>
              ))}
            </select>
            <button
              onClick={() => loadCoinTransactions(coinTxFilter)}
              disabled={coinTxLoading}
              className="text-xs text-gray-500 hover:text-white border border-gray-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
            >
              {coinTxLoading ? '...' : '↻'}
            </button>
          </div>
        </div>

        {coinTxLoading && coinTx.length === 0 ? (
          <p className="text-gray-600 text-sm text-center py-4">Carregando...</p>
        ) : coinTx.length === 0 ? (
          <p className="text-gray-600 text-sm text-center py-4">Nenhuma transação registrada.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-800 text-xs">
                  <th className="pb-2 pr-3 font-medium">Data</th>
                  <th className="pb-2 pr-3 font-medium">Usuário</th>
                  <th className="pb-2 pr-3 font-medium">Descrição</th>
                  <th className="pb-2 pr-3 font-medium text-right">Valor</th>
                  <th className="pb-2 font-medium text-right">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40">
                {coinTx.map(tx => {
                  const isPositive = tx.amount > 0;
                  const date = new Date(tx.created_at);
                  const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
                  const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                  return (
                    <tr key={tx.id} className="hover:bg-gray-800/30">
                      <td className="py-2 pr-3 text-gray-500 whitespace-nowrap">
                        <div className="text-xs">{dateStr}</div>
                        <div className="text-xs text-gray-600">{timeStr}</div>
                      </td>
                      <td className="py-2 pr-3">
                        <div className="text-white font-medium text-xs">{tx.username}</div>
                        <div className="text-gray-600 text-xs">{tx.nome_time}</div>
                      </td>
                      <td className="py-2 pr-3 text-gray-400 text-xs">{tx.description}</td>
                      <td className={`py-2 pr-3 text-right font-mono font-bold text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                        {isPositive ? '+' : ''}{tx.amount} 🪙
                      </td>
                      <td className="py-2 text-right font-mono text-yellow-300 text-sm font-bold">
                        {tx.balance_after}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Historico de Drafts ── */}
      <div className="mb-6">
        <DraftHistory />
      </div>

      {loading && players.length === 0 ? (
        <div className="text-center py-16 text-gray-500">Carregando jogadores...</div>
      ) : players.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-2">Nenhum jogador no banco.</p>
          <p className="text-gray-600 text-sm">Clique em "Sincronizar Draft Football" para importar.</p>
        </div>
      ) : (
        <div className="space-y-6">

          {/* ── Tabela 1: Pool do Draft ── */}
          <div className="flex flex-col lg:flex-row gap-4 items-start">

            {/* Main table */}
            <div className="card flex-1 min-w-0">
              <h3 className="font-semibold text-green-400 mb-1 flex items-center gap-2">
                ✅ Pool do Draft
                <span className="text-xs text-gray-500 font-normal">({poolDraft.length})</span>
                {eligibleIds.size > 0 && (
                  <span className="text-xs text-blue-400 font-normal">
                    · {eligibleIds.size} adicionados manualmente
                  </span>
                )}
              </h3>
              <p className="text-xs text-gray-600 mb-3">
                Prováveis titulares + jogadores adicionados manualmente
              </p>

              {/* Filters */}
              <div className="space-y-2 mb-3">
                <PosFilter
                  value={tPos}
                  onChange={setTPos}
                  players={players.filter(p => p.status_id === 7 || eligibleIds.has(p.player_id))}
                  countStatus={null}
                />
                <div className="flex items-center gap-2">
                  <ClubSelect value={tClub} onChange={setTClub} clubs={clubs} />
                  {(tPos !== 0 || tClub !== 0) && (
                    <button
                      onClick={() => { setTPos(0); setTClub(0); }}
                      className="text-xs text-gray-600 hover:text-gray-300 underline transition-colors"
                    >
                      limpar
                    </button>
                  )}
                </div>
              </div>

              {poolDraft.length === 0 ? (
                <p className="text-gray-600 text-sm text-center py-4">Nenhum com os filtros atuais</p>
              ) : (
                <div className="overflow-x-auto">
                  <div style={{ minWidth: '620px' }}>
                    <RoundsHeader recentRounds={recentRounds} sort={tSort} onSort={setTSort} />
                    {poolDraft.slice(tPage * PAGE_SIZE, (tPage + 1) * PAGE_SIZE).map(p => {
                      const isManual = eligibleIds.has(p.player_id);
                      const isToggling = togglingId === p.player_id;
                      return (
                        <div
                          key={p.player_id}
                          className={isManual ? 'border-l-2 border-blue-500 rounded-r-lg' : ''}
                        >
                          <PlayerRow
                            player={p}
                            match={clubMatches[p.club_id] || clubMatches[String(p.club_id)] || null}
                            recentRounds={recentRounds}
                            action={
                              <button
                                onClick={() => handleRemoveFromPool(p.player_id)}
                                disabled={isToggling}
                                className="whitespace-nowrap text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 border bg-gray-800 text-gray-400 hover:bg-red-900/40 hover:text-red-300 border-gray-700 hover:border-red-700"
                              >
                                {isToggling ? '...' : 'Remover'}
                              </button>
                            }
                          />
                        </div>
                      );
                    })}
                    <Pagination page={tPage} total={poolDraft.length} onChange={setTPage} />
                  </div>
                </div>
              )}
            </div>

            {/* Club count sidebar */}
            <div className="card lg:w-64 w-full flex-shrink-0">
              <h4 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">
                Jogadores por time
              </h4>
              {clubCounts.length === 0 ? (
                <p className="text-gray-600 text-xs text-center py-4">—</p>
              ) : (
                <div className="space-y-2">
                  {(() => {
                    const maxCount = Math.max(...clubCounts.map(c => c.count), 1);
                    return clubCounts.map(({ name, count }) => {
                      const pct = Math.round((count / maxCount) * 100);
                      return (
                        <div key={name}>
                          <div className="flex items-center justify-between mb-0.5">
                            <span className={`text-xs font-medium truncate mr-2 ${count === 0 ? 'text-gray-600' : 'text-gray-300'}`}>
                              {name}
                            </span>
                            <span className={`text-xs font-bold flex-shrink-0 ${count === 0 ? 'text-gray-600' : 'text-draft-gold'}`}>
                              {count}
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-draft-green transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>

          </div>

          {/* ── Tabela 2: Não cotados ── */}
          <div className="card">
            <h3 className="font-semibold text-gray-400 mb-1 flex items-center gap-2">
              ⚠️ Não cotados como titulares
              <span className="text-xs text-gray-500 font-normal">({outros.length})</span>
            </h3>
            <p className="text-xs text-gray-600 mb-3">
              Adicione manualmente os jogadores que devem entrar no pool do draft
            </p>

            {/* Filters */}
            <div className="space-y-2 mb-3">
              <PosFilter value={oPos} onChange={setOPos} players={players.filter(p => p.status_id !== 7)} countStatus={null} />
              <div className="flex flex-wrap items-center gap-2">
                {/* Status chips */}
                <button
                  onClick={() => setOStatus(0)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    oStatus === 0 ? 'bg-gray-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  Todos status
                </button>
                {OUTROS_STATUS_ORDER.map(sid => {
                  const info = STATUS_INFO[sid];
                  return (
                    <button
                      key={sid}
                      onClick={() => setOStatus(oStatus === sid ? 0 : sid)}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                        oStatus === sid
                          ? `${info.bg} ${info.text} border-current`
                          : 'bg-gray-800 text-gray-400 border-transparent hover:text-white'
                      }`}
                    >
                      {info.label}
                    </button>
                  );
                })}
                <ClubSelect value={oClub} onChange={setOClub} clubs={clubs} />
                {(oPos !== 0 || oStatus !== 0 || oClub !== 0) && (
                  <button
                    onClick={() => { setOPos(0); setOStatus(0); setOClub(0); }}
                    className="text-xs text-gray-600 hover:text-gray-300 underline transition-colors"
                  >
                    limpar
                  </button>
                )}
              </div>
            </div>

            {outros.length === 0 ? (
              <p className="text-gray-600 text-sm text-center py-4">Nenhum com os filtros atuais</p>
            ) : (
              <div className="overflow-x-auto">
                <div style={{ minWidth: '620px' }}>
                  <RoundsHeader recentRounds={recentRounds} sort={oSort} onSort={setOSort} />
                  {outros.slice(oPage * PAGE_SIZE, (oPage + 1) * PAGE_SIZE).map(p => {
                    const isEligible = eligibleIds.has(p.player_id);
                    const isExcluded = excludedIds.has(p.player_id);
                    const isToggling = togglingId === p.player_id;
                    return (
                      <div
                        key={p.player_id}
                        className={isEligible ? 'border-l-2 border-blue-500 rounded-r-lg' : ''}
                      >
                        <PlayerRow
                          player={p}
                          match={clubMatches[p.club_id] || clubMatches[String(p.club_id)] || null}
                          recentRounds={recentRounds}
                          action={isExcluded ? (
                            <button
                              onClick={() => handleRestoreToPool(p.player_id)}
                              className="whitespace-nowrap text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors border bg-orange-900/30 text-orange-300 hover:bg-green-900/40 hover:text-green-300 border-orange-700/50 hover:border-green-700"
                            >
                              ↩ Restaurar
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleEligible(p.player_id)}
                              disabled={isToggling}
                              className={`whitespace-nowrap text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 border ${
                                isEligible
                                  ? 'bg-blue-900/40 text-blue-300 hover:bg-red-900/40 hover:text-red-300 border-blue-700 hover:border-red-700'
                                  : 'bg-gray-800 text-gray-400 hover:bg-green-900/40 hover:text-green-300 border-gray-700 hover:border-green-700'
                              }`}
                            >
                              {isToggling ? '...' : isEligible ? '✓ Adicionado' : '+ Adicionar'}
                            </button>
                          )}
                        />
                      </div>
                    );
                  })}
                  <Pagination page={oPage} total={outros.length} onChange={setOPage} />
                </div>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
