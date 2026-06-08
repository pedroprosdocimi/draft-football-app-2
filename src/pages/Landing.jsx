import React from 'react';

/* ============================================================================
   Landing — primeira tela para usuários não autenticados.
   Props: onGoLogin, onGoRegister, onStartGuest
   O fluxo guest é gerenciado pelo App.jsx (FormationPickerPhase → GuestDraft → GuestConvert).
   Classes .land-* em src/index.css (bloco landing).
   ============================================================================ */

const HERO_FLAGS = ['br', 'ar', 'fr', 'es', 'pt', 'de', 'nl', 'hr', 'it', 'mx'];
const STEPS_HOW = [
  ['Escolha sua formação',  'Decida o esquema: 4-3-3, 3-4-3 ou outros. Define quantos atacantes, meias e defensores você vai ter.'],
  ['Convoque seus craques', 'Faça o draft: escolha jogador por jogador para cada posição. Cada craque só pode estar em um time.'],
  ['Os jogos acontecem',    'Rodada a rodada, as partidas reais geram stats: gols, assistências, defesas, chutes...'],
  ['Veja sua pontuação',    'Cada stat vira ponto. Seu capitão vale dobrado. Quem escalou o melhor time vence a rodada.'],
];

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

export default function Landing({ onGoLogin, onGoRegister, onStartGuest }) {
  return (
    <div className="land-root">
      <div className="land-state" data-active="true">

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
                <button className="land-btn land-btn-primary land-btn-lg land-btn-block" onClick={onStartGuest}>
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
              <button className="land-btn land-btn-primary land-btn-lg land-btn-block" onClick={onStartGuest}>
                Montar meu time agora →
              </button>
              <button className="land-link" onClick={onGoLogin}>Já tenho conta → <b>Entrar</b></button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
