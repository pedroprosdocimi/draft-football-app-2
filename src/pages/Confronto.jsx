import React, { useState, useEffect } from 'react';
import PlayerFigure, { NATIONAL_KITS } from '../components/PlayerFigure.jsx';
import { FORMATIONS, loadPlayers, getOptionsForSlot, buildGroupDraw, buildKODraw, getTeamStrength } from '../data/confrontoPlayers.js';

/* ── Inline SVG emblem ─────────────────────────────────────── */
function CFEmblem({ s = 28 }) {
  return (
    <span className="demblem" dangerouslySetInnerHTML={{ __html:
      `<svg width="${s}" height="${s}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs><linearGradient id="cfg${s}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1f7a46"/><stop offset="1" stop-color="#0b3a20"/></linearGradient>
        <clipPath id="cfc${s}"><rect x="3" y="3" width="94" height="94" rx="26"/></clipPath></defs>
        <rect x="3" y="3" width="94" height="94" rx="26" fill="url(#cfg${s})"/>
        <g clip-path="url(#cfc${s})">
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
        <text x="50" y="72" text-anchor="middle" font-family="'Bricolage Grotesque',sans-serif" font-weight="700" font-size="8" letter-spacing="2.5" fill="#fbd07a">DRAFTING</text>
      </svg>`
    }} />
  );
}

/* ── Crest (flag or drafting11 emblem) ─────────────────────── */
function CFCrest({ team, cls = 'cf-crest' }) {
  if (team.me) {
    return (
      <span className={cls} style={{ display:'grid', placeItems:'center', background:'linear-gradient(160deg,#1f7a46,#0b3a20)' }}>
        <CFEmblem s={cls === 'cf-sbcrest' ? 34 : 14} />
      </span>
    );
  }
  return <span className={cls}><span className={`fi fi-${team.iso || 'xx'}`} /></span>;
}

/* ── Icons ─────────────────────────────────────────────────── */
const CFArrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>
  </svg>
);
const CFPlay = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 5v14l12-7z"/></svg>
);
const CFBall = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="12" r="9"/><path d="M12 7l2.5 1.8-1 3h-3l-1-3z" fill="currentColor" stroke="none"/>
  </svg>
);

/* ── Line colour per position line ─────────────────────────── */
const LINEC = { gk:'var(--c-gk)', def:'var(--c-def)', mid:'var(--c-mid)', att:'var(--c-att)' };

/* ── Mini pitch formation dots ─────────────────────────────── */
function MiniPitch({ dots }) {
  return (
    <div className="cf-minipitch">
      {dots.map((d, i) => (
        <span key={i} className={`pdot ${d[0]}`} style={{ left:`${d[1]}%`, top:`${d[2]}%` }} />
      ))}
    </div>
  );
}

/* ── Filled mini field card ─────────────────────────────────── */
function FieldMini({ s }) {
  const p = s.player;
  const k = p ? (NATIONAL_KITS[p.iso] || NATIONAL_KITS._) : NATIONAL_KITS._;
  return (
    <div className="cf-mini" style={{ borderColor:`color-mix(in oklab, ${LINEC[s.line]} 50%, rgba(255,255,255,.14))` }}>
      {p && <div className="cf-pcflag"><span className={`fi fi-${p.iso}`} /></div>}
      <div className="cf-pcveil" />
      {p && <PlayerFigure kit={k} number={p.number} surname={p.surname} uid={`fm-${s.key}`} className="cf-pcfig" />}
      <div className="ov">{p?.ovr || ''}</div>
      <div className="nm">{p?.name || ''}</div>
    </div>
  );
}

/* ── Empty mini field card (slot not yet picked) ────────────── */
function EmptyMini({ s, active }) {
  return (
    <div className="cf-mini" style={{
      borderStyle:'dashed',
      background: active ? 'rgba(245,166,35,.12)' : 'rgba(10,14,12,.6)',
      borderColor: active ? 'var(--gold)' : `color-mix(in oklab, ${LINEC[s.line]} 45%, rgba(255,255,255,.16))`,
      display:'grid', placeItems:'center',
    }}>
      <div className="cf-pcveil" />
      <span style={{ position:'relative', zIndex:3, fontSize:18, color: active ? 'var(--gold-soft)' : '#fff', fontWeight:500 }}>+</span>
      <div className="nm" style={{ color: active ? 'var(--gold-soft)' : 'var(--text-3)' }}>{s.pos}</div>
    </div>
  );
}

