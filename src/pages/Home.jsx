import React, { useEffect, useMemo, useState } from 'react';
import { API_URL } from '../config.js';

function authFetch(url, options = {}) {
  const token = localStorage.getItem('draft_token');
  return fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}

function formatRoundLabel(round) {
  if (!round) return 'rodada nao definida';
  if (round.number) return `Rodada ${round.number}`;
  if (round.name) return round.name;
  return 'rodada sem nome';
}

function formatDraftDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
}

function formatScore(value) {
  return Number(value || 0).toFixed(1);
}

function formatChampionshipType(type) {
  if (type === 'league') return 'Pontos corridos';
  if (type === 'knockout') return 'Mata-mata';
  if (type === 'hybrid') return 'Misto';
  return type;
}

const STATUS_LABELS = {
  formation_pick: 'Escolha da formacao',
  drafting: 'Titulares',
  bench_drafting: 'Reservas',
  captain_pick: 'Capitao',
  complete: 'Finalizado',
};

function StandingsModal({ open, loading, error, currentRound, standings, onClose, onViewDraft }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-green-400">Classificacao</p>
            <p className="text-sm text-white">{formatRoundLabel(currentRound)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-gray-700 px-3 py-1 text-xs text-gray-400 transition-colors hover:border-gray-500 hover:text-white"
          >
            Fechar
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-4 py-4">
          {loading && (
            <div className="flex items-center justify-center py-10">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-700 border-t-green-500" />
            </div>
          )}

          {!loading && error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {!loading && !error && standings.length === 0 && (
            <div className="rounded-xl border border-gray-800 bg-gray-800/40 px-4 py-6 text-center text-sm text-gray-400">
              Nenhum time finalizado ainda para esta rodada.
            </div>
          )}

          {!loading && !error && standings.length > 0 && (
            <div className="space-y-3">
              {standings.map((item, index) => (
                <div
                  key={item.draft_id}
                  className="rounded-xl border border-gray-800 bg-gray-800/50 px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-green-500/15 px-2 text-xs font-bold text-green-400">
                          {index + 1}
                        </span>
                        <p className="truncate text-sm font-bold text-white">{item.team_name}</p>
                      </div>
                      <p className="mt-1 text-xs text-gray-400">Treinador: {item.coach_name || '-'}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {item.formation || 'Formacao definida'} • {formatDraftDate(item.updated_at)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-bold text-green-400">{formatScore(item.score)}</p>
                      <p className="text-[11px] uppercase tracking-wide text-gray-500">Pontuacao atual</p>
                    </div>
                  </div>

                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => onViewDraft(item.draft_id)}
                      className="rounded-lg bg-draft-green px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-500"
                    >
                      Ver time
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Home({ user, onLogout, onGoAdmin, onStartDraft, onViewDraft, onOpenChampionship }) {
  const [activeDrafts, setActiveDrafts] = useState([]);
  const [championships, setChampionships] = useState([]);
  const [currentRound, setCurrentRound] = useState(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [standingsOpen, setStandingsOpen] = useState(false);
  const [standingsLoading, setStandingsLoading] = useState(false);
  const [standingsError, setStandingsError] = useState(null);
  const [standings, setStandings] = useState([]);
  const [standingsRound, setStandingsRound] = useState(null);
  const [playedRounds, setPlayedRounds] = useState([]);
  const [playedRoundsLoading, setPlayedRoundsLoading] = useState(false);

  const loadDrafts = async () => {
    setLoading(true);
    try {
      const [activeRes, championshipsRes] = await Promise.all([
        authFetch(`${API_URL}/drafts/active`),
        authFetch(`${API_URL}/championships`),
      ]);
      const [activeData, championshipsData] = await Promise.all([
        activeRes.json(),
        championshipsRes.json(),
      ]);

      setActiveDrafts(activeData.drafts || []);
      setCurrentRound(activeData.current_round || null);
      setChampionships(championshipsData.data || []);
    } catch {
      setError('Nao foi possivel carregar seus drafts agora.');
    } finally {
      setLoading(false);
    }
  };

  const loadPlayedRounds = async () => {
    setPlayedRoundsLoading(true);
    try {
      const res = await authFetch(`${API_URL}/drafts/played-rounds`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Nao foi possivel carregar rodadas anteriores.');
      setPlayedRounds(data.rounds || []);
    } catch {
      setPlayedRounds([]);
    } finally {
      setPlayedRoundsLoading(false);
    }
  };

  useEffect(() => {
    loadDrafts();
    loadPlayedRounds();
  }, []);

  const currentRoundActiveDraft = useMemo(() => {
    if (!currentRound?.id) return null;
    return activeDrafts.find((draft) => draft.round_id === currentRound.id) || null;
  }, [activeDrafts, currentRound]);

  const handleCreateDraft = async () => {
    setCreating(true);
    setError(null);
    try {
      const res = await authFetch(`${API_URL}/drafts`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        await loadDrafts();
        throw new Error(data.error || 'Nao foi possivel criar o draft.');
      }
      onStartDraft(data.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleOpenStandings = async () => {
    setStandingsOpen(true);
    setStandingsLoading(true);
    setStandingsError(null);
    setStandingsRound(currentRound);

    try {
      const res = await authFetch(`${API_URL}/drafts/current-round/standings`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Nao foi possivel carregar a classificacao.');
      }
      setStandings(data.standings || []);
    } catch (err) {
      setStandingsError(err.message);
    } finally {
      setStandingsLoading(false);
    }
  };

  const handleOpenRoundStandings = async (round) => {
    if (!round?.id) return;

    setStandingsOpen(true);
    setStandingsLoading(true);
    setStandingsError(null);
    setStandingsRound(round);

    try {
      const res = await authFetch(`${API_URL}/drafts/rounds/${round.id}/standings`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Nao foi possivel carregar a classificacao.');
      }
      setStandings(data.standings || []);
    } catch (err) {
      setStandingsError(err.message);
    } finally {
      setStandingsLoading(false);
    }
  };

  const handleViewStandingsDraft = (draftId) => {
    setStandingsOpen(false);
    onViewDraft(draftId);
  };

  const canCreateDraft = Boolean(currentRound) && !currentRoundActiveDraft;

  return (
    <div className="h-dvh overflow-hidden flex flex-col items-center justify-center p-4">
      <StandingsModal
        open={standingsOpen}
        loading={standingsLoading}
        error={standingsError}
        currentRound={standingsRound || currentRound}
        standings={standings}
        onClose={() => setStandingsOpen(false)}
        onViewDraft={handleViewStandingsDraft}
      />

      <div className="w-full max-w-md">
        <div className="text-center mb-6 md:mb-10">
          <div className="text-6xl mb-4">⚽</div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Tira Tira</h1>
          <div className="flex items-center justify-center gap-3 mt-4">
            <span className="text-gray-400 text-sm">
              Ola, <span className="text-white font-medium">{user.name?.split(' ')[0]}</span>
              {user.is_admin && (
                <span className="ml-2 text-xs bg-draft-gold/20 text-draft-gold border border-draft-gold/30 px-2 py-0.5 rounded-full">
                  admin
                </span>
              )}
            </span>
            <button onClick={onLogout} className="text-xs text-gray-600 hover:text-red-400 transition-colors">
              Sair
            </button>
          </div>
        </div>

        <div className="card mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Rodada atual</p>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-white font-semibold">{formatRoundLabel(currentRound)}</p>
              <p className="text-xs text-gray-500">
                {currentRound ? 'Os novos drafts serao criados para esta rodada.' : 'Defina a rodada ativa no painel admin.'}
              </p>
            </div>
            {loading && <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-700 border-t-draft-gold" />}
          </div>
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={handleOpenStandings}
              disabled={!currentRound}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Classificacao
            </button>
          </div>
        </div>

        {(playedRoundsLoading || playedRounds.length > 0) && (
          <div className="card mb-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Rodadas anteriores</p>
                <p className="text-sm text-white">Classificacao das rodadas que voce jogou.</p>
              </div>
              {playedRoundsLoading && <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-700 border-t-draft-gold" />}
            </div>

            <div className="flex flex-nowrap gap-2 overflow-x-auto overflow-y-hidden pb-1">
              {playedRounds.map((round) => (
                <button
                  key={round.id}
                  type="button"
                  onClick={() => handleOpenRoundStandings(round)}
                  className="shrink-0 rounded-full border border-gray-800 bg-gray-800/40 px-3 py-1.5 text-xs font-semibold text-gray-200 transition-colors hover:border-gray-600 hover:bg-gray-800/70"
                >
                  R{round.number}
                </button>
              ))}
              {!playedRoundsLoading && playedRounds.length === 0 && (
                <div className="text-xs text-gray-500">
                  Nenhuma rodada finalizada encontrada ainda.
                </div>
              )}
            </div>
          </div>
        )}

        {championships.length > 0 && (
          <div className="card mb-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Campeonatos</p>
                <p className="text-sm text-white">Acompanhe e compartilhe os torneios ativos.</p>
              </div>
              <span className="rounded-full border border-draft-gold/30 bg-draft-gold/10 px-2.5 py-1 text-xs font-semibold text-draft-gold">
                {championships.length}
              </span>
            </div>

            <div className="space-y-2">
              {championships.slice(0, 4).map((item) => (
                <div key={item.id} className="rounded-xl border border-gray-800 bg-gray-800/50 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{item.name}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {formatChampionshipType(item.type)} • rodadas {item.start_round_number} a {item.end_round_number}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenChampionship({ id: item.id, shareCode: item.share_code })}
                      className="rounded-lg bg-draft-gold px-3 py-2 text-xs font-semibold text-black transition-colors hover:bg-yellow-300"
                    >
                      Abrir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentRoundActiveDraft && (
          <div className="mb-4 rounded-xl border border-draft-green/30 bg-draft-green/10 px-4 py-4">
            <p className="text-xs font-semibold text-draft-green uppercase tracking-wide mb-2">Draft em andamento nesta rodada</p>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-white text-sm">
                    {currentRoundActiveDraft.formation || 'A definir'}
                  </span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-draft-green/20 text-green-400 border border-draft-green/30">
                    {STATUS_LABELS[currentRoundActiveDraft.status] || currentRoundActiveDraft.status}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">{formatRoundLabel(currentRoundActiveDraft.round)}</p>
              </div>
              <button onClick={() => onStartDraft(currentRoundActiveDraft.id)} className="flex-shrink-0 btn-primary text-sm py-1.5 px-4">
                Continuar
              </button>
            </div>
          </div>
        )}

        <div className="card">
          {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
          <button
            onClick={handleCreateDraft}
            disabled={creating || !canCreateDraft}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating
              ? 'Criando draft...'
              : canCreateDraft
                ? `Criar draft da ${formatRoundLabel(currentRound)}`
                : currentRoundActiveDraft
                  ? `Continue seu draft da ${formatRoundLabel(currentRound)}`
                  : 'Nenhuma rodada ativa definida'}
          </button>
        </div>

        {user.is_admin && (
          <div className="mt-4 text-center">
            <button
              onClick={onGoAdmin}
              className="text-xs text-gray-600 hover:text-draft-gold border border-gray-800 hover:border-gray-600 px-4 py-2 rounded-lg transition-colors"
            >
              Painel Admin
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
