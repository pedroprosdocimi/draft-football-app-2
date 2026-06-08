import React, { useState, useEffect, useMemo, useRef } from 'react';
import { API_URL } from '../config.js';
import { getFormationPreviewLayout } from '../components/FormationPreview.jsx';
import FieldPlayerPreview from '../components/FieldPlayerPreview.jsx';
import PickPanel from '../components/PickPanel.jsx';
import PlayerFigure, { NATIONAL_KITS } from '../components/PlayerFigure.jsx';
import { getDetailedPositionLabel } from '../utils/positions.js';

/* ============================================================================
   GuestDraft — fase "drafting" dos 11 titulares sem login.
   Usa o mesmo pitch e PickPanel do Draft.jsx real, com jogadores demo.
   Props: formation (string), onConvert(starters, formationSlots), onBack()
   ============================================================================ */

const GRAY_KIT = NATIONAL_KITS['_'];

// Mapeamento de cor por detailed_position_id (1-13)
const DRAFT_DETAIL_TO_LINE = {
  1: 'var(--c-gk)',
  2: 'var(--c-def)', 3: 'var(--c-def)', 4: 'var(--c-def)',
  5: 'var(--c-mid)', 6: 'var(--c-mid)', 7: 'var(--c-mid)', 8: 'var(--c-mid)', 9: 'var(--c-mid)',
  10: 'var(--c-att)', 11: 'var(--c-att)', 12: 'var(--c-att)', 13: 'var(--c-att)',
};

const POS_FULL = {
  GOL: 'Goleiro', ZAG: 'Zagueiro', LD: 'Lateral Dir.', LE: 'Lateral Esq.',
  VOL: 'Volante', MC: 'Meio-campo', MEI: 'Meia', ATA: 'Atacante', PE: 'Ponta Esq.', PD: 'Ponta Dir.',
};

/* Jogadores demo com alt_positions cobrindo ambos os sistemas de IDs
   (1-13 frontend e SportMonks: 24=GOL, 148=ZAG, 154=LD, 155=LE,
   149=VOL, 153=MEI, 151=CA, 152=PE, 156=PD) */
