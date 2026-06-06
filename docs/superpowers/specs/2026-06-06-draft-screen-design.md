# Draft Screen Redesign — Design Spec (Sub-projeto 1: Campo)

**Identidade:** Copa do Mundo 2026 · Estádio Premium  
**Escopo:** visual-only — lógica de Draft.jsx preservada integralmente

---

## Objetivo

Substituir a aparência da tela de draft pelo novo modelo "convocação": todo slot é uma carta retangular com bandeira da seleção ao fundo, bonequinho SVG de costas, OVR, chip de posição e nome. Slots vazios e ativos seguem o mesmo formato. Layout desktop em 3 colunas com rails laterais. Tema Estádio Premium no campo.

---

## Arquivos

| Ação | Arquivo | Responsabilidade |
|------|---------|-----------------|
| Criar | `src/components/PlayerFigure.jsx` | SVG bonequinho compartilhado |
| Reescrever | `src/components/FieldPlayerPreview.jsx` | Carta de jogador escalado (`.fcard`) |
| Modificar (visual) | `src/pages/Draft.jsx` | Shell, header, slots, desktop rails, dock |
| Modificar (CSS) | `src/index.css` | Adicionar bloco de classes de draft |

---

## PlayerFigure (`src/components/PlayerFigure.jsx`)

Componente SVG puro, exportado como default. Compartilhado entre FieldPlayerPreview e (futuramente) PickPanel.

**Props:**
```ts
{
  kit: {
    skin: string,       // hex — tom de pele
    hair: string,       // hex — cabelo
    jersey: string,     // hex — camisa
    sleeve: string,     // hex — manga / gola
    name_color: string, // hex — sobrenome/número nas costas
    stripes?: boolean,
    stripe1?: string,
    stripe2?: string,
  },
  number: string | number,  // número nas costas (vazio = oculto)
  surname: string,          // sobrenome nas costas (vazio = oculto)
  uid: string,              // id único para o <pattern> SVG de listras
  className?: string,       // classe extra (ex: "sil" para opacidade 0.34)
}
```

**Viewbox:** `"2 14 196 184"` — da cintura para cima, mesmo do protótipo.

**Renderização de listras:** quando `kit.stripes === true`, usa `<pattern id={uid}>` com `stripe1`/`stripe2`; caso contrário fill sólido com `kit.jersey`.

**Classe base aplicada ao SVG:** `fcard-fig` (posicionada absolutamente pela CSS da carta).

### Paleta nacional (exportada como `NATIONAL_KITS`)

15 seleções + fallback cinza (`_`). O caller mapeia `nationalityToIso2(player.nationality)` → ISO2 → `NATIONAL_KITS[iso2] ?? NATIONAL_KITS['_']`.

| ISO2 | Kit |
|------|-----|
| `br` | amarelo/verde, pele média-escura |
| `fr` | azul marinho, pele média-escura |
| `es` | vermelho/amarelo, pele média |
| `ar` | azul celeste listrado, pele clara |
| `pt` | vermelho/verde, pele média-clara |
| `de` | branco/preto, pele média-clara |
| `nl` | laranja, pele média-clara |
| `gb-eng` | branco/vermelho, pele clara |
| `uy` | azul celeste, pele média-clara |
| `co` | amarelo/azul, pele média-escura |
| `mx` | verde, pele média |
| `us` | branco/azul, pele clara |
| `it` | azul profundo, pele média-clara |
| `hr` | vermelho listrado branco, pele média-clara |
| `ma` | vermelho, pele média |
| `_` | cinza neutro, `name_color: rgba(0,0,0,0)` (texto invisível) |

---

## FieldPlayerPreview reescrito (`src/components/FieldPlayerPreview.jsx`)

**Props preservadas:** `player`, `posLabel`, `slotPositionId`

