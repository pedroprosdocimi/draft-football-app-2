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

function formatPosition(value) {
  return `${value}\u00BA`;
}

function stageMatchLabel(stageLabel, matchNumber) {
  return `${formatPosition(matchNumber)} ${stageLabel}`;
}

const BRACKET_LAYOUT = {
  canvasPaddingX: 20,
  canvasPaddingY: 20,
  headerHeight: 56,
  columnWidth: 300,
  columnGap: 92,
  cardHeight: 164,
  rowGap: 26,
};

function roundRangeLabel(data) {
  if (data.type === 'hybrid' && data.league_phase_start_round_number && data.league_phase_end_round_number) {
    return `Fase de liga: ${data.league_phase_start_round_number}-${data.league_phase_end_round_number} • final na rodada ${data.end_round_number}`;
  }
  return `Rodadas ${data.start_round_number} a ${data.end_round_number}`;
}

function ResultsTable({ title, rows, highlightTop = 0 }) {
  const allRounds = rows[0]?.round_scores || [];
  if (!rows?.length) return null;

  return (
    <section className="rounded-3xl border border-gray-800 bg-gray-900/70 p-5 shadow-2xl shadow-black/20">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="text-sm text-gray-500">Pontuação acumulada rodada a rodada.</p>
        </div>
        {highlightTop > 0 && (
          <div className="rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-300">
            Top {highlightTop} vão ao mata-mata
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="px-3 py-2">Pos.</th>
              <th className="px-3 py-2">Time</th>
              <th className="px-3 py-2">Técnico</th>
              {allRounds.map((round) => (
                <th key={round.round_number} className="px-3 py-2 text-center">R{round.round_number}</th>
              ))}
              <th className="px-3 py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const highlighted = highlightTop > 0 && row.position <= highlightTop;
              return (
                <tr
                  key={row.user_id}
                  className={`border-b border-gray-900/80 text-gray-200 ${
                    highlighted ? 'bg-green-500/10' : ''
                  }`}
                >
                  <td className="px-3 py-3">
                    <span className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 font-semibold ${
                      highlighted ? 'bg-green-500/20 text-green-200' : 'bg-white/5 text-white'
                    }`}>
                      {formatPosition(row.position)}
                    </span>
                  </td>
                  <td className={`px-3 py-3 font-semibold ${highlighted ? 'text-green-100' : 'text-white'}`}>
                    {row.team_name}
                  </td>
                  <td className="px-3 py-3 text-gray-400">{row.coach_name}</td>
                  {row.round_scores.map((round) => (
                    <td key={round.round_number} className="px-3 py-3 text-center">
                      <span className={round.played ? (highlighted ? 'text-green-100' : 'text-white') : 'text-gray-600'}>
                        {formatScore(round.score)}
                      </span>
                    </td>
                  ))}
                  <td className={`px-3 py-3 text-right font-bold ${highlighted ? 'text-green-300' : 'text-draft-gold'}`}>
                    {formatScore(row.total_score)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function buildBracketLayout(stages) {
  if (!stages?.length) return null;

  const { canvasPaddingY, headerHeight, cardHeight, rowGap } = BRACKET_LAYOUT;
  const firstStageMatchCount = stages[0]?.matches?.length || 1;
  const firstStageOrder = buildDisplayOrder(firstStageMatchCount);
  const firstStageSlotByMatch = new Map(firstStageOrder.map((matchIndex, slotIndex) => [matchIndex, slotIndex]));
  const firstStageCenters = new Array(firstStageMatchCount).fill(0);
  const stageLeafSets = [];
  const stageLayouts = [];

  for (let matchIndex = 0; matchIndex < firstStageMatchCount; matchIndex++) {
    const slotIndex = firstStageSlotByMatch.get(matchIndex) ?? matchIndex;
    firstStageCenters[matchIndex] = (
      canvasPaddingY +
      headerHeight +
      (cardHeight / 2) +
      slotIndex * (cardHeight + rowGap)
    );
  }

  stageLeafSets[0] = Array.from({ length: firstStageMatchCount }, (_, matchIndex) => [matchIndex]);
  stageLayouts[0] = {
    ...stages[0],
    cards: stages[0].matches.map((match, matchIndex) => ({
      match,
      center: firstStageCenters[matchIndex],
      top: firstStageCenters[matchIndex] - (cardHeight / 2),
    })),
  };

  for (let stageIndex = 1; stageIndex < stages.length; stageIndex++) {
    const prevMatchCount = stages[stageIndex - 1].matches.length;
    const leafSets = [];

    for (let matchIndex = 0; matchIndex < stages[stageIndex].matches.length; matchIndex++) {
      leafSets[matchIndex] = [
        ...stageLeafSets[stageIndex - 1][matchIndex],
        ...stageLeafSets[stageIndex - 1][prevMatchCount - 1 - matchIndex],
      ];
    }

    stageLeafSets[stageIndex] = leafSets;
    stageLayouts[stageIndex] = {
      ...stages[stageIndex],
      cards: stages[stageIndex].matches.map((match, matchIndex) => {
        const leaves = leafSets[matchIndex];
        const center = leaves.reduce((sum, leafIndex) => sum + firstStageCenters[leafIndex], 0) / leaves.length;
        return {
          match,
          center,
          top: center - (cardHeight / 2),
        };
      }),
    };
  }

  const height = (
    canvasPaddingY +
    headerHeight +
    firstStageMatchCount * BRACKET_LAYOUT.cardHeight +
    Math.max(0, firstStageMatchCount - 1) * BRACKET_LAYOUT.rowGap +
    canvasPaddingY
  );

  return { height, stageLayouts };
}

function buildDisplayOrder(matchCount) {
  const matches = Array.from({ length: matchCount }, (_, index) => index);
  return buildDisplayOrderFromList(matches);
}

function buildDisplayOrderFromList(matches) {
  if (matches.length <= 1) return matches;

  const pairs = [];
  for (let left = 0, right = matches.length - 1; left <= right; left += 1, right -= 1) {
    if (left === right) pairs.push([matches[left]]);
    else pairs.push([matches[left], matches[right]]);
  }

  const pairOrder = buildDisplayOrderFromList(Array.from({ length: pairs.length }, (_, index) => index));
  return pairOrder.flatMap((pairIndex) => pairs[pairIndex]);
}

function BracketTeamRow({ team, isWinner, isTop }) {
  const label = team?.team_name || 'A definir';
  const subtitle = team?.coach_name || (team?.played ? 'confronto em andamento' : '');

  return (
    <div
      className={`flex items-center justify-between gap-3 px-4 py-3 ${
        isTop ? 'border-b border-white/10' : ''
      } ${isWinner ? 'bg-draft-gold/10' : ''}`}
    >
      <div className="min-w-0">
        <p className={`break-words text-sm font-semibold leading-snug ${isWinner ? 'text-draft-gold' : 'text-white'}`}>
          {label}
        </p>
        {subtitle && (
          <p className="mt-1 break-words text-[11px] uppercase tracking-wide text-gray-500">
            {subtitle}
          </p>
        )}
      </div>

      <div className="text-right">
        <p className={`text-base font-black ${team?.played ? 'text-white' : 'text-gray-600'}`}>
          {team ? formatScore(team.score) : '—'}
        </p>
        <p className="text-[10px] uppercase tracking-wide text-gray-600">
          {team?.played ? 'jogou' : 'pendente'}
        </p>
      </div>
    </div>
  );
}

function BracketSection({ stages }) {
  if (!stages?.length) return null;

  const layout = buildBracketLayout(stages);
  const { canvasPaddingX, canvasPaddingY, headerHeight, columnWidth, columnGap, cardHeight } = BRACKET_LAYOUT;
  const canvasWidth = (
    canvasPaddingX * 2 +
    stages.length * columnWidth +
    Math.max(0, stages.length - 1) * columnGap
  );

  return (
    <section className="rounded-3xl border border-gray-800 bg-gray-900/70 p-5 shadow-2xl shadow-black/20">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white">Chave do mata-mata</h2>
        <p className="text-sm text-gray-500">Visualização gráfica dos confrontos até a final.</p>
      </div>

      <div className="overflow-x-auto pb-2">
        <div
          className="relative rounded-[28px] border border-white/5 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))]"
          style={{
            width: `${canvasWidth}px`,
            minHeight: `${layout.height}px`,
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 0)',
            backgroundSize: '20px 20px',
          }}
        >
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox={`0 0 ${canvasWidth} ${layout.height}`}
            preserveAspectRatio="none"
          >
            {layout.stageLayouts.slice(0, -1).flatMap((stage, stageIndex) => {
              const stageX = canvasPaddingX + stageIndex * (columnWidth + columnGap);
              const nextX = canvasPaddingX + (stageIndex + 1) * (columnWidth + columnGap);
              const startX = stageX + columnWidth;
              const middleX = startX + columnGap / 2;
              const nextCount = layout.stageLayouts[stageIndex + 1].cards.length;

              return stage.cards.map((card, matchIndex) => {
                const parentIndex = Math.min(matchIndex, stage.cards.length - 1 - matchIndex, nextCount - 1);
                const targetCenter = layout.stageLayouts[stageIndex + 1].cards[parentIndex].center;
                return (
                  <g key={`${stage.stage_number}-${matchIndex}`}>
                    <line x1={startX} y1={card.center} x2={middleX} y2={card.center} stroke="rgba(250,204,21,0.45)" strokeWidth="2" />
                    <line x1={middleX} y1={card.center} x2={middleX} y2={targetCenter} stroke="rgba(250,204,21,0.45)" strokeWidth="2" />
                    <line x1={middleX} y1={targetCenter} x2={nextX} y2={targetCenter} stroke="rgba(250,204,21,0.45)" strokeWidth="2" />
                  </g>
                );
              });
            })}
          </svg>

          {layout.stageLayouts.map((stage, stageIndex) => {
            const x = canvasPaddingX + stageIndex * (columnWidth + columnGap);
            return (
              <div key={`${stage.stage_number}-${stage.round_number}`}>
                <div
                  className="absolute"
                  style={{ left: `${x}px`, top: `${canvasPaddingY}px`, width: `${columnWidth}px`, height: `${headerHeight}px` }}
                >
                  <div className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 backdrop-blur-sm">
                    <p className="text-xs uppercase tracking-[0.25em] text-gray-500">Rodada {stage.round_number}</p>
                    <p className="mt-1 text-sm font-bold text-white">{stage.label}</p>
                  </div>
                </div>

                {stage.cards.map(({ match, top }) => {
                  const homeWinner = match.resolved && match.winner_user_id && match.home?.user_id === match.winner_user_id;
                  const awayWinner = match.resolved && match.winner_user_id && match.away?.user_id === match.winner_user_id;

                  return (
                    <div
                      key={match.match_number}
                      className="absolute overflow-hidden rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,15,23,0.96),rgba(15,23,35,0.82))] shadow-[0_18px_60px_rgba(0,0,0,0.35)] backdrop-blur-sm"
                      style={{ left: `${x}px`, top: `${top}px`, width: `${columnWidth}px`, height: `${cardHeight}px` }}
                    >
                      <div className="border-b border-white/10 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                        {stage.cards.length === layout.stageLayouts[0].cards.length
                          ? stageMatchLabel(stage.label, match.match_number)
                          : stageMatchLabel(stage.label, match.match_number)}
                      </div>
                      <BracketTeamRow team={match.home} isWinner={homeWinner} isTop />
                      <BracketTeamRow team={match.away} isWinner={awayWinner} />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function Championship({ championshipId, shareCode, user, onGoHome }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

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
        if (!res.ok) throw new Error(payload.error || 'Não foi possível carregar o campeonato.');
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
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
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
                    {data.participants.length} participantes • rodada ativa atual {data.current_active_round_number || 'não definida'}
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Campeão atual</p>
                  <p className="mt-2 text-2xl font-bold text-white">{data.winner?.team_name || 'Em disputa'}</p>
                  <p className="mt-1 text-sm text-gray-400">{data.winner?.coach_name || 'Aguardando definição'}</p>
                  {link && (
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="mt-5 block w-full rounded-2xl border border-gray-800 bg-black/30 p-3 text-left transition-colors hover:border-draft-gold/30 hover:bg-draft-gold/10"
                    >
                      <p className="text-[11px] uppercase tracking-wide text-gray-600">
                        {copied ? 'Link copiado' : 'Link compartilhável'}
                      </p>
                      <p className="mt-1 break-all text-xs text-gray-300">{link}</p>
                    </button>
                  )}
                </div>
              </div>
            </section>

            {data.standings?.length > 0 && (
              <ResultsTable
                title={data.type === 'league' ? 'Classificação geral' : 'Classificação'}
                rows={data.standings}
              />
            )}

            {data.qualification_standings?.length > 0 && (
              <ResultsTable
                title="Classificação da fase inicial"
                rows={data.qualification_standings}
                highlightTop={data.knockout_size || 0}
              />
            )}

            {data.type === 'hybrid' && !data.knockout_ready && (
              <section className="rounded-3xl border border-sky-500/20 bg-sky-500/10 px-5 py-4 text-sm text-sky-200">
                O chaveamento final já aparece projetado pelas posições da fase inicial e será preenchido com os times reais depois da rodada {data.league_phase_end_round_number}.
              </section>
            )}

            <BracketSection stages={data.bracket} />
          </div>
        )}
      </div>
    </div>
  );
}