/* ── Football pitch with all 11 slots ──────────────────────── */
function Pitch({ slots, lineup, activeSlotKey }) {
  return (
    <div className="cf-pitch">
      <div className="cf-pl frame" />
      <div className="cf-pl half" />
      <div className="cf-pl circ" />
      {slots.map(s => (
        <div key={s.key} className="cf-fslot" style={{ top:`${s.top}%`, left:`${s.left}%` }}>
          {lineup[s.key]
            ? <FieldMini s={{ ...s, player: lineup[s.key] }} />
            : <EmptyMini s={s} active={s.key === activeSlotKey} />}
        </div>
      ))}
    </div>
  );
}

/* ── Player option card (picking phase) ─────────────────────── */
function OptionCard({ p, onPick }) {
  const kit = NATIONAL_KITS[p.iso] || NATIONAL_KITS._;
  const isoLabel = p.iso.toUpperCase().replace('GB-SCT','SCO').replace('GB-ENG','ENG');
  return (
    <div className="cf-pcard" onClick={() => onPick(p)} style={{ cursor:'pointer' }}>
      <div className="cf-pcflag"><span className={`fi fi-${p.iso}`} /></div>
      <div className="cf-pcveil" />
      <PlayerFigure kit={kit} number={p.number} surname={p.surname} uid={`opt-${p.id}`} className="cf-pcfig" />
      <div className="cf-pcbody">
        <div className="cf-pchead">
          <span className="cf-pcovr">{p.ovr}<i>OVR</i></span>
          <span className="cf-pcrole">{isoLabel}</span>
        </div>
        <div className="cf-pcname">{p.name}</div>
      </div>
    </div>
  );
}

/* ── Position label map ─────────────────────────────────────── */
const POS_LABEL = {
  GOL:'Goleiro', LE:'Lateral Esq.', LD:'Lateral Dir.',
  ZAG:'Zagueiro', VOL:'Volante', MC:'Meia Central',
  MEI:'Meia Atacante', PE:'Ponta Esq.', PD:'Ponta Dir.', ATA:'Atacante',
};

/* ── Mobile shell ───────────────────────────────────────────── */
function MobileShell({ stepHtml, rightNode, children, footer }) {
  return (
    <div className="cf" style={{ position:'fixed', inset:0 }}>
      <div className="cf-top">
        <span className="cf-wm"><CFEmblem s={24} />drafting<span className="g">11</span></span>
        {stepHtml
          ? <span className="cf-step" dangerouslySetInnerHTML={{ __html: stepHtml }} />
          : null}
        {rightNode !== undefined
          ? rightNode
          : <span className="cf-tag"><span className="star">★</span> COPA 2026</span>}
      </div>
      <div style={{ flex:1, minHeight:0, overflowY:'auto', display:'flex', flexDirection:'column' }}>
        {children}
      </div>
      {footer && <div className="cf-cta-wrap">{footer}</div>}
    </div>
  );
}

/* ── Desktop journey rail ───────────────────────────────────── */
const CFD_STEPS = ['Montar time','Fase de grupos','16-avos','Oitavas','Quartas','Semifinal','Final'];

function DesktopRail({ now, note }) {
  return (
    <div className="cfd-rail">
      <div className="cfd-brand"><CFEmblem s={28} />drafting<span className="g">11</span></div>
      <span className="cfd-railtag"><span className="star">★</span> COPA DO MUNDO 2026</span>
      <div>
        <div className="cfd-steplbl">Sua jornada</div>
        <div className="cfd-stepper">
          {CFD_STEPS.map((s, i) => {
            const st = i < now ? 'done' : i === now ? 'now' : 'locked';
            return (
              <div key={s} className={`cfd-stepitem ${st}`}>
                <span className="ix">{i < now ? '✓' : i + 1}</span>
                <span className="lb">{s}</span>
              </div>
            );
          })}
        </div>
      </div>
      {note && <div className="cfd-railnote">{note}</div>}
    </div>
  );
}

/* ── Desktop shell ──────────────────────────────────────────── */
function DesktopShell({ now=0, note, eyebrow, title, big=false, sub, children, footer, rightRail }) {
  return (
    <div className="cfd" style={{ position:'fixed', inset:0 }}>
      <DesktopRail now={now} note={note} />
      <div className="cfd-main">
        <div className="cfd-top">
          <div>
            {eyebrow && <span className="cf-eyebrow">{eyebrow}</span>}
            <h1 className={`cfd-h1${big ? ' big' : ''}`}>{title}</h1>
            {sub && <p className="cfd-topsub">{sub}</p>}
          </div>
        </div>
        <div className="cfd-content">{children}</div>
        {footer && <div className="cfd-footer">{footer}</div>}
      </div>
      {rightRail}
    </div>
  );
}

