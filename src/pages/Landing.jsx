import React, { useMemo, useState } from 'react';

/* ============================================================================
   Landing + Onboarding — draft11 / Copa do Mundo 2026
   Primeira experiência de quem chega sem login. Três estados:
     'landing' → explica o jogo + CTA
     'guest'   → guest draft (100% local, sem API, dados demo)
     'convert' → time montado → convite para cadastro
   Props: onGoLogin, onGoRegister
   Classes .land-* em src/index.css (bloco landing).
   ============================================================================ */

// ── KIT nacional por ISO2 ────────────────────────────────────────────────────
const KIT = {
  br:       { skin: '#7a5230', hair: '#141210', jersey: '#ffd400', sleeve: '#149a4b', name_color: '#16713c' },
  ar:       { skin: '#e0b48d', hair: '#4a3322', jersey: '#75acdf', sleeve: '#75acdf', name_color: '#14213d', stripes: true, stripe1: '#7cb1e2', stripe2: '#f3f4f2' },
  fr:       { skin: '#5b3a26', hair: '#120f0d', jersey: '#1b3a8f', sleeve: '#16306f', name_color: '#ffffff' },
  es:       { skin: '#a06b42', hair: '#15110e', jersey: '#c4222a', sleeve: '#a31a22', name_color: '#ffd24a' },
  pt:       { skin: '#d49e74', hair: '#181410', jersey: '#b81f33', sleeve: '#0a6b34', name_color: '#ffffff' },
  de:       { skin: '#d9aa84', hair: '#6b4a2a', jersey: '#eef0ef', sleeve: '#161616', name_color: '#161616' },
  nl:       { skin: '#e0b48d', hair: '#caa24a', jersey: '#ec6608', sleeve: '#c4500a', name_color: '#ffffff' },
  hr:       { skin: '#d8a87f', hair: '#3a2a1a', jersey: '#d4332f', sleeve: '#d4332f', name_color: '#1d3a8f', stripes: true, stripe1: '#d4332f', stripe2: '#f3f4f2' },
  it:       { skin: '#d4a07a', hair: '#20160f', jersey: '#1b66b3', sleeve: '#16508c', name_color: '#ffffff' },
  mx:       { skin: '#9c6b42', hair: '#15110e', jersey: '#1a7a3c', sleeve: '#0f5828', name_color: '#ffffff' },
  cz:       { skin: '#e0b48d', hair: '#6b4a2a', jersey: '#c4222a', sleeve: '#11457e', name_color: '#ffffff' },
  'gb-eng': { skin: '#e3bb93', hair: '#8a5a2a', jersey: '#eef0ef', sleeve: '#1d3a8f', name_color: '#1d3a8f' },
  ma:       { skin: '#8a5a36', hair: '#15110e', jersey: '#c1272d', sleeve: '#0a6b34', name_color: '#ffffff' },
  eg:       { skin: '#8a5a36', hair: '#15110e', jersey: '#c8102e', sleeve: '#1a1a1a', name_color: '#ffffff' },
  sn:       { skin: '#3a2418', hair: '#0e0a08', jersey: '#eef0ef', sleeve: '#1a8a3c', name_color: '#1a8a3c' },
  se:       { skin: '#e3bb93', hair: '#c9a44a', jersey: '#f5c542', sleeve: '#1b66b3', name_color: '#1b3a8f' },
  rs:       { skin: '#d8a87f', hair: '#2a1d12', jersey: '#c4222a', sleeve: '#1d3a8f', name_color: '#ffffff' },
  kr:       { skin: '#d9b48f', hair: '#0e0a08', jersey: '#c4222a', sleeve: '#1d3a8f', name_color: '#ffffff' },
  jp:       { skin: '#d9b48f', hair: '#0e0a08', jersey: '#1b3a8f', sleeve: '#16306f', name_color: '#ffffff' },
};
const FALLBACK_KIT = { skin: '#9c6b42', hair: '#1a1410', jersey: '#2a6f4a', sleeve: '#1c5235', name_color: '#ffffff' };
const GRAY_KIT    = { skin: '#3a434b', hair: '#2c343b', jersey: '#222a30', sleeve: '#1a2127', name_color: 'rgba(0,0,0,0)' };
const kitFor = (iso) => KIT[iso] || FALLBACK_KIT;

