import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { API_URL } from '../config.js';

/* ============================================================================
   Championship — Copa do Mundo 2026 redesign (draft11)
   ----------------------------------------------------------------------------
   LÓGICA 100% INTACTA. Preservados sem alteração: authFetch, refreshChampionship
   (auto 30s + focus + visibilitychange), hydratePlacementTeam,
   hydrateProjectedBracket, bracketHasPlacementLabels, BRACKET_LAYOUT,
   buildBracketLayout, buildDisplayOrder, buildDisplayOrderFromList, roundRangeLabel,
   handleCopyLink, handleRequestJoin e o cálculo de posicionamento + conectores SVG.
   Só a camada de apresentação mudou: Tailwind utilitário → classes .champ-*
   (bloco adicionado ao final de src/index.css).
   ========================================================================== */

function authFetch(path, options = {}) {
  const token = localStorage.getItem('draft_token');
  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}

function typeLabel(type) {
  if (type === 'league') return 'Pontos corridos';
  if (type === 'knockout') return 'Mata-mata';
  if (type === 'hybrid') return 'Misto';
  return type;
}

function shareLink(shareCode) {
  return `${window.location.origin}${window.location.pathname}?championship=${shareCode}`;
}

function formatScore(value) {
  return Number(value || 0).toFixed(1);
}

function formatPosition(value) {
  return `${value}º`;
}

function stageMatchLabel(stageLabel, matchNumber) {
  return `${formatPosition(matchNumber)} ${stageLabel}`;
}

function placementFromLabel(label) {
  const match = String(label || '').match(/^(\d+)(?:º|o|°)\s+Colocado$/i);
  return match ? Number(match[1]) : null;
}

function hydratePlacementTeam(team, standings) {
  const placement = placementFromLabel(team?.team_name);
  if (!placement) return team;

  const standing = standings?.[placement - 1];
  if (!standing) return team;

  return {
    ...team,
    user_id: standing.user_id,
    coach_name: standing.coach_name,
    team_name: standing.team_name,
    seed_order: standing.position,
  };
}

function hydrateProjectedBracket(stages, standings) {
  if (!stages?.length || !standings?.length) return stages;

  return stages.map((stage) => ({
    ...stage,
    matches: stage.matches.map((match) => ({
      ...match,
      home: hydratePlacementTeam(match.home, standings),
      away: hydratePlacementTeam(match.away, standings),
    })),
  }));
}

function bracketHasPlacementLabels(stages) {
  return Boolean(stages?.some((stage) => (
    stage.matches.some((match) => (
      placementFromLabel(match.home?.team_name) || placementFromLabel(match.away?.team_name)
    ))
  )));
}

const BRACKET_LAYOUT = {
  canvasPaddingX: 20,
  canvasPaddingY: 20,
  headerHeight: 56,
  headerGap: 18,
  columnWidth: 300,
  columnGap: 92,
  cardHeight: 164,
  rowGap: 26,
};

function roundRangeLabel(data) {
  if (data.type === 'hybrid' && data.league_phase_start_round_number && data.league_phase_end_round_number) {
    return `Fase de liga: rodadas ${data.league_phase_start_round_number}–${data.league_phase_end_round_number} · grande final na rodada ${data.end_round_number}`;
  }
  return `Rodadas ${data.start_round_number} a ${data.end_round_number}`;
}

// Ícones inline (apresentação) ─ usados nos banners e no link compartilhável.
function Glyph({ name, size = 18, stroke = 1.7 }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'link': return <svg {...p}><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.5 1.5" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.5-1.5" /></svg>;
    case 'info': return <svg {...p}><circle cx="12" cy="12" r="9" /><line x1="12" y1="11" x2="12" y2="16" /><circle cx="12" cy="8" r=".6" fill="currentColor" /></svg>;
    case 'clock': return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
    case 'x': return <svg {...p}><circle cx="12" cy="12" r="9" /><line x1="9" y1="9" x2="15" y2="15" /><line x1="15" y1="9" x2="9" y2="15" /></svg>;
    case 'user': return <svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>;
    default: return null;
  }
}

// ── Banner ───────────────────────────────────────────────────────────────────

function Banner({ tone, icon, children }) {
  return (
    <section className="champ-banner" data-tone={tone}>
      <div className="ic"><Glyph name={icon} /></div>
      <div className="champ-banner-body">{children}</div>
    </section>
  );
}

// ── Results table ────────────────────────────────────────────────────────────

