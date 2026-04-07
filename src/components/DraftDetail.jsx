import React, { useState, useEffect, useCallback } from 'react';
import { API_URL } from '../config.js';

const POS_LABEL = { 1: 'GOL', 2: 'LAT', 3: 'ZAG', 4: 'MEI', 5: 'ATA', 21: 'DEF RES 1', 22: 'DEF RES 2', 23: 'M/A RES 1', 24: 'M/A RES 2', 25: 'M/A RES 3' };
const POS_COLORS = {
  1: 'text-blue-400', 2: 'text-green-400', 3: 'text-green-400',
  4: 'text-yellow-400', 5: 'text-red-400',
  21: 'text-green-500', 22: 'text-green-500', 23: 'text-yellow-500', 24: 'text-yellow-500', 25: 'text-yellow-500',
};
const BENCH_SLOT_IDS = [21, 22, 23, 24, 25];
const POS_ORDER = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 21: 5, 22: 6, 23: 7, 24: 8, 25: 9 };

// Which bench slot can substitute which starter positions
const BENCH_TO_POSITIONS = { 21: [1, 2, 3], 22: [1, 2, 3], 23: [4, 5], 24: [4, 5], 25: [4, 5] };
// Short label used when a bench player subs in
const BENCH_SUB_LABEL = { 21: 'DEF', 22: 'DEF', 23: 'M/A', 24: 'M/A', 25: 'M/A' };

function scoreColor(score) {
  if (score == null) return 'text-gray-600';
  if (score < 0) return 'text-red-400';
  return 'text-green-400';
}

// Build set of club_ids that have already played their match this round.
// A club is considered to have played if ANY player from that club (across all teams)
// has a non-null round_score. This prevents substituting starters whose games haven't
// happened yet.
function buildPlayedClubs(allTeams) {
  const played = new Set();
  for (const team of allTeams) {
    for (const pick of team.picks) {
      if (pick.round_score != null && pick.club_id) played.add(pick.club_id);
    }
  }
  return played;
}

// Returns substitution maps:
// subMap: starterCartolaId -> benchPlayer (bench came in for this starter)
// usedBenchIds: Set of bench cartolaIds that were subbed in
// playedClubs: Set of club_ids whose game has already happened this round
function buildSubstitutions(picks, playedClubs) {
  const mainPicks = picks.filter(p => !BENCH_SLOT_IDS.includes(p.position_id));
  const benchPicks = picks.filter(p => BENCH_SLOT_IDS.includes(p.position_id))
    .sort((a, b) => (POS_ORDER[a.position_id] ?? 9) - (POS_ORDER[b.position_id] ?? 9));

  const subMap = new Map();   // starterCartolaId -> benchPlayer
  const usedBenchIds = new Set();

  for (const bench of benchPicks) {
    if (!bench.round_score || bench.round_score === 0) continue; // bench didn't play
    const allowed = BENCH_TO_POSITIONS[bench.position_id] || [];
    const target = mainPicks.find(p =>
      allowed.includes(p.position_id) &&
      p.round_score == null &&
      playedClubs.has(p.club_id) &&  // só substitui se o time do titular já jogou
      !subMap.has(p.cartola_id)
    );
    if (target) {
      subMap.set(target.cartola_id, bench);
      usedBenchIds.add(bench.cartola_id);
    }
  }

  return { subMap, usedBenchIds };
}

function teamRoundScore(picks, captainId, playedClubs) {
  const mainPicks = picks.filter(p => !BENCH_SLOT_IDS.includes(p.position_id));
  const { subMap } = buildSubstitutions(picks, playedClubs);

  return mainPicks.reduce((sum, p) => {
    const effective = subMap.has(p.cartola_id) ? subMap.get(p.cartola_id) : p;
    const score = effective.round_score ?? 0;
    const multiplier = p.cartola_id === captainId ? 2 : 1;
    return sum + score * multiplier;
  }, 0);
}

function teamAvgScore(picks) {
  return picks
    .filter(p => !BENCH_SLOT_IDS.includes(p.position_id))
    .reduce((sum, p) => sum + (p.average_score || 0), 0);
}