const LINE_VAR = { gk: 'var(--c-gk)', def: 'var(--c-def)', mid: 'var(--c-mid)', att: 'var(--c-att)' };
const POS_FULL = { GOL: 'Goleiro', ZAG: 'Zagueiro', LAT: 'Lateral', MEI: 'Meia', ATA: 'Atacante' };

const surnameOf   = (n) => n.split(' ').slice(-1)[0].toUpperCase();
const firstNameOf = (n) => n.split(' ')[0];
const ovr2        = (ovr) => (ovr > 30 ? Math.round(ovr) : Math.round(ovr * 10));

// ── Figura de costas SVG (kit nacional) ─────────────────────────────────────
function PlayerFigureLand({ kit: k, number, surname, uid }) {
  const pid = `lstrp-${uid}`;
  const torsoFill = k.stripes ? `url(#${pid})` : k.jersey;
  return (
    <svg className="fcard-fig" viewBox="2 14 196 184" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        {k.stripes && (
          <pattern id={pid} width="24" height="10" patternUnits="userSpaceOnUse">
            <rect width="24" height="10" fill={k.stripe2} />
            <rect width="12" height="10" fill={k.stripe1} />
          </pattern>
        )}
      </defs>
      <rect x="44" y="104" width="16" height="84" rx="7.5" fill={k.skin} />
      <rect x="140" y="104" width="16" height="84" rx="7.5" fill={k.skin} />
      <rect x="87" y="62" width="26" height="24" rx="7" fill={k.skin} />
      <path d="M58,90 C58,83 64,80 73,80 L127,80 C136,80 142,83 142,90 L137,196 L63,196 Z" fill={torsoFill} />
      <path d="M58,90 C50,87 43,91 40,101 L46,118 C52,115 57,107 60,99 Z" fill={k.sleeve} />
      <path d="M142,90 C150,87 157,91 160,101 L154,118 C148,115 143,107 140,99 Z" fill={k.sleeve} />
      <path d="M84,82 Q100,91 116,82" fill="none" stroke={k.sleeve} strokeWidth="4.5" strokeLinecap="round" />
      {surname && <text x="100" y="112" textAnchor="middle" fontFamily="'Bricolage Grotesque',sans-serif" fontWeight="800" fontSize="17" letterSpacing="0.5" fill={k.name_color}>{surname}</text>}
      {number ? <text x="100" y="178" textAnchor="middle" fontFamily="'Bricolage Grotesque',sans-serif" fontWeight="800" fontSize="74" fill={k.name_color}>{number}</text> : null}
      <circle cx="71" cy="48" r="6.5" fill={k.skin} />
      <circle cx="129" cy="48" r="6.5" fill={k.skin} />
      <circle cx="100" cy="44" r="30" fill={k.hair} />
    </svg>
  );
}

