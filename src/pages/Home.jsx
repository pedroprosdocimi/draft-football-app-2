import React, { useEffect, useMemo, useState } from 'react';
import { API_URL } from '../config.js';

/* ============================================================================
   Home — Copa do Mundo 2026 redesign (draft11)
   ----------------------------------------------------------------------------
   LÓGICA INTACTA: estado, props, handlers e chamadas de API são idênticos ao
   original. Só a camada de apresentação mudou: os style-objects inline viraram
   classes .home-* (ver bloco adicionado em src/index.css) e a marca "TT/Tira
   Tira" virou o emblema draft11 + identidade Copa do Mundo 2026.
   ========================================================================== */

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
  if (!round) return 'Rodada não definida';
  if (round.number) return `Rodada ${round.number}`;
  if (round.name) return round.name;
  return 'Rodada sem nome';
}

function formatDraftDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
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
  formation_pick: 'Escolha da formação',
  drafting: 'Titulares',
  bench_drafting: 'Reservas',
  captain_pick: 'Capitão',
  complete: 'Finalizado',
};
const STATUS_ORDER = ['formation_pick', 'drafting', 'bench_drafting', 'captain_pick', 'complete'];
const STEP_SHORT = ['Formação', 'Titulares', 'Reservas', 'Capitão', 'Final'];

// Decorative only — "seleções na disputa". Não depende de dados da API.
const HERO_FLAGS = ['br', 'ar', 'fr', 'es', 'pt', 'de', 'nl', 'hr'];

