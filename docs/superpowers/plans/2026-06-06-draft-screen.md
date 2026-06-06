# Draft Screen Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reestilizar a tela de draft com o modelo "convocação" (bandeira da seleção + bonequinho SVG + OVR + chip de posição), preservando toda a lógica existente.

**Architecture:** Novo componente compartilhado `PlayerFigure.jsx` (SVG bonequinho), `FieldPlayerPreview.jsx` reescrito com as classes `.fcard`, e `Draft.jsx` com novo shell responsivo (mobile: header+campo+dock / desktop: 3 colunas) e slots visuais novos. Todo CSS de draft vai no final de `index.css`.

**Tech Stack:** React 18, Vite, Tailwind CSS (classes pré-existentes preservadas), flag-icons (já carregado), Bricolage Grotesque + JetBrains Mono (já carregados), CSS custom properties.

**Spec:** `docs/superpowers/specs/2026-06-06-draft-screen-design.md`

---

## Arquivo Map

| Ação | Arquivo |
|------|---------|
| Criar | `src/components/PlayerFigure.jsx` |
| Reescrever | `src/components/FieldPlayerPreview.jsx` |
| Acrescentar CSS | `src/index.css` (bloco ao final) |
| Modificar (visual) | `src/pages/Draft.jsx` |

---

## Task 1: CSS — adicionar bloco de classes de draft a `src/index.css`

**Files:**
- Modify: `src/index.css` (append at end)

- [ ] **Step 1: Abrir `src/index.css` e adicionar o bloco ao final**

Adicione exatamente este conteúdo após a última linha do arquivo (após o bloco `@layer components { ... }`):