**Mapeamento de linha de posição:**
```js
const DETAIL_TO_LINE = {
  1: 'var(--c-gk)',
  2:'var(--c-def)', 3:'var(--c-def)', 4:'var(--c-def)',
  5:'var(--c-mid)', 6:'var(--c-mid)', 7:'var(--c-mid)', 8:'var(--c-mid)', 9:'var(--c-mid)',
  10:'var(--c-att)', 11:'var(--c-att)', 12:'var(--c-att)', 13:'var(--c-att)',
};
```

`lineColor = DETAIL_TO_LINE[slotPositionId] ?? DETAIL_TO_LINE[player.detailed_position_id] ?? 'var(--c-mid)'`

**OVR exibido:** `player.score_value ?? player.avg_score ?? 0`, formatado com `.toFixed(1)`.

**Sobrenome:** último token de `player.display_name || player.name`, uppercase, máx 8 chars (truncado com ellipsis no SVG via `textLength` não — só limite visual; o SVG já tem `overflow:hidden` implícito no viewbox).

**Número:** `player.jersey_number` ou string vazia.

**Estrutura JSX:**
```jsx
<div className="fcard" style={{ '--line-c': lineColor }}>
  {isCaptain && <div className="fcard-cap">C</div>}
  <div className="fcard-flagbg">
    <span className={`fi fi-${iso2}`}
          style={{ display:'block', width:'100%', height:'100%',
                   backgroundSize:'cover', backgroundPosition:'center' }} />
  </div>
  <div className="fcard-veil" />
  <PlayerFigure kit={kit} number={player.jersey_number ?? ''} surname={surname}
                uid={`field-${player.id}`} />
  <div className="fcard-body">
    <div className="fcard-head">
      <div className="fcard-ovr">
        <div className="v">{ovr}</div>
        <div className="l">OVR</div>
      </div>
      <span className="fcard-pos">{posLabel}</span>
    </div>
    <div className="fcard-name">{displayName}</div>
  </div>
</div>
```

`isCaptain` = `player.id === captainPlayerId` — prop opcional `captainPlayerId` adicionada (nullable, default `null`). Draft.jsx passa `draft.captain_player_id`.

---

## Draft.jsx — mudanças visuais

### Regra fundamental
Não tocar em nenhum hook, handler, state, useCallback, useMemo ou chamada de API. Apenas o JSX de retorno é alterado.

### isDesktop state
```js
const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1024);
useEffect(() => {
  const fn = () => setIsDesktop(window.innerWidth >= 1024);
  window.addEventListener('resize', fn);
  return () => window.removeEventListener('resize', fn);
}, []);
```

### Constantes visuais (adicionadas no topo do componente)
```js
const GRAY_KIT = { skin:'#3a434b', hair:'#2c343b', jersey:'#222a30',
                   sleeve:'#1a2127', name_color:'rgba(0,0,0,0)' };

const POS_FULL = {
  GOL:'Goleiro', ZAG:'Zagueiro', LD:'Lateral Dir.', LE:'Lateral Esq.',
  VOL:'Volante', MC:'Meio-campo', MEI:'Meia', MEI2:'Meia',
  PD:'Ponta Dir.', PE:'Ponta Esq.', ATA:'Centroavante',
};

const DETAIL_TO_LINE = { /* ... ver acima ... */ };
```

### Slot JSX

**Preenchido:** renderiza `<FieldPlayerPreview player={cardPlayer} posLabel={...} slotPositionId={...} captainPlayerId={draft.captain_player_id} />`

**Vazio:**
```jsx
<div className="fcard is-empty" style={{ '--line-c': lineColor }}
     onClick={() => handleSlotClick(slotPosition)}>
  <div className="fcard-veil" />
  <PlayerFigure kit={GRAY_KIT} number="" surname="" uid={`sil-${slotPosition}`} className="sil" />
  <div className="fcard-body">
    <div className="fcard-head"><span /><span className="fcard-pos">{posLabel}</span></div>
  </div>
  <div className="e-plus">+</div>
  <div className="e-label">{posFullLabel}</div>
</div>
```