function ResultsTable({ title, eyebrow, sub, rows, highlightTop = 0 }) {
  const allRounds = rows[0]?.round_scores || [];
  if (!rows?.length) return null;

  return (
    <section className="champ-section">
      <div className="champ-sechead">
        <div>
          <span className="champ-sec-eyebrow"><span className="star">★</span> {eyebrow}</span>
          <div className="champ-sec-title">{title}</div>
          <div className="champ-sec-sub">{sub || 'Pontuação acumulada rodada a rodada.'}</div>
        </div>
        {highlightTop > 0 && (
          <span className="champ-sec-badge"><span className="arr">→</span> Top {highlightTop} avançam ao mata-mata</span>
        )}
      </div>

      <div className="champ-table-wrap">
        <table className="champ-table">
          <thead>
            <tr>
              <th>Pos</th>
              <th>Time</th>
              <th>Técnico</th>
              {allRounds.map((round) => (
                <th key={round.round_number} className="c">R{round.round_number}</th>
              ))}
              <th className="r">Pts</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const highlighted = highlightTop > 0 && row.position <= highlightTop;
              const q = highlightTop > 0 ? (highlighted ? 'in' : 'out') : 'none';
              return (
                <tr key={row.user_id} className="champ-row" data-q={q}>
                  <td><span className="champ-pos">{formatPosition(row.position)}</span></td>
                  <td>
                    <span className="champ-team">
                      {row.team_name}
                      {highlighted && <span className="champ-qual-badge">→ Mata-mata</span>}
                    </span>
                  </td>
                  <td className="champ-coach">{row.coach_name}</td>
                  {row.round_scores.map((round) => (
                    <td key={round.round_number} className="champ-rscore" data-played={Boolean(round.played)}>
                      {formatScore(round.score)}
                    </td>
                  ))}
                  <td className="champ-total">{formatScore(row.total_score)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ── Group stage (fase de grupos estilo Copa) ─────────────────────────────────
// Renderiza a fase inicial como N grupos quando os dados trazem grupo.
// Contrato (qualquer um dos dois):
//   a) data.qualification_groups = [{ label:'A', advance:2, rows:[standingRow...] }]
//   b) data.qualification_standings com row.group ('A'|'B'|...) + row.group_position
// Sem grupo nos dados → null (cai no fallback da tabela plana).
function buildGroups(data) {
  if (Array.isArray(data?.qualification_groups) && data.qualification_groups.length) {
    return data.qualification_groups.map((g) => ({
      label: g.label,
      advance: g.advance || 2,
      rows: g.rows || [],
    }));
  }
  const rows = data?.qualification_standings;
  if (Array.isArray(rows) && rows.some((r) => r.group != null)) {
    const map = new Map();
    for (const r of rows) {
      const key = String(r.group);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(r);
    }
    const perGroup = Math.max(1, Math.round((data.knockout_size || 0) / map.size)) || 2;
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([label, gr]) => ({
        label,
        advance: data.group_advance || perGroup || 2,
        rows: gr.slice().sort((a, b) => (a.group_position ?? a.position) - (b.group_position ?? b.position)),
      }));
  }
  return null;
}

function GroupStage({ groups, totalAdvance }) {
  if (!groups?.length) return null;
  return (
    <section className="champ-section">
      <div className="champ-sechead">
        <div>
          <span className="champ-sec-eyebrow"><span className="star">★</span> Fase de grupos</span>
          <div className="champ-sec-title">{groups.length} grupos</div>
          <div className="champ-sec-sub">Os primeiros de cada grupo avançam ao mata-mata.</div>
        </div>
        {totalAdvance > 0 && (
          <span className="champ-sec-badge"><span className="arr">→</span> {totalAdvance} classificados</span>
        )}
      </div>
      <div className="champ-groups">
        {groups.map((g) => (
          <div className="champ-group" key={g.label}>
            <div className="champ-group-head">
              <span className="g"><span className="lt">{g.label}</span> Grupo {g.label}</span>
              <span className="q">{g.advance} classificados</span>
            </div>
            <table className="champ-gtable">
              <thead>
                <tr>
                  <th />
                  <th className="l">Time</th>
                  {(g.rows[0]?.round_scores || []).map((r) => (
                    <th key={r.round_number}>R{r.round_number}</th>
                  ))}
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {g.rows.map((row, i) => {
                  const pos = row.group_position ?? (i + 1);
                  const qualified = pos <= g.advance;
                  return (
                    <tr className="champ-grow" data-q={qualified ? 'in' : 'out'} key={row.user_id}>
                      <td className="champ-gpos">{pos}</td>
                      <td>
                        <span className="champ-gteam">
                          <span className="dot">{(row.team_name || '?')[0]}</span>
                          <span className="nm">{row.team_name}</span>
                        </span>
                      </td>
                      {(row.round_scores || []).map((r) => (
                        <td key={r.round_number} className="champ-gnum" data-played={Boolean(r.played)}>
                          {formatScore(r.score)}
                        </td>
                      ))}
                      <td className="champ-gpts">{formatScore(row.total_score)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Bracket layout (INTACTO) ─────────────────────────────────────────────────

function buildBracketLayout(stages) {
  if (!stages?.length) return null;

  const { canvasPaddingY, headerHeight, headerGap, cardHeight, rowGap } = BRACKET_LAYOUT;
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
      headerGap +
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
    headerGap +
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

// ── Bracket presentation ─────────────────────────────────────────────────────

function BracketTeamRow({ team, isWinner, isTop }) {
  const label = team?.team_name || 'A definir';
  const subtitle = team?.coach_name || (team?.played ? 'confronto em andamento' : '');

  return (
    <div className="champ-team-row" data-top={Boolean(isTop)} data-winner={Boolean(isWinner)}>
      <div style={{ minWidth: 0 }}>
        <div className="champ-team-name">{label}</div>
        {subtitle && <div className="champ-team-sub">{subtitle}</div>}
      </div>
      <div className="champ-team-score">
        <div className="v" data-played={Boolean(team?.played)}>{team ? formatScore(team.score) : '—'}</div>
        <div className="u">{team?.played ? 'jogou' : 'pendente'}</div>
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
  const firstStageCount = layout.stageLayouts[0]?.cards.length || 0;

  return (
    <section className="champ-section">
      <div className="champ-sechead">
        <div>
          <span className="champ-sec-eyebrow"><span className="star">★</span> Mata-mata</span>
          <div className="champ-sec-title">Chave do mata-mata</div>
          <div className="champ-sec-sub">Visualização gráfica dos confrontos até a final.</div>
        </div>
      </div>

      <div className="champ-bracket-wrap">
        <div
          className="champ-bracket-canvas"
          style={{ position: 'relative', width: `${canvasWidth}px`, minHeight: `${layout.height}px` }}
        >
          <svg
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
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
                    <line x1={startX} y1={card.center} x2={middleX} y2={card.center} stroke="rgba(245,166,35,0.55)" strokeWidth="2" />
                    <line x1={middleX} y1={card.center} x2={middleX} y2={targetCenter} stroke="rgba(245,166,35,0.55)" strokeWidth="2" />
                    <line x1={middleX} y1={targetCenter} x2={nextX} y2={targetCenter} stroke="rgba(245,166,35,0.55)" strokeWidth="2" />
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
                  className="champ-col-head"
                  style={{ position: 'absolute', left: `${x}px`, top: `${canvasPaddingY}px`, width: `${columnWidth}px` }}
                >
                  <div className="r">Rodada {stage.round_number}</div>
                  <div className="s"><span className="star">★</span> {stage.label}</div>
                </div>

                {stage.cards.map(({ match, top }) => {
                  const homeWinner = match.resolved && match.winner_user_id && match.home?.user_id === match.winner_user_id;
                  const awayWinner = match.resolved && match.winner_user_id && match.away?.user_id === match.winner_user_id;

                  return (
                    <div
                      key={match.match_number}
                      className="champ-match"
                      style={{ position: 'absolute', left: `${x}px`, top: `${top}px`, width: `${columnWidth}px`, height: `${cardHeight}px` }}
                    >
                      <div className="champ-match-head">{stageMatchLabel(stage.label, match.match_number)}</div>
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

// ── Root component (LÓGICA INTACTA) ──────────────────────────────────────────

export default function Championship({ championshipId, shareCode, user, onGoHome }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submittingJoin, setSubmittingJoin] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const path = shareCode
          ? (user ? `/championships/share/${shareCode}` : `/public/championships/${shareCode}`)
          : `/championships/${championshipId}`;
        const res = await authFetch(path);
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
  }, [championshipId, shareCode, user]);

  const refreshChampionship = useCallback(async () => {
    if (!shareCode && !championshipId) return;

    try {
      const path = shareCode
        ? (user ? `/championships/share/${shareCode}` : `/public/championships/${shareCode}`)
        : `/championships/${championshipId}`;
      const res = await authFetch(path);
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Não foi possível carregar o campeonato.');
      setData(payload.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, [championshipId, shareCode, user]);

  useEffect(() => {
    const refresh = () => {
      if (!document.hidden) refreshChampionship();
    };

    const intervalID = window.setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);

    return () => {
      window.clearInterval(intervalID);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [refreshChampionship]);

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

  const handleRequestJoin = async () => {
    if (!shareCode) return;
    setSubmittingJoin(true);
    setError(null);
    try {
      const res = await authFetch(`/championships/share/${shareCode}/join-request`, {
        method: 'POST',
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Não foi possível solicitar participação.');
      setData(payload.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingJoin(false);
    }
  };

  const viewerRequestStatus = data?.viewer_join_request_status || null;
  const shouldShowJoinPrompt = user && data && !data.viewer_is_participant;
  const hydratedBracket = useMemo(
    () => hydrateProjectedBracket(data?.bracket, data?.qualification_standings),
    [data?.bracket, data?.qualification_standings],
  );
  const hasProjectedPlacementLabels = bracketHasPlacementLabels(hydratedBracket);

  return (
    <div className="champ-screen">
      <div className="champ-wrap">
        <button type="button" className="champ-back" onClick={onGoHome}>
          ‹ {user ? 'Voltar' : 'Fechar'}
        </button>

        {loading && (
          <div className="champ-loading"><div className="champ-spinner" /></div>
        )}

        {!loading && error && (
          <Banner tone="danger" icon="x">{error}</Banner>
        )}

        {!loading && !error && data && (
          <>
            {/* Hero */}
            <section className="champ-hero">
              <div className="champ-hero-grid">
                <div>
                  <div className="champ-hero-head">
                    <span className="champ-eyebrow"><span className="live-dot" /> Copa do Mundo 2026</span>
                    <span className="champ-type" data-type={data.type}><span className="d" />{typeLabel(data.type)}</span>
                  </div>
                  <h1 className="champ-title">{data.name}</h1>
                  <p className="champ-range">{roundRangeLabel(data)}</p>
                  <p className="champ-parts">
                    <span className="mono">{data.participants.length}</span> participantes
                    <span className="sep" />
                    rodada ativa <span className="mono">{data.current_active_round_number || 'não definida'}</span>
                  </p>
                </div>

                <div className="champ-side">
                  <div className="champ-side-lbl"><span className="star">★</span> Campeão atual</div>
                  <div className="champ-winner">{data.winner?.team_name || 'Em disputa'}</div>
                  <div className="champ-winner-coach">{data.winner?.coach_name || 'Aguardando a grande final'}</div>
                  {link && (
                    <button type="button" className="champ-share" data-copied={copied} onClick={handleCopyLink}>
                      <span className="k"><span className="ic"><Glyph name="link" size={12} stroke={2} /></span> {copied ? 'Link copiado' : 'Link compartilhável'}</span>
                      <span className="v">{link}</span>
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* Join banners */}
            {!user && shareCode && (
              <Banner tone="info" icon="info">Faça login para solicitar participação neste campeonato.</Banner>
            )}

            {shouldShowJoinPrompt && viewerRequestStatus === 'pending' && (
              <Banner tone="warn" icon="clock">Sua solicitação de participação está pendente de aprovação do admin.</Banner>
            )}

            {shouldShowJoinPrompt && viewerRequestStatus === 'declined' && (
              <Banner tone="danger" icon="x">Sua solicitação anterior foi recusada. Você pode solicitar participação novamente.</Banner>
            )}

            {shouldShowJoinPrompt && viewerRequestStatus !== 'pending' && (
              <section className="champ-banner" data-tone="cta">
                <div className="ic"><Glyph name="user" /></div>
                <div className="champ-banner-body">
                  <div className="champ-banner-row">
                    <div>
                      <div className="champ-banner-title">Quer entrar neste campeonato?</div>
                      <div className="champ-banner-sub">Envie um pedido e o admin poderá aprovar ou recusar sua participação.</div>
                    </div>
                    <button
                      type="button"
                      className="champ-btn champ-btn-primary"
                      onClick={handleRequestJoin}
                      disabled={submittingJoin}
                    >
                      {submittingJoin ? 'Enviando...' : viewerRequestStatus === 'declined' ? 'Solicitar novamente' : 'Solicitar participação'}
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* League standings */}
            {data.standings?.length > 0 && (
              <ResultsTable
                title={data.type === 'league' ? 'Classificação geral' : 'Classificação'}
                eyebrow={data.type === 'league' ? 'Pontos corridos' : 'Classificação'}
                rows={data.standings}
              />
            )}

            {/* Hybrid qualification phase — grupos quando disponíveis, senão tabela plana */}
            {(() => {
              const groups = buildGroups(data);
              if (groups) return <GroupStage groups={groups} totalAdvance={data.knockout_size || 0} />;
              if (data.qualification_standings?.length > 0) {
                return (
                  <ResultsTable
                    title="Classificação da fase inicial"
                    eyebrow="Fase de grupos"
                    rows={data.qualification_standings}
                    highlightTop={data.knockout_size || 0}
                  />
                );
              }
              return null;
            })()}

            {/* Projected bracket notice */}
            {data.type === 'hybrid' && !data.knockout_ready && hasProjectedPlacementLabels && (
              <Banner tone="info" icon="info">
                O chaveamento final já aparece projetado pelas posições da fase inicial e será preenchido com os times reais depois da rodada {data.league_phase_end_round_number}.
              </Banner>
            )}

            <BracketSection stages={hydratedBracket} />
          </>
        )}
      </div>
    </div>
  );
}