function Icon({ name, size = 16, stroke = 1.6 }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'logout': return <svg {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>;
    case 'trophy': return <svg {...p}><path d="M6 9H4a2 2 0 0 1-2-2V5h4" /><path d="M18 9h2a2 2 0 0 0 2-2V5h-4" /><path d="M6 5h12v6a6 6 0 0 1-12 0V5z" /><line x1="12" y1="15" x2="12" y2="19" /><path d="M8 21h8" /></svg>;
    case 'ranking': return <svg {...p}><rect x="2" y="12" width="5" height="9" rx="1" /><rect x="9.5" y="7" width="5" height="14" rx="1" /><rect x="17" y="3" width="5" height="18" rx="1" /></svg>;
    case 'play': return <svg {...p}><polygon points="6 4 20 12 6 20 6 4" fill="currentColor" /></svg>;
    case 'plus': return <svg {...p}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
    case 'history': return <svg {...p}><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /><path d="M12 7v5l3 2" /></svg>;
    case 'close': return <svg {...p}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
    case 'arrow-right': return <svg {...p}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>;
    case 'home': return <svg {...p}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z" /></svg>;
    case 'shield-admin': return <svg {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></svg>;
    default: return null;
  }
}

// Emblema draft11 — mesmo componente usado nas telas de Draft/Seleção.
function Emblem({ s = 34 }) {
  return (
    <span className="home-emblem" dangerouslySetInnerHTML={{ __html:
      `<svg width="${s}" height="${s}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs><linearGradient id="he${s}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1f7a46"/><stop offset="1" stop-color="#0b3a20"/></linearGradient>
        <clipPath id="hc${s}"><rect x="3" y="3" width="94" height="94" rx="26"/></clipPath></defs>
        <rect x="3" y="3" width="94" height="94" rx="26" fill="url(#he${s})"/>
        <g clip-path="url(#hc${s})">
          <rect x="3" y="3" width="15.666" height="94" fill="#ffffff" opacity="0.05"/>
          <rect x="18.666" y="3" width="15.666" height="94" fill="#06351c" opacity="0.30"/>
          <rect x="34.333" y="3" width="15.666" height="94" fill="#ffffff" opacity="0.05"/>
          <rect x="50" y="3" width="15.666" height="94" fill="#06351c" opacity="0.30"/>
          <rect x="65.666" y="3" width="15.666" height="94" fill="#ffffff" opacity="0.05"/>
          <rect x="81.333" y="3" width="15.666" height="94" fill="#06351c" opacity="0.30"/>
          <rect x="3" y="3" width="94" height="48" rx="26" fill="#ffffff" opacity="0.05"/>
        </g>
        <rect x="7" y="7" width="86" height="86" rx="22" fill="none" stroke="#fbd07a" stroke-width="0.9" opacity="0.55"/>
        <text x="50" y="49" text-anchor="middle" dominant-baseline="central" font-family="'Bricolage Grotesque',sans-serif" font-weight="800" font-size="44" letter-spacing="-2" fill="#f6f8f6">11</text>
        <text x="50" y="72" text-anchor="middle" font-family="'Bricolage Grotesque',sans-serif" font-weight="700" font-size="8" letter-spacing="4" fill="#fbd07a">DRAFT</text>
      </svg>`
    }} />
  );
}

// ── Shared sub-components ────────────────────────────────────────────────────

function Brand({ large = false }) {
  return (
    <div className="home-brand">
      <Emblem s={large ? 40 : 34} />
      <div>
        <div className="home-wm" style={{ fontSize: large ? 22 : 19 }}>draft<span className="g">11</span></div>
        <div className="home-wm-sub">Copa do Mundo 2026</div>
      </div>
    </div>
  );
}

function Avatar({ name, size = 30 }) {
  return (
    <div className="home-avatar" style={{ width: size, height: size, fontSize: size >= 36 ? 13 : 12 }}>
      {name?.[0] || '?'}
    </div>
  );
}

function AdminPill() {
  return <span className="home-admin">Admin</span>;
}

function Spinner({ large = false }) {
  return (
    <div style={{ border: `${large ? 3 : 2}px solid rgba(255,255,255,.1)`, borderTopColor: large ? '#46c97a' : '#f5a623', borderRadius: '50%', animation: 'spin .9s linear infinite' }}
      className={large ? 'w-8 h-8' : 'w-[18px] h-[18px]'} />
  );
}

function RankTile({ rank, small = false }) {
  return (
    <div className={`home-rank${small ? ' home-rank-sm' : ''}`} data-r={rank <= 3 ? rank : 'x'}>
      {rank}
    </div>
  );
}

function StepperBar({ stepIndex }) {
  return (
    <>
      <div className="home-steps">
        {STATUS_ORDER.map((s, i) => (
          <div key={s} className="home-step" data-state={i < stepIndex ? 'done' : i === stepIndex ? 'now' : undefined} />
        ))}
      </div>
      <div className="home-steplabels">
        {STEP_SHORT.map((l, i) => (
          <div key={l} data-state={i === stepIndex ? 'now' : undefined}>{l}</div>
        ))}
      </div>
    </>
  );
}

function EmptyState({ icon, title, sub }) {
  return (
    <div className="home-empty">
      <div className="ic"><Icon name={icon} size={20} /></div>
      <div className="t">{title}</div>
      {sub && <div className="s">{sub}</div>}
    </div>
  );
}

function SectionHead({ title, count }) {
  return (
    <div className="home-sechead">
      <span className="t">{title}</span>
      <span className="home-count">{count}</span>
    </div>
  );
}

function HeroFlags() {
  return (
    <div className="home-flags">
      {HERO_FLAGS.map(f => <span key={f} className={`fi fi-${f}`} />)}
      <span className="more">+ 24 seleções</span>
    </div>
  );
}

// ── Buttons ──────────────────────────────────────────────────────────────────

function Btn({ variant = 'primary', size, block, className = '', children, ...rest }) {
  const cls = [
    'home-btn', `home-btn-${variant}`,
    size === 'lg' && 'home-btn-lg',
    size === 'sm' && 'home-btn-sm',
    block && 'home-btn-block',
    className,
  ].filter(Boolean).join(' ');
  return <button className={cls} {...rest}>{children}</button>;
}

// ── Standings bottom-sheet ───────────────────────────────────────────────────

function StandingsModal({ open, loading, error, currentRound, standings, onClose, onViewDraft }) {
  if (!open) return null;
  return (
    <div className="home-sheet-back" onClick={onClose}>
      <div className="home-sheet" onClick={e => e.stopPropagation()}>
        <div className="home-sheet-grip" />
        <div className="home-sheet-head">
          <div>
            <div className="home-eyebrow" style={{ marginBottom: 4 }}>Classificação <span className="sep" /> <span className="muted">Fase de grupos</span></div>
            <div className="home-sheet-title">{formatRoundLabel(currentRound)}</div>
          </div>
          <button className="home-icon-btn" style={{ color: 'var(--text-2)', borderColor: 'var(--line)' }} onClick={onClose}>
            <Icon name="close" size={14} />
          </button>
        </div>
        <div className="home-sheet-body">
          {loading && <div className="flex justify-center py-10"><Spinner large /></div>}
          {!loading && error && <div className="home-error" style={{ marginTop: 0 }}>{error}</div>}
          {!loading && !error && standings.length === 0 && (
            <EmptyState icon="ranking" title="Nenhum time finalizado" sub="Ainda não há resultados para esta rodada." />
          )}
          {!loading && !error && standings.length > 0 && standings.map((item, i) => (
            <div key={item.draft_id} className="home-standrow" onClick={() => onViewDraft(item.draft_id)}>
              <RankTile rank={i + 1} />
              <div style={{ minWidth: 0 }}>
                <div className="home-stand-name">{item.team_name}</div>
                <div className="home-stand-meta">
                  <span className="mono">{item.formation}</span>
                  <span className="sep" /><span>{item.coach_name}</span>
                  <span className="sep" /><span>{formatDraftDate(item.updated_at)}</span>
                </div>
              </div>
              <div className="home-stand-score">{formatScore(item.score)}<span className="u">Pontos</span></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Hero (convocação) ────────────────────────────────────────────────────────

function Hero({ large, loading, currentRound, children }) {
  return (
    <div className={`home-hero${large ? ' home-hero-lg' : ''}`}>
      <div className="home-hero-in">
        <div className="home-hero-row">
          <span className="home-eyebrow">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span className="live-dot" /> Rodada ativa
            </span>
            <span className="sep" /><span className="muted">Fase de grupos</span>
          </span>
          <span className="home-wc"><span className="star">★</span> COPA 2026</span>
        </div>
        <div className="home-hero-title">{loading ? '...' : formatRoundLabel(currentRound)}</div>
        <div className="home-hero-sub">
          {currentRound
            ? (large
              ? 'Convoque sua seleção para a rodada. Monte a escalação, defina o capitão e dispute pontos contra os outros técnicos rumo à taça.'
              : 'Convoque sua seleção e dispute a rodada rumo à taça.')
            : 'Defina a rodada ativa no painel admin.'}
        </div>
        <HeroFlags />
        {children}
      </div>
    </div>
  );
}

// ── Progress card ────────────────────────────────────────────────────────────

function ProgressCard({ large, draft, stepIndex }) {
  return (
    <div className={`home-progress${large ? ' home-progress-lg' : ''}`}>
      <div style={{ display: 'flex', alignItems: 'center', gap: large ? 12 : 10, flexWrap: 'wrap' }}>
        <span className="home-fmt">{draft.formation || 'A definir'}</span>
        <span className="home-status"><span className="dot" />{STATUS_LABELS[draft.status]}</span>
      </div>
      <div className="home-prog-note">Draft em andamento · {formatRoundLabel(draft.round)}</div>
      <StepperBar stepIndex={stepIndex} />
    </div>
  );
}

// ── Mobile layout ────────────────────────────────────────────────────────────

function MobileLayout(props) {
  const {
    user, onLogout, onGoAdmin, onStartDraft, onOpenChampionship,
    activeTab, setActiveTab, currentRound, currentRoundActiveDraft, canCreateDraft,
    creating, error, loading, playedRounds, playedRoundsLoading, championships,
    standingsOpen, setStandingsOpen, standingsLoading, standingsError, standings, standingsRound,
    stepIndex, handleCreateDraft, handleOpenStandings, handleOpenRoundStandings, handleViewStandingsDraft,
  } = props;

  const tabs = [['current', 'Rodada atual'], ['previous', 'Rodadas'], ['championships', 'Campeonatos']];
  const tabIndex = tabs.findIndex(([t]) => t === activeTab);

  return (
    <div className="home-app">
      <StandingsModal open={standingsOpen} loading={standingsLoading} error={standingsError}
        currentRound={standingsRound || currentRound} standings={standings}
        onClose={() => setStandingsOpen(false)} onViewDraft={handleViewStandingsDraft} />

      <div className="home-inner">
        {/* Header */}
        <div className="home-head">
          <Brand />
          <div className="home-head-user">
            <div className="home-head-name">
              {user.name?.split(' ')[0]}
              {user.is_admin && <div style={{ marginTop: 3 }}><AdminPill /></div>}
            </div>
            <Avatar name={user.name} />
            <button className="home-icon-btn" onClick={onLogout}><Icon name="logout" size={14} /></button>
          </div>
        </div>

        {/* Tab pill */}
        <div className="home-tabs">
          <div className="home-tab-ind" style={{ transform: `translateX(${tabIndex * 100}%)` }} />
          {tabs.map(([tab, label]) => (
            <button key={tab} className="home-tab" data-active={activeTab === tab} onClick={() => setActiveTab(tab)}>
              {label}
            </button>
          ))}
        </div>

        {/* Scrollable content */}
        <div className="home-scroll">

          {/* ── Rodada atual ── */}
          {activeTab === 'current' && (
            <>
              <Hero loading={loading} currentRound={currentRound}>
                <div className="home-hero-cta">
                  <Btn variant="ghost" onClick={handleOpenStandings} disabled={!currentRound}>
                    <Icon name="ranking" size={14} /> Classificação
                  </Btn>
                  {!currentRoundActiveDraft ? (
                    <Btn variant="primary" onClick={handleCreateDraft} disabled={creating || !canCreateDraft}>
                      <Icon name="plus" size={14} /> {creating ? 'Criando...' : 'Novo draft'}
                    </Btn>
                  ) : (
                    <Btn variant="primary" onClick={() => onStartDraft(currentRoundActiveDraft.id)}>
                      <Icon name="play" size={12} /> Continuar
                    </Btn>
                  )}
                </div>
              </Hero>

              {currentRoundActiveDraft && (
                <ProgressCard draft={currentRoundActiveDraft} stepIndex={stepIndex} />
              )}

              {error && <div className="home-error">{error}</div>}

              {user.is_admin && (
                <button className="home-admin-row" onClick={onGoAdmin}>
                  Painel Admin <Icon name="arrow-right" size={11} />
                </button>
              )}
            </>
          )}

          {/* ── Rodadas ── */}
          {activeTab === 'previous' && (
            <>
              <SectionHead title="Rodadas jogadas" count={playedRounds.length} />
              {playedRoundsLoading && <div className="flex justify-center py-6"><Spinner /></div>}
              {!playedRoundsLoading && playedRounds.length === 0 && (
                <EmptyState icon="history" title="Sem rodadas anteriores" sub="Suas rodadas finalizadas aparecerão aqui." />
              )}
              {!playedRoundsLoading && playedRounds.length > 0 && (
                <div className="home-rounds">
                  {playedRounds.map(r => (
                    <button key={r.id} className="home-round" onClick={() => handleOpenRoundStandings(r)}>
                      <div className="lab">RODADA</div>
                      <div className="num">{r.number}</div>
                      {r.score != null && <div className="pts">{formatScore(r.score)}</div>}
                    </button>
                  ))}
                </div>
              )}
              <div className="home-hint">Toque em uma rodada para ver a classificação.</div>
            </>
          )}

          {/* ── Campeonatos ── */}
          {activeTab === 'championships' && (
            <>
              <SectionHead title="Seus campeonatos" count={championships.length} />
              {championships.length === 0
                ? <EmptyState icon="trophy" title="Você não está em nenhum campeonato" sub="Entre em um para competir com amigos." />
                : (
                  <div className="flex flex-col gap-2">
                    {championships.map(c => (
                      <div key={c.id} className="home-champ">
                        <div className="home-champ-icon"><Icon name="trophy" size={18} /></div>
                        <div className="flex-1 min-w-0">
                          <div className="home-champ-name">{c.name}</div>
                          <div className="home-champ-meta">
                            <span className="type">{formatChampionshipType(c.type)}</span>
                            <span className="sep" />
                            <span>R{c.start_round_number}–R{c.end_round_number}</span>
                          </div>
                        </div>
                        <Btn variant="gold" size="sm" onClick={() => onOpenChampionship({ id: c.id, shareCode: c.share_code })}>
                          Abrir
                        </Btn>
                      </div>
                    ))}
                  </div>
                )}
            </>
          )}

          <div style={{ height: 20 }} />
        </div>
      </div>
    </div>
  );
}

// ── Desktop layout ───────────────────────────────────────────────────────────

function DesktopLayout(props) {
  const {
    user, onLogout, onGoAdmin, onStartDraft, onOpenChampionship,
    activeTab, setActiveTab, currentRound, currentRoundActiveDraft, canCreateDraft,
    creating, error, loading, playedRounds, playedRoundsLoading, championships,
    stepIndex, handleCreateDraft, handleOpenStandings, handleOpenRoundStandings, handleViewStandingsDraft,
    standings, standingsLoading, standingsOpen, setStandingsOpen, standingsError, standingsRound,
  } = props;

  const tabTitles = {
    current: { title: formatRoundLabel(currentRound), sub: 'Visão geral da rodada ativa, seu draft em andamento e a classificação parcial.' },
    previous: { title: 'Rodadas anteriores', sub: `Classificação das ${playedRounds.length} rodadas em que você já jogou.` },
    championships: { title: 'Campeonatos', sub: `Você participa de ${championships.length} torneios neste momento.` },
  };
  const head = tabTitles[activeTab];

  const navItems = [
    { tab: 'current', icon: 'home', label: 'Rodada atual', count: currentRoundActiveDraft ? '●' : null },
    { tab: 'previous', icon: 'history', label: 'Rodadas', count: playedRounds.length || null },
    { tab: 'championships', icon: 'trophy', label: 'Campeonatos', count: championships.length || null },
  ];

  return (
    <div className="home-desktop">
      {/* Sidebar */}
      <aside className="home-side">
        <Brand large />

        <div className="home-usercard">
          <Avatar name={user.name} size={36} />
          <div className="flex-1 min-w-0">
            <div className="nm">{user.name?.split(' ')[0]}</div>
            <div className="em">{user.email || ''}</div>
          </div>
          {user.is_admin && <AdminPill />}
        </div>

        <nav className="home-nav">
          <div className="home-nav-label">Menu</div>
          {navItems.map(({ tab, icon, label, count }) => (
            <button key={tab} className="home-nav-item" data-active={activeTab === tab} onClick={() => setActiveTab(tab)}>
              <span className="home-nav-ic"><Icon name={icon} size={14} /></span>
              <span>{label}</span>
              {count && <span className="ct">{count}</span>}
            </button>
          ))}
        </nav>

        <div className="home-side-foot">
          {user.is_admin && (
            <button onClick={onGoAdmin}>
              <span className="home-nav-ic"><Icon name="shield-admin" size={14} /></span> Painel admin
            </button>
          )}
          <button className="danger" onClick={onLogout}>
            <span className="home-nav-ic"><Icon name="logout" size={14} /></span> Sair
          </button>
        </div>
      </aside>

      {/* Main pane */}
      <main className="home-main">
        <div className="home-mainhead">
          <div>
            <div className="h1">{loading && activeTab === 'current' ? '...' : head.title}</div>
            <div className="sub">{head.sub}</div>
          </div>
          {activeTab === 'current' && (
            !currentRoundActiveDraft
              ? <Btn variant="primary" size="lg" onClick={handleCreateDraft} disabled={creating || !canCreateDraft}><Icon name="plus" size={14} /> {creating ? 'Criando...' : `Novo draft da ${formatRoundLabel(currentRound)}`}</Btn>
              : <Btn variant="primary" size="lg" onClick={() => onStartDraft(currentRoundActiveDraft.id)}><Icon name="play" size={12} /> Continuar draft</Btn>
          )}
        </div>

        {/* ── Rodada atual ── */}
        {activeTab === 'current' && (
          <div className="home-twocol">
            <div className="home-col">
              <Hero large loading={loading} currentRound={currentRound} />
              {currentRoundActiveDraft && (
                <ProgressCard large draft={currentRoundActiveDraft} stepIndex={stepIndex} />
              )}
              {error && <div className="home-error">{error}</div>}
            </div>

            {/* Standings panel */}
            <div className="home-sidecard">
              <div className="home-sidecard-head">
                <div>
                  <div className="t">Classificação parcial</div>
                  <div className="s">{formatRoundLabel(currentRound)} · Fase de grupos</div>
                </div>
                <span className="home-count">Top 5</span>
              </div>
              <div className="home-sidecard-body">
                {standingsLoading && <div className="flex justify-center py-4"><Spinner /></div>}
                {!standingsLoading && standings.length === 0 && (
                  <div className="home-hint" style={{ padding: '16px 0' }}>Nenhum time finalizado ainda.</div>
                )}
                {!standingsLoading && standings.length > 0 && standings.slice(0, 5).map((item, i) => (
                  <div key={item.draft_id} className="home-standrow compact" onClick={() => handleViewStandingsDraft(item.draft_id)}>
                    <RankTile rank={i + 1} small />
                    <div className="min-w-0">
                      <div className="home-stand-name">{item.team_name}</div>
                      <div className="home-stand-meta">{item.coach_name} · <span className="mono">{item.formation}</span></div>
                    </div>
                    <div className="home-stand-score">{formatScore(item.score)}</div>
                  </div>
                ))}
                <div className="home-sidecard-foot">
                  <Btn variant="ghost" size="sm" block onClick={handleOpenStandings} disabled={!currentRound}>
                    <Icon name="ranking" size={13} /> Ver classificação completa
                  </Btn>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Rodadas ── */}
        {activeTab === 'previous' && (
          <div className="flex flex-col gap-5">
            {standingsOpen && (
              <StandingsModal open={standingsOpen} loading={standingsLoading} error={standingsError}
                currentRound={standingsRound || currentRound} standings={standings}
                onClose={() => setStandingsOpen(false)} onViewDraft={handleViewStandingsDraft} />
            )}
            {playedRoundsLoading && <div className="flex justify-center py-6"><Spinner /></div>}
            {!playedRoundsLoading && playedRounds.length === 0 && <EmptyState icon="history" title="Sem rodadas anteriores" />}
            {!playedRoundsLoading && playedRounds.length > 0 && (
              <div className="home-rounds">
                {playedRounds.map(r => (
                  <button key={r.id} className="home-round" onClick={() => handleOpenRoundStandings(r)}>
                    <div className="lab">RODADA</div>
                    <div className="num">{r.number}</div>
                    {r.score != null && <div className="pts">{formatScore(r.score)} pts</div>}
                  </button>
                ))}
              </div>
            )}
            <div className="home-hint" style={{ textAlign: 'left' }}>Clique em uma rodada para ver a classificação completa.</div>
          </div>
        )}

        {/* ── Campeonatos ── */}
        {activeTab === 'championships' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {championships.length === 0
              ? <div style={{ gridColumn: '1/-1' }}><EmptyState icon="trophy" title="Você não está em nenhum campeonato" /></div>
              : championships.map(c => (
                <div key={c.id} className="home-champ" style={{ padding: 16 }}>
                  <div className="home-champ-icon" style={{ width: 48, height: 48, borderRadius: 12 }}><Icon name="trophy" size={20} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="home-champ-name" style={{ fontSize: 15 }}>{c.name}</div>
                    <div className="home-champ-meta">
                      <span className="type">{formatChampionshipType(c.type)}</span>
                      <span className="sep" />
                      <span>R{c.start_round_number}–R{c.end_round_number}</span>
                      {c.share_code && <>
                        <span className="sep" />
                        <span className="code">#{c.share_code}</span>
                      </>}
                    </div>
                  </div>
                  <Btn variant="gold" onClick={() => onOpenChampionship({ id: c.id, shareCode: c.share_code })}>
                    Abrir <Icon name="arrow-right" size={12} />
                  </Btn>
                </div>
              ))
            }
          </div>
        )}
      </main>
    </div>
  );
}

// ── Root component (LÓGICA INTACTA) ──────────────────────────────────────────

export default function Home({ user, onLogout, onGoAdmin, onStartDraft, onViewDraft, onOpenChampionship }) {
  const [activeDrafts, setActiveDrafts] = useState([]);
  const [championships, setChampionships] = useState([]);
  const [currentRound, setCurrentRound] = useState(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('current');
  const [standingsOpen, setStandingsOpen] = useState(false);
  const [standingsLoading, setStandingsLoading] = useState(false);
  const [standingsError, setStandingsError] = useState(null);
  const [standings, setStandings] = useState([]);
  const [standingsRound, setStandingsRound] = useState(null);
  const [playedRounds, setPlayedRounds] = useState([]);
  const [playedRoundsLoading, setPlayedRoundsLoading] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

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
      setError('Não foi possível carregar seus drafts agora.');
    } finally {
      setLoading(false);
    }
  };

  const loadPlayedRounds = async () => {
    setPlayedRoundsLoading(true);
    try {
      const res = await authFetch(`${API_URL}/drafts/played-rounds`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao carregar rodadas.');
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
    return activeDrafts.find(d => d.round_id === currentRound.id) || null;
  }, [activeDrafts, currentRound]);

  const canCreateDraft = Boolean(currentRound) && !currentRoundActiveDraft;
  const stepIndex = currentRoundActiveDraft ? STATUS_ORDER.indexOf(currentRoundActiveDraft.status) : -1;

  const handleCreateDraft = async () => {
    setCreating(true);
    setError(null);
    try {
      const res = await authFetch(`${API_URL}/drafts`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { await loadDrafts(); throw new Error(data.error || 'Não foi possível criar o draft.'); }
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
      if (!res.ok) throw new Error(data.error || 'Não foi possível carregar a classificação.');
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
      if (!res.ok) throw new Error(data.error || 'Não foi possível carregar a classificação.');
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

  const sharedProps = {
    user, onLogout, onGoAdmin, onStartDraft, onViewDraft, onOpenChampionship,
    activeTab, setActiveTab, currentRound, currentRoundActiveDraft, canCreateDraft,
    creating, error, loading, playedRounds, playedRoundsLoading, championships,
    standingsOpen, setStandingsOpen, standingsLoading, standingsError, standings, standingsRound,
    stepIndex, handleCreateDraft, handleOpenStandings, handleOpenRoundStandings, handleViewStandingsDraft,
  };

  if (isDesktop) return <DesktopLayout {...sharedProps} />;
  return <MobileLayout {...sharedProps} />;
}