```css
/* ===== draft11 — Draft Screen ===== */
:root {
  --bg-950:#0a0b0d; --bg-900:#111316; --bg-850:#16191d; --bg-800:#1c2126;
  --line:#23292f; --line-2:#2a313a;
  --text:#e8eaed; --text-2:#a8aeb6; --text-3:#6c727a; --text-4:#4a4f56;
  --green-draft:#1a6b3c; --green-hi:#23864b; --green-glow:#46c97a;
  --gold:#f5a623; --gold-soft:#fbd07a;
  --c-gk:#3a86d4; --c-def:#2fa564; --c-mid:#f5a623; --c-att:#e0443e;
}

/* screen shells */
.dscreen{position:fixed;inset:0;width:100%;height:100%;overflow:hidden;
  background:var(--bg-950);color:var(--text);font-family:'Inter',system-ui,sans-serif;
  -webkit-font-smoothing:antialiased;}
.dscreen[data-device="mobile"]{display:flex;flex-direction:column;}
.dscreen[data-device="desktop"]{display:grid;grid-template-columns:266px 1fr 314px;}

.bricol{font-family:'Bricolage Grotesque',sans-serif;}
.mono{font-family:'JetBrains Mono',monospace;}
.wc-tag{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;
  background:rgba(245,166,35,.09);border:1px solid rgba(245,166,35,.34);color:var(--gold-soft);
  font-family:'JetBrains Mono',monospace;font-weight:600;font-size:10px;letter-spacing:.13em;white-space:nowrap;}
.wc-tag .star{color:var(--gold);}
.demblem{filter:drop-shadow(0 8px 16px rgba(0,0,0,.5));flex:none;line-height:0;}

/* mobile header */
.dhead{position:relative;z-index:6;padding:14px 16px 10px;display:flex;flex-direction:column;gap:11px;
  border-bottom:1px solid #1a1e22;background:linear-gradient(180deg,rgba(255,255,255,.02),transparent);}
.dhead-brand{display:flex;align-items:center;justify-content:space-between;gap:10px;}
.dhead-brand .wm{font-family:'Bricolage Grotesque',sans-serif;font-weight:800;font-size:18px;letter-spacing:-.01em;display:flex;align-items:center;gap:9px;}
.dhead-brand .wm .g{color:var(--gold);}
.dhead-ctrl{display:flex;align-items:center;justify-content:space-between;gap:10px;}
.dpill{display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 11px;border-radius:9px;
  border:1px solid var(--line-2);background:rgba(255,255,255,.04);color:var(--text-2);
  font-size:11px;font-weight:600;cursor:pointer;}
.dpill:hover{border-color:rgba(255,255,255,.22);color:#fff;}
.dphase{font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;letter-spacing:.14em;
  text-transform:uppercase;color:var(--text-2);display:flex;align-items:center;gap:8px;}
.dphase .fmt{color:var(--gold-soft);}
.dback{background:0;border:0;color:var(--text-3);font-size:12px;cursor:pointer;padding:4px 2px;display:inline-flex;align-items:center;gap:5px;}
.dback:hover{color:#fff;}

/* progress bar */
.dprog{display:flex;align-items:center;gap:10px;}
.dprog .lab{font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;color:var(--text-2);white-space:nowrap;}
.dprog .bar{position:relative;flex:1;height:6px;border-radius:999px;background:rgba(255,255,255,.07);overflow:hidden;}
.dprog .fill{position:absolute;inset:0 auto 0 0;border-radius:999px;
  background:linear-gradient(90deg,var(--green-draft),var(--green-glow));box-shadow:0 0 10px rgba(70,201,122,.5);}

/* field container */
.dfieldwrap{flex:1;min-height:0;padding:12px 14px;display:flex;align-items:center;justify-content:center;}
.pitch{position:relative;height:100%;aspect-ratio:36/61;border-radius:24px;overflow:hidden;
  border:1px solid rgba(255,255,255,.08);box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 24px 60px -20px rgba(0,0,0,.6);}
.pitch-center{display:flex;align-items:center;justify-content:center;height:100%;padding:18px 0;}
.dscreen[data-device="desktop"] .pitch{height:100%;width:auto;max-height:100%;aspect-ratio:36/61;}

/* pitch theme: stadium */
.pitch[data-theme="stadium"]{
  --pitch-line:rgba(110,231,183,.34);
  border-color:rgba(70,201,122,.2);
  background:
    radial-gradient(80% 50% at 50% -10%,rgba(120,255,190,.22),transparent 50%),
    radial-gradient(120% 90% at 50% 50%,rgba(10,58,34,.2),rgba(3,18,11,.96) 78%),
    repeating-linear-gradient(90deg,rgba(255,255,255,.03) 0 8.333%,rgba(3,26,15,.5) 8.333% 16.666%),
    linear-gradient(180deg,#0a2d1c,#04140c);}
.pitch[data-theme="stadium"]::after{content:"";position:absolute;inset:0;pointer-events:none;
  background:radial-gradient(70% 45% at 50% 0%,rgba(180,255,210,.16),transparent 60%);}
.pitch[data-theme="stadium"]::before{content:"";position:absolute;inset:0;pointer-events:none;z-index:1;
  box-shadow:inset 0 0 120px 30px rgba(0,0,0,.6);}

/* pitch markings */
.pl{position:absolute;pointer-events:none;border-color:var(--pitch-line,rgba(255,255,255,.16));border-style:solid;border-width:0;}
.pl-frame{inset:14px;border-width:1.5px;border-radius:16px;}
.pl-half{left:22px;right:22px;top:50%;height:0;border-top-width:1.5px;transform:translateY(-50%);}
.pl-circle{left:50%;top:50%;width:26%;aspect-ratio:1;border-width:1.5px;border-radius:50%;transform:translate(-50%,-50%);}
.pl-spot{left:50%;top:50%;width:5px;height:5px;border-radius:50%;transform:translate(-50%,-50%);background:var(--pitch-line,rgba(255,255,255,.4));border:0;}
.pl-boxT{left:50%;top:14px;width:54%;height:13%;border-width:1.5px;border-top-width:0;border-radius:0 0 14px 14px;transform:translateX(-50%);}
.pl-boxB{left:50%;bottom:14px;width:54%;height:13%;border-width:1.5px;border-bottom-width:0;border-radius:14px 14px 0 0;transform:translateX(-50%);}
.pl-gaT{left:50%;top:14px;width:30%;height:6%;border-width:1.5px;border-top-width:0;border-radius:0 0 9px 9px;transform:translateX(-50%);}
.pl-gaB{left:50%;bottom:14px;width:30%;height:6%;border-width:1.5px;border-bottom-width:0;border-radius:9px 9px 0 0;transform:translateX(-50%);}

/* slot positioning */
.slot{position:absolute;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;z-index:10;}
.slot[data-filled="true"]{z-index:20;}

/* ===== FIELD CARD (.fcard) ===== */
.fcard{position:relative;width:var(--fcw,76px);aspect-ratio:76/106;border-radius:12px;overflow:hidden;cursor:grab;
  border:1px solid rgba(255,255,255,.12);background:#0b0f0d;color:#fff;
  box-shadow:0 12px 22px -8px rgba(0,0,0,.55);}
.dscreen[data-device="desktop"] .fcard{--fcw:92px;}
.fcard-flagbg{position:absolute;inset:0;opacity:.4;z-index:0;}
.fcard-flagbg .fi{width:100%;height:100%;background-size:cover;background-position:center;border-radius:0;display:block;}
.fcard-veil{position:absolute;inset:0;z-index:1;pointer-events:none;background:
  radial-gradient(120% 80% at 50% 34%,rgba(8,12,10,.26),rgba(8,12,10,.72) 86%),
  linear-gradient(180deg,rgba(8,12,10,.55),rgba(8,12,10,.12) 28%,rgba(8,12,10,.9));}
.fcard-fig{position:absolute;left:50%;bottom:15px;transform:translateX(-50%);width:108%;height:auto;z-index:1;}
.fcard-body{position:relative;z-index:2;height:100%;display:flex;flex-direction:column;padding:5px 5px 0;}
.fcard-head{display:flex;align-items:flex-start;justify-content:space-between;gap:4px;}
.fcard-ovr{line-height:.82;text-align:left;}
.fcard-ovr .v{font-family:'Bricolage Grotesque',sans-serif;font-weight:800;font-size:14px;color:#fff;}
.dscreen[data-device="desktop"] .fcard-ovr .v{font-size:16px;}
.fcard-ovr .l{font-family:'JetBrains Mono',monospace;font-size:6px;font-weight:700;letter-spacing:.12em;color:rgba(255,255,255,.6);}
.fcard-pos{font-family:'JetBrains Mono',monospace;font-weight:800;font-size:8px;letter-spacing:.04em;color:#fff;
  padding:2px 5px;border-radius:6px;border:1px solid color-mix(in oklab,var(--line-c,#888) 55%,#fff 22%);
  background:color-mix(in oklab,var(--line-c,#888) 62%,#000 16%);}
.fcard-name{margin-top:auto;text-align:center;font-family:'Bricolage Grotesque',sans-serif;font-weight:800;font-size:9px;
  text-transform:uppercase;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
  padding:4px 2px 5px;}
.dscreen[data-device="desktop"] .fcard-name{font-size:10px;}
.fcard-cap{position:absolute;top:-5px;left:50%;transform:translateX(-50%);z-index:6;width:18px;height:18px;border-radius:50%;
  display:grid;place-items:center;background:var(--gold);color:#3a2806;font-family:'Bricolage Grotesque',sans-serif;font-weight:800;font-size:10px;border:1.5px solid #fff2b0;box-shadow:0 4px 10px rgba(0,0,0,.4);}

/* empty card */
.fcard.is-empty{cursor:pointer;background:rgba(10,14,12,.6);border-style:dashed;
  border-color:color-mix(in oklab,var(--line-c,#888) 48%,rgba(255,255,255,.16));
  transition:border-color .15s,background .15s,transform .15s;}
.fcard.is-empty:hover{transform:translateY(-2px);
  border-color:var(--line-c,#888);background:color-mix(in oklab,var(--line-c,#888) 12%,rgba(10,14,12,.65));}
.fcard.is-empty .fcard-veil{background:linear-gradient(180deg,rgba(8,12,10,.4),rgba(8,12,10,.1) 40%,rgba(8,12,10,.75));}
.fcard .sil{opacity:.34;}
.e-plus{position:absolute;left:50%;top:46%;transform:translate(-50%,-50%);z-index:4;display:grid;place-items:center;
  width:24px;height:24px;border-radius:50%;border:1.5px solid color-mix(in oklab,var(--line-c,#888) 60%,rgba(255,255,255,.3));
  background:color-mix(in oklab,var(--line-c,#888) 24%,rgba(8,12,10,.6));color:#fff;font-size:16px;line-height:1;font-weight:500;}
.e-label{position:absolute;left:4px;right:4px;bottom:7px;z-index:4;text-align:center;
  font-family:'JetBrains Mono',monospace;font-weight:700;font-size:7px;letter-spacing:.1em;text-transform:uppercase;color:var(--text-2);}

/* active (next pick) card */
.fcard.is-active{border-style:solid;border-color:var(--gold);background:rgba(245,166,35,.1);
  box-shadow:0 0 0 1px rgba(245,166,35,.25),0 14px 26px -8px rgba(245,166,35,.3);
  animation:cardpulse 1.6s ease-in-out infinite;}
.fcard.is-active .e-plus{border-color:var(--gold);background:rgba(245,166,35,.25);color:var(--gold-soft);}
.fcard.is-active .e-label{color:var(--gold-soft);}
.fcard.is-active .fcard-pos{display:none;}
.nexttag{position:absolute;top:6px;left:0;right:0;z-index:5;text-align:center;
  font-family:'JetBrains Mono',monospace;font-weight:800;font-size:7px;letter-spacing:.16em;color:var(--gold-soft);text-transform:uppercase;}
@keyframes cardpulse{0%,100%{box-shadow:0 0 0 0 rgba(245,166,35,.4),0 14px 26px -8px rgba(245,166,35,.3);}50%{box-shadow:0 0 0 7px rgba(245,166,35,0),0 14px 26px -8px rgba(245,166,35,.3);}}

/* desktop rails */
.rail{position:relative;z-index:6;height:100%;overflow:hidden;padding:22px 20px;display:flex;flex-direction:column;gap:18px;}
.rail-l{border-right:1px solid var(--line);background:linear-gradient(180deg,rgba(255,255,255,.018),transparent);}
.rail-r{border-left:1px solid var(--line);background:linear-gradient(180deg,rgba(255,255,255,.018),transparent);}
.rcard{background:var(--bg-900);border:1px solid var(--line);border-radius:16px;padding:16px;}
.rcard h4{margin:0 0 12px;font-family:'JetBrains Mono',monospace;font-size:10.5px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--text-3);}
.rrow{display:flex;align-items:center;justify-content:space-between;padding:7px 0;border-bottom:1px solid #1a1e22;font-size:12.5px;}
.rrow:last-child{border-bottom:0;}
.rrow .k{color:var(--text-3);}.rrow .v{color:var(--text);font-weight:600;white-space:nowrap;}
.rrow .v.gold{color:var(--gold-soft);font-family:'Bricolage Grotesque',sans-serif;font-weight:800;}
.legend{display:flex;flex-direction:column;gap:9px;}
.legend .li{display:flex;align-items:center;gap:9px;font-size:12px;color:var(--text-2);}
.legend .sw{width:11px;height:11px;border-radius:3px;flex:none;}

/* next-pick highlight (right rail) */
.nextpick{border-radius:16px;padding:16px;border:1px solid color-mix(in oklab,var(--puck,#888) 45%,var(--line));
  background:linear-gradient(180deg,color-mix(in oklab,var(--puck,#888) 12%,transparent),transparent),var(--bg-900);}
.nextpick .eyebrow{font-family:'JetBrains Mono',monospace;font-size:9.5px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:var(--gold-soft);margin-bottom:9px;}
.nextpick .np-row{display:flex;align-items:center;gap:12px;}
.nextpick .np-name{font-family:'Bricolage Grotesque',sans-serif;font-weight:800;font-size:18px;line-height:1.05;}
.nextpick .np-sub{font-size:11px;color:var(--text-3);margin-top:2px;}
.btn-pick{margin-top:14px;width:100%;height:44px;border:0;border-radius:11px;cursor:pointer;
  font-family:'Inter',sans-serif;font-weight:700;font-size:14px;color:#231a05;
  display:flex;align-items:center;justify-content:center;gap:8px;
  background:linear-gradient(180deg,var(--gold-soft),var(--gold));box-shadow:0 10px 22px -10px rgba(245,166,35,.6);}
.btn-pick:hover{filter:brightness(1.05);}
.rail-flags{display:flex;gap:6px;flex-wrap:wrap;}
.rail-flags .fi{width:22px;height:15px;border-radius:2px;box-shadow:0 1px 3px rgba(0,0,0,.4),inset 0 0 0 1px rgba(255,255,255,.12);}
.rail-spacer{flex:1;}

/* mobile dock */
.ddock{position:relative;z-index:6;padding:12px 16px 16px;border-top:1px solid var(--line);
  background:linear-gradient(180deg,transparent,rgba(0,0,0,.3));}
.ddock-inner{display:flex;align-items:center;gap:12px;}
.ddock .grow{flex:1;min-width:0;}
.ddock .btn-pick{margin:0;width:auto;padding:0 18px;height:42px;white-space:nowrap;}
```