**Ativo (próxima escolha):** adiciona `is-active` e o selo:
```jsx
<div className="fcard is-empty is-active" style={{ '--line-c': lineColor }}
     onClick={() => handleSlotClick(slotPosition)}>
  <div className="fcard-veil" />
  <PlayerFigure kit={GRAY_KIT} number="" surname="" uid={`sil-${slotPosition}`} className="sil" />
  <div className="nexttag">PRÓXIMA</div>
  <div className="fcard-body">
    <div className="fcard-head"><span /></div>
  </div>
  <div className="e-plus">+</div>
  <div className="e-label">{posFullLabel}</div>
</div>
```

**Lógica de "slot ativo":** o primeiro slot sem pick na ordem de `starterPlacements` (ou bench). Já computado pelo estado existente `activeSlot` — apenas lê esse valor.

### Marcações do campo (pitch markings)

Adicionar dentro do `<div className="pitch">`:
```jsx
<div className="pl pl-frame" />
<div className="pl pl-half" />
<div className="pl pl-circle" />
<div className="pl pl-spot" />
<div className="pl pl-boxT" />
<div className="pl pl-boxB" />
<div className="pl pl-gaT" />
<div className="pl pl-gaB" />
```

### Header mobile
```jsx
<div className="dhead">
  <div className="dhead-brand">
    <span className="bricol" style={{ fontWeight:800, fontSize:18, display:'flex', alignItems:'center', gap:9 }}>
      <Emblem s={26} />
      draft<span style={{ color:'var(--gold)' }}>11</span>
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
      <div className="fill" style={{ width: `${(pickedCount / totalSlots) * 100}%` }} />
    </div>
  </div>
</div>
```

`pickedCount` = `draft.picks?.length ?? 0`. `totalSlots` = `11` no drafting, `16` no bench (11 + 5).  
`phaseLabel`: `'Titulares'` em drafting, `'Reservas'` em bench_drafting, `'Capitão'` em captain_pick.

### Shell de layout

**Mobile:**
```jsx
<div className="dscreen" data-device="mobile" data-theme="stadium">
  <div className="dhead">...</div>
  <div className="dfieldwrap"><div className="pitch" data-theme="stadium">...</div></div>
  {activeNextSlot && <div className="ddock">...</div>}
</div>
```

**Desktop:**
```jsx
<div className="dscreen" data-device="desktop" data-theme="stadium">
  <div className="rail rail-l">...</div>
  <div className="pitch-center"><div className="pitch" data-theme="stadium">...</div></div>
  <div className="rail rail-r">...</div>
</div>
```

### Mobile dock (`.ddock`)
Aparece quando há `activeNextSlot` e `draft.status === 'drafting' || 'bench_drafting'`:
```jsx
<div className="ddock">
  <div className="ddock-inner">
    <div className="fcard is-empty is-active" style={{ '--line-c': lineColor, '--fcw':'50px' }}
         onClick={() => handleSlotClick(activeNextSlot.slot_position)}>
      <div className="fcard-veil" />
      <PlayerFigure kit={GRAY_KIT} number="" surname="" uid="dock-next" className="sil" />
      <div className="nexttag">PRÓXIMA</div>
      <div className="fcard-body"><div className="fcard-head"><span /></div></div>
      <div className="e-plus">+</div>
    </div>
    <div className="grow">
      <div style={{ fontFamily:"'Bricolage Grotesque'", fontWeight:800, fontSize:15 }}>
        {POS_FULL[activeNextSlot.pos] ?? posLabel}
      </div>
      <div style={{ fontSize:10.5, color:'var(--text-3)', marginTop:2 }}>
        Toque na carta para escolher o jogador
      </div>
    </div>
    <button className="btn-pick" onClick={() => handleSlotClick(activeNextSlot.slot_position)}>
      Escolher <ArrowR />
    </button>
  </div>
</div>
```

