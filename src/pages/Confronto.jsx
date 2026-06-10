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

/* ── Simulation engine ──────────────────────────────────────── */
const KO_PHASE_NAMES = ['16-avos','Oitavas','Quartas','Semifinal','Final'];
const KO_RAIL_STEP   = [2, 3, 4, 5, 6]; // index in CFD_STEPS for desktop rail

function simulateMatch(myAvgOvr, oppStrength, isKO = false) {
  const diff = myAvgOvr - oppStrength;
  const pWin = 1 / (1 + Math.exp(-diff / 7));
  const r = Math.random();
  let result;
  if (isKO) {
    result = r < pWin ? 'w' : 'l';
  } else {
    if (r < pWin * 0.88) result = 'w';
    else if (r < pWin * 0.88 + 0.17) result = 'd';
    else result = 'l';
  }
  const myGoals  = result === 'w' ? Math.floor(Math.random()*3)+1
                 : result === 'd' ? Math.floor(Math.random()*3)
                 : Math.floor(Math.random()*2);
  const oppGoals = result === 'l' ? Math.floor(Math.random()*3)+1
                 : result === 'd' ? myGoals
                 : Math.max(0, myGoals - Math.floor(Math.random()*2) - 1);
  const possession = Math.min(72, Math.max(28, Math.round(50 + diff/3 + (Math.random()*10-5))));
  const shots = Math.round(8 + myGoals*2 + Math.random()*8);
  const xg = +(myGoals + Math.random()*0.8 - 0.2).toFixed(1);
  return { result, myGoals, oppGoals, possession, shots, xg };
}

function genEvents(lineup, myGoals, oppGoals) {
  const attackers = Object.values(lineup).filter(p =>
    ['pe','pd','ata','mei','mc'].includes(p.slotType)
  );
  const total = myGoals + oppGoals;
  const mins = Array.from({ length: total }, () => Math.floor(Math.random()*90)+1)
    .sort((a,b)=>a-b);
  const events = [];
  let meCount = 0, oppCount = 0;
  for (const min of mins) {
    const isMe = meCount < myGoals && (oppCount >= oppGoals || Math.random() < 0.6);
    if (isMe) {
      meCount++;
      const scorer = attackers[Math.floor(Math.random()*Math.max(1,attackers.length))];
      events.push({ min:`${min}'`, side:'me', name: scorer?.name || 'Jogador', goal:true, sc:`${meCount}–${oppCount}` });
    } else {
      oppCount++;
      events.push({ min:`${min}'`, side:'op', name:'Gol adversário', goal:true, sc:`${meCount}–${oppCount}` });
    }
  }
  return events;
}

const HEADLINES_W = [
  'Dominante! Seu Time vence com autoridade',
  'Show de futebol: vitória convincente',
  'Brilhante! Favorito confirma qualidade',
  'Eficiência total: gols na hora certa',
];
const HEADLINES_D = [
  'Duelo equilibrado termina sem vencedor',
  'Batalha intensa: empate justo em campo',
  'Difícil, mas um ponto que vale muito',
];
const HEADLINES_L = [
  'Derrota amarga para Seu Time',
  'Difícil jornada: adversário leva a melhor',
  'Noite para esquecer — mas a Copa continua',
];
function genHeadline(result) {
  const pool = result==='w' ? HEADLINES_W : result==='d' ? HEADLINES_D : HEADLINES_L;
  return pool[Math.floor(Math.random()*pool.length)];
}