- [ ] **Step 2: Verificar que o arquivo ficou correto**

Abra `src/index.css` e confirme que o bloco começa com `/* ===== draft11 — Draft Screen =====` logo após o bloco existente.

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "style: add draft screen CSS classes to index.css"
```

---

## Task 2: Criar `src/components/PlayerFigure.jsx`

**Files:**
- Create: `src/components/PlayerFigure.jsx`

- [ ] **Step 1: Criar o arquivo com o conteúdo completo**

```jsx
// PlayerFigure.jsx — back-view bonequinho SVG + national kit palette
// Shared between FieldPlayerPreview (field cards) and PickPanel (pick cards).

export const NATIONAL_KITS = {
  br: { skin:'#7a5230', hair:'#141210', jersey:'#ffd400', sleeve:'#149a4b', name_color:'#16713c' },
  fr: { skin:'#5b3a26', hair:'#120f0d', jersey:'#1b3a8f', sleeve:'#16306f', name_color:'#ffffff' },
  es: { skin:'#a06b42', hair:'#15110e', jersey:'#c4222a', sleeve:'#a31a22', name_color:'#ffd24a' },
  ar: { skin:'#e0b48d', hair:'#4a3322', jersey:'#75acdf', sleeve:'#75acdf', name_color:'#14213d', stripes:true, stripe1:'#7cb1e2', stripe2:'#f3f4f2' },
  pt: { skin:'#d49e74', hair:'#181410', jersey:'#b81f33', sleeve:'#0a6b34', name_color:'#ffffff' },
  de: { skin:'#c8956c', hair:'#2e1f12', jersey:'#ffffff', sleeve:'#000000', name_color:'#000000' },
  nl: { skin:'#c8956c', hair:'#3a2810', jersey:'#f76d2b', sleeve:'#e55a18', name_color:'#ffffff' },
  'gb-eng': { skin:'#c8a882', hair:'#3d2a1a', jersey:'#ffffff', sleeve:'#cc0000', name_color:'#cc0000' },
  uy: { skin:'#c8956c', hair:'#2e1f12', jersey:'#5eb2e0', sleeve:'#4899c5', name_color:'#ffffff' },
  co: { skin:'#7a5230', hair:'#1a1008', jersey:'#ffd700', sleeve:'#e6b800', name_color:'#003087' },
  mx: { skin:'#8a6540', hair:'#1a0f06', jersey:'#006847', sleeve:'#005538', name_color:'#ffffff' },
  us: { skin:'#c8a882', hair:'#3d2a1a', jersey:'#ffffff', sleeve:'#002868', name_color:'#002868' },
  it: { skin:'#c8956c', hair:'#2e1f12', jersey:'#003d9e', sleeve:'#002d7a', name_color:'#ffffff' },
  hr: { skin:'#c8956c', hair:'#2e1f12', jersey:'#cc0000', sleeve:'#cc0000', name_color:'#ffffff', stripes:true, stripe1:'#cc0000', stripe2:'#ffffff' },
  ma: { skin:'#8a6540', hair:'#1a0f06', jersey:'#c1272d', sleeve:'#a01e22', name_color:'#ffffff' },
  _: { skin:'#3a434b', hair:'#2c343b', jersey:'#222a30', sleeve:'#1a2127', name_color:'rgba(0,0,0,0)' },
};