### Rail esquerdo (desktop)
```jsx
<div className="rail rail-l">
  <div style={{ display:'flex', alignItems:'center', gap:11 }}>
    <Emblem s={34} />
    <span className="bricol" style={{ fontWeight:800, fontSize:20 }}>
      draft<span style={{ color:'var(--gold)' }}>11</span>
    </span>
  </div>
  <span className="wc-tag"><span className="star">★</span> COPA DO MUNDO 2026</span>
  <div className="rcard">
    <h4>Seu Draft</h4>
    <div className="rrow"><span className="k">Rodada</span><span className="v">{draft.round_id}</span></div>
    <div className="rrow"><span className="k">Formação</span><span className="v gold">{draft.formation}</span></div>
    <div className="rrow"><span className="k">Fase</span><span className="v">{phaseLabel}</span></div>
    <div className="rrow"><span className="k">Escalados</span><span className="v">{pickedCount} / 11</span></div>
  </div>
  <div className="rcard">
    <h4>Progresso</h4>
    <div className="dprog">
      <span className="lab">{pickedCount}/{totalSlots}</span>
      <div className="bar"><div className="fill" style={{ width:`${pct}%` }} /></div>
    </div>
  </div>
  <div className="rail-spacer" />
  <div style={{ display:'flex', gap:10 }}>
    <button className="dpill" style={{ flex:1, justifyContent:'center', height:38 }}
            onClick={() => setShowFixturesModal(true)}>Partidas</button>
    <button className="dpill" style={{ flex:1, justifyContent:'center', height:38 }}
            onClick={onGoHome}>Sair</button>
  </div>
</div>
```

### Rail direito (desktop)
```jsx
<div className="rail rail-r">
  {activeNextSlot && (
    <div className="nextpick" style={{ '--puck': lineColor }}>
      <div className="eyebrow">Próxima escolha</div>
      <div className="np-row">
        <div className="fcard is-empty is-active" style={{ '--line-c': lineColor, '--fcw':'68px' }}
             onClick={() => handleSlotClick(activeNextSlot.slot_position)}>
          <div className="fcard-veil" />
          <PlayerFigure kit={GRAY_KIT} number="" surname="" uid="rail-next" className="sil" />
          <div className="nexttag">PRÓXIMA</div>
          <div className="fcard-body"><div className="fcard-head"><span /></div></div>
          <div className="e-plus">+</div>
        </div>
        <div>
          <div style={{ fontFamily:"'Bricolage Grotesque'", fontWeight:800, fontSize:18 }}>
            {POS_FULL[activeNextSlot.pos] ?? posLabel}
          </div>
          <div style={{ fontSize:11, color:'var(--text-3)', marginTop:2 }}>
            {options?.length ?? '–'} jogadores disponíveis
          </div>
        </div>
      </div>
      <button className="btn-pick" onClick={() => handleSlotClick(activeNextSlot.slot_position)}>
        Escolher jogador <ArrowR />
      </button>
    </div>
  )}
  <div className="rcard">
    <h4>Posições</h4>
    <div className="legend">
      <div className="li"><span className="sw" style={{ background:'var(--c-gk)' }} /> Goleiro</div>
      <div className="li"><span className="sw" style={{ background:'var(--c-def)' }} /> Defesa</div>
      <div className="li"><span className="sw" style={{ background:'var(--c-mid)' }} /> Meio-campo</div>
      <div className="li"><span className="sw" style={{ background:'var(--c-att)' }} /> Ataque</div>
    </div>
  </div>
  <div className="rail-spacer" />
  <div className="rcard">
    <h4>Seleções no pote</h4>
    <div className="rail-flags">
      {pickedFlags.map(iso => <span key={iso} className={`fi fi-${iso}`} />)}
    </div>
  </div>
</div>
```

`pickedFlags` = ISO2s únicos dos jogadores já escalados:
```js
const pickedFlags = [...new Set(
  (draft.picks ?? [])
    .map(p => nationalityToIso2(p.nationality ?? ''))
    .filter(Boolean)
)];
```

### Componentes inline em Draft.jsx

```jsx
const Emblem = ({ s = 30 }) => ( /* mesmo SVG inline do Login.jsx */ );
const ArrowR = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>
  </svg>
);
```