const DEMO_PLAYERS = [
  // ── Goleiros ─────────────────────────────────────────────────────────────
  { id: 101, name: 'Anders Holm',   display_name: 'Anders Holm',   nationality: 'Sweden',        jersey_number: 1,  detailed_position_id: 1,  alt_positions: [24],       avg_score: 8.0 },
  { id: 102, name: 'Ivan Petrov',   display_name: 'Ivan Petrov',   nationality: 'Serbia',        jersey_number: 22, detailed_position_id: 1,  alt_positions: [24],       avg_score: 7.8 },
  { id: 103, name: 'Joon Park',     display_name: 'Joon Park',     nationality: 'South Korean',  jersey_number: 23, detailed_position_id: 1,  alt_positions: [24],       avg_score: 7.5 },
  // ── Defensores ───────────────────────────────────────────────────────────
  { id: 104, name: 'Bram de Vries', display_name: 'Bram de Vries', nationality: 'Dutch',         jersey_number: 4,  detailed_position_id: 2,  alt_positions: [148],      avg_score: 7.8 },
  { id: 105, name: 'Luka Orsic',   display_name: 'Luka Orsic',   nationality: 'Croatian',      jersey_number: 3,  detailed_position_id: 2,  alt_positions: [148],      avg_score: 7.7 },
  { id: 106, name: 'Sami Bouz',    display_name: 'Sami Bouz',    nationality: 'Moroccan',      jersey_number: 2,  detailed_position_id: 2,  alt_positions: [148],      avg_score: 7.5 },
  { id: 107, name: 'Tariq Nasser', display_name: 'Tariq Nasser', nationality: 'Egyptian',      jersey_number: 15, detailed_position_id: 2,  alt_positions: [148],      avg_score: 7.2 },
  { id: 108, name: 'Carlos Vega',  display_name: 'Carlos Vega',  nationality: 'Mexican',       jersey_number: 12, detailed_position_id: 3,  alt_positions: [154, 155], avg_score: 7.4 },
  { id: 109, name: 'Owen Pryce',   display_name: 'Owen Pryce',   nationality: 'English',       jersey_number: 13, detailed_position_id: 3,  alt_positions: [154, 155], avg_score: 7.3 },
  { id: 110, name: 'Felipe Nunes', display_name: 'Felipe Nunes', nationality: 'Brazilian',     jersey_number: 16, detailed_position_id: 4,  alt_positions: [155, 154], avg_score: 7.6 },
  { id: 127, name: 'Yann Cissé',   display_name: 'Yann Cissé',   nationality: 'Senegalese',    jersey_number: 20, detailed_position_id: 4,  alt_positions: [155, 154], avg_score: 7.1 },
  // ── Meias ─────────────────────────────────────────────────────────────────
  { id: 111, name: 'Hugo Marès',   display_name: 'Hugo Marès',   nationality: 'French',        jersey_number: 8,  detailed_position_id: 7,  alt_positions: [153, 149], avg_score: 8.4 },
  { id: 112, name: 'Tó Salgado',   display_name: 'Tó Salgado',   nationality: 'Portuguese',    jersey_number: 6,  detailed_position_id: 7,  alt_positions: [153, 149], avg_score: 8.1 },
  { id: 113, name: 'Nico Rossi',   display_name: 'Nico Rossi',   nationality: 'Italian',       jersey_number: 5,  detailed_position_id: 5,  alt_positions: [149, 153], avg_score: 7.9 },
  { id: 114, name: 'Diego Sol',    display_name: 'Diego Sol',    nationality: 'Spanish',       jersey_number: 7,  detailed_position_id: 6,  alt_positions: [153, 149], avg_score: 8.0 },
  { id: 115, name: 'Ren Takeda',   display_name: 'Ren Takeda',   nationality: 'Japanese',      jersey_number: 14, detailed_position_id: 5,  alt_positions: [149, 153], avg_score: 7.6 },
  // ── Atacantes ─────────────────────────────────────────────────────────────
  { id: 116, name: 'Léo Fortuna',  display_name: 'Léo Fortuna',  nationality: 'Brazilian',     jersey_number: 9,  detailed_position_id: 10, alt_positions: [151, 152], avg_score: 8.7 },
  { id: 117, name: 'Marco Vidal',  display_name: 'Marco Vidal',  nationality: 'Argentine',     jersey_number: 10, detailed_position_id: 10, alt_positions: [151, 163], avg_score: 8.9 },
  { id: 118, name: 'Kai Berger',   display_name: 'Kai Berger',   nationality: 'German',        jersey_number: 11, detailed_position_id: 10, alt_positions: [151, 152], avg_score: 8.2 },
  { id: 119, name: 'Pavel Novák',  display_name: 'Pavel Novák',  nationality: 'Czech',         jersey_number: 19, detailed_position_id: 11, alt_positions: [152, 156], avg_score: 7.8 },
  { id: 120, name: 'Sam Whyte',    display_name: 'Sam Whyte',    nationality: 'English',       jersey_number: 17, detailed_position_id: 12, alt_positions: [156, 152], avg_score: 7.7 },
];