export default function PlayerFigure({ kit: k, number, surname, uid, className = '' }) {
  const pid = `strp-${uid}`;
  const torsoFill = k.stripes ? `url(#${pid})` : k.jersey;
  return (
    <svg
      className={`fcard-fig ${className}`}
      viewBox="2 14 196 184"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        {k.stripes && (
          <pattern id={pid} width="24" height="10" patternUnits="userSpaceOnUse">
            <rect width="24" height="10" fill={k.stripe2} />
            <rect width="12" height="10" fill={k.stripe1} />
          </pattern>
        )}
      </defs>
      {/* arms */}
      <rect x="44" y="104" width="16" height="84" rx="7.5" fill={k.skin} />
      <rect x="140" y="104" width="16" height="84" rx="7.5" fill={k.skin} />
      {/* neck */}
      <rect x="87" y="62" width="26" height="24" rx="7" fill={k.skin} />
      {/* jersey torso */}
      <path d="M58,90 C58,83 64,80 73,80 L127,80 C136,80 142,83 142,90 L137,196 L63,196 Z" fill={torsoFill} />
      {/* sleeves */}
      <path d="M58,90 C50,87 43,91 40,101 L46,118 C52,115 57,107 60,99 Z" fill={k.sleeve} />
      <path d="M142,90 C150,87 157,91 160,101 L154,118 C148,115 143,107 140,99 Z" fill={k.sleeve} />
      {/* collar */}
      <path d="M84,82 Q100,91 116,82" fill="none" stroke={k.sleeve} strokeWidth="4.5" strokeLinecap="round" />
      {/* surname + number */}
      {surname ? (
        <text x="100" y="112" textAnchor="middle" fontFamily="'Bricolage Grotesque',sans-serif"
              fontWeight="800" fontSize="17" letterSpacing="0.5" fill={k.name_color}>{surname}</text>
      ) : null}
      {number ? (
        <text x="100" y="178" textAnchor="middle" fontFamily="'Bricolage Grotesque',sans-serif"
              fontWeight="800" fontSize="74" fill={k.name_color}>{number}</text>
      ) : null}
      {/* head + ears */}
      <circle cx="71" cy="48" r="6.5" fill={k.skin} />
      <circle cx="129" cy="48" r="6.5" fill={k.skin} />
      <circle cx="100" cy="44" r="30" fill={k.hair} />
    </svg>
  );
}
```

- [ ] **Step 2: Verificar que o arquivo existe**

```bash
ls src/components/PlayerFigure.jsx
```

Expected: arquivo listado.

- [ ] **Step 3: Commit**

```bash
git add src/components/PlayerFigure.jsx
git commit -m "feat: add PlayerFigure SVG component with national kit palette"
```

---

## Task 3: Reescrever `src/components/FieldPlayerPreview.jsx`

**Files:**
- Modify: `src/components/FieldPlayerPreview.jsx` (complete rewrite)

**Context:** O componente atual usa `team_jersey_url` ou SVG de camisa do time. O novo modelo usa bandeira da seleção ao fundo + PlayerFigure (bonequinho de costas) + OVR no topo-esquerdo + chip de posição no topo-direito + nome embaixo. As props `player`, `posLabel`, `slotPositionId` são preservadas; `captainPlayerId` é nova (opcional, nullable).

- [ ] **Step 1: Substituir o conteúdo completo do arquivo**

```jsx
import React from 'react';
import PlayerFigure, { NATIONAL_KITS } from './PlayerFigure.jsx';
import { nationalityToIso2 } from '../utils/nationality.js';
import { getDetailedPositionLabel } from '../utils/positions.js';

const DETAIL_TO_LINE = {
  1: 'var(--c-gk)',
  2: 'var(--c-def)', 3: 'var(--c-def)', 4: 'var(--c-def)',
  5: 'var(--c-mid)', 6: 'var(--c-mid)', 7: 'var(--c-mid)', 8: 'var(--c-mid)', 9: 'var(--c-mid)',
  10: 'var(--c-att)', 11: 'var(--c-att)', 12: 'var(--c-att)', 13: 'var(--c-att)',
};

function getSurname(displayName) {
  if (!displayName) return '';
  const parts = displayName.trim().split(/\s+/);
  return (parts[parts.length - 1] || '').toUpperCase().slice(0, 10);
}