---

## CSS (`src/index.css`)

Adicionar bloco único no final do arquivo. Tokens já definidos no bloco do login (`--bg-900`, `--bg-950`, `--gold`, `--gold-soft`, `--text`, `--text-2`, `--text-3`) são reaproveitados.

**Novos tokens (só os que ainda não existem):**
```css
:root {
  --c-gk: #3a86d4;
  --c-def: #2fa564;
  --c-mid: #f5a623;
  --c-att: #e0443e;
  --line: #23292f;
  --line-2: #2a313a;
  --green: #1a6b3c;
  --green-hi: #23864b;
  --green-glow: #46c97a;
}
```

**Classes incluídas** (transcritas de `draft11-draft.css` sem modificação exceto onde necessário para integrar com Tailwind):
- `.dscreen`, `.dscreen[data-device="mobile"]`, `.dscreen[data-device="desktop"]`
- `.bricol`, `.mono`, `.wc-tag`
- `.demblem`
- `.dhead`, `.dhead-brand`, `.dhead-ctrl`, `.dpill`, `.dphase`, `.dback`
- `.dprog`, `.dprog .lab`, `.dprog .bar`, `.dprog .fill`
- `.dfieldwrap`, `.pitch`, `.pitch[data-theme="stadium"]`, `pitch::before`, `.pitch::after`, `.pitch-center`
- `.pl`, `.pl-frame`, `.pl-half`, `.pl-circle`, `.pl-spot`, `.pl-boxT`, `.pl-boxB`, `.pl-gaT`, `.pl-gaB`
- `.slot`, `.slot[data-filled="true"]`
- `.fcard`, `.fcard-flagbg`, `.fcard-veil`, `.fcard-fig`, `.fcard-body`, `.fcard-head`, `.fcard-ovr`, `.fcard-pos`, `.fcard-name`, `.fcard-cap`
- `.fcard.is-empty`, `.fcard.is-empty:hover`, `.fcard .sil`, `.e-plus`, `.e-label`
- `.fcard.is-active`, `.fcard.is-active .e-plus`, `.fcard.is-active .nexttag`, `.nexttag`
- `@keyframes cardpulse`
- `.rail`, `.rail-l`, `.rail-r`, `.rail-brand`, `.rcard`, `.rrow`, `.legend`, `.legend .li`, `.legend .sw`
- `.nextpick`, `.nextpick .eyebrow`, `.nextpick .np-row`, `.nextpick .np-name`, `.nextpick .np-sub`
- `.btn-pick`
- `.rail-flags`, `.rail-flags .fi`, `.rail-spacer`
- `.ddock`, `.ddock-inner`, `.ddock .grow`, `.ddock .btn-pick`
- `.dscreen[data-device="desktop"] .fcard` (tamanho 92px)
- `.dscreen[data-device="desktop"] .pitch`

---

## O que não muda em Draft.jsx

- `useState` / `useEffect` / `useCallback` / `useMemo`
- `authFetch`, `normalizeDraftPlayer`, `getPlayerDisplayName`
- `handleSlotClick`, `handlePickPlayer`, `handleSwap`
- `handleFieldPointerDown/Move/Up` (drag-to-swap)
- `isSwapValid`, `getSwapInvalidReason`
- `isBenchDrawerOpen`, `isCaptainSelectionMode`, `showConfirmDraftModal`, `showFixturesModal`
- `captainCandidateId`, `setCaptainCandidateId`
- `picksBySlot`, `formationSlots`, `starterPlacements`
- `pendingPick`, `pickedPlayers`, `poppingSlot`, `draggingSlot`, `dropTargetSlot`, `selectedSwapSlot`, `selectedCard`
- Modais: `PlayerStatsModal`, `FixturesBrowser`, confirmação de draft, gaveta de reservas
- Fase `formation_pick` → `FormationPickerPhase` (intocada)
- Fase `captain_pick` → modo seleção com `isCaptainSelectionMode` (só troca visual da carta)
- Fase `complete` → navegação para home