// ── Cartinha FUT (campo + picker) ────────────────────────────────────────────
function LandCartinha({ player, rowPos, line, state = 'empty', pick = false, captain = false, fcw, onClick }) {
  const lineC = LINE_VAR[line] || LINE_VAR.def;
  const style = { '--line-c': lineC };
  if (fcw) style['--fcw'] = fcw;

  if (player) {
    const k = kitFor(player.iso);
    return (
      <div className={`fcard${pick ? ' is-pick' : ''}`} style={style} onClick={onClick} role={onClick ? 'button' : undefined}>
        {captain && <div className="fcard-cap">C</div>}
        <div className="fcard-flagbg"><span className={`fi fi-${player.iso}`} /></div>
        <div className="fcard-veil" />
        <PlayerFigureLand kit={k} number={player.num} surname={surnameOf(player.name)} uid={`${player.id}-${state}${pick ? '-p' : ''}`} />
        <div className="fcard-body">
          <div className="fcard-head">
            <div className="fcard-ovr"><div className="v">{ovr2(player.ovr)}</div><div className="l">OVR</div></div>
            <span className="fcard-pos">{player.pos}</span>
          </div>
          <div className="fcard-name">{firstNameOf(player.name)}</div>
        </div>
      </div>
    );
  }

  const active = state === 'active';
  return (
    <div className={`fcard is-empty${active ? ' is-active' : ''}`} style={style} onClick={onClick} role={onClick ? 'button' : undefined}>
      <div className="fcard-veil" />
      <PlayerFigureLand kit={GRAY_KIT} number="" surname="" uid={`sil-${rowPos}-${state}`} />
      {active && <div className="nexttag">Próxima</div>}
      <div className="fcard-body">
        <div className="fcard-head"><span /><span className="fcard-pos">{rowPos}</span></div>
      </div>
      <div className="e-plus">+</div>
      <div className="e-label">{POS_FULL[rowPos] || rowPos}</div>
    </div>
  );
}

// ── Demo data ────────────────────────────────────────────────────────────────
const DEMO_PLAYERS = [
  ['Léo Fortuna',   'br',     'ATA',  9, 8.7],
  ['Marco Vidal',   'ar',     'ATA', 10, 8.9],
  ['Kai Berger',    'de',     'ATA', 11, 8.2],
  ['Pavel Novák',   'cz',     'ATA', 19, 7.8],
  ['Sam Whyte',     'gb-eng', 'ATA', 17, 7.7],
  ['Hugo Marès',    'fr',     'MEI',  8, 8.4],
  ['Tó Salgado',    'pt',     'MEI',  6, 8.1],
  ['Nico Rossi',    'it',     'MEI',  5, 7.9],
  ['Diego Sol',     'es',     'MEI',  7, 8.0],
  ['Ren Takeda',    'jp',     'MEI', 14, 7.6],
  ['Bram de Vries', 'nl',     'ZAG',  4, 7.8],
  ['Luka Orsic',    'hr',     'ZAG',  3, 7.7],
  ['Sami Bouz',     'ma',     'ZAG',  2, 7.5],
  ['Tariq Nasser',  'eg',     'ZAG', 15, 7.2],
  ['Carlos Vega',   'mx',     'LAT', 12, 7.4],
  ['Owen Pryce',    'gb-eng', 'LAT', 13, 7.3],
  ['Felipe Nunes',  'br',     'LAT', 16, 7.6],
  ['Yann Cissé',    'sn',     'LAT', 20, 7.1],
  ['Anders Holm',   'se',     'GOL',  1, 8.0],
  ['Ivan Petrov',   'rs',     'GOL', 22, 7.8],
  ['Joon Park',     'kr',     'GOL', 23, 7.5],
].map((p, i) => ({ id: i, name: p[0], iso: p[1], pos: p[2], num: p[3], ovr: p[4] }));

const FORMATIONS = {
  '4-3-3': { def: 4, mid: 3, att: 3, desc: 'Equilíbrio e velocidade no ataque.' },
  '4-4-2': { def: 4, mid: 4, att: 2, desc: 'Clássico e seguro, com dois centroavantes.' },
  '3-4-3': { def: 3, mid: 4, att: 3, desc: 'Ofensivo: pressão alta e amplitude.' },
  '5-3-2': { def: 5, mid: 3, att: 2, desc: 'Defensivo, forte no contra-ataque.' },
};

const GROUP_ACCEPTS = { GOL: ['GOL'], DEF: ['ZAG', 'LAT'], MEI: ['MEI'], ATA: ['ATA'] };
const GROUP_LABEL   = { GOL: 'Goleiros', DEF: 'Defensores', MEI: 'Meias', ATA: 'Atacantes' };
const GROUP_LINE    = { GOL: 'gk', DEF: 'def', MEI: 'mid', ATA: 'att' };
const POS_LINE      = { GOL: 'gk', ZAG: 'def', LAT: 'def', MEI: 'mid', ATA: 'att' };