const Emblem = ({ s = 26 }) => (
  <span className="demblem" dangerouslySetInnerHTML={{ __html:
    `<svg width="${s}" height="${s}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="tgg${s}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1f7a46"/><stop offset="1" stop-color="#0b3a20"/></linearGradient>
      <clipPath id="tcc${s}"><rect x="3" y="3" width="94" height="94" rx="26"/></clipPath></defs>
      <rect x="3" y="3" width="94" height="94" rx="26" fill="url(#tgg${s})"/>
      <g clip-path="url(#tcc${s})">
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

const ArrowR = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>
  </svg>
);

export default function GuestDraft({ formation, onConvert, onBack }) {
  const [formationSlots, setFormationSlots] = useState([]);
  const [pickedPlayers, setPickedPlayers] = useState({}); // { slotPos: demoPlayer }
  const [activeSlot, setActiveSlot]         = useState(null);
  const [options, setOptions]               = useState(null);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [pendingPick, setPendingPick]       = useState(null);
  const [poppingSlot, setPoppingSlot]       = useState(null);
  const [loadingFormations, setLoadingFormations] = useState(true);
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);
  const animTimeoutsRef = useRef([]);
  const fieldRef = useRef(null);

  // Fetch formations to get slot data for pitch rendering
  useEffect(() => {
    fetch(`${API_URL}/formations`)
      .then(r => r.json())
      .then(data => {
        const f = (data.data || []).find(f => f.name === formation);
        setFormationSlots(f?.slots || []);
      })
      .catch(() => {})
      .finally(() => setLoadingFormations(false));
  }, [formation]);

  useEffect(() => {
    const fn = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  useEffect(() => () => {
    animTimeoutsRef.current.forEach(clearTimeout);
  }, []);

  // Compute pitch layout
  const starterPlacements = useMemo(() => {
    if (!formationSlots.length) return [];
    return getFormationPreviewLayout({ name: formation, slots: formationSlots });
  }, [formation, formationSlots]);

  // Next empty slot
  const activeNextSlot = useMemo(() =>
    starterPlacements.find(s => !pickedPlayers[s.position]) ?? null,
    [starterPlacements, pickedPlayers]
  );

  const pickedCount = Object.keys(pickedPlayers).length;
  const pct = (pickedCount / 11) * 100;

  // Player options for a slot — demo players not yet used
  const getOptionsForSlot = (slotDetailedPosId) => {
    const usedIds = new Set(Object.values(pickedPlayers).map(p => p.id));
    // matchesDetailedPositionSlot from PickPanel handles filtering by position
    return DEMO_PLAYERS.filter(p => !usedIds.has(p.id));
  };

  const handleSlotClick = (slotPosition) => {
    if (pickedPlayers[slotPosition]) return;
    setActiveSlot(slotPosition);
    const slot = starterPlacements.find(s => s.position === slotPosition);
    setOptions(getOptionsForSlot(slot?.detailed_position_id));
  };

  const handlePickPlayer = (player) => {
    const slotPosition = activeSlot;
    let applied = false;

    setPendingPick({ player, slotPosition });
    setIsAnimatingOut(true);

    const t1 = setTimeout(() => {
      applied = true;
      const next = { ...pickedPlayers, [slotPosition]: player };
      setPickedPlayers(next);
      setPoppingSlot(slotPosition);
      setOptions(null);
      setActiveSlot(null);
      setIsAnimatingOut(false);
      setPendingPick(null);
      animTimeoutsRef.current = animTimeoutsRef.current.filter(id => id !== t1);

      if (Object.keys(next).length >= 11) {
        const t2 = setTimeout(() => {
          onConvert(Object.values(next), formationSlots);
          animTimeoutsRef.current = animTimeoutsRef.current.filter(id => id !== t2);
        }, 600);
        animTimeoutsRef.current.push(t2);
      } else {
        const t2 = setTimeout(() => {
          setPoppingSlot(null);
          animTimeoutsRef.current = animTimeoutsRef.current.filter(id => id !== t2);
        }, 500);
        animTimeoutsRef.current.push(t2);
      }
    }, 300);
    animTimeoutsRef.current.push(t1);
  };

  const activeSlotDetailedPositionId = useMemo(() => {
    if (!activeSlot) return null;
    return starterPlacements.find(s => s.position === activeSlot)?.detailed_position_id ?? null;
  }, [activeSlot, starterPlacements]);

  if (loadingFormations) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 animate-pulse">Carregando...</p>
      </div>
    );
  }

  const renderPitch = () => (
    <div className="pitch" data-theme="stadium" ref={fieldRef}>
      <div className="pl pl-frame" /><div className="pl pl-half" /><div className="pl pl-circle" />
      <div className="pl pl-spot" /><div className="pl pl-boxT" /><div className="pl pl-boxB" />
      <div className="pl pl-gaT" /><div className="pl pl-gaB" />

      {starterPlacements.map((slot) => {
        const posLabel  = getDetailedPositionLabel(slot.detailed_position_id) || '?';
        const lineColor = DRAFT_DETAIL_TO_LINE[slot.detailed_position_id] ?? 'var(--c-mid)';
        const cardPlayer = pickedPlayers[slot.position] ?? null;
        const isNextPick = activeNextSlot?.position === slot.position;
        const cardAnim = poppingSlot === slot.position
          ? { animation: 'card-pop 0.45s cubic-bezier(0.34,1.56,0.64,1) both' }
          : undefined;
        const posFullLabel = POS_FULL[posLabel] ?? posLabel;

        return (
          <div key={slot.key} className="slot" data-filled={cardPlayer ? 'true' : undefined}
            style={{ top: `${slot.top}%`, left: `${slot.left}%` }}>
            {cardPlayer ? (
              <div style={{ ...cardAnim, cursor: 'default' }}>
                <FieldPlayerPreview
                  player={cardPlayer}
                  posLabel={posLabel}
                  slotPositionId={slot.detailed_position_id}
                />
              </div>
            ) : (
              <div
                className={`fcard is-empty${isNextPick ? ' is-active' : ''}`}
                style={{ '--line-c': lineColor }}
                onClick={() => handleSlotClick(slot.position)}
              >
                <div className="fcard-veil" />
                <PlayerFigure kit={GRAY_KIT} number="" surname="" uid={`sil-${slot.position}`} className="sil" />
                {isNextPick && <div className="nexttag">PRÓXIMA</div>}
                <div className="fcard-body">
                  <div className="fcard-head"><span /><span className="fcard-pos">{posLabel}</span></div>
                </div>
                <div className="e-plus">+</div>
                <div className="e-label">{posFullLabel}</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderMobile = () => (
    <>
      <div className="dhead">
        <div className="dhead-brand">
          <span className="wm bricol"><Emblem s={26} />draft<span className="g">11</span></span>
          <span className="wc-tag"><span className="star">★</span> COPA 2026</span>
        </div>
        <div className="dhead-ctrl">
          <button className="dback" onClick={onBack}>‹ Sair</button>
          <span className="dphase">Titulares <span className="fmt">· {formation}</span></span>
          <span className="land-chip" style={{ fontSize: 9.5, padding: '3px 9px' }}>DEMO</span>
        </div>
        <div className="dprog">
          <span className="lab">{pickedCount}/11</span>
          <div className="bar"><div className="fill" style={{ width: `${pct}%` }} /></div>
        </div>
      </div>
      <div className="dfieldwrap">{renderPitch()}</div>

      {activeNextSlot && (() => {
        const lc = DRAFT_DETAIL_TO_LINE[activeNextSlot.detailed_position_id] ?? 'var(--c-mid)';
        const pfl = POS_FULL[getDetailedPositionLabel(activeNextSlot.detailed_position_id)] ??
          getDetailedPositionLabel(activeNextSlot.detailed_position_id) ?? '?';
        return (
          <div className="ddock">
            <div className="ddock-inner">
              <div className="fcard is-empty is-active"
                style={{ '--line-c': lc, '--fcw': '50px', flexShrink: 0 }}
                onClick={() => handleSlotClick(activeNextSlot.position)}>
                <div className="fcard-veil" />
                <PlayerFigure kit={GRAY_KIT} number="" surname="" uid="dock-next" className="sil" />
                <div className="nexttag">PRÓXIMA</div>
                <div className="fcard-body"><div className="fcard-head"><span /></div></div>
                <div className="e-plus">+</div>
              </div>
              <div className="grow">
                <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 15, color: 'var(--text)' }}>{pfl}</div>
                <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 2 }}>Toque na carta para escolher</div>
              </div>
              <button className="btn-pick" style={{ margin: 0, width: 'auto', padding: '0 18px', height: 42, whiteSpace: 'nowrap' }}
                onClick={() => handleSlotClick(activeNextSlot.position)}>
                Escolher <ArrowR />
              </button>
            </div>
          </div>
        );
      })()}
    </>
  );

  const renderDesktop = () => {
    const nextSlot = activeNextSlot;
    const nextLc = nextSlot ? (DRAFT_DETAIL_TO_LINE[nextSlot.detailed_position_id] ?? 'var(--c-mid)') : 'var(--c-mid)';
    const nextPosLabel = nextSlot
      ? (POS_FULL[getDetailedPositionLabel(nextSlot.detailed_position_id)] ?? getDetailedPositionLabel(nextSlot.detailed_position_id) ?? '?')
      : '?';

    return (
      <>
        <div className="rail rail-l">
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <Emblem s={34} />
            <span className="bricol" style={{ fontWeight: 800, fontSize: 20, color: 'var(--text)' }}>
              draft<span style={{ color: 'var(--gold)' }}>11</span>
            </span>
          </div>
          <span className="wc-tag"><span className="star">★</span> COPA DO MUNDO 2026</span>
          <div className="rcard">
            <h4>Seu Time</h4>
            <div className="rrow"><span className="k">Formação</span><span className="v gold">{formation}</span></div>
            <div className="rrow"><span className="k">Fase</span><span className="v">Titulares</span></div>
            <div className="rrow"><span className="k">Escalados</span><span className="v">{pickedCount} / 11</span></div>
            <div className="rrow"><span className="k">Modo</span><span className="v" style={{ color: 'var(--gold-soft)' }}>Demo</span></div>
          </div>
          <div className="rcard">
            <h4>Progresso</h4>
            <div className="dprog">
              <span className="lab">{pickedCount}/11</span>
              <div className="bar"><div className="fill" style={{ width: `${pct}%` }} /></div>
            </div>
          </div>
          <div className="rail-spacer" />
          <button className="dpill" style={{ justifyContent: 'center', height: 38 }} onClick={onBack}>Sair</button>
        </div>

        <div className="pitch-center">{renderPitch()}</div>

        <div className="rail rail-r">
          {nextSlot && (
            <div className="nextpick" style={{ '--puck': nextLc }}>
              <div className="eyebrow">Próxima escolha</div>
              <div className="np-row">
                <div className="fcard is-empty is-active"
                  style={{ '--line-c': nextLc, '--fcw': '68px', flexShrink: 0 }}
                  onClick={() => handleSlotClick(nextSlot.position)}>
                  <div className="fcard-veil" />
                  <PlayerFigure kit={GRAY_KIT} number="" surname="" uid="rail-next" className="sil" />
                  <div className="nexttag">PRÓXIMA</div>
                  <div className="fcard-body"><div className="fcard-head"><span /></div></div>
                  <div className="e-plus">+</div>
                </div>
                <div>
                  <div className="np-name">{nextPosLabel}</div>
                  <div className="np-sub">{options?.length ?? '–'} jogadores disponíveis</div>
                </div>
              </div>
              <button className="btn-pick" onClick={() => handleSlotClick(nextSlot.position)}>
                Escolher jogador <ArrowR />
              </button>
            </div>
          )}
          <div className="rcard">
            <h4>Posições</h4>
            <div className="legend">
              <div className="li"><span className="sw" style={{ background: 'var(--c-gk)' }} /> Goleiro</div>
              <div className="li"><span className="sw" style={{ background: 'var(--c-def)' }} /> Defesa</div>
              <div className="li"><span className="sw" style={{ background: 'var(--c-mid)' }} /> Meio-campo</div>
              <div className="li"><span className="sw" style={{ background: 'var(--c-att)' }} /> Ataque</div>
            </div>
          </div>
          <div className="rail-spacer" />
        </div>
      </>
    );
  };

  return (
    <>
      <style>{`@keyframes card-pop{0%{transform:scale(0.3);opacity:0}60%{transform:scale(1.08);opacity:1}100%{transform:scale(1);opacity:1}}`}</style>

      {options && (
        <PickPanel
          options={options}
          slotDetailedPositionId={activeSlotDetailedPositionId}
          slotPosition={activeSlot}
          onPickPlayer={handlePickPlayer}
          onClose={() => { setOptions(null); setActiveSlot(null); }}
          fadingOut={isAnimatingOut}
        />
      )}

      <div className="dscreen" data-device={isDesktop ? 'desktop' : 'mobile'}>
        {isDesktop ? renderDesktop() : renderMobile()}
      </div>
    </>
  );
}