function simGroupOpponentPts() {
  const pts = [0,0,0];
  for (let i = 0; i < 3; i++) {
    const r = Math.random();
    if (r < 0.4) { pts[i%3]+=3; }
    else if (r < 0.65) { pts[i%3]+=1; pts[(i+1)%3]+=1; }
    else { pts[(i+1)%3]+=3; }
  }
  return pts;
}

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

  function getMyAvgOvr() {
    const vals = Object.values(gs.lineup).map(p => p.ovr);
    if (!vals.length) return 75;
    return vals.reduce((s, v) => s + v, 0) / vals.length;
  }

  function doSimGroupRound() {
    const opp = gs.group.opponents[gs.round];
    const myAvg = getMyAvgOvr();
    const sim = simulateMatch(myAvg, opp.strength);
    const events = genEvents(gs.lineup, sim.myGoals, sim.oppGoals);
    const headline = genHeadline(sim.result);
    const pts = sim.result==='w'?3:sim.result==='d'?1:0;
    setGs(prev => ({
      ...prev,
      phase: 'matchSim',
      currentMatch: {
        ...sim, events, headline,
        oppName: opp.namePt, oppIso: opp.iso,
        roundLabel: `Rodada ${prev.round+1}`,
        isGroup: true, pts,
      },
    }));
  }

  function afterMatchNews() {
    const m = gs.currentMatch;
    const newRoundResults = [...gs.roundResults, {
      oppName: m.oppName, oppIso: m.oppIso,
      myGoals: m.myGoals, oppGoals: m.oppGoals, result: m.result,
      pts: m.result==='w'?3:m.result==='d'?1:0,
    }];
    const newCampaign = [...gs.campaign, {
      ph: `Grupo ${gs.group?.letter||'G'} · R${gs.round+1}`,
      vs: m.oppName, scoreMe: m.myGoals, scoreThem: m.oppGoals, result: m.result,
    }];
    const nextRound = gs.round + 1;
    if (nextRound < 3) {
      const opp2 = gs.group.opponents[nextRound];
      const myAvg2 = Object.values(gs.lineup).reduce((s,p)=>s+p.ovr,0)/11;
      const sim2 = simulateMatch(myAvg2, opp2.strength);
      const ev2 = genEvents(gs.lineup, sim2.myGoals, sim2.oppGoals);
      setGs(prev=>({...prev, round:nextRound, roundResults:newRoundResults, campaign:newCampaign, phase:'matchSim',
        currentMatch:{
          ...sim2, events:ev2, headline:genHeadline(sim2.result),
          oppName:opp2.namePt, oppIso:opp2.iso,
          roundLabel:`Rodada ${nextRound+1}`, isGroup:true, pts:sim2.result==='w'?3:sim2.result==='d'?1:0,
        }
      }));
    } else {
      setGs(prev=>({...prev, roundResults:newRoundResults, campaign:newCampaign, phase:'groupResult'}));
    }
  }

  function computeGroupStandings() {
    const oppPts = simGroupOpponentPts();
    const myPts = gs.roundResults.reduce((s,r)=>s+r.pts, 0);
    const myGF = gs.roundResults.reduce((s,r)=>s+r.myGoals,0);
    const myGA = gs.roundResults.reduce((s,r)=>s+r.oppGoals,0);
    const mySG = myGF - myGA;
    const rows = [
      { name:'Seu Time', namePt:'Seu Time', me:true, pts:myPts, j:3, sg:mySG, gf:myGF, ga:myGA, iso:'_me' },
      ...(gs.group?.opponents || []).map((o,i)=>{
        const sg = Math.floor(Math.random()*5)-2;
        return { name:o.name, namePt:o.namePt, iso:o.iso, pts:oppPts[i], j:3, sg, gf:3+sg, ga:3 };
      }),
    ];
    rows.sort((a,b)=>b.pts-a.pts||b.sg-a.sg||b.gf-a.gf);
    return rows;
  }

  function doSimKOMatch() {
    const opp = gs.koOpponents[gs.koRound];
    const myAvg = getMyAvgOvr();
    const sim = simulateMatch(myAvg, opp.strength, true);
    const events = genEvents(gs.lineup, sim.myGoals, sim.oppGoals);
    setGs(prev=>({...prev, phase:'koMatch', currentMatch:{
      ...sim, events, headline:genHeadline(sim.result),
      oppName:opp.namePt, oppIso:opp.iso,
      phaseLabel:KO_PHASE_NAMES[prev.koRound],
      isKO:true,
    }}));
  }

  function afterKOMatch() {
    const m = gs.currentMatch;
    const newKoResults = [...gs.koResults, {
      phase:KO_PHASE_NAMES[gs.koRound], oppName:m.oppName, oppIso:m.oppIso,
      myGoals:m.myGoals, oppGoals:m.oppGoals, result:m.result,
    }];
    const newCampaign = [...gs.campaign, {
      ph:KO_PHASE_NAMES[gs.koRound], vs:m.oppName,
      scoreMe:m.myGoals, scoreThem:m.oppGoals, result:m.result,
    }];
    if (m.result === 'l') {
      setGs(prev=>({...prev, koResults:newKoResults, campaign:newCampaign, phase:'eliminated'}));
    } else {
      const nextKO = gs.koRound + 1;
      if (nextKO >= 4) {
        setGs(prev=>({...prev, koRound:nextKO, koResults:newKoResults, campaign:newCampaign, phase:'final'}));
      } else {
        setGs(prev=>({...prev, koRound:nextKO, koResults:newKoResults, campaign:newCampaign, phase:'bracket'}));
      }
    }
  }

  function doSimFinal() {
    const oppIdx = Math.min(4, gs.koOpponents.length-1);
    const opp = gs.koOpponents[oppIdx] || gs.koOpponents[gs.koOpponents.length-1] || {namePt:'Brasil',iso:'br'};
    const myAvg = getMyAvgOvr();
    const sim = simulateMatch(myAvg, opp.strength, true);
    const events = genEvents(gs.lineup, sim.myGoals, sim.oppGoals);
    const newCampaign = [...gs.campaign, {
      ph:'Final', vs:opp.namePt, scoreMe:sim.myGoals, scoreThem:sim.oppGoals, result:sim.result,
    }];
    setGs(prev=>({...prev, campaign:newCampaign, phase: sim.result==='w'?'champion':'eliminated',
      currentMatch:{...sim, events, headline:genHeadline(sim.result), oppName:opp.namePt, oppIso:opp.iso, phaseLabel:'Final'},
      koResults:[...prev.koResults, {phase:'Final', oppName:opp.namePt, oppIso:opp.iso, myGoals:sim.myGoals, oppGoals:sim.oppGoals, result:sim.result}],
    }));
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

  /* ── PHASE: groupOverview ────────────────────────────────── */
  if (gs.phase === 'groupOverview') {
    const opp = gs.group?.opponents || [];
    const letter = gs.group?.letter || 'G';
    const fixtures = opp.map((o,i) => ({ rd:`R${i+1}`, oppName:o.namePt, oppIso:o.iso }));
    if (desktop) return (
      <DesktopShell now={1} note={<>3 jogos. Os 2 melhores avançam para o mata-mata.</>}
        eyebrow={`★ VOCÊ CAIU NO GRUPO ${letter}`} title="Três jogos. Os 2 melhores avançam."
        sub="Simule rodada a rodada e some pontos para classificar."
        footer={<><span className="hint">Grupo {letter} · 4 seleções</span><button className="cfd-btn green" onClick={doSimGroupRound}>Simular Rodada 1 <CFPlay /></button></>}>
        <div className="cf-card" style={{marginBottom:16}}>
          <div className="cf-cardhd"><span className="ttl">Grupo {letter}</span><span className="cf-step" style={{color:'var(--text-4)'}}>4 SELEÇÕES</span></div>
          <table className="cf-gtable">
            <thead><tr><th className="l">Seleção</th><th>J</th><th>SG</th><th>Pts</th></tr></thead>
            <tbody>
              <tr className="cf-grow me"><td className="l"><div className="cf-gteam"><span className="cf-crest" style={{display:'grid',placeItems:'center',background:'linear-gradient(160deg,#1f7a46,#0b3a20)'}}><CFEmblem s={14}/></span><span className="cf-gname">Seu Time</span></div></td><td>0</td><td>—</td><td className="cf-gpts">0</td></tr>
              {opp.map(o=>(
                <tr key={o.name} className="cf-grow"><td className="l"><div className="cf-gteam"><span className="cf-crest"><span className={`fi fi-${o.iso}`}/></span><span className="cf-gname">{o.namePt}</span></div></td><td>0</td><td>—</td><td className="cf-gpts">0</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="cf-sec" style={{margin:'0 0 10px'}}><span className="n">3×</span><span className="t">Calendário</span><span className="ln" style={{flex:1,height:1,background:'rgba(255,255,255,.08)',margin:'0 8px'}}/></div>
        <div className="cf-card">
          <div className="cf-fix">
            {fixtures.map((f,i)=>(
              <div key={i} className="cf-fixrow">
                <span className="cf-fixrd">{f.rd}</span>
                <div className="cf-fixteam me"><span className="cf-crest" style={{display:'grid',placeItems:'center',background:'linear-gradient(160deg,#1f7a46,#0b3a20)'}}><CFEmblem s={12}/></span><span className="nm">Seu Time</span></div>
                <span className="cf-fixsc pend">VS</span>
                <div className="cf-fixteam r"><span className="nm">{f.oppName}</span><span className="cf-crest"><span className={`fi fi-${f.oppIso}`}/></span></div>
              </div>
            ))}
          </div>
        </div>
      </DesktopShell>
    );
    return (
      <MobileShell stepHtml={`<b>FASE DE GRUPOS</b><span class='dot'></span>GRUPO ${letter}`}
        footer={<button className="cf-cta green" onClick={doSimGroupRound}>Simular Rodada 1 <CFPlay /></button>}>
        <div className="cf-body cf-pad cf-scroll">
          <span className="cf-eyebrow">★ VOCÊ CAIU NO GRUPO {letter}</span>
          <h2 className="cf-h2" style={{marginTop:10}}>Três jogos. Os 2 melhores avançam.</h2>
          <p className="cf-sub">Simule rodada a rodada e some pontos para classificar.</p>
          <div className="cf-card" style={{marginTop:16}}>
            <div className="cf-cardhd"><span className="ttl">Grupo {letter}</span><span className="cf-step" style={{color:'var(--text-4)'}}>4 SELEÇÕES</span></div>
            <table className="cf-gtable">
              <thead><tr><th className="l">Seleção</th><th>J</th><th>SG</th><th>Pts</th></tr></thead>
              <tbody>
                <tr className="cf-grow me"><td className="l"><div className="cf-gteam"><span className="cf-crest" style={{display:'grid',placeItems:'center',background:'linear-gradient(160deg,#1f7a46,#0b3a20)'}}><CFEmblem s={14}/></span><span className="cf-gname">Seu Time</span></div></td><td>0</td><td>—</td><td className="cf-gpts">0</td></tr>
                {opp.map(o=>(
                  <tr key={o.name} className="cf-grow"><td className="l"><div className="cf-gteam"><span className="cf-crest"><span className={`fi fi-${o.iso}`}/></span><span className="cf-gname">{o.namePt}</span></div></td><td>0</td><td>—</td><td className="cf-gpts">0</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="cf-sec" style={{margin:'20px 0 10px'}}><span className="n">3×</span><span className="t">Calendário</span><span className="ln" style={{flex:1,height:1,background:'rgba(255,255,255,.08)',margin:'0 8px'}}/></div>
          <div className="cf-card">
            <div className="cf-fix">
              {fixtures.map((f,i)=>(
                <div key={i} className="cf-fixrow">
                  <span className="cf-fixrd">{f.rd}</span>
                  <div className="cf-fixteam me"><span className="cf-crest" style={{display:'grid',placeItems:'center',background:'linear-gradient(160deg,#1f7a46,#0b3a20)'}}><CFEmblem s={12}/></span><span className="nm">Seu Time</span></div>
                  <span className="cf-fixsc pend">VS</span>
                  <div className="cf-fixteam r"><span className="nm">{f.oppName}</span><span className="cf-crest"><span className={`fi fi-${f.oppIso}`}/></span></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </MobileShell>
    );
  }

  /* ── PHASE: matchSim ──────────────────────────────────────── */
  if (gs.phase === 'matchSim') {
    const m = gs.currentMatch;
    if (!m) return <div style={{position:'fixed',inset:0,background:'#060807',display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{color:'#fff',fontSize:16}}>Simulando...</div></div>;
    const score = `${m.myGoals}<span class="x">×</span>${m.oppGoals}`;
    const stepHtml = m.isGroup
      ? `<b>GRUPO ${gs.group?.letter||'G'}</b><span class='dot'></span>${m.roundLabel?.toUpperCase()}`
      : `<b>MATA-MATA</b><span class='dot'></span>${m.phaseLabel?.toUpperCase()}`;
    const scoreboard = (
      <div className="cf-scoreboard">
        <div className="cf-sbtop"><span className="cf-live"><span className="cf-livedot"/> FIM DE JOGO</span> · {m.roundLabel||m.phaseLabel}</div>
        <div className="cf-sbgrid">
          <div className="cf-sbside">
            <span className="cf-sbcrest" style={{display:'grid',placeItems:'center',background:'linear-gradient(160deg,#1f7a46,#0b3a20)'}}><CFEmblem s={34}/></span>
            <div className="cf-sbnm me">Seu Time</div>
          </div>
          <div style={{textAlign:'center'}}>
            <div className="cf-sbscore" dangerouslySetInnerHTML={{__html:score}}/>
            <div className="cf-sbmin">FIM DE JOGO</div>
          </div>
          <div className="cf-sbside">
            <span className="cf-sbcrest"><span className={`fi fi-${m.oppIso}`}/></span>
            <div className="cf-sbnm">{m.oppName}</div>
          </div>
        </div>
      </div>
    );
    const timeline = (
      <>
        <div className="cf-sumhd"><span className="t">Súmula</span><span className="ln" style={{flex:1,height:1,background:'rgba(255,255,255,.08)',margin:'0 8px'}}/><span className="t" style={{color:'var(--gold-soft)'}}>{m.myGoals+m.oppGoals} gols</span></div>
        <div className="cf-timeline">
          {m.events.map((e,i)=>(
            <div key={i} className={`cf-tl ${e.side==='op'?'r':''}`}>
              <span className="cf-tlmin">{e.min}</span>
              <span className={`cf-tlball ${e.goal?'goal':''}`}><CFBall/></span>
              <div className="cf-tlmain">
                <div className="cf-tlname">{e.name} <span style={{color:'var(--text-4)',fontSize:11,fontWeight:700}}>{e.sc}</span></div>
                <div className="cf-tlkind">{e.goal?'Gol':''} · {e.side==='me'?'Seu Time':m.oppName}</div>
              </div>
            </div>
          ))}
        </div>
      </>
    );
    if (desktop) return (
      <DesktopShell now={m.isGroup?1:KO_RAIL_STEP[gs.koRound]||2} note={<>{m.phaseLabel||m.roundLabel}</>}
        eyebrow={m.isGroup?`★ GRUPO ${gs.group?.letter||'G'} · ${m.roundLabel?.toUpperCase()}`:`★ MATA-MATA · ${m.phaseLabel?.toUpperCase()}`}
        title={`Seu Time ${m.myGoals}×${m.oppGoals} ${m.oppName}`}
        footer={<><span className="hint">Fim de jogo</span><button className="cfd-btn" onClick={()=>setGs(p=>({...p,phase:'matchNews'}))}>Ver repercussão <CFArrow/></button></>}>
        <div className="cf-match">{scoreboard}{timeline}</div>
      </DesktopShell>
    );
    return (
      <MobileShell stepHtml={stepHtml} footer={<button className="cf-cta" onClick={()=>setGs(p=>({...p,phase:'matchNews'}))}>Apito final · ver repercussão <CFArrow/></button>}>
        <div className="cf-match">{scoreboard}{timeline}</div>
      </MobileShell>
    );
  }

  /* ── PHASE: matchNews ─────────────────────────────────────── */
  if (gs.phase === 'matchNews') {
    const m = gs.currentMatch;
    const [verdictLabel, verdictCls] = m.result==='w'?['▲ Vitória',m.isGroup?'· 3 pontos':'· Classificado!']:m.result==='d'?['● Empate','· 1 ponto']:['▼ Derrota',m.isGroup?'· 0 pontos':''];
    const verdict = <span className={`cf-verdict ${m.result==='w'?'win':m.result==='d'?'draw':'lose'}`}>{verdictLabel} {verdictCls}</span>;
    const newsCard = (
      <div className="cf-news">
        <div className="cf-newsband"><span className="lbl">★ Boletim da Partida</span><span className="dt">COPA 2026</span></div>
        <div className="cf-newsbody">
          <h3 className="cf-headline">{m.headline}</h3>
          <div className="cf-newsstat">
            <div className="cf-stat"><div className="v">{m.possession}%</div><div className="k">Posse</div></div>
            <div className="cf-stat"><div className="v">{m.shots}</div><div className="k">Finalizações</div></div>
            <div className="cf-stat"><div className="v">{m.xg}</div><div className="k">xG</div></div>
          </div>
        </div>
      </div>
    );
    const myScorers = m.events.filter(e=>e.side==='me').map(e=>`${e.name} ${e.min}`).join(' · ') || '—';
    const oppScorers = m.events.filter(e=>e.side==='op').map(e=>e.min).join(', ') || '—';
    const goalCard = (
      <div className="cf-card" style={{margin:'12px 16px 0'}}>
        <div className="cf-fix">
          <div className="cf-fixrow" style={{gridTemplateColumns:'1fr auto'}}>
            <div className="cf-fixteam me"><span className="cf-crest" style={{display:'grid',placeItems:'center',background:'linear-gradient(160deg,#1f7a46,#0b3a20)'}}><CFEmblem s={12}/></span><span className="nm">{myScorers}</span></div>
            <span className={`cf-fixsc ${m.result==='w'?'w':m.result==='d'?'d':'l'}`}>{m.myGoals}</span>
          </div>
          <div className="cf-fixrow" style={{gridTemplateColumns:'1fr auto'}}>
            <div className="cf-fixteam"><span className="cf-crest"><span className={`fi fi-${m.oppIso}`}/></span><span className="nm">{oppScorers}</span></div>
            <span className={`cf-fixsc ${m.result==='l'?'w':m.result==='d'?'d':'l'}`}>{m.oppGoals}</span>
          </div>
        </div>
      </div>
    );
    const isLastGroup = gs.round >= 2;
    const isKO = m.isKO;
    const ctaBtn = isKO
      ? <button className={`cf-cta${m.result==='w'?' green':''}`} onClick={afterKOMatch}>{m.result==='w'?'Avançar ':'Ver eliminação '}{m.result==='w'?<CFArrow/>:null}</button>
      : isLastGroup
        ? <button className="cf-cta" onClick={afterMatchNews}>Ver classificação final <CFArrow/></button>
        : <button className="cf-cta green" onClick={afterMatchNews}>Simular Rodada {gs.round+2} <CFPlay/></button>;
    const stepHtml = m.isGroup
      ? `<b>GRUPO ${gs.group?.letter||'G'}</b><span class='dot'></span>R${gs.round+1} · ENCERRADO`
      : `<b>MATA-MATA</b><span class='dot'></span>${m.phaseLabel?.toUpperCase()} · ENCERRADO`;
    if (desktop) return (
      <DesktopShell now={m.isGroup?1:KO_RAIL_STEP[gs.koRound]||2} note={<>{m.phaseLabel||m.roundLabel} encerrado</>}
        eyebrow={m.result==='w'?'★ VITÓRIA':'★ RESULTADO'}
        title={m.headline}
        footer={<><span className="hint">{m.myGoals}–{m.oppGoals} · {m.oppName}</span>{ctaBtn}</>}>
        <div style={{padding:'0 0 8px',display:'flex',justifyContent:'center'}}>{verdict}</div>
        {newsCard}{goalCard}
      </DesktopShell>
    );
    return (
      <MobileShell stepHtml={stepHtml} footer={ctaBtn}>
        <div className="cf-body cf-scroll" style={{overflow:'hidden'}}>
          <div style={{padding:'2px 16px 0',display:'flex',justifyContent:'center'}}>{verdict}</div>
          {newsCard}
          <div className="cf-sumhd"><span className="t">Quem marcou</span><span className="ln" style={{flex:1,height:1,background:'rgba(255,255,255,.08)',margin:'0 8px'}}/></div>
          {goalCard}
        </div>
      </MobileShell>
    );
  }

  /* ── PHASE: groupResult ───────────────────────────────────── */
  if (gs.phase === 'groupResult') {
    const standings = computeGroupStandings();
    const myPos = standings.findIndex(r=>r.me)+1;
    const qualified = myPos <= 2;
    const totalPts = gs.roundResults.reduce((s,r)=>s+r.pts,0);
    const wins = gs.roundResults.filter(r=>r.result==='w').length;
    const draws = gs.roundResults.filter(r=>r.result==='d').length;
    const losses = gs.roundResults.filter(r=>r.result==='l').length;
    const letter = gs.group?.letter||'G';
    const finishLabel = myPos===1?'1º':'2º';
    const addGroupCampaign = () => {
      const entry = { ph:`Grupo ${letter}`, vs:`${finishLabel} lugar · ${totalPts} pts`, scoreMe:wins, scoreThem:losses, result:qualified?'w':'l' };
      const updated = gs.campaign.some(c=>c.ph===`Grupo ${letter}`) ? gs.campaign : [entry,...gs.campaign];
      if (!qualified) {
        setGs(prev=>({...prev, campaign:updated, phase:'eliminated'}));
      } else {
        setGs(prev=>({...prev, campaign:updated, phase:'bracket'}));
      }
    };
    const table = (
      <div className="cf-card" style={{marginTop:14}}>
        <table className="cf-gtable">
          <thead><tr><th className="l">Seleção</th><th>J</th><th>SG</th><th>Pts</th></tr></thead>
          <tbody>
            {standings.map((r,i)=>(
              <tr key={r.name} className={`cf-grow${r.me?' me':''}${i<2?' qual':''}${i>=3?' elim':''}`}>
                <td className="l"><div className="cf-gteam">
                  <span className="cf-gpos" style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:'var(--text-4)',width:12,display:'inline-block',textAlign:'center'}}>{i+1}</span>
                  {r.me
                    ? <span className="cf-crest" style={{display:'grid',placeItems:'center',background:'linear-gradient(160deg,#1f7a46,#0b3a20)'}}><CFEmblem s={14}/></span>
                    : <span className="cf-crest"><span className={`fi fi-${r.iso}`}/></span>}
                  <span className="cf-gname">{r.me?'Seu Time':r.namePt}</span>
                  {i<2 && <span className="cf-qbadge">→ avança</span>}
                </div></td>
                <td>{r.j}</td>
                <td>{r.sg>=0?`+${r.sg}`:r.sg}</td>
                <td className="cf-gpts">{r.pts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    const resultBadge = qualified
      ? <div className="cf-ready" style={{margin:'16px 0 0'}}><div className="ck">✓</div><div style={{flex:1}}><h4>Classificado para o mata-mata</h4><p>{wins}V · {draws}E · {losses}D — {totalPts} pts</p></div></div>
      : <div className="cf-ready" style={{margin:'16px 0 0',borderColor:'rgba(224,68,62,.4)',background:'rgba(224,68,62,.08)'}}><div className="ck" style={{background:'rgba(224,68,62,.2)',color:'#e0443e'}}>✗</div><div style={{flex:1}}><h4>Eliminado na fase de grupos</h4><p>{wins}V · {draws}E · {losses}D — {totalPts} pts</p></div></div>;
    if (desktop) return (
      <DesktopShell now={1}
        eyebrow={`★ GRUPO ${letter} · CLASSIFICAÇÃO FINAL`}
        title={qualified?`Você terminou em ${finishLabel}!`:'Eliminado na fase de grupos.'}
        footer={<><span className="hint">{qualified?'Avançando para o mata-mata':'Jornada encerrada'}</span><button className={`cfd-btn${qualified?' green':''}`} onClick={addGroupCampaign}>{qualified?'Entrar no mata-mata':'Ver resumo'} <CFArrow/></button></>}>
        {table}
        {resultBadge}
      </DesktopShell>
    );
    return (
      <MobileShell stepHtml={`<b>FASE DE GRUPOS</b><span class='dot'></span>ENCERRADA`}
        footer={<button className={`cf-cta${qualified?'':' '}`} onClick={addGroupCampaign}>{qualified?'Entrar no mata-mata':'Ver resumo'} {qualified?<CFArrow/>:null}</button>}>
        <div className="cf-body cf-pad cf-scroll" style={{overflow:'hidden'}}>
          <span className="cf-eyebrow">★ GRUPO {letter} · CLASSIFICAÇÃO FINAL</span>
          <h2 className="cf-h2" style={{marginTop:10}}>{qualified?`Você terminou em ${finishLabel}!`:'Eliminado na fase de grupos.'}</h2>
          {table}
          <div className="cf-sumhd"><span className="t">Sua campanha no grupo</span><span className="ln" style={{flex:1,height:1,background:'rgba(255,255,255,.08)',margin:'0 8px'}}/></div>
          <div className="cf-card" style={{margin:'12px 0 0'}}>
            <div className="cf-fix">
              {gs.roundResults.map((r,i)=>(
                <div key={i} className="cf-fixrow">
                  <span className="cf-fixrd">R{i+1}</span>
                  <div className="cf-fixteam me"><span className="cf-crest" style={{display:'grid',placeItems:'center',background:'linear-gradient(160deg,#1f7a46,#0b3a20)'}}><CFEmblem s={12}/></span><span className="nm">Seu Time</span></div>
                  <span className={`cf-fixsc ${r.result}`}>{r.myGoals}–{r.oppGoals}</span>
                  <div className="cf-fixteam r"><span className="nm">{r.oppName}</span><span className="cf-crest"><span className={`fi fi-${r.oppIso}`}/></span></div>
                </div>
              ))}
            </div>
          </div>
          {resultBadge}
        </div>
      </MobileShell>
    );
  }

  /* ── PHASE: bracket ───────────────────────────────────────── */
  if (gs.phase === 'bracket') {
    const phaseName = KO_PHASE_NAMES[gs.koRound];
    const opp = gs.koOpponents[gs.koRound];
    const bracketItems = KO_PHASE_NAMES.map((ph,i)=>{
      const done = gs.koResults.find(r=>r.phase===ph);
      const st = done ? 'done' : i===gs.koRound ? 'now' : 'locked';
      return { ph, st, done };
    });
    if (desktop) return (
      <DesktopShell now={KO_RAIL_STEP[gs.koRound]||2}
        eyebrow="★ CAMINHO ATÉ O TÍTULO" title="5 mata-matas até a taça."
        sub="Ganhou, avança. Perdeu, acabou. Simule um confronto de cada vez."
        footer={<><span className="hint">vs {opp?.namePt}</span><button className="cfd-btn green" onClick={doSimKOMatch}>Simular {phaseName} <CFPlay/></button></>}>
        <div style={{marginTop:16}}>
          {bracketItems.map((k,i)=>(
            <div key={k.ph} className={`cf-brkphase ${k.st}`}>
              <span className="cf-brkstep">{k.st==='done'?'✓':i+1}</span>
              <div className="cf-brkmain"><div className="cf-brkname">{k.ph}</div></div>
              <div className="cf-brkres">
                {k.st==='done' && <><div className={`sc ${k.done.result}`}>{k.done.myGoals}–{k.done.oppGoals}</div><div className="op">vs {k.done.oppName}</div></>}
                {k.st==='now' && <><div className="cf-brktag">▶ AGORA</div><div className="op">vs {opp?.namePt}</div></>}
                {k.st==='locked' && <div className="op" style={{opacity:.6}}>A definir</div>}
              </div>
            </div>
          ))}
        </div>
      </DesktopShell>
    );
    return (
      <MobileShell stepHtml={`<b>MATA-MATA</b><span class='dot'></span>SUA CHAVE`}
        footer={<button className="cf-cta green" onClick={doSimKOMatch}>Simular {phaseName} <CFPlay/></button>}>
        <div className="cf-body cf-pad cf-scroll" style={{overflow:'hidden'}}>
          <span className="cf-eyebrow gold">★ CAMINHO ATÉ O TÍTULO</span>
          <h2 className="cf-h2" style={{marginTop:10}}>5 mata-matas até a taça.</h2>
          <p className="cf-sub">Ganhou, avança. Perdeu, acabou.</p>
          <div style={{marginTop:16}}>
            {bracketItems.map((k,i)=>(
              <div key={k.ph} className={`cf-brkphase ${k.st}`}>
                <span className="cf-brkstep">{k.st==='done'?'✓':i+1}</span>
                <div className="cf-brkmain"><div className="cf-brkname">{k.ph}</div></div>
                <div className="cf-brkres">
                  {k.st==='done' && <><div className={`sc ${k.done.result}`}>{k.done.myGoals}–{k.done.oppGoals}</div><div className="op">vs {k.done.oppName}</div></>}
                  {k.st==='now' && <><div className="cf-brktag">▶ AGORA</div><div className="op">vs {opp?.namePt}</div></>}
                  {k.st==='locked' && <div className="op" style={{opacity:.6}}>A definir</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </MobileShell>
    );
  }

  /* ── PHASE: koMatch ───────────────────────────────────────── */
  if (gs.phase === 'koMatch') {
    const m = gs.currentMatch;
    if (!m) return null;
    const [verdictLabel, verdictCls] = m.result==='w'?['▲ Classificado','win']:['▼ Eliminado','lose'];
    const nextPhaseName = m.result==='w' && gs.koRound < 3 ? KO_PHASE_NAMES[gs.koRound+1] : null;
    if (desktop) return (
      <DesktopShell now={KO_RAIL_STEP[gs.koRound]||2}
        eyebrow={`★ ${m.phaseLabel?.toUpperCase()} · MATA-MATA`}
        title={`Seu Time ${m.myGoals}×${m.oppGoals} ${m.oppName}`}
        footer={<><span className="hint">{m.result==='w'?`Avançando para as ${nextPhaseName||'Final'}`:'Eliminado'}</span><button className={`cfd-btn${m.result==='w'?' green':''}`} onClick={afterKOMatch}>{m.result==='w'?'Avançar ':'Ver campanha '}<CFArrow/></button></>}>
        <div className="cf-match">
          <div className="cf-scoreboard">
            <div className="cf-sbtop">★ {m.phaseLabel?.toUpperCase()} · MATA-MATA</div>
            <div className="cf-sbgrid">
              <div className="cf-sbside"><span className="cf-sbcrest" style={{display:'grid',placeItems:'center',background:'linear-gradient(160deg,#1f7a46,#0b3a20)'}}><CFEmblem s={34}/></span><div className="cf-sbnm me">Seu Time</div></div>
              <div style={{textAlign:'center'}}><div className="cf-sbscore">{m.myGoals}<span className="x">×</span>{m.oppGoals}</div><div className="cf-sbmin">FIM DE JOGO</div></div>
              <div className="cf-sbside"><span className="cf-sbcrest"><span className={`fi fi-${m.oppIso}`}/></span><div className="cf-sbnm">{m.oppName}</div></div>
            </div>
          </div>
          <div style={{display:'flex',justifyContent:'center',marginTop:16}}><span className={`cf-verdict ${verdictCls}`}>{verdictLabel} {m.result==='w'?`nas ${nextPhaseName||'Final'}`:''}</span></div>
          <div className="cf-timeline" style={{marginTop:12}}>
            {m.events.slice(0,4).map((e,i)=>(
              <div key={i} className={`cf-tl ${e.side==='op'?'r':''}`}>
                <span className="cf-tlmin">{e.min}</span>
                <span className={`cf-tlball ${e.goal?'goal':''}`}><CFBall/></span>
                <div className="cf-tlmain"><div className="cf-tlname">{e.name} <span style={{color:'var(--text-4)',fontSize:11,fontWeight:700}}>{e.sc}</span></div><div className="cf-tlkind">{e.side==='me'?'Seu Time':m.oppName}</div></div>
              </div>
            ))}
          </div>
        </div>
      </DesktopShell>
    );
    return (
      <MobileShell stepHtml={`<b>MATA-MATA</b><span class='dot'></span>${m.phaseLabel?.toUpperCase()}`}
        footer={<button className={`cf-cta${m.result==='w'?' green':''}`} onClick={afterKOMatch}>{m.result==='w'?'Avançar ':'Ver campanha '}<CFArrow/></button>}>
        <div className="cf-match">
          <div className="cf-scoreboard">
            <div className="cf-sbtop">★ {m.phaseLabel?.toUpperCase()} · MATA-MATA</div>
            <div className="cf-sbgrid">
              <div className="cf-sbside"><span className="cf-sbcrest" style={{display:'grid',placeItems:'center',background:'linear-gradient(160deg,#1f7a46,#0b3a20)'}}><CFEmblem s={34}/></span><div className="cf-sbnm me">Seu Time</div></div>
              <div style={{textAlign:'center'}}><div className="cf-sbscore">{m.myGoals}<span className="x">×</span>{m.oppGoals}</div><div className="cf-sbmin">FIM DE JOGO</div></div>
              <div className="cf-sbside"><span className="cf-sbcrest"><span className={`fi fi-${m.oppIso}`}/></span><div className="cf-sbnm">{m.oppName}</div></div>
            </div>
          </div>
          <div style={{padding:'0 16px',display:'flex',justifyContent:'center',marginTop:16}}><span className={`cf-verdict ${verdictCls}`}>{verdictLabel}</span></div>
          <div className="cf-timeline" style={{marginTop:12}}>
            {m.events.slice(0,3).map((e,i)=>(
              <div key={i} className={`cf-tl ${e.side==='op'?'r':''}`}>
                <span className="cf-tlmin">{e.min}</span>
                <span className={`cf-tlball ${e.goal?'goal':''}`}><CFBall/></span>
                <div className="cf-tlmain"><div className="cf-tlname">{e.name} <span style={{color:'var(--text-4)',fontSize:11,fontWeight:700}}>{e.sc}</span></div><div className="cf-tlkind">{e.side==='me'?'Seu Time':m.oppName}</div></div>
              </div>
            ))}
          </div>
        </div>
      </MobileShell>
    );
  }

  /* ── PHASE: final ─────────────────────────────────────────── */
  if (gs.phase === 'final') {
    const oppIdx = Math.min(4, gs.koOpponents.length-1);
    const finalOpp = gs.koOpponents[oppIdx] || gs.koOpponents[gs.koOpponents.length-1] || {namePt:'Brasil',iso:'br'};
    if (desktop) return (
      <DesktopShell now={6} eyebrow="★ A GRANDE FINAL" title="Um jogo entre você e a taça." big
        sub="Você venceu todos os mata-matas para chegar aqui. Falta o último passo: ser campeão do mundo."
        footer={<><span className="hint">MetLife Stadium · Nova Jersey</span><button className="cfd-btn" onClick={doSimFinal}>Disputar a final <CFPlay/></button></>}>
        <div className="cf-end" style={{justifyContent:'space-between',paddingTop:18}}>
          <div style={{display:'flex',alignItems:'center',gap:14,margin:'16px 0'}}>
            <div className="cf-sbside"><span className="cf-sbcrest" style={{display:'grid',placeItems:'center',background:'linear-gradient(160deg,#1f7a46,#0b3a20)'}}><CFEmblem s={34}/></span><div className="cf-sbnm me" style={{fontSize:15}}>Seu Time</div></div>
            <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontWeight:800,fontSize:28,color:'var(--text-4)'}}>×</div>
            <div className="cf-sbside"><span className="cf-sbcrest"><span className={`fi fi-${finalOpp.iso}`}/></span><div className="cf-sbnm" style={{fontSize:15}}>{finalOpp.namePt}</div></div>
          </div>
          <div className="cf-ribbon" style={{justifyContent:'center',marginTop:8}}>
            {KO_PHASE_NAMES.slice(0,-1).map(ph=><span key={ph} className="cf-rib on">{ph} ✓</span>)}
            <span className="cf-rib"><span className="i">★</span> Final</span>
          </div>
        </div>
      </DesktopShell>
    );
    return (
      <MobileShell stepHtml="<b>★ A GRANDE FINAL</b>"
        footer={<button className="cf-cta" onClick={doSimFinal}>Disputar a final <CFPlay/></button>}>
        <div className="cf-end" style={{justifyContent:'space-between',paddingTop:18}}>
          <div style={{textAlign:'center'}}>
            <span className="cf-endkick">FINAL DA COPA DO MUNDO 2026</span>
            <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontWeight:800,fontSize:13,color:'var(--text-3)',marginTop:6,letterSpacing:'.04em'}}>METLIFE STADIUM · NOVA JERSEY</div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:14,margin:'10px 0'}}>
            <div className="cf-sbside"><span className="cf-sbcrest" style={{display:'grid',placeItems:'center',background:'linear-gradient(160deg,#1f7a46,#0b3a20)'}}><CFEmblem s={34}/></span><div className="cf-sbnm me" style={{fontSize:15}}>Seu Time</div></div>
            <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontWeight:800,fontSize:28,color:'var(--text-4)'}}>×</div>
            <div className="cf-sbside"><span className="cf-sbcrest"><span className={`fi fi-${finalOpp.iso}`}/></span><div className="cf-sbnm" style={{fontSize:15}}>{finalOpp.namePt}</div></div>
          </div>
          <div style={{textAlign:'center'}}>
            <h2 className="cf-h2" style={{fontSize:24}}>Um jogo entre você e a taça.</h2>
            <p className="cf-endsub" style={{margin:'10px auto 0'}}>Você chegou até a final. Um jogo separa você do título mundial.</p>
          </div>
          <div className="cf-ribbon" style={{justifyContent:'center',marginTop:0}}>
            {KO_PHASE_NAMES.slice(0,-1).map(ph=><span key={ph} className="cf-rib on">{ph} ✓</span>)}
            <span className="cf-rib"><span className="i">★</span> Final</span>
          </div>
        </div>
      </MobileShell>
    );
  }

  /* ── PHASE: champion ──────────────────────────────────────── */
  if (gs.phase === 'champion') {
    const m = gs.currentMatch;
    const resetGame = () => setGs({...INITIAL_STATE});
    const recapItems = gs.campaign;
    if (desktop) return (
      <DesktopShell now={7} eyebrow="★ CAMPEÃO DO MUNDO · 2026" title="VOCÊ É CAMPEÃO!" big
        footer={<><button className="cfd-btn ghost" onClick={resetGame}>Jogar de novo</button></>}>
        <div style={{position:'relative'}}>
          <div className="cf-confetti">{CONFETTI.map((c,i)=>(<span key={i} style={{left:`${c.left}%`,top:`${c.top}%`,background:c.c,transform:`rotate(${c.rot}deg)`,position:'absolute',width:8,height:8,borderRadius:2}}/>))}</div>
          <div className="cf-trophy"><svg width="44" height="44" viewBox="0 0 24 24" fill="#3a2806"><path d="M6 4h12v3a4 4 0 0 1-2 3.46V12a4 4 0 0 1-3 3.87V18h3v2H8v-2h3v-2.13A4 4 0 0 1 8 12v-1.54A4 4 0 0 1 6 7V4zM4 6h2v1a2 2 0 0 1-2-2V6zm14 0h2v-1a2 2 0 0 1-2 2V6z"/></svg></div>
          <p className="cf-endsub" style={{marginTop:10,textAlign:'center'}}>Seu Time venceu {m?.oppName||'o adversário'} por <b style={{color:'#fff'}}>{m?.myGoals}–{m?.oppGoals}</b> na final.</p>
          <div className="cf-recap" style={{marginTop:16}}>
            {recapItems.map((r,i)=>(
              <div key={i} className={`cf-recaprow${r.result==='l'?' out':''}`}>
                <span className="ph">{r.ph}</span>
                <span className="vs">{r.vs}</span>
                <span className={`rs ${r.result==='w'?'w':r.result==='d'?'d':'l'}`}>{r.scoreMe}–{r.scoreThem}</span>
              </div>
            ))}
          </div>
        </div>
      </DesktopShell>
    );
    return (
      <MobileShell stepHtml="<b>FIM DE JOGO</b>" rightNode={<span className="cf-step" style={{color:'var(--gold-soft)'}}>★</span>}
        footer={<><button className="cf-cta" onClick={resetGame}>Jogar de novo <CFArrow/></button><button className="cf-ghost" onClick={()=>setGs(p=>({...INITIAL_STATE,players:p.players}))}>Trocar formação e elenco</button></>}>
        <div className="cf-confetti">{CONFETTI.map((c,i)=>(<span key={i} style={{left:`${c.left}%`,top:`${c.top}%`,background:c.c,transform:`rotate(${c.rot}deg)`,position:'fixed',width:8,height:8,borderRadius:2}}/>))}</div>
        <div className="cf-end cf-scroll" style={{overflow:'hidden',justifyContent:'flex-start',paddingTop:18}}>
          <div className="cf-trophy"><svg width="44" height="44" viewBox="0 0 24 24" fill="#3a2806"><path d="M6 4h12v3a4 4 0 0 1-2 3.46V12a4 4 0 0 1-3 3.87V18h3v2H8v-2h3v-2.13A4 4 0 0 1 8 12v-1.54A4 4 0 0 1 6 7V4zM4 6h2v1a2 2 0 0 1-2-2V6zm14 0h2v-1a2 2 0 0 1-2 2V6z"/></svg></div>
          <span className="cf-endkick">CAMPEÃO DO MUNDO · 2026</span>
          <h1 className="cf-endtitle" style={{fontSize:33}}>VOCÊ É<br/>CAMPEÃO!</h1>
          <p className="cf-endsub" style={{marginTop:10}}>Seu Time venceu {m?.oppName||'o adversário'} por <b style={{color:'#fff'}}>{m?.myGoals}–{m?.oppGoals}</b> na final.</p>
          <div className="cf-recap" style={{marginTop:16}}>
            {recapItems.map((r,i)=>(
              <div key={i} className={`cf-recaprow${r.result==='l'?' out':''}`}>
                <span className="ph">{r.ph}</span>
                <span className="vs">{r.vs}</span>
                <span className={`rs ${r.result==='w'?'w':r.result==='d'?'d':'l'}`}>{r.scoreMe}–{r.scoreThem}</span>
              </div>
            ))}
          </div>
        </div>
      </MobileShell>
    );
  }

  /* ── PHASE: eliminated ────────────────────────────────────── */
  if (gs.phase === 'eliminated') {
    const resetGame = () => setGs({...INITIAL_STATE});
    const recapItems = gs.campaign;
    const lastResult = recapItems[recapItems.length-1];
    const elPhase = lastResult?.ph || 'Grupos';
    if (desktop) return (
      <DesktopShell now={1} eyebrow={`★ ELIMINADO · ${elPhase.toUpperCase()}`} title="Fim de linha."
        footer={<><button className="cfd-btn" onClick={resetGame}>Tentar de novo <CFArrow/></button><button className="cfd-btn ghost" onClick={()=>setGs(p=>({...INITIAL_STATE,players:p.players}))}>Trocar escalação</button></>}>
        <div className="cf-trophy"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#8a9099" strokeWidth="1.8" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></div>
        <p className="cf-endsub" style={{marginTop:10}}>Você foi longe — mas a taça fica para a próxima.</p>
        <div className="cf-recap" style={{marginTop:18}}>
          {recapItems.map((r,i)=>(
            <div key={i} className={`cf-recaprow${r.result==='l'?' out':''}`}>
              <span className="ph">{r.ph}</span>
              <span className="vs">{r.vs}</span>
              <span className={`rs ${r.result==='w'?'w':r.result==='d'?'d':'l'}`}>{r.scoreMe}–{r.scoreThem}</span>
            </div>
          ))}
        </div>
      </DesktopShell>
    );
    return (
      <MobileShell stepHtml="<b>FIM DE JOGO</b>"
        footer={<><button className="cf-cta" onClick={resetGame}>Tentar de novo <CFArrow/></button><button className="cf-ghost" onClick={()=>setGs(p=>({...INITIAL_STATE,players:p.players}))}>Trocar formação e elenco</button></>}>
        <div className="cf-end lose cf-scroll" style={{overflow:'hidden',justifyContent:'flex-start',paddingTop:24}}>
          <div className="cf-trophy"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#8a9099" strokeWidth="1.8" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></div>
          <span className="cf-endkick">VOCÊ PAROU {elPhase!=='Grupos'?`NAS ${elPhase.toUpperCase()}`:'NA FASE DE GRUPOS'}</span>
          <h1 className="cf-endtitle" style={{fontSize:30}}>Fim de linha<br/>{elPhase!=='Grupos'?`nas ${elPhase}.`:'na fase de grupos.'}</h1>
          <p className="cf-endsub" style={{marginTop:10}}>Você foi longe — mas a taça fica para a próxima.</p>
          <div className="cf-recap" style={{marginTop:18}}>
            {recapItems.map((r,i)=>(
              <div key={i} className={`cf-recaprow${r.result==='l'?' out':''}`}>
                <span className="ph">{r.ph}</span>
                <span className="vs">{r.vs}</span>
                <span className={`rs ${r.result==='w'?'w':r.result==='d'?'d':'l'}`}>{r.scoreMe}–{r.scoreThem}</span>
              </div>
            ))}
          </div>
        </div>
      </MobileShell>
    );
  }

  /* ── Fallback ─────────────────────────────────────────────── */
  return (
    <div style={{ position:'fixed', inset:0, background:'#060807', color:'var(--text)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter,sans-serif' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:13, color:'var(--text-3)', marginBottom:12 }}>Fase: {gs.phase}</div>
        <div style={{ fontSize:18, color:'#fff' }}>Carregando próxima fase...</div>
      </div>
    </div>
  );
}