export default function FieldPlayerPreview({
  player,
  posLabel,
  slotPositionId = null,
  captainPlayerId = null,
}) {
  const iso2 = nationalityToIso2(player?.nationality || '');
  const kit = NATIONAL_KITS[iso2] ?? NATIONAL_KITS['_'];

  const detailId = slotPositionId ?? player?.detailed_position_id ?? null;
  const lineColor = DETAIL_TO_LINE[detailId] ?? 'var(--c-mid)';

  const chipLabel = posLabel || getDetailedPositionLabel(detailId) || '?';
  const displayName = player?.display_name || player?.name || '';
  const surname = getSurname(displayName);
  const jerseyNumber = player?.jersey_number ?? player?.jersey ?? '';

  const ovr = Number.isFinite(player?.score_value)
    ? player.score_value.toFixed(1)
    : Number.isFinite(player?.avg_score)
      ? player.avg_score.toFixed(1)
      : '–';

  const isCaptain = captainPlayerId != null &&
    player?.id != null &&
    String(player.id) === String(captainPlayerId);

  return (
    <div className="fcard" style={{ '--line-c': lineColor }}>
      {isCaptain && <div className="fcard-cap">C</div>}
      <div className="fcard-flagbg">
        {iso2 && (
          <span
            className={`fi fi-${iso2}`}
            style={{ display: 'block', width: '100%', height: '100%', backgroundSize: 'cover', backgroundPosition: 'center' }}
          />
        )}
      </div>
      <div className="fcard-veil" />
      <PlayerFigure
        kit={kit}
        number={jerseyNumber}
        surname={surname}
        uid={`field-${player?.id ?? displayName}`}
      />
      <div className="fcard-body">
        <div className="fcard-head">
          <div className="fcard-ovr">
            <div className="v">{ovr}</div>
            <div className="l">OVR</div>
          </div>
          <span className="fcard-pos">{chipLabel}</span>
        </div>
        <div className="fcard-name">{displayName}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar que não há erros de import**

```bash
# No terminal do projeto (draft-football-app-2)
npx vite build 2>&1 | head -40
```

Expected: sem erros de módulo não encontrado. (Warnings de Tailwind são OK.)

- [ ] **Step 3: Commit**

```bash
git add src/components/FieldPlayerPreview.jsx
git commit -m "feat: rewrite FieldPlayerPreview with new convocacao card model"
```

---

## Task 4: Atualizar `src/pages/Draft.jsx` — visual-only

**Files:**
- Modify: `src/pages/Draft.jsx`

**Context:** `Draft.jsx` tem ~1155 linhas com toda a lógica de estado, drag-swap, API calls, etc. Este task toca APENAS no JSX do `return` e adiciona alguns `useMemo`/`useState` visuais. Não mexer em nenhum handler, useCallback, chamada de API, ou lógica existente.

**O que muda:**
1. Adicionar import de `PlayerFigure` e `NATIONAL_KITS`
2. Adicionar constantes visuais (`GRAY_KIT`, `POS_FULL`, `DETAIL_TO_LINE`)
3. Adicionar `isDesktop` state + effect
4. Adicionar `activeNextSlot` useMemo
5. Adicionar `pickedFlags` derivado
6. Adicionar `Emblem` e `ArrowR` inline components
7. Substituir o bloco `return (...)` inteiro

**O que NÃO muda:** Todo código das linhas 1–754 (imports originais, state, effects, handlers, `authFetch`, etc.). A fase `formation_pick` (linha 767–769) e o spinner de loading (756–765) não mudam.

### Step 1: Adicionar imports no topo

- [ ] Após a linha `import { getDetailedPositionLabel, matchesDetailedPositionSlot } from '../utils/positions.js';`, acrescentar:

```js
import PlayerFigure, { NATIONAL_KITS } from '../components/PlayerFigure.jsx';
import { nationalityToIso2 } from '../utils/nationality.js';
```

### Step 2: Substituir as constantes visuais no topo do arquivo

- [ ] Substituir o bloco `const SLOT_TONE_CLASSES = { ... };` (linhas 16–29 do arquivo original) pelo seguinte:

```js
const SLOT_TONE_CLASSES = {
  GOL: 'border-sky-300/40 bg-sky-950/95 text-sky-100 ring-sky-300/20',
  ZAG: 'border-emerald-300/40 bg-emerald-950/95 text-emerald-100 ring-emerald-300/20',
  LD: 'border-emerald-300/40 bg-emerald-950/95 text-emerald-100 ring-emerald-300/20',
  LE: 'border-emerald-300/40 bg-emerald-950/95 text-emerald-100 ring-emerald-300/20',
  VOL: 'border-emerald-300/40 bg-emerald-950/95 text-emerald-100 ring-emerald-300/20',
  MC: 'border-amber-300/40 bg-amber-950/95 text-amber-100 ring-amber-300/20',
  MD: 'border-amber-300/40 bg-amber-950/95 text-amber-100 ring-amber-300/20',
  ME: 'border-amber-300/40 bg-amber-950/95 text-amber-100 ring-amber-300/20',
  MEI: 'border-amber-300/40 bg-amber-950/95 text-amber-100 ring-amber-300/20',
  PE: 'border-rose-300/40 bg-rose-950/95 text-rose-100 ring-rose-300/20',
  PD: 'border-rose-300/40 bg-rose-950/95 text-rose-100 ring-rose-300/20',
  ATA: 'border-rose-300/40 bg-rose-950/95 text-rose-100 ring-rose-300/20',
};

const GRAY_KIT = NATIONAL_KITS['_'];

const POS_FULL = {
  GOL: 'Goleiro', ZAG: 'Zagueiro', LD: 'Lateral Dir.', LE: 'Lateral Esq.',
  VOL: 'Volante', MC: 'Meio-campo', MEI: 'Meia', MD: 'Meia Dir.', ME: 'Meia Esq.',
  PD: 'Ponta Dir.', PE: 'Ponta Esq.', ATA: 'Centroavante',
};

const DRAFT_DETAIL_TO_LINE = {
  1: 'var(--c-gk)',
  2: 'var(--c-def)', 3: 'var(--c-def)', 4: 'var(--c-def)',
  5: 'var(--c-mid)', 6: 'var(--c-mid)', 7: 'var(--c-mid)', 8: 'var(--c-mid)', 9: 'var(--c-mid)',
  10: 'var(--c-att)', 11: 'var(--c-att)', 12: 'var(--c-att)', 13: 'var(--c-att)',
};
```

Note: `SLOT_TONE_CLASSES` é mantido para eventual uso futuro mas não é mais usado no JSX novo.

### Step 3: Adicionar isDesktop state e activeNextSlot useMemo

- [ ] Dentro da função `Draft`, após a linha `const longPressTimeoutRef = React.useRef(null);` (linha ~95), adicionar:

```js
const [isDesktop, setIsDesktop] = useState(
  () => typeof window !== 'undefined' && window.innerWidth >= 1024
);
```

- [ ] Logo após o `useEffect` para cleanup (o que chama `animTimeoutsRef.current.forEach(clearTimeout)`, linhas 183–187), adicionar:

```js
useEffect(() => {
  const fn = () => setIsDesktop(window.innerWidth >= 1024);
  window.addEventListener('resize', fn);
  return () => window.removeEventListener('resize', fn);
}, []);
```

- [ ] Após a definição de `draggingSlotDetails` (useMemo, linhas ~139–156), adicionar:

```js
const activeNextSlot = useMemo(() => {
  if (draft?.status !== 'drafting') return null;
  return starterPlacements.find(
    (s) => !picksBySlot[s.position] && !pickedPlayers[s.position]
  ) ?? null;
}, [draft?.status, starterPlacements, picksBySlot, pickedPlayers]);

const pickedFlags = useMemo(() => {
  return [...new Set(
    (draft?.picks ?? [])
      .map((p) => nationalityToIso2(p.nationality ?? ''))
      .filter(Boolean)
  )];
}, [draft?.picks]);
```

### Step 4: Adicionar componentes inline (Emblem, ArrowR) antes do return

- [ ] Logo antes do `if (!draft)` (linha ~756), adicionar as funções inline:

```jsx
const Emblem = ({ s = 30 }) => (
  <span className="demblem" dangerouslySetInnerHTML={{ __html:
    `<svg width="${s}" height="${s}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="tg${s}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1f7a46"/><stop offset="1" stop-color="#0b3a20"/></linearGradient>
      <clipPath id="tc${s}"><rect x="3" y="3" width="94" height="94" rx="26"/></clipPath></defs>
      <rect x="3" y="3" width="94" height="94" rx="26" fill="url(#tg${s})"/>
      <g clip-path="url(#tc${s})">
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
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>
  </svg>
);
```

### Step 5: Substituir o return block

- [ ] Localizar o `return (` do componente Draft (linha ~772) e substituir TODO o bloco `return (...);` pelo seguinte:

```jsx
const phaseLabel = isCaptainPhase ? 'Capitão' : isBenchPhase ? 'Reservas' : 'Titulares';
const pickedCount = draft.picks?.length ?? 0;
const totalSlots = isBenchPhase ? 11 + BENCH_SLOTS.length : 11;
const pct = totalSlots > 0 ? (pickedCount / totalSlots) * 100 : 0;

const renderPitch = () => {
  return (
    <div
      className="pitch"
      data-theme="stadium"
      ref={fieldRef}
      style={{
        cursor: draggingSlot !== null ? 'grabbing' : 'default',
        touchAction: draggingSlot !== null ? 'none' : 'auto',
      }}
    >
      {isCaptainSelectionMode && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 5, background: 'rgba(0,0,0,0.34)' }} />
      )}
      <div className="pl pl-frame" />
      <div className="pl pl-half" />
      <div className="pl pl-circle" />
      <div className="pl pl-spot" />
      <div className="pl pl-boxT" />
      <div className="pl pl-boxB" />
      <div className="pl pl-gaT" />
      <div className="pl pl-gaB" />

      {starterPlacements.map((slot) => {
        const posLabel = getDetailedPositionLabel(slot.detailed_position_id) || slot.label || '?';
        const lineColor = DRAFT_DETAIL_TO_LINE[slot.detailed_position_id] ?? 'var(--c-mid)';
        const playerObj = normalizeDraftPlayer(pickedPlayers[slot.position] ?? null);
        const confirmedPick = picksBySlot[slot.position];
        const cardPlayer = playerObj ?? normalizeDraftPlayer(confirmedPick);
        const isLocked = isBenchPhase && !playerObj && !confirmedPick;
        const showFieldCard = Boolean(playerObj || confirmedPick);
        const isCaptainSelected = isCaptainPhase && captainCandidateId &&
          String(cardPlayer?.id) === String(captainCandidateId);
        const isNextPick = !isBenchPhase && !isCaptainPhase &&
          activeNextSlot?.position === slot.position;
        const cardAnimationStyle = poppingSlot === slot.position
          ? { animation: 'card-pop 0.45s cubic-bezier(0.34,1.56,0.64,1) both' }
          : undefined;
        const posFullLabel = POS_FULL[posLabel] ?? posLabel;

        return (
          <div
            key={slot.key}
            className="slot"
            data-filled={showFieldCard ? 'true' : undefined}
            style={{ top: `${slot.top}%`, left: `${slot.left}%` }}
          >
            {showFieldCard ? (
              <div
                onPointerDown={isCaptainPhase ? undefined : (e) => handleFieldPointerDown(e, slot.position, cardPlayer)}
                onClick={
                  isCaptainPhase
                    ? () => handleCaptainFieldClick(slot.position, cardPlayer)
                    : () => {
                        if (!fieldGestureRef.current?.moved) {
                          clearLongPressTimeout();
                          fieldGestureRef.current = null;
                          setDraggingSlot(null);
                          setDragPointer(null);
                          handleOpenPlayerStats(cardPlayer);
                        }
                      }
                }
                style={{
                  ...cardAnimationStyle,
                  touchAction: isCaptainPhase ? 'manipulation' : 'none',
                  cursor: isCaptainPhase ? 'pointer' : draggingSlot === slot.position ? 'grabbing' : 'grab',
                  opacity: draggingSlot === slot.position ? 0.5 : 1,
                  outline: isCaptainSelected
                    ? '3px solid rgba(250,204,21,0.98)'
                    : isCaptainSelectionMode
                      ? '2px solid rgba(255,255,255,0.38)'
                      : selectedSwapSlot === slot.position
                        ? '2px solid rgba(250,204,21,0.95)'
                        : dropTargetSlot === slot.position
                          ? '2px solid rgba(110,231,183,0.8)'
                          : 'none',
                  borderRadius: '12px',
                  transition: 'opacity 0.15s, outline 0.1s, transform 0.16s',
                  transform: isCaptainSelectionMode ? 'scale(1.03)' : undefined,
                  position: 'relative',
                  zIndex: isCaptainSelectionMode ? 25 : undefined,
                }}
              >
                <FieldPlayerPreview
                  player={cardPlayer}
                  posLabel={posLabel}
                  slotPositionId={slot.detailed_position_id}
                  captainPlayerId={draft.captain_player_id}
                />
              </div>
            ) : isLocked ? (
              <div
                className="fcard is-empty"
                style={{ '--line-c': lineColor, opacity: 0.4, pointerEvents: 'none' }}
              >
                <div className="fcard-veil" />
                <PlayerFigure kit={GRAY_KIT} number="" surname="" uid={`lock-${slot.position}`} className="sil" />
                <div className="fcard-body">
                  <div className="fcard-head">
                    <span />
                    <span className="fcard-pos">{posLabel}</span>
                  </div>
                </div>
                <div className="e-label">Fechado</div>
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
                  <div className="fcard-head">
                    <span />
                    <span className="fcard-pos">{posLabel}</span>
                  </div>
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
};

const renderMobile = () => (
  <>
    <div className="dhead">
      <div className="dhead-brand">
        <span className="wm bricol">
          <Emblem s={26} />
          draft<span className="g">11</span>
        </span>
        <span className="wc-tag"><span className="star">★</span> COPA 2026</span>
      </div>
      <div className="dhead-ctrl">
        <button className="dback" onClick={onGoHome}>‹ Sair</button>
        <span className="dphase">
          {phaseLabel} <span className="fmt">· {draft.formation}</span>
        </span>
        <button className="dpill" onClick={() => setShowFixturesModal(true)}>Partidas</button>
      </div>
      <div className="dprog">
        <span className="lab">{pickedCount}/{totalSlots}</span>
        <div className="bar">
          <div className="fill" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>

    <div className="dfieldwrap">
      {renderPitch()}
    </div>

    {activeNextSlot && draft.status === 'drafting' && (() => {
      const lc = DRAFT_DETAIL_TO_LINE[activeNextSlot.detailed_position_id] ?? 'var(--c-mid)';
      const pfl = POS_FULL[getDetailedPositionLabel(activeNextSlot.detailed_position_id)] ??
        getDetailedPositionLabel(activeNextSlot.detailed_position_id) ?? '?';
      return (
        <div className="ddock">
          <div className="ddock-inner">
            <div
              className="fcard is-empty is-active"
              style={{ '--line-c': lc, '--fcw': '50px', flexShrink: 0 }}
              onClick={() => handleSlotClick(activeNextSlot.position)}
            >
              <div className="fcard-veil" />
              <PlayerFigure kit={GRAY_KIT} number="" surname="" uid="dock-next" className="sil" />
              <div className="nexttag">PRÓXIMA</div>
              <div className="fcard-body"><div className="fcard-head"><span /></div></div>
              <div className="e-plus">+</div>
            </div>
            <div className="grow">
              <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 15, color: 'var(--text)' }}>
                {pfl}
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 2 }}>
                Toque na carta para escolher o jogador
              </div>
            </div>
            <button
              className="btn-pick"
              style={{ margin: 0, width: 'auto', padding: '0 18px', height: 42, whiteSpace: 'nowrap' }}
              onClick={() => handleSlotClick(activeNextSlot.position)}
            >
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
  const nextLc = nextSlot
    ? (DRAFT_DETAIL_TO_LINE[nextSlot.detailed_position_id] ?? 'var(--c-mid)')
    : 'var(--c-mid)';
  const nextPosLabel = nextSlot
    ? (POS_FULL[getDetailedPositionLabel(nextSlot.detailed_position_id)] ??
       getDetailedPositionLabel(nextSlot.detailed_position_id) ?? '?')
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
          <h4>Seu Draft</h4>
          <div className="rrow">
            <span className="k">Rodada</span>
            <span className="v">{draft.round_id}</span>
          </div>
          <div className="rrow">
            <span className="k">Formação</span>
            <span className="v gold">{draft.formation}</span>
          </div>
          <div className="rrow">
            <span className="k">Fase</span>
            <span className="v">{phaseLabel}</span>
          </div>
          <div className="rrow">
            <span className="k">Escalados</span>
            <span className="v">{pickedCount} / {totalSlots}</span>
          </div>
        </div>
        <div className="rcard">
          <h4>Progresso</h4>
          <div className="dprog">
            <span className="lab">{pickedCount}/{totalSlots}</span>
            <div className="bar"><div className="fill" style={{ width: `${pct}%` }} /></div>
          </div>
        </div>
        <div className="rail-spacer" />
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="dpill"
            style={{ flex: 1, justifyContent: 'center', height: 38 }}
            onClick={() => setShowFixturesModal(true)}
          >Partidas</button>
          <button
            className="dpill"
            style={{ flex: 1, justifyContent: 'center', height: 38 }}
            onClick={onGoHome}
          >Sair</button>
        </div>
      </div>

      <div className="pitch-center">
        {renderPitch()}
      </div>

      <div className="rail rail-r">
        {nextSlot && draft.status === 'drafting' && (
          <div className="nextpick" style={{ '--puck': nextLc }}>
            <div className="eyebrow">Próxima escolha</div>
            <div className="np-row">
              <div
                className="fcard is-empty is-active"
                style={{ '--line-c': nextLc, '--fcw': '68px', flexShrink: 0 }}
                onClick={() => handleSlotClick(nextSlot.position)}
              >
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
        {pickedFlags.length > 0 && (
          <div className="rcard">
            <h4>Seleções no pote</h4>
            <div className="rail-flags">
              {pickedFlags.map((iso) => (
                <span key={iso} className={`fi fi-${iso}`} />
              ))}
            </div>
          </div>
        )}
        <div className="rail-spacer" />
      </div>
    </>
  );
};

return (
  <>
    <style>{`
      @keyframes card-pop {
        0%   { transform: scale(0.3); opacity: 0; }
        60%  { transform: scale(1.08); opacity: 1; }
        100% { transform: scale(1);   opacity: 1; }
      }
      @keyframes captain-cta-pulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(252,211,77,0.18); opacity: 1; }
        50%       { box-shadow: 0 0 0 10px rgba(252,211,77,0); opacity: 0.78; }
      }
    `}</style>

    {/* Fixed overlays */}
    {showFixturesModal && (
      <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm">
        <div className="mx-auto h-full w-full max-w-xl">
          <FixturesBrowser
            embedded
            initialRoundNumber={draft?.round?.number || null}
            backLabel="Fechar"
            onBack={() => setShowFixturesModal(false)}
          />
        </div>
      </div>
    )}

    {error && (
      <div className="fixed inset-x-0 top-4 z-[90] flex justify-center px-4 pointer-events-none">
        <div className="w-full max-w-sm rounded-2xl border border-red-700 bg-red-900/30 px-4 py-2 text-sm text-red-300 shadow-lg">
          {error}
        </div>
      </div>
    )}

    {swapError && (
      <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-5 pt-6 sm:hidden">
        <div className="w-full max-w-sm rounded-2xl border border-red-400/35 bg-slate-950/96 px-5 py-4 text-center shadow-[0_24px_60px_rgba(0,0,0,0.5)] ring-1 ring-red-300/15 backdrop-blur-md">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-red-300/80">Erro</div>
          <p className="mt-2 text-sm font-medium leading-5 text-red-100">{swapError}</p>
        </div>
      </div>
    )}

    {isCaptainPhase && (
      <div style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 50 }}>
        <button
          type="button"
          onClick={handleCaptainModeButton}
          disabled={loading || (isCaptainSelectionMode && !captainCandidateId)}
          className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
            captainCandidateId
              ? 'border-amber-300/50 bg-amber-400/20 text-amber-100'
              : 'border-white/10 bg-white/5 text-slate-100'
          } ${loading || (isCaptainSelectionMode && !captainCandidateId) ? 'opacity-60' : 'hover:border-amber-300/40 hover:bg-amber-300/10'}`}
          style={{
            animation: !isCaptainSelectionMode && !captainCandidateId
              ? 'captain-cta-pulse 1.15s ease-in-out infinite'
              : 'none',
          }}
        >
          {captainCandidateId ? 'Confirmar Draft' : 'Escolher capitão'}
        </button>
      </div>
    )}

    {/* Bench drawer */}
    {(isBenchPhase || isCaptainPhase) && (
      <>
        {isBenchDrawerOpen && (
          <button
            type="button"
            aria-label="Fechar reservas"
            onClick={() => setIsBenchDrawerOpen(false)}
            className="fixed inset-0 z-30 bg-black/45 backdrop-blur-[1px]"
          />
        )}
        {!isBenchDrawerOpen && (
          <div className="pointer-events-none fixed bottom-6 right-0 z-40">
            <button
              type="button"
              onClick={() => setIsBenchDrawerOpen(true)}
              className="pointer-events-auto flex h-36 w-12 items-center justify-center rounded-l-3xl border border-r-0 border-white/10 bg-slate-500/50 px-2 shadow-[0_20px_45px_rgba(0,0,0,0.35)]"
            >
              <span className="[writing-mode:vertical-rl] rotate-180 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-100/80">
                Reservas
              </span>
            </button>
          </div>
        )}
        <aside
          className={`pointer-events-auto fixed inset-y-0 right-0 z-40 h-screen w-[min(56vw,11rem)] rounded-l-3xl border border-r-0 border-white/10 bg-slate-500/50 px-3 py-5 shadow-[-24px_0_50px_rgba(0,0,0,0.4)] backdrop-blur-md transition-transform duration-300 sm:w-[12rem] ${isBenchDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300/70">Reservas</span>
            <button
              type="button"
              onClick={() => setIsBenchDrawerOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-red-500/40 bg-red-500/15 text-sm font-black text-red-400 transition hover:bg-red-500/30"
            >✕</button>
          </div>
          <div className="flex h-[calc(100%-4.5rem)] flex-col items-center gap-2 overflow-y-auto pr-1">
            {BENCH_SLOTS.map(({ slot, label }) => {
              const playerObj = normalizeDraftPlayer(pickedPlayers[slot] ?? null);
              const confirmedPick = picksBySlot[slot];
              const cardPlayer = playerObj ?? normalizeDraftPlayer(confirmedPick);
              const posLabel = playerObj
                ? getDetailedPositionLabel(playerObj.detailed_position_id)
                : confirmedPick
                  ? getDetailedPositionLabel(confirmedPick.detailed_position_id)
                  : null;
              const isSelected = selectedSwapSlot === slot;

              if (playerObj || confirmedPick) {
                return (
                  <div
                    key={slot}
                    onPointerDown={(e) => handleFieldPointerDown(e, slot, cardPlayer)}
                    onClick={() => {
                      if (!fieldGestureRef.current?.moved) {
                        clearLongPressTimeout();
                        fieldGestureRef.current = null;
                        setDraggingSlot(null);
                        setDragPointer(null);
                        handleOpenPlayerStats(cardPlayer);
                      }
                    }}
                    style={{
                      ...(poppingSlot === slot ? { animation: 'card-pop 0.45s cubic-bezier(0.34,1.56,0.64,1) both' } : {}),
                      flexShrink: 0,
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'center',
                      cursor: draggingSlot === slot ? 'grabbing' : 'pointer',
                      opacity: draggingSlot === slot ? 0.5 : 1,
                      outline: isSelected
                        ? '2px solid rgba(250,204,21,0.95)'
                        : selectedSwapSlot !== null
                          ? '2px solid rgba(110,231,183,0.35)'
                          : 'none',
                      borderRadius: '12px',
                      transition: 'outline 0.1s, opacity 0.15s',
                      touchAction: draggingSlot === slot ? 'none' : 'manipulation',
                    }}
                  >
                    <FieldPlayerPreview
                      player={cardPlayer}
                      posLabel={posLabel}
                      captainPlayerId={draft.captain_player_id}
                    />
                  </div>
                );
              }

              return (
                <div
                  key={slot}
                  className="fcard is-empty"
                  style={{ '--line-c': 'var(--text-3)', '--fcw': '76px', flexShrink: 0 }}
                  onClick={() => handleSlotClick(slot)}
                >
                  <div className="fcard-veil" />
                  <PlayerFigure kit={GRAY_KIT} number="" surname="" uid={`bench-sil-${slot}`} className="sil" />
                  <div className="fcard-body">
                    <div className="fcard-head"><span /><span className="fcard-pos">{label}</span></div>
                  </div>
                  <div className="e-plus">+</div>
                  <div className="e-label">{label}</div>
                </div>
              );
            })}
          </div>
        </aside>
      </>
    )}

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

    {draggingPlayer && dragPointer && (
      <div
        className="pointer-events-none fixed left-0 top-0 z-[70]"
        style={{ transform: `translate(${dragPointer.x}px, ${dragPointer.y}px)` }}
      >
        <div style={{ transform: 'translate(-50%, -50%) scale(1.03) rotate(-4deg)' }}>
          <FieldPlayerPreview
            player={draggingPlayer}
            posLabel={draggingSlotDetails.posLabel}
            slotPositionId={draggingSlotDetails.slotPositionId}
            captainPlayerId={draft.captain_player_id}
          />
        </div>
      </div>
    )}

    {selectedCard && (
      <PlayerStatsModal player={selectedCard} onClose={() => setSelectedCard(null)} />
    )}

    {showConfirmDraftModal && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
        <div className="w-full max-w-xs rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.5)]">
          <p className="text-center text-base font-semibold text-white leading-snug mb-2">
            Deseja confirmar seu draft?
          </p>
          <p className="text-center text-sm text-gray-400 mb-6">
            Você não poderá editar após isso.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowConfirmDraftModal(false)}
              className="flex-1 rounded-xl border border-white/15 bg-white/5 py-2.5 text-sm font-semibold text-gray-300 transition hover:bg-white/10"
            >Voltar</button>
            <button
              type="button"
              disabled={loading}
              onClick={() => { setShowConfirmDraftModal(false); handleCaptain(captainCandidateId); }}
              className="flex-1 rounded-xl border border-emerald-400/40 bg-emerald-500/20 py-2.5 text-sm font-bold text-emerald-300 transition hover:bg-emerald-500/35 disabled:opacity-60"
            >Confirmar</button>
          </div>
        </div>
      </div>
    )}

    {/* Main layout shell */}
    <div className="dscreen" data-device={isDesktop ? 'desktop' : 'mobile'}>
      {isDesktop ? renderDesktop() : renderMobile()}
    </div>
  </>
);
```

- [ ] **Step 6: Verificar build sem erros**

```bash
npx vite build 2>&1 | head -60
```

Expected: `built in Xs` sem erros. Warnings de variáveis não usadas são OK.

- [ ] **Step 7: Verificar no browser (mobile)**

```bash
npm run dev
```

Abra `http://localhost:5173`, faça login, vá para um draft em fase `drafting`. Verificar:
- Fundo escuro `#060807` (tela toda)
- Header com emblem + "draft11" + pílula "★ COPA 2026" + linha 2 com Sair/fase/Partidas + barra de progresso
- Campo com fundo estádio (holofote no topo, gramado escuro, vinheta)
- Marcações do campo em verde-neon semi-transparente
- Slots vazios: carta com borda tracejada, silhueta cinza, "+" e nome da posição
- Slot ativo (primeiro vazio): borda dourada, pulso, tag "PRÓXIMA"
- Slots preenchidos: carta com bandeira da seleção ao fundo, bonequinho, OVR, chip de posição, nome
- Dock inferior com preview do slot ativo + botão "Escolher"

- [ ] **Step 8: Verificar no browser (desktop, ≥1024px)**

Abrir em viewport ≥ 1024px. Verificar:
- Layout 3 colunas (rail esquerdo + campo centralizado + rail direito)
- Rail esquerdo: emblema, pílula, "Seu Draft" card, progresso, botões
- Rail direito: "Próxima escolha" com preview do slot ativo, legenda de posições
- Campo centralizado com aspect-ratio 36/61

- [ ] **Step 9: Verificar drag-swap**

Na fase bench_drafting ou com slots preenchidos: arrastar uma carta para outro slot. Verificar que:
- A carta segue o cursor durante o drag
- O slot destino é destacado quando válido
- O swap funciona ao soltar

- [ ] **Step 10: Commit**

```bash
git add src/pages/Draft.jsx
git commit -m "feat: apply draft screen visual redesign with stadium theme"
```