/* ── Responsive breakpoint hook ─────────────────────────────── */
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 900);
  useEffect(() => {
    const fn = () => setIsDesktop(window.innerWidth >= 900);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return isDesktop;
}

/* ── Confetti dots (champion screen) ───────────────────────── */
const CONFETTI = Array.from({ length: 28 }, (_, i) => ({
  left: (i * 37) % 100, top: (i * 53) % 70, rot: (i * 47) % 360,
  c: ['#f5a623','#46c97a','#fbd07a','#3a86d4','#e0443e'][i % 5],
}));

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════ */
const INITIAL_STATE = {
  phase: 'intro',
  formation: '4-3-3',
  lineup: {},
  pickingIndex: 0,
  players: null,
  options: [],
  group: null,
  koOpponents: [],
  round: 0,
  roundResults: [],
  koRound: 0,
  koResults: [],
  currentMatch: null,
  campaign: [],
};

export default function Confronto({ onBack }) {
  const [gs, setGs] = useState(INITIAL_STATE);
  const desktop = useIsDesktop();

  useEffect(() => {
    loadPlayers().then(players => {
      const group = buildGroupDraw(players);
      setGs(prev => ({ ...prev, players, group }));
    });
  }, []);

  const formation = FORMATIONS[gs.formation] || FORMATIONS['4-3-3'];
  const slots = formation.slots;
  const activeSlot = slots[gs.pickingIndex];
  const pickedCount = Object.keys(gs.lineup).length;

  function getMyAvgOvr() {
    const vals = Object.values(gs.lineup).map(p => p.ovr);
    if (!vals.length) return 75;
    return vals.reduce((s, v) => s + v, 0) / vals.length;
  }

  function startPicking(formationName) {
    const f = FORMATIONS[formationName] || formation;
    const options = getOptionsForSlot(gs.players, f.slots[0].slotType, new Set());
    setGs(prev => ({ ...prev, phase:'pickPlayers', formation:formationName, pickingIndex:0, options, lineup:{} }));
  }

  function pickPlayer(player) {
    const newLineup = { ...gs.lineup, [activeSlot.key]: player };
    const nextIndex = gs.pickingIndex + 1;
    const usedIds = new Set(Object.values(newLineup).map(p => p.id));
    if (nextIndex >= slots.length) {
      setGs(prev => ({ ...prev, lineup: newLineup, phase:'ready' }));
    } else {
      const nextSlot = slots[nextIndex];
      const options = getOptionsForSlot(gs.players, nextSlot.slotType, usedIds);
      setGs(prev => ({ ...prev, lineup: newLineup, pickingIndex: nextIndex, options }));
    }
  }

  function goPickAgain() {
    const f = FORMATIONS[gs.formation] || formation;
    const options = getOptionsForSlot(gs.players, f.slots[0].slotType, new Set());
    setGs(prev => ({ ...prev, phase:'pickPlayers', pickingIndex:0, lineup:{}, options }));
  }

  /* ── PHASE: intro ─────────────────────────────────────────── */
  if (gs.phase === 'intro') {
    const ribbon = (
      <div className="cf-ribbon">
        <span className="cf-rib on"><span className="i">●</span> Grupos</span>
        <span className="cf-ribsep">→</span>
        <span className="cf-rib">16-avos</span><span className="cf-ribsep">→</span>
        <span className="cf-rib">Oitavas</span><span className="cf-ribsep">→</span>
        <span className="cf-rib">Quartas</span><span className="cf-ribsep">→</span>
        <span className="cf-rib">Semi</span><span className="cf-ribsep">→</span>
        <span className="cf-rib"><span className="i">★</span> Final</span>
      </div>
    );
    const steps = (
      <>
        <div className="cf-stepcard"><div className="cf-stepnum">1</div><div><h4>Escolha a formação</h4><p>5 esquemas táticos. Defina como seu time vai jogar.</p></div></div>
        <div className="cf-stepcard"><div className="cf-stepnum">2</div><div><h4>Escale os titulares</h4><p>Para cada posição, 5 craques da Copa. Monte os 11.</p></div></div>
        <div className="cf-stepcard"><div className="cf-stepnum">3</div><div><h4>Simule a campanha</h4><p>3 jogos de grupo + mata-mata. Chegue na final.</p></div></div>
      </>
    );
    if (desktop) return (
      <DesktopShell now={0}
        note={<>Jogo <b>sem login</b>. Monte uma vez e simule a campanha inteira da Copa 2026.</>}
        eyebrow="★ DESAFIO COPA DO MUNDO 2026" big title="Monte seu XI e leve até a taça."
        sub="Escolha a formação, escale 11 craques da Copa 2026 e simule grupos e mata-mata — sem cadastro."
        footer={<><span className="hint">Sem login · é só jogar</span><button className="cfd-btn" onClick={() => setGs(p => ({...p, phase:'pickFormation'}))}>Montar meu time <CFArrow /></button></>}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>{steps}</div>
        <div style={{ marginTop:'auto' }}>{ribbon}</div>
      </DesktopShell>
    );
    return (
      <MobileShell stepHtml="<b>SEM LOGIN</b><span class='dot'></span>JOGUE JÁ"
        footer={<button className="cf-cta" onClick={() => setGs(p => ({...p, phase:'pickFormation'}))}>Montar meu time <CFArrow /></button>}>
        <div className="cf-pad">
          <span className="cf-eyebrow">★ DESAFIO COPA DO MUNDO 2026</span>
          <h1 className="cf-h1" style={{ fontSize:27 }}>Monte seu XI e leve até a taça.</h1>
          <p className="cf-lead" style={{ marginTop:8 }}>Escolha a formação, escale 11 craques da Copa 2026 e simule a campanha — grupos e mata-mata. Sem cadastro.</p>
          <div className="cf-steps" style={{ marginTop:16, gap:10 }}>{steps}</div>
          {ribbon}
        </div>
      </MobileShell>
    );
  }

  /* ── PHASE: pickFormation ─────────────────────────────────── */
  if (gs.phase === 'pickFormation') {
    const cards = Object.entries(FORMATIONS).map(([name, f]) => (
      <div key={name} className={`cf-formcard${gs.formation === name ? ' sel' : ''}`}
        onClick={() => setGs(p => ({...p, formation:name}))}>
        <div className="cf-formtop">
          <div><div className="cf-formname">{name}</div><div className="cf-formtagline">{f.tag}</div></div>
          <div className="cf-formpick" />
        </div>
        <MiniPitch dots={f.dots} />
      </div>
    ));
    if (desktop) return (
      <DesktopShell now={0} note={<>Passo <b>1 de 3</b>. Depois você escala os titulares.</>}
        eyebrow="★ MONTE SEU TIME · FORMAÇÃO" title="Como seu time vai a campo?"
        footer={<><span className="hint">1 de 3 · formação</span><button className="cfd-btn green" onClick={() => startPicking(gs.formation)}>Escalar titulares <CFArrow /></button></>}>
        <div className="cfd-formrow">{cards}</div>
      </DesktopShell>
    );
    return (
      <MobileShell stepHtml="<b>MONTE</b><span class='dot'></span>1 / 3 · FORMAÇÃO"
        footer={<button className="cf-cta green" onClick={() => startPicking(gs.formation)}>Escalar titulares <CFArrow /></button>}>
        <div className="cf-pad cf-scroll">
          <span className="cf-eyebrow">★ ESCOLHA SEU ESQUEMA</span>
          <h2 className="cf-h2" style={{ marginTop:10 }}>Como seu time vai a campo?</h2>
          <div className="cf-formgrid">{cards}</div>
        </div>
      </MobileShell>
    );
  }

  /* ── PHASE: pickPlayers ───────────────────────────────────── */
  if (gs.phase === 'pickPlayers') {
    const slot = activeSlot;
    const posColor = slot.line === 'gk' ? 'var(--c-gk)' : slot.line === 'def' ? 'var(--c-def)' : slot.line === 'mid' ? 'var(--c-mid)' : 'var(--c-att)';
    const posBar = (
      <div className="cf-pickbar">
        <div className="cf-pickpos" style={{ '--pc': posColor }}>
          <span className="cf-posbadge">{slot.pos}</span>
          <div>
            <div style={{ fontWeight:700, fontSize:13, color:'#fff' }}>{POS_LABEL[slot.pos] || slot.pos}</div>
            <div style={{ fontSize:10, color:'var(--text-3)' }}>Toque na carta para escalar</div>
          </div>
        </div>
      </div>
    );
    const optCards = <div className="cf-optrow">{gs.options.map(p => <OptionCard key={p.id} p={p} onPick={pickPlayer} />)}</div>;

    if (desktop) return (
      <DesktopShell now={0}
        note={<>Passo <b>2 de 3</b>. Toque numa carta para escalar a posição em destaque.</>}
        eyebrow="★ MONTE SEU TIME · TITULARES" title="Escale os 11 titulares"
        footer={<><span className="hint"><b>{pickedCount}</b> / 11 escalados</span><button className="cfd-btn ghost" disabled style={{ opacity:.45 }}>Faltam {11-pickedCount} posições</button></>}
        rightRail={
          <div className="cfd-rrail">
            <div className="cfd-rrail-hd">
              <span className="cf-eyebrow gold">★ Próxima escolha</span>
              <span className="cf-step" style={{ color:'var(--gold-soft)' }}>{pickedCount} / 11</span>
            </div>
            {posBar}
            <div className="cf-optrow" style={{ marginTop:4 }}>
              {gs.options.map(p => <OptionCard key={p.id} p={p} onPick={pickPlayer} />)}
            </div>
          </div>
        }>
        <Pitch slots={slots} lineup={gs.lineup} activeSlotKey={slot.key} />
      </DesktopShell>
    );
    return (
      <MobileShell stepHtml="<b>MONTE</b><span class='dot'></span>2 / 3 · TITULARES"
        rightNode={<span className="cf-step" style={{ color:'var(--gold-soft)' }}>{pickedCount} / 11</span>}>
        <div style={{ padding:'0 16px 6px' }}>{posBar}</div>
        <Pitch slots={slots} lineup={gs.lineup} activeSlotKey={slot.key} />
        <div className="cf-cta-wrap" style={{ paddingTop:14 }}>{optCards}</div>
      </MobileShell>
    );
  }

  /* ── PHASE: ready ─────────────────────────────────────────── */
  if (gs.phase === 'ready') {
    const avgOvr = (Object.values(gs.lineup).reduce((s, p) => s + p.ovr, 0) / 11).toFixed(1);
    const readyBanner = (
      <div className="cf-ready" style={{ margin:'8px 16px 0' }}>
        <div className="ck">✓</div>
        <div style={{ flex:1 }}>
          <h4>Seu XI está pronto</h4>
          <p>Média geral <b style={{ color:'#fff' }}>{avgOvr}</b></p>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontWeight:800, fontSize:20, color:'var(--gold-soft)' }}>★★★★★</div>
        </div>
      </div>
    );
    function goSimulate() {
      const koOpponents = buildKODraw(gs.players, gs.group?.opponents.map(o => o.name) || []);
      setGs(prev => ({ ...prev, phase:'groupOverview', koOpponents }));
    }
    if (desktop) return (
      <DesktopShell now={0}
        note={<>Tudo pronto. Clique em <b>Simular a Copa</b> para começar a fase de grupos.</>}
        eyebrow={`★ ESCALAÇÃO COMPLETA · ${gs.formation}`} title="Seu XI está pronto"
        footer={<>
          <button className="cfd-btn ghost" onClick={goPickAgain}>Ajustar escalação</button>
          <div className="grow" />
          <button className="cfd-btn" onClick={goSimulate}>Simular a Copa <CFPlay /></button>
        </>}
        rightRail={
          <div className="cfd-rrail">
            <div className="cf-ready" style={{ margin:0 }}>
              <div className="ck">✓</div>
              <div style={{ flex:1 }}><h4>11 / 11 escalados</h4><p>{gs.formation} · média {avgOvr}</p></div>
            </div>
          </div>
        }>
        <Pitch slots={slots} lineup={gs.lineup} />
      </DesktopShell>
    );
    return (
      <MobileShell stepHtml="<b>MONTE</b><span class='dot'></span>3 / 3 · PRONTO"
        rightNode={<span className="cf-step" style={{ color:'var(--green-glow)' }}>11 / 11 ✓</span>}
        footer={<>
          <button className="cf-cta" onClick={goSimulate}>Simular a Copa <CFPlay /></button>
          <button className="cf-ghost" onClick={goPickAgain}>Ajustar escalação</button>
        </>}>
        <div style={{ padding:'0 16px 4px' }}>
          <span className="cf-eyebrow">★ ESCALAÇÃO COMPLETA · {gs.formation}</span>
        </div>
        <Pitch slots={slots} lineup={gs.lineup} />
        {readyBanner}
      </MobileShell>
    );
  }

  /* ── PHASES handled in Task 4 (placeholder) ─────────────── */
  return (
    <div style={{ position:'fixed', inset:0, background:'#060807', color:'var(--text)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter,sans-serif' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:13, color:'var(--text-3)', marginBottom:12 }}>Fase: {gs.phase}</div>
        <div style={{ fontSize:18, color:'#fff' }}>Carregando próxima fase...</div>
      </div>
    </div>
  );
}