function slotPlan(formationName) {
  const f = FORMATIONS[formationName];
  const plan = [{ group: 'GOL', rowPos: 'GOL' }];
  for (let i = 0; i < f.def; i++) plan.push({ group: 'DEF', rowPos: i === 0 || i === f.def - 1 ? 'LAT' : 'ZAG' });
  for (let i = 0; i < f.mid; i++) plan.push({ group: 'MEI', rowPos: 'MEI' });
  for (let i = 0; i < f.att; i++) plan.push({ group: 'ATA', rowPos: 'ATA' });
  return plan;
}

const HERO_FLAGS = ['br', 'ar', 'fr', 'es', 'pt', 'de', 'nl', 'hr', 'it', 'mx'];
const STEPS_HOW = [
  ['Escolha sua formação',  'Decida o esquema: 4-3-3, 3-4-3 ou outros. Define quantos atacantes, meias e defensores você vai ter.'],
  ['Convoque seus craques', 'Faça o draft: escolha jogador por jogador para cada posição. Cada craque só pode estar em um time.'],
  ['Os jogos acontecem',    'Rodada a rodada da Copa, as partidas reais geram stats: gols, assistências, defesas, chutes...'],
  ['Veja sua pontuação',    'Cada stat vira ponto. Seu capitão vale dobrado. Quem escalou o melhor time vence a rodada.'],
];
const CONVERT_BENEFITS = [
  'Completar o elenco: 5 reservas e o capitão',
  'Salvar seu time e competir a cada rodada',
  'Criar campeonatos privados com amigos',
  'Ver rankings, histórico e pontuações ao vivo',
];

