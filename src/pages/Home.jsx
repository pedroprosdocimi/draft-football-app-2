import React, { useState, useEffect } from 'react';
import socket from '../socket.js';
import { API_URL } from '../config.js';
import DraftDetail from '../components/DraftDetail.jsx';

function readSession() {
  try { return JSON.parse(localStorage.getItem('draft_session')); } catch { return null; }
}

const STATUS_LABELS = {
  lobby: 'Aguardando',
  drafting: 'Em andamento',
  bench_drafting: 'Reservas',
  captain_drafting: 'Capitão',
  parallel_waiting: 'Paralelo — aguardando',
};

export default function Home({ user, onLogout, onGoAdmin, onRejoin }) {
  const [roomCode, setRoomCode] = useState('');
  const [tab, setTab] = useState('create'); // 'create' | 'join' — only admin sees tabs
  const [entryFee, setEntryFee] = useState(0);
  const [maxParticipants, setMaxParticipants] = useState('');
  const [wantToPlay, setWantToPlay] = useState(true);
  const [activeDrafts, setActiveDrafts] = useState([]);
  const [historyDrafts, setHistoryDrafts] = useState([]);
  const [detailRoomCode, setDetailRoomCode] = useState(null);
  const [poolStats, setPoolStats] = useState(null);
  const [poolStatsError, setPoolStatsError] = useState(null);

  const activeSession = readSession();

  // Fetch pool stats for admin create tab
  useEffect(() => {
    if (!user.isAdmin) return;
    fetch(`${API_URL}/api/drafts/pool-stats`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setPoolStatsError(data.error);
        else setPoolStats(data);
      })
      .catch(() => setPoolStatsError('Não foi possível carregar as estatísticas do pool.'));
  }, [user.isAdmin]);

  useEffect(() => {
    const token = localStorage.getItem('draft_token');
    if (!token) return;
    fetch(`${API_URL}/api/drafts/active`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => { if (data.drafts) setActiveDrafts(data.drafts); })
      .catch(() => {});
    fetch(`${API_URL}/api/drafts/history`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => { if (data.drafts) setHistoryDrafts(data.drafts); })
      .catch(() => {});
  }, []);

  const handleRejoinDraft = (rc, pid) => {
    socket.emit('reconnect_participant', { roomCode: rc, participantId: pid });
  };

  // Auto-fill invite code from URL (e.g. /ABC123)
  useEffect(() => {
    const invite = sessionStorage.getItem('draft_invite_code');
    if (invite) {
      sessionStorage.removeItem('draft_invite_code');
      setRoomCode(invite);
      setTab('join');
    }
  }, []);

  const handleCreate = () => {
    const token = localStorage.getItem('draft_token');
    socket.emit('create_room', { participantName: user.nomeTime, entryFee, token, spectate: !wantToPlay, maxParticipants: maxParticipants ? parseInt(maxParticipants) : null });
  };

  const handleJoin = () => {
    if (roomCode.length < 6) return;
    const token = localStorage.getItem('draft_token');
    socket.emit('join_room', { roomCode: roomCode.trim().toUpperCase(), participantName: user.nomeTime, token });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {detailRoomCode && (
        <DraftDetail roomCode={detailRoomCode} onClose={() => setDetailRoomCode(null)} />
      )}
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">⚽</div>
          <h1 className="text-4xl font-bold text-white mb-2">Draft Cartola</h1>
          <p className="text-gray-400">Monte seu time com jogadores reais do Brasileirão</p>
          <div className="flex items-center justify-center gap-3 mt-4">
            <span className="text-gray-400 text-sm">
              Olá, <span className="text-white font-medium">{user.nome.split(' ')[0]}</span>
              {' '}·{' '}
              <span className="text-cartola-green font-medium">{user.nomeTime}</span>
              {user.isAdmin && (
                <span className="ml-2 text-xs bg-cartola-gold/20 text-cartola-gold border border-cartola-gold/30 px-2 py-0.5 rounded-full">
                  admin
                </span>
              )}
            </span>
            <button onClick={onLogout} className="text-xs text-gray-600 hover:text-red-400 transition-colors">
              Sair
            </button>
          </div>
          <div className="mt-2">
            <span className="inline-flex items-center gap-1.5 bg-yellow-900/30 border border-yellow-700/50 text-yellow-300 text-sm font-semibold px-3 py-1 rounded-full">
              🪙 {user.coins ?? 0} moedas
            </span>
          </div>
        </div>

        {/* Active drafts from server */}
        {activeDrafts.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Seus drafts ativos</p>
            <div className="space-y-2">
              {activeDrafts.map(draft => (
                <div key={draft.room_code} className="rounded-xl border border-gray-700 bg-gray-800/60 px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-sm">{draft.room_code}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-cartola-green/20 text-green-400 border border-cartola-green/30">
                        {STATUS_LABELS[draft.status] || draft.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{draft.participant_count} participante{draft.participant_count !== '1' ? 's' : ''}</p>
                  </div>
                  <button
                    onClick={() => setDetailRoomCode(draft.room_code)}
                    className="flex-shrink-0 text-xs text-gray-500 hover:text-white border border-gray-700 hover:border-gray-500 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Pontuação
                  </button>
                  <button
                    onClick={() => handleRejoinDraft(draft.room_code, draft.participant_id)}
                    className="flex-shrink-0 btn-primary text-sm py-1.5 px-4"
                  >
                    Entrar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active draft banner */}
        {activeSession?.roomCode && (
          <div className="mb-4 rounded-xl border border-cartola-green/50 bg-cartola-green/10 p-4 flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <div className="w-3 h-3 rounded-full bg-cartola-green" />
              <div className="absolute inset-0 w-3 h-3 rounded-full bg-cartola-green animate-ping" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm">Draft em andamento</p>
              <p className="text-gray-400 text-xs font-mono mt-0.5">{activeSession.roomCode}</p>
            </div>
            <button
              onClick={onRejoin}
              className="flex-shrink-0 btn-primary text-sm py-1.5 px-4"
            >
              Voltar
            </button>
          </div>
        )}

        {/* Card */}
        <div className="card">

          {/* Admin: tabs to switch between create and join */}
          {user.isAdmin && (
            <div className="flex mb-6 bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setTab('create')}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                  tab === 'create' ? 'bg-cartola-green text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Criar Sala
              </button>
              <button
                onClick={() => setTab('join')}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                  tab === 'join' ? 'bg-cartola-green text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Entrar com Código
              </button>
            </div>
          )}

          {/* Non-admin: section label */}
          {!user.isAdmin && (
            <p className="text-sm font-medium text-gray-400 mb-4">Entrar em uma sala</p>
          )}

          {/* Create room — admin only */}
          {user.isAdmin && tab === 'create' && (
            <>
              {/* Want to play toggle */}
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-400 mb-2">Participação</p>
                <div className="inline-flex bg-gray-800 rounded-lg p-1 gap-1">
                  <button
                    onClick={() => setWantToPlay(true)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      wantToPlay ? 'bg-cartola-green text-white shadow' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    ⚽ Quero jogar
                  </button>
                  <button
                    onClick={() => setWantToPlay(false)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      !wantToPlay ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    👁️ Só observar
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-1.5">
                  {wantToPlay
                    ? `Você entrará como ${user.nomeTime} e participará do draft`
                    : 'Você administra a sala mas não drafta'}
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  🪙 Taxa de entrada (moedas por participante)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={entryFee}
                    onChange={e => setEntryFee(Math.max(0, parseInt(e.target.value) || 0))}
                    className="input-field w-32 text-center font-mono text-lg"
                  />
                  <span className="text-gray-500 text-sm">moedas</span>
                  {entryFee === 0 && <span className="text-xs text-gray-600">(gratuito)</span>}
                  {entryFee > 0 && wantToPlay && (
                    <span className="text-xs text-yellow-400">
                      Você também pagará {entryFee} 🪙
                    </span>
                  )}
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  👥 Limite de jogadores (opcional)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={maxParticipants}
                    onChange={e => setMaxParticipants(e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value) || 1))}
                    placeholder="Sem limite"
                    className="input-field w-32 text-center font-mono text-lg"
                  />
                  <span className="text-gray-500 text-sm">jogadores</span>
                  {maxParticipants === '' && <span className="text-xs text-gray-600">(sem limite)</span>}
                </div>
              </div>

              {/* Pool stats */}
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-400 mb-2">📊 Capacidade do Draft (rodada atual)</p>
                {poolStatsError ? (
                  <p className="text-xs text-red-400 bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">{poolStatsError}</p>
                ) : !poolStats ? (
                  <p className="text-xs text-gray-600 animate-pulse">Carregando...</p>
                ) : (() => {
                  const pos = [
                    { key: 'gol', label: 'GOL', count: poolStats.counts.gol, worst: poolStats.worstCase.gol, max: poolStats.maxByPos.gol },
                    { key: 'zag', label: 'ZAG', count: poolStats.counts.zag, worst: poolStats.worstCase.zag, max: poolStats.maxByPos.zag },
                    { key: 'lat', label: 'LAT', count: poolStats.counts.lat, worst: poolStats.worstCase.lat, max: poolStats.maxByPos.lat },
                    { key: 'mei', label: 'MEI', count: poolStats.counts.mei, worst: poolStats.worstCase.mei, max: poolStats.maxByPos.mei },
                    { key: 'ata', label: 'ATA', count: poolStats.counts.ata, worst: poolStats.worstCase.ata, max: poolStats.maxByPos.ata },
                    { key: 'def', label: 'ZAG+LAT', count: poolStats.counts.zag + poolStats.counts.lat, worst: poolStats.worstCase.def, max: poolStats.maxByPos.def },
                  ];
                  const bottleneck = Math.min(...pos.map(p => p.max));
                  return (
                    <div className="rounded-lg border border-gray-700 overflow-hidden">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-gray-800 text-gray-400">
                            <th className="text-left px-3 py-2">Posição</th>
                            <th className="text-center px-2 py-2">Pool</th>
                            <th className="text-center px-2 py-2">Slots/time</th>
                            <th className="text-center px-2 py-2">Máx. times</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pos.map(p => (
                            <tr
                              key={p.key}
                              className={`border-t border-gray-700/60 ${p.max === bottleneck ? 'bg-red-950/30 text-red-300' : 'text-gray-300'}`}
                            >
                              <td className="px-3 py-1.5 font-semibold">{p.label}</td>
                              <td className="px-2 py-1.5 text-center font-mono">{p.count}</td>
                              <td className="px-2 py-1.5 text-center text-gray-500">{p.worst}</td>
                              <td className={`px-2 py-1.5 text-center font-bold ${p.max === bottleneck ? 'text-red-400' : 'text-cartola-green'}`}>{p.max}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className={`px-3 py-2 border-t flex items-center justify-between ${bottleneck <= 4 ? 'bg-red-950/40 border-red-800/50' : 'bg-gray-800/60 border-gray-700'}`}>
                        <span className="text-xs text-gray-400">Jogadores no pool: <span className="text-white font-semibold">{poolStats.total}</span></span>
                        <span className="text-sm font-bold">
                          {bottleneck <= 0
                            ? <span className="text-red-400">Pool insuficiente</span>
                            : <span className={bottleneck <= 4 ? 'text-yellow-400' : 'text-cartola-green'}>
                                Máx. <span className="text-xl">{bottleneck}</span> jogadores
                              </span>
                          }
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <button
                onClick={handleCreate}
                disabled={wantToPlay && entryFee > 0 && (user.coins ?? 0) < entryFee}
                className="btn-primary w-full disabled:opacity-40"
              >
                ✨ Criar Sala{wantToPlay && entryFee > 0 ? ` (-${entryFee} 🪙)` : ''}
              </button>
              {wantToPlay && entryFee > 0 && (user.coins ?? 0) < entryFee && (
                <p className="text-red-400 text-xs mt-2 text-center">
                  Moedas insuficientes para criar esta sala.
                </p>
              )}
            </>
          )}

          {/* Join room — everyone */}
          {(!user.isAdmin || tab === 'join') && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">Código da sala</label>
                <input
                  type="text"
                  className="input-field uppercase tracking-widest text-xl text-center font-mono"
                  placeholder="ABC123"
                  value={roomCode}
                  onChange={e => setRoomCode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && handleJoin()}
                  maxLength={6}
                  autoFocus
                />
                <p className="text-xs text-gray-600 mt-2 text-center">
                  Você entrará como <span className="text-white">{user.nomeTime}</span>
                </p>
              </div>
              <button
                onClick={handleJoin}
                className="btn-primary w-full"
                disabled={roomCode.length < 6}
              >
                🚀 Entrar na Sala
              </button>
            </>
          )}
        </div>

        {user.isAdmin && (
          <div className="mt-4 text-center">
            <button
              onClick={onGoAdmin}
              className="text-xs text-gray-600 hover:text-cartola-gold transition-colors border border-gray-800 hover:border-gray-600 px-4 py-2 rounded-lg"
            >
              ⚙️ Painel Admin
            </button>
          </div>
        )}

        {/* Draft history */}
        {historyDrafts.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-white">🏆 Seus Drafts</p>
              <span className="text-xs text-gray-600">{historyDrafts.length} draft{historyDrafts.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="space-y-2">
              {historyDrafts.map(draft => (
                <button
                  key={draft.room_code}
                  onClick={() => setDetailRoomCode(draft.room_code)}
                  className="w-full rounded-xl border border-gray-700 bg-gray-800/50 px-4 py-3 text-left hover:border-cartola-green/50 hover:bg-gray-800 transition-all"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-sm">{draft.room_code}</span>
                      <span className="text-xs text-green-500 bg-green-950/40 border border-green-900/60 px-1.5 py-0.5 rounded">finalizado</span>
                    </div>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {draft.completed_at
                        ? new Date(draft.completed_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
                        : '—'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 truncate">{draft.participants_names}</p>
                  <p className="text-xs text-cartola-green/70 mt-1">Ver classificação →</p>
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-gray-600 text-xs mt-4">
          Dados dos jogadores via API não-oficial do Cartola FC
        </p>
      </div>
    </div>
  );
}
