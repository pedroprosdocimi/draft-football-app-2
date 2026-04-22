import React, { useEffect, useMemo, useState } from 'react';
import { API_URL } from '../config.js';

function authFetch(path) {
  const token = localStorage.getItem('draft_token');
  return fetch(`${API_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

function typeLabel(type) {
  if (type === 'league') return 'Pontos corridos';
  if (type === 'knockout') return 'Mata-mata';
  if (type === 'hybrid') return 'Misto';
  return type;
}

function typeClass(type) {
  if (type === 'league') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
  if (type === 'knockout') return 'border-rose-500/30 bg-rose-500/10 text-rose-300';
  return 'border-sky-500/30 bg-sky-500/10 text-sky-300';
}

function shareLink(shareCode) {
  return `${window.location.origin}${window.location.pathname}?championship=${shareCode}`;
}

function formatScore(value) {
  return Number(value || 0).toFixed(1);
}

function roundRangeLabel(data) {
  if (data.type === 'hybrid' && data.league_phase_start_round_number && data.league_phase_end_round_number) {
    return `Fase de liga: ${data.league_phase_start_round_number}-${data.league_phase_end_round_number} • Final em ${data.end_round_number}`;
  }
  return `Rodadas ${data.start_round_number} a ${data.end_round_number}`;
}

function ResultsTable({ title, rows }) {
  const allRounds = rows[0]?.round_scores || [];
  if (!rows?.length) return null;

  return (
    <section className="rounded-3xl border border-gray-800 bg-gray-900/70 p-5 shadow-2xl shadow-black/20">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="text-sm text-gray-500">Pontuacao acumulada rodada a rodada.</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="px-3 py-2">Pos</th>
              <th className="px-3 py-2">Time</th>
              <th className="px-3 py-2">Tecnico</th>
              {allRounds.map((round) => (
                <th key={round.round_number} className="px-3 py-2 text-center">R{round.round_number}</th>
              ))}
              <th className="px-3 py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.user_id} className="border-b border-gray-900/80 text-gray-200">
                <td className="px-3 py-3">
                  <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-white/5 px-2 font-semibold text-white">
                    {row.position}
                  </span>
                </td>
                <td className="px-3 py-3 font-semibold text-white">{row.team_name}</td>
                <td className="px-3 py-3 text-gray-400">{row.coach_name}</td>
                {row.round_scores.map((round) => (
                  <td key={round.round_number} className="px-3 py-3 text-center">
                    <span className={round.played ? 'text-white' : 'text-gray-600'}>
                      {formatScore(round.score)}
                    </span>
                  </td>
                ))}
                <td className="px-3 py-3 text-right font-bold text-draft-gold">{formatScore(row.total_score)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function BracketSection({ stages }) {
  if (!stages?.length) return null;

  return (
    <section className="rounded-3xl border border-gray-800 bg-gray-900/70 p-5 shadow-2xl shadow-black/20">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white">Chave do mata-mata</h2>
        <p className="text-sm text-gray-500">Cada fase usa a pontuacao da rodada correspondente.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {stages.map((stage) => (
          <div key={`${stage.stage_number}-${stage.round_number}`} className="rounded-2xl border border-gray-800 bg-black/20 p-4">
            <div className="mb-3">
              <p className="text-sm font-semibold text-white">{stage.label}</p>
              <p className="text-xs text-gray-500">Rodada {stage.round_number}</p>
            </div>

            <div className="space-y-3">
              {stage.matches.map((match) => (
                <div key={match.match_number} className="rounded-xl border border-gray-800 bg-gray-950/60 p-3">
                  {[match.home, match.away].map((team, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between gap-3 ${index === 0 ? 'mb-2 border-b border-gray-800/80 pb-2' : ''}`}
                    >
                      <div>
                        <p className="text-sm font-semibold text-white">{team?.team_name || 'A definir'}</p>
                        <p className="text-xs text-gray-500">{team?.coach_name || 'aguardando fase anterior'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-draft-gold">{team ? formatScore(team.score) : '—'}</p>
                        <p className="text-[11px] text-gray-600">{team?.played ? 'jogou' : 'pendente'}</p>
                      </div>
                    </div>
                  ))}

                  <div className="mt-2 text-[11px] uppercase tracking-wide text-gray-500">
                    {match.resolved && match.winner_user_id ? 'Confronto resolvido' : 'Aguardando resultado'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Championship({ championshipId, shareCode, user, onGoHome }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await authFetch(
          shareCode ? `/public/championships/${shareCode}` : `/championships/${championshipId}`
        );
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error || 'Nao foi possivel carregar o campeonato.');
        if (!cancelled) setData(payload.data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (shareCode || championshipId) load();
    return () => { cancelled = true; };
  }, [championshipId, shareCode]);

  const link = useMemo(() => (data?.share_code ? shareLink(data.share_code) : ''), [data]);

  const handleCopyLink = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // noop
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.14),_transparent_30%),linear-gradient(180deg,_#070b11,_#0f1724)] px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onGoHome}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-gray-200 transition-colors hover:border-white/20 hover:text-white"
          >
            {user ? 'Voltar' : 'Fechar'}
          </button>
          {data?.share_code && (
            <button
              type="button"
              onClick={handleCopyLink}
              className="rounded-xl border border-draft-gold/30 bg-draft-gold/10 px-4 py-2 text-sm font-semibold text-draft-gold transition-colors hover:bg-draft-gold/20"
            >
              Copiar link
            </button>
          )}
        </div>

        {loading && (
          <div className="flex min-h-[40vh] items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-700 border-t-draft-gold" />
          </div>
        )}

        {!loading && error && (
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 px-6 py-5 text-sm text-red-300">
            {error}
          </div>
        )}

        {!loading && !error && data && (
          <div className="space-y-6">
            <section className="overflow-hidden rounded-[32px] border border-white/10 bg-black/25 shadow-2xl shadow-black/30">
              <div className="grid gap-6 px-6 py-6 md:grid-cols-[1.4fr_0.8fr] md:px-8">
                <div>
                  <div className="mb-4 flex items-center gap-3">
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${typeClass(data.type)}`}>
                      {typeLabel(data.type)}
                    </span>
                    <span className="text-xs uppercase tracking-[0.25em] text-gray-500">Campeonato</span>
                  </div>
                  <h1 className="text-3xl font-black tracking-tight text-white md:text-5xl">{data.name}</h1>
                  <p className="mt-3 max-w-2xl text-sm text-gray-400 md:text-base">
                    {roundRangeLabel(data)}
                  </p>
                  <p className="mt-2 text-sm text-gray-500">
                    {data.participants.length} participantes • rodada ativa atual {data.current_active_round_number || 'nao definida'}
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Campeao atual</p>
                  <p className="mt-2 text-2xl font-bold text-white">{data.winner?.team_name || 'Em disputa'}</p>
                  <p className="mt-1 text-sm text-gray-400">{data.winner?.coach_name || 'Aguardando definicao'}</p>
                  {link && (
                    <div className="mt-5 rounded-2xl border border-gray-800 bg-black/30 p-3">
                      <p className="text-[11px] uppercase tracking-wide text-gray-600">Link compartilhavel</p>
                      <p className="mt-1 break-all text-xs text-gray-300">{link}</p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-gray-800 bg-gray-900/70 p-5 shadow-2xl shadow-black/20">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">Participantes</h2>
                  <p className="text-sm text-gray-500">Times inscritos no campeonato.</p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {data.participants.map((participant) => (
                  <div key={participant.user_id} className="rounded-2xl border border-gray-800 bg-black/20 px-4 py-3">
                    <div>
                      <div>
                        <p className="font-semibold text-white">{participant.team_name}</p>
                        <p className="text-sm text-gray-500">{participant.coach_name}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {data.standings?.length > 0 && (
              <ResultsTable
                title={data.type === 'league' ? 'Classificacao geral' : 'Classificacao'}
                rows={data.standings}
              />
            )}

            {data.qualification_standings?.length > 0 && (
              <ResultsTable title="Classificacao da fase inicial" rows={data.qualification_standings} />
            )}

            {data.type === 'hybrid' && !data.knockout_ready && (
              <section className="rounded-3xl border border-sky-500/20 bg-sky-500/10 px-5 py-4 text-sm text-sky-200">
                O chaveamento final ja aparece projetado pelas posicoes da fase inicial e sera preenchido com os times reais depois da rodada {data.league_phase_end_round_number}.
              </section>
            )}

            <BracketSection stages={data.bracket} />
          </div>
        )}
      </div>
    </div>
  );
}