// ── Primitives ───────────────────────────────────────────────────────────────
function Emblem({ s = 40 }) {
  return (
    <span className="land-emblem" dangerouslySetInnerHTML={{ __html:
      `<svg width="${s}" height="${s}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="le${s}" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#1f7a46"/><stop offset="1" stop-color="#0b3a20"/>
          </linearGradient>
          <clipPath id="lc${s}"><rect x="3" y="3" width="94" height="94" rx="26"/></clipPath>
        </defs>
        <rect x="3" y="3" width="94" height="94" rx="26" fill="url(#le${s})"/>
        <g clip-path="url(#lc${s})">
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

function Brand({ s = 40, wm = 22 }) {
  return (
    <div className="land-brand">
      <Emblem s={s} />
      <div>
        <div className="land-wm" data-sz={String(wm)}>draft<span className="g">11</span></div>
        <div className="land-wm-sub">Copa do Mundo 2026</div>
      </div>
    </div>
  );
}

const Chip = ({ children, className = '' }) => (
  <span className={`land-chip ${className}`.trim()}><span className="star">★</span> {children}</span>
);

const FlagStrip = () => (
  <div className="land-flags">
    {HERO_FLAGS.map((f) => <span key={f} className={`fi fi-${f}`} />)}
    <span className="more">+ 38 seleções</span>
  </div>
);

const LiveEyebrow = ({ children, center }) => (
  <span className="land-eyebrow" data-center={center ? 'true' : undefined}>
    <span className="land-live" /> {children}
  </span>
);

// ── Campo (linhas flex de cartinhas) ─────────────────────────────────────────
function Field({ formationName, starters, activeIndex, done, onActivate }) {
  const plan = slotPlan(formationName);
  const f = FORMATIONS[formationName];
  const rows = [
    { key: 'GOL', count: 1,     start: 0 },
    { key: 'DEF', count: f.def, start: 1 },
    { key: 'MEI', count: f.mid, start: 1 + f.def },
    { key: 'ATA', count: f.att, start: 1 + f.def + f.mid },
  ];
  return (
    <div className={`land-field${done ? ' land-field-done' : ''}`}>
      {rows.map((row) => (
        <div className="land-row" key={row.key}>
          {Array.from({ length: row.count }).map((_, i) => {
            const idx = row.start + i;
            const player = starters[idx];
            const state = player ? 'filled' : activeIndex === idx ? 'active' : 'empty';
            const slotPos = plan[idx].rowPos;
            const line = GROUP_LINE[plan[idx].group];
            const handle = state === 'active' && onActivate ? onActivate : undefined;
            return (
              <LandCartinha key={idx} player={player || null} rowPos={slotPos} line={line} state={state} onClick={handle} />
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ── Picker de cartinhas ──────────────────────────────────────────────────────
function CardPicker({ players, onPick }) {
  if (!players.length) {
    return <div className="land-pick-empty">Nenhum jogador disponível nesta posição.</div>;
  }
  return (
    <div className="land-card-grid">
      {players.map((p) => (
        <LandCartinha key={p.id} player={p} rowPos={p.pos} line={POS_LINE[p.pos]} pick onClick={() => onPick(p)} />
      ))}
    </div>
  );
}

// ── Header do guest draft ────────────────────────────────────────────────────
function GdHeader({ step, total, label, onBack }) {
  const pct = Math.round((step / total) * 100);
  return (
    <div className="land-gd-header">
      <button className="land-back" onClick={onBack}>‹ Voltar</button>
      <div className="land-gd-progress">
        <div className="p">Passo {step} de {total}</div>
        <div className="s">{label}</div>
        <div className="land-gd-bar"><i style={{ width: `${pct}%` }} /></div>
      </div>
      <Chip className="land-gd-demo">MODO DEMO</Chip>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
export default function Landing({ onGoLogin, onGoRegister }) {
  const [page,        setPage]        = useState('landing'); // landing | guest | convert
  const [formation,   setFormation]   = useState('4-3-3');
  const [step,        setStep]        = useState(0);         // 0=formação, 1..11=titulares
  const [starters,    setStarters]    = useState([]);
  const [pickerOpen,  setPickerOpen]  = useState(false);

  const plan     = useMemo(() => slotPlan(formation), [formation]);
  const usedIds  = useMemo(() => new Set(starters.map((p) => p.id)), [starters]);

  const startGuest = () => { setPage('guest'); setStep(0); setStarters([]); setPickerOpen(false); };

  const goBack = () => {
    if (pickerOpen) { setPickerOpen(false); return; }
    if (step === 0)  { setPage('landing'); return; }
    setStarters((s) => s.slice(0, -1));
    setStep((s) => s - 1);
  };

  const confirmFormation = () => setStep(1);

  const activeIndex = step >= 1 && step <= 11 ? step - 1 : -1;
  const activeSlot  = activeIndex >= 0 ? plan[activeIndex] : null;
  const activeGroup = activeSlot ? activeSlot.group : null;
  const titularesAvail = activeGroup
    ? DEMO_PLAYERS.filter((p) => !usedIds.has(p.id) && GROUP_ACCEPTS[activeGroup].includes(p.pos))
    : [];

  const pickStarter = (p) => {
    const next = [...starters, p];
    setStarters(next);
    if (next.length >= 11) {
      setPickerOpen(false);
      setPage('convert');
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <div className="land-root">

      {/* ── STATE 1: LANDING ─────────────────────────────────────────────── */}
      <div className="land-state" data-active={String(page === 'landing')}>

        {/* desktop (≥ 1024px) */}
        <div className="land-landing">
          <div className="land-left land-stadium">
            <div className="land-left-top"><Brand s={44} wm={24} /><Chip>COPA DO MUNDO 2026</Chip></div>
            <div className="land-left-mid">
              <h1 className="land-headline">Monte seu time dos sonhos.</h1>
              <p className="land-subhead">Escale os craques do mundo. Cada gol, cada assistência vira ponto no seu time.</p>
              <div className="land-left-cta"><FlagStrip /></div>
              <div className="land-left-foot">48 seleções · um título</div>
            </div>
          </div>

          <div className="land-right">
            <div className="land-right-inner">
              <LiveEyebrow>Como funciona</LiveEyebrow>
              <h2>Quatro passos até a taça.</h2>
              <div className="land-steps">
                {STEPS_HOW.map(([t, d], i) => (
                  <div className="land-step" key={i}>
                    <div className="land-step-num">{i + 1}</div>
                    <div><div className="land-step-t">{t}</div><div className="land-step-d">{d}</div></div>
                  </div>
                ))}
              </div>
              <div className="land-incentive">
                <div className="ic">⚡</div>
                <div className="tx">Experimente agora — sem precisar criar uma conta.</div>
              </div>
              <div className="land-right-cta">
                <button className="land-btn land-btn-primary land-btn-lg land-btn-block" onClick={startGuest}>
                  Montar meu time agora →
                </button>
                <button className="land-link" onClick={onGoLogin}>Já tenho conta → <b>Entrar</b></button>
              </div>
            </div>
          </div>
        </div>

        {/* mobile (< 1024px) */}
        <div className="land-landing-mob">
          <div className="land-head"><Brand s={32} wm={18} /><Chip>COPA 2026</Chip></div>
          <div className="land-hero-mob land-stadium">
            <LiveEyebrow>Copa do Mundo 2026</LiveEyebrow>
            <h1 className="land-headline">Monte seu time dos sonhos.</h1>
            <p className="land-subhead">Escale os craques do mundo. Cada gol vira ponto.</p>
            <FlagStrip />
          </div>
          <div className="land-mob-body">
            <LiveEyebrow>Como funciona</LiveEyebrow>
            <div className="land-mob-steps">
              {STEPS_HOW.map(([t, d], i) => (
                <div className="land-step-card" key={i}>
                  <div className="n">{i + 1}</div>
                  <div><div className="land-step-t">{t}</div><div className="land-step-d">{d}</div></div>
                </div>
              ))}
            </div>
            <div className="land-incentive">
              <div className="ic">⚡</div>
              <div className="tx">Experimente agora — sem criar conta.</div>
            </div>
            <div className="land-right-cta">
              <button className="land-btn land-btn-primary land-btn-lg land-btn-block" onClick={startGuest}>
                Montar meu time agora →
              </button>
              <button className="land-link" onClick={onGoLogin}>Já tenho conta → <b>Entrar</b></button>
            </div>
          </div>
        </div>
      </div>

      {/* ── STATE 2: GUEST DRAFT ─────────────────────────────────────────── */}
      <div className="land-state" data-active={String(page === 'guest')}>
        <div className="land-gd">
          <GdHeader
            step={step === 0 ? 1 : 2}
            total={2}
            label={step === 0 ? 'Escolha da formação' : 'Convoque seus 11 titulares'}
            onBack={goBack}
          />

          {/* Passo 1 — formação */}
          {step === 0 && (
            <div className="land-gd-body">
              <div className="land-form-wrap">
                <LiveEyebrow center>
                  Passo 1 <span className="sep" /> <span className="muted">Formação</span>
                </LiveEyebrow>
                <div className="land-form-title">Qual será seu esquema?</div>
                <div className="land-form-grid">
                  {Object.entries(FORMATIONS).map(([name, ff]) => (
                    <button
                      className="land-form-card"
                      data-sel={String(name === formation)}
                      key={name}
                      onClick={() => setFormation(name)}
                    >
                      <div className="land-form-name">{name}</div>
                      <div className="land-form-mini">
                        <span>{ff.def} def</span>
                        <span>{ff.mid} mei</span>
                        <span>{ff.att} ata</span>
                      </div>
                      <div className="land-form-desc">{ff.desc}</div>
                    </button>
                  ))}
                </div>
                <button className="land-btn land-btn-primary land-btn-lg" onClick={confirmFormation}>
                  Confirmar formação →
                </button>
              </div>
            </div>
          )}

          {/* Passo 2 — draft dos 11 titulares */}
          {step >= 1 && step <= 11 && (
            <div className="land-gd-body land-gd-body-draft">
              <div className="land-draft">
                <div className="land-field-pane">
                  <div className="land-field-head">
                    <LiveEyebrow center>
                      Escalação <span className="sep" /> <span className="muted">{formation}</span>
                    </LiveEyebrow>
                    <div className="t">{starters.length} de 11 titulares</div>
                  </div>
                  <Field
                    formationName={formation}
                    starters={starters}
                    activeIndex={activeIndex}
                    onActivate={() => setPickerOpen(true)}
                  />
                </div>
                <div className="land-pick-pane">
                  <div className="land-pick-head">
                    <div className="t">{activeGroup ? GROUP_LABEL[activeGroup] : ''}</div>
                    <div className="s">Clique numa carta para escalar no slot em destaque</div>
                  </div>
                  <div className="land-pick-scroll">
                    <CardPicker players={titularesAvail} onPick={pickStarter} />
                  </div>
                </div>
              </div>

              {/* Dock mobile */}
              {activeSlot && (
                <div className="land-dock">
                  <LandCartinha
                    player={null}
                    rowPos={activeSlot.rowPos}
                    line={GROUP_LINE[activeGroup]}
                    state="active"
                    fcw="42px"
                  />
                  <div className="grow">
                    <div className="np-name">{POS_FULL[activeSlot.rowPos] || activeSlot.rowPos}</div>
                    <div className="np-sub">{titularesAvail.length} disponíveis · {starters.length}/11 escalados</div>
                  </div>
                  <button className="land-btn land-btn-gold" onClick={() => setPickerOpen(true)}>Escolher →</button>
                </div>
              )}
            </div>
          )}

          {/* Bottom-sheet mobile (seletor de cartinhas) */}
          <div className="land-sheet" data-open={pickerOpen && activeGroup ? 'true' : 'false'}>
            <div className="land-sheet-scrim" onClick={() => setPickerOpen(false)} />
            <div className="land-sheet-panel">
              <div className="land-sheet-grab" />
              <div className="land-sheet-head">
                <div>
                  <div className="t">
                    {activeGroup ? GROUP_LABEL[activeGroup] : ''}{' '}
                    <span className="cnt">{starters.length}/11</span>
                  </div>
                  <div className="s">Toque numa carta para escalar</div>
                </div>
                <button className="land-sheet-x" onClick={() => setPickerOpen(false)} aria-label="Fechar">✕</button>
              </div>
              <div className="land-sheet-body">
                <CardPicker players={titularesAvail} onPick={pickStarter} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── STATE 3: CONVERSÃO ───────────────────────────────────────────── */}
      <div className="land-state" data-active={String(page === 'convert')}>
        <div className="land-convert-screen">
          <Field formationName={formation} starters={starters} activeIndex={-1} done />
          <div className="land-convert land-stadium">
            <LiveEyebrow>Seu time titular está pronto</LiveEyebrow>
            <h2>Falta pouco para entrar em campo.</h2>
            <p className="sub">
              Crie sua conta para completar o elenco — escolher os 5 reservas e o capitão —
              salvar o time e disputar os campeonatos.
            </p>
            <ul className="land-benefits">
              {CONVERT_BENEFITS.map((b) => (
                <li key={b}><span className="ck">✓</span> {b}</li>
              ))}
            </ul>
            <div className="land-convert-cta">
              <button className="land-btn land-btn-primary land-btn-lg land-btn-block" onClick={onGoRegister}>
                Criar minha conta grátis →
              </button>
              <button className="land-btn land-btn-ghost land-btn-block" onClick={onGoLogin}>
                Já tenho conta → Entrar
              </button>
            </div>
            <div className="land-convert-note">Grátis. Sem cartão de crédito.</div>
          </div>
        </div>
      </div>

    </div>
  );
}