function UnpickedTable({ players, hasRoundScores }) {
  const [open, setOpen] = React.useState(false);
  const visible = open ? players : players.slice(0, 20);

  return (
    <div className="card mb-4 p-0 overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full px-4 py-3 flex items-center justify-between border-b border-gray-800 hover:bg-gray-800/40 transition-colors"
      >
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Jogadores não escolhidos {hasRoundScores ? '· pontuação da rodada' : ''}
        </span>
        <span className="text-gray-600 text-xs">{open ? '▲ recolher' : `▼ ver todos (${players.length})`}</span>
      </button>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800/60">
            <th className="py-2 pl-4 pr-2 text-left text-xs text-gray-600 font-medium">Jogador</th>
            <th className="py-2 px-2 text-center text-xs text-gray-600 font-medium">Pos</th>
            <th className="py-2 px-2 text-center text-xs text-gray-600 font-medium">Time</th>
            <th className="py-2 px-2 text-left text-xs text-gray-600 font-medium">Confronto</th>
            <th className="py-2 px-2 pr-4 text-right text-xs text-gray-600 font-medium">Pts</th>
          </tr>
        </thead>
        <tbody>
          {visible.map(p => (
            <tr key={p.cartola_id} className="border-b border-gray-800/40 last:border-0 hover:bg-gray-800/20">
              <td className="py-2 pl-4 pr-2">
                <div className="flex items-center gap-2">
                  {p.photo && <img src={p.photo} className="w-6 h-6 rounded-full object-cover flex-shrink-0" alt="" />}
                  <span className="text-white font-medium text-xs">{p.nickname}</span>
                </div>
              </td>
              <td className="py-2 px-2 text-center">
                <span className={`text-xs font-bold ${POS_COLORS[p.position_id] || 'text-gray-400'}`}>
                  {POS_LABEL[p.position_id] || '—'}
                </span>
              </td>
              <td className="py-2 px-2 text-center text-xs text-gray-400">{p.club?.abbreviation || '—'}</td>
              <td className="py-2 px-2 text-xs text-gray-500">{p.match || '—'}</td>
              <td className={`py-2 px-2 pr-4 text-right font-bold text-xs ${scoreColor(p.round_score)}`}>
                {p.round_score != null ? p.round_score.toFixed(2) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!open && players.length > 20 && (
        <button
          onClick={() => setOpen(true)}
          className="w-full py-2 text-xs text-gray-600 hover:text-gray-400 transition-colors border-t border-gray-800/60"
        >
          + {players.length - 20} jogadores a mais
        </button>
      )}
    </div>
  );
}

export default function DraftDetail({ roomCode, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserName, setCurrentUserName] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('draft_token');
    if (!token) return;
    fetch(`${API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.user?.nome) setCurrentUserName(d.user.nome); })
      .catch(() => {});
  }, []);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const token = localStorage.getItem('draft_token');
      // Always sync scores before loading so we show the latest data
      await fetch(`${API_URL}/api/sync/scores`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
      const res = await fetch(`${API_URL}/api/drafts/history/${roomCode}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao carregar draft.');
      setData(json);
      setActiveTab(prev => prev || json.teams?.[0]?.id || null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [roomCode]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 60_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const hasRoundScores = data?.scoresAvailable === true;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
        <div className="card p-8 text-center">
          <div className="animate-spin text-4xl mb-3">⚽</div>
          <p className="text-gray-400">Carregando draft...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
        <div className="card p-8 text-center max-w-sm">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={onClose} className="btn-secondary">Fechar</button>
        </div>
      </div>
    );
  }

  const playedClubs = buildPlayedClubs(data.teams);

  // Ranking: sort by round score desc (or avg if no round scores yet)
  const rankedTeams = [...data.teams].sort((a, b) => {
    if (hasRoundScores) {
      return teamRoundScore(b.picks, b.captainId, playedClubs) - teamRoundScore(a.picks, a.captainId, playedClubs);
    }
    return teamAvgScore(b.picks) - teamAvgScore(a.picks);
  });

  // Actual draft order: who drafted first = lowest overall_pick among their picks
  const draftStartOrder = [...data.teams]
    .filter(t => t.picks.length > 0)
    .map(t => ({ id: t.id, firstPick: Math.min(...t.picks.map(p => p.overall_pick ?? Infinity)) }))
    .sort((a, b) => a.firstPick - b.firstPick);
  const draftOrderMap = new Map(draftStartOrder.map((t, i) => [t.id, i + 1]));

  const sortedTeams = [...data.teams].sort((a, b) => (a.pickOrder || 0) - (b.pickOrder || 0));
  const activeTeam = data.teams.find(t => t.id === activeTab);

  const mainPicks = (activeTeam?.picks.filter(p => !BENCH_SLOT_IDS.includes(p.position_id)) || [])
    .sort((a, b) => (POS_ORDER[a.position_id] ?? 9) - (POS_ORDER[b.position_id] ?? 9));
  const benchPicks = (activeTeam?.picks.filter(p => BENCH_SLOT_IDS.includes(p.position_id)) || [])
    .sort((a, b) => (POS_ORDER[a.position_id] ?? 9) - (POS_ORDER[b.position_id] ?? 9));

  const { subMap, usedBenchIds } = activeTeam
    ? buildSubstitutions(activeTeam.picks, playedClubs)
    : { subMap: new Map(), usedBenchIds: new Set() };

  const cols = 5;

  return (
    <div className="fixed inset-0 bg-black/85 z-50 overflow-y-auto p-4">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-4 pt-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-bold text-white text-lg">{roomCode}</span>
              {data.roundNumber && (
                <span className="bg-cartola-green/20 text-green-400 border border-cartola-green/40 text-xs font-bold px-2 py-0.5 rounded-full">
                  Rodada {data.roundNumber}
                </span>
              )}
              {data.roundNumber && !hasRoundScores && (
                <span className="text-xs text-yellow-600 italic">pontuações da rodada {data.roundNumber} ainda não sincronizadas</span>
              )}
            </div>
            {data.completedAt && (
              <p className="text-xs text-gray-500 mt-0.5">
                Draft finalizado em {new Date(data.completedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              <span className={refreshing ? 'animate-spin inline-block' : ''}>⚽</span>
              {refreshing ? 'Atualizando...' : 'Atualizar'}
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-xl leading-none px-2">✕</button>
          </div>
        </div>

        {/* Ranking table */}
        <div className="card mb-4 p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              {hasRoundScores ? `Classificação · Rodada ${data.roundNumber}` : 'Classificação por média'}
            </span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800/60">
                <th className="py-2 pl-4 pr-2 text-left text-xs text-gray-600 font-medium w-8">#</th>
                <th className="py-2 px-2 text-left text-xs text-gray-600 font-medium">Time</th>
                <th className="py-2 px-2 text-left text-xs text-gray-600 font-medium">Usuário</th>
                <th className="py-2 px-2 text-center text-xs text-gray-600 font-medium">Draft</th>
                <th className="py-2 px-2 text-right text-xs text-gray-600 font-medium">Pontuação</th>
                <th className="py-2 pl-2 pr-4 text-right text-xs text-gray-600 font-medium">Prêmio</th>
              </tr>
            </thead>
            <tbody>
              {rankedTeams.map((team, idx) => {
                const roundTotal = teamRoundScore(team.picks, team.captainId, playedClubs);
                const avgTotal = teamAvgScore(team.picks);
                const posIcons = ['🥇', '🥈', '🥉'];
                const posIcon = posIcons[idx] || `${idx + 1}º`;
                const prizes = [50, 25, 15, 10];
                const prize = prizes[idx] ?? 5;
                const isActive = activeTab === team.id;
                return (
                  <tr
                    key={team.id}
                    onClick={() => setActiveTab(team.id)}
                    className={`border-b border-gray-800/60 last:border-0 cursor-pointer transition-colors ${
                      isActive ? 'bg-cartola-green/10' : 'hover:bg-gray-800/40'
                    }`}
                  >
                    <td className="py-3 pl-4 pr-2 text-lg leading-none">{posIcon}</td>
                    <td className="py-3 px-2 font-semibold text-white">{team.name}</td>
                    <td className="py-3 px-2 text-xs text-gray-400">{team.userName || '—'}</td>
                    <td className="py-3 px-2 text-center">
                      <span className="text-xs text-gray-500 tabular-nums">
                        {draftOrderMap.has(team.id) ? `${draftOrderMap.get(team.id)}º` : '—'}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right font-bold tabular-nums">
                      <span className={scoreColor(hasRoundScores ? roundTotal : null)}>
                        {hasRoundScores ? roundTotal.toFixed(1) : '0.0'} pts
                      </span>
                    </td>
                    <td className="py-3 pl-2 pr-4 text-right tabular-nums">
                      <span className="inline-flex items-center gap-1 bg-yellow-900/30 border border-yellow-700/40 text-yellow-300 text-xs font-bold px-2 py-0.5 rounded-full">
                        🪙 {prize}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Team selector dropdown */}
        {(() => {
          const myTeam = sortedTeams.find(t => t.userName === currentUserName);
          const dropdownTeams = myTeam
            ? [myTeam, ...sortedTeams.filter(t => t.id !== myTeam.id)]
            : sortedTeams;
          return (
            <div className="mt-6 mb-4">
              <label className="block text-xs text-gray-500 font-medium mb-1.5">Ver time</label>
              <select
                value={activeTab != null ? String(activeTab) : ''}
                onChange={e => {
                  const found = dropdownTeams.find(t => String(t.id) === e.target.value);
                  if (found) setActiveTab(found.id);
                }}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-cartola-green"
              >
                {dropdownTeams.map(team => (
                  <option key={team.id} value={String(team.id)}>
                    {team.userName === currentUserName ? `${team.name} (você)` : team.name}
                    {team.formation ? ` — ${team.formation}` : ''}
                  </option>
                ))}
              </select>
            </div>
          );
        })()}

        {/* Active team detail */}
        {activeTeam && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {activeTeam.name}
                  {activeTeam.userName && (
                    <span className="ml-2 text-sm font-normal text-gray-400">({activeTeam.userName})</span>
                  )}
                </h2>
                <p className="text-gray-500 text-xs">{activeTeam.formation} · {activeTeam.picks.length} jogadores</p>
              </div>
              {hasRoundScores && (
                <div className="text-right">
                  <div className={`text-xl font-bold ${scoreColor(teamRoundScore(activeTeam.picks, activeTeam.captainId, playedClubs))}`}>
                    {teamRoundScore(activeTeam.picks, activeTeam.captainId, playedClubs).toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">pts · Rodada {data.roundNumber}</div>
                </div>
              )}
            </div>

            <div className="space-y-px">
                {mainPicks.map(p => {
                  const isCaptain = p.cartola_id === activeTeam.captainId;
                  const subIn = subMap.get(p.cartola_id);
                  const wasSubbedOut = !!subIn;

                  const slotScore = wasSubbedOut ? (subIn.round_score || 0) : (p.round_score ?? 0);
                  const displayScore = (p.round_score != null || wasSubbedOut)
                    ? (isCaptain ? slotScore * 2 : slotScore)
                    : null;

                  return (
                    <React.Fragment key={p.cartola_id}>
                      {/* Starter row */}
                      <div className={`flex items-center gap-2 py-2 px-1 rounded-lg border-b border-gray-800/40 ${wasSubbedOut ? 'opacity-40' : 'hover:bg-gray-800/30'}`}>
                        {/* Pos + sub indicator */}
                        <div className="flex flex-col items-center w-10 shrink-0">
                          <span className={`font-bold text-xs ${POS_COLORS[p.position_id]}`}>
                            {POS_LABEL[p.position_id]}
                          </span>
                          {wasSubbedOut && <span className="text-red-500 text-[10px] leading-none mt-0.5">↓</span>}
                        </div>
                        {/* Photo */}
                        {p.photo
                          ? <img src={p.photo} className="w-7 h-7 rounded-full object-cover shrink-0" alt="" />
                          : <div className="w-7 h-7 rounded-full bg-gray-700 shrink-0" />}
                        {/* Name + club */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 min-w-0">
                            <span className={`truncate text-sm ${wasSubbedOut ? 'line-through text-gray-500' : 'font-medium text-white'}`}>
                              {p.nickname}
                            </span>
                            {isCaptain && (
                              <span className="bg-yellow-400 text-black text-[10px] font-black px-1 py-0.5 rounded leading-none shrink-0">C</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 truncate">{p.club?.abbreviation || '—'}{p.match ? ` · ${p.match}` : ''}</div>
                        </div>
                        {/* Score */}
                        <div className="shrink-0 text-right w-14">
                          {wasSubbedOut
                            ? <span className="text-gray-600 text-sm font-bold">0.00</span>
                            : p.round_score != null
                              ? <span className={`text-sm font-bold ${scoreColor(p.round_score)}`}>
                                  {(isCaptain ? p.round_score * 2 : p.round_score).toFixed(2)}
                                  {isCaptain && <span className="text-yellow-400 text-[10px] ml-0.5">×2</span>}
                                </span>
                              : <span className="text-gray-600 text-sm">—</span>}
                        </div>
                      </div>

                      {/* Sub-in row */}
                      {wasSubbedOut && (
                        <div className="flex items-center gap-2 py-1.5 px-1 rounded-lg bg-green-950/20 border-b border-green-900/20">
                          {/* Pos */}
                          <div className="flex items-center gap-0.5 w-10 shrink-0">
                            <span className="text-green-400 text-xs font-bold leading-none">↑</span>
                            <span className={`font-bold text-xs ${POS_COLORS[subIn.position_id]}`}>
                              {BENCH_SUB_LABEL[subIn.position_id] || POS_LABEL[subIn.position_id]}
                            </span>
                          </div>
                          {/* Photo */}
                          {subIn.photo
                            ? <img src={subIn.photo} className="w-7 h-7 rounded-full object-cover shrink-0" alt="" />
                            : <div className="w-7 h-7 rounded-full bg-gray-700 shrink-0" />}
                          {/* Name + club */}
                          <div className="flex-1 min-w-0">
                            <span className="text-green-300 font-medium text-sm truncate block">{subIn.nickname}</span>
                            <div className="text-xs text-gray-500 truncate">{subIn.club?.abbreviation || '—'}{subIn.match ? ` · ${subIn.match}` : ''}</div>
                          </div>
                          {/* Score */}
                          <div className={`shrink-0 text-right w-14 text-sm font-bold ${scoreColor(displayScore)}`}>
                            {displayScore != null
                              ? <span>{displayScore.toFixed(2)}{isCaptain && <span className="text-yellow-400 text-[10px] ml-0.5">×2</span>}</span>
                              : <span className="text-gray-600">—</span>}
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}

                {/* Bench section */}
                {benchPicks.length > 0 && (
                  <>
                    <div className="py-2 px-1 text-xs font-semibold text-gray-600 uppercase tracking-wide border-t border-gray-800 mt-1">
                      Reservas
                    </div>
                    {benchPicks.map(p => {
                      const subbed = usedBenchIds.has(p.cartola_id);
                      return (
                        <div key={p.cartola_id} className={`flex items-center gap-2 py-2 px-1 rounded-lg border-b border-gray-800/30 ${subbed ? 'opacity-40' : 'opacity-60'}`}>
                          <div className="w-10 shrink-0">
                            <span className={`font-bold text-xs ${POS_COLORS[p.position_id]}`}>
                              {POS_LABEL[p.position_id]}
                            </span>
                          </div>
                          {p.photo
                            ? <img src={p.photo} className="w-7 h-7 rounded-full object-cover shrink-0" alt="" />
                            : <div className="w-7 h-7 rounded-full bg-gray-700 shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <span className="text-gray-300 text-sm truncate block">{p.nickname}</span>
                            <div className="text-xs text-gray-500 truncate">{p.club?.abbreviation || '—'}{p.match ? ` · ${p.match}` : ''}</div>
                          </div>
                          <div className={`shrink-0 text-right w-14 text-sm font-bold ${scoreColor(p.round_score)}`}>
                            {p.round_score != null ? p.round_score.toFixed(2) : '—'}
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
            </div>
          </div>
        )}

        {/* Unpicked players */}
        {data.unpicked?.length > 0 && (
          <div className="mt-8">
            <UnpickedTable players={data.unpicked} hasRoundScores={hasRoundScores} />
          </div>
        )}
      </div>
    </div>
  );
}
