# Draft — Campo de Cartas e Animação de Pick Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ao escolher uma carta no PickPanel o overlay faz fade-out, a carta aparece com animação de pop no slot correto do campo, e o campo da formação exibe DraftPlayerCard compacto (140px) em vez de mini-boxes.

**Architecture:** Três mudanças encadeadas — (1) DraftPlayerCard ganha prop `compact` que escala para 140px; (2) PickPanel ganha prop `fadingOut` para o fade-out de 300ms; (3) Draft.jsx gerencia estado de animação otimista, mantém mapa `pickedPlayers` para renderizar cartas confirmadas, e redesenha o campo com DraftPlayerCard compact.

**Tech Stack:** React 18, CSS transitions + keyframe nativo, Vite (sem test runner configurado — verificação visual via `npm run dev`).

---

## File Structure

| Arquivo | O que muda |
|---|---|
| `src/components/DraftPlayerCard.jsx` | Adiciona prop `compact` com dimensões reduzidas |
| `src/components/PickPanel.jsx` | Adiciona prop `fadingOut`; passa objeto `player` (não `player.id`) para `onPickPlayer` |
| `src/pages/Draft.jsx` | Adiciona estados de animação + `pickedPlayers`; reescreve `handlePickPlayer`; redesenha campo com DraftPlayerCard compact; injeta keyframe CSS |

---

## Task 1: DraftPlayerCard — prop `compact`

**Files:**
- Modify: `src/components/DraftPlayerCard.jsx`

Contexto: o componente atual tem `width: 210`, seção superior `height: 120`, jersey SVG `width={108}`. Precisamos de uma variante 140px para o campo.

- [ ] **Step 1: Adicionar prop `compact` e aplicar dimensões condicionais**

Substituir a assinatura e os valores inline em `src/components/DraftPlayerCard.jsx`:

```jsx
export default function DraftPlayerCard({ player, onClick, isMyTurn, compact = false }) {
  const isGoalkeeper = player.detailed_position_id === 1;
  const attrs = isGoalkeeper ? GOALKEEPER_ATTRS : OUTFIELD_ATTRS;
  const borderColor = BORDER_COLORS[player.position_id] || '#6b7280';
  const iso2 = nationalityToIso2(player.nationality || '');
  const displayName = player.display_name || player.name;
  const altPositions = [...new Set((player.alt_positions || []))].slice(0, 2);
  const avgScore = (player.avg_score || 0).toFixed(1);
  const avgMinutes = Math.round(player.avg_minutes || 0);
  const jersey = TEAM_COLORS[player.team_short_code] || { p: BORDER_COLORS[player.position_id] || '#3b82f6', s: '#FFFFFF' };

  const W = compact ? 140 : 210;
  const topH = compact ? 80 : 120;
  const jerseyW = compact ? 72 : 108;
  const scoreFz = compact ? 18 : 26;
  const minutesFz = compact ? 10 : 14;
  const posFz = compact ? 14 : 20;
  const nameFz = compact ? 11 : 15;
  const attrLabelFz = compact ? 10 : 14;
  const attrValFz = compact ? 11 : 15;
  const attrLabelW = compact ? 24 : 34;
  const attrValW = compact ? 26 : 36;
  const flagW = compact ? 20 : 28;
  const flagH = compact ? 14 : 20;
  const bottomPad = compact ? '6px 8px 12px' : '8px 12px 17px';
  const gap = compact ? 6 : 8;

  return (
    <button
      onClick={isMyTurn ? onClick : undefined}
      disabled={!isMyTurn}
      style={{
        width: W,
        flexShrink: 0,
        borderRadius: 14,
        overflow: 'hidden',
        border: `1.5px solid ${borderColor}`,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        background: 'transparent',
        cursor: isMyTurn ? 'pointer' : 'default',
        opacity: isMyTurn ? 1 : 0.8,
        textAlign: 'left',
        transition: 'transform 0.15s, box-shadow 0.15s',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
      onMouseEnter={e => { if (isMyTurn) e.currentTarget.style.transform = 'scale(1.04)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      {/* ── TOP ── */}
      <div style={{
        height: topH,
        background: '#1a2234',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Jersey */}
        <div style={{
          position:'absolute', inset:0,
          display:'flex', alignItems:'flex-end', justifyContent:'center'
        }}>
          <svg viewBox="0 0 120 95" width={jerseyW} fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 4px 14px rgba(0,0,0,0.7))' }}>
            <defs>
              <clipPath id={`jersey-${player.id}`}>
                <path d="M38 6 C36 6 24 9 6 20 L13 46 C19 40 25 38 30 38 L30 95 L90 95 L90 38 C95 38 101 40 107 46 L114 20 C96 9 84 6 82 6 C80 1 74 0 74 3 Q60 13 46 3 C46 0 40 1 38 6 Z"/>
              </clipPath>
            </defs>
            <g clipPath={`url(#jersey-${player.id})`}>
              <rect x="0" y="0" width="120" height="95" fill={jersey.p}/>
              <rect x="45" y="0" width="30" height="95" fill={jersey.s} opacity="0.85"/>
            </g>
          </svg>
        </div>

        {/* Top-left: score */}
        <div style={{ position:'absolute', top:9, left:11 }}>
          <div style={{ fontSize:scoreFz, fontWeight:800, color:'#fbbf24', lineHeight:1.05 }}>
            {avgScore}
          </div>
          <div style={{ fontSize:8, color:'#6b7280' }}>score méd.</div>
        </div>

        {/* Top-right: minutes + flag */}
        <div style={{
          position:'absolute', top:9, right:11,
          display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8
        }}>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:minutesFz, fontWeight:700, color:'#d1d5db', lineHeight:1 }}>
              {avgMinutes}'
            </div>
            <div style={{ fontSize:8, color:'#6b7280' }}>méd. min.</div>
            <div style={{ fontSize:minutesFz, fontWeight:700, color:'#d1d5db', lineHeight:1, marginTop:4 }}>
              {player.matches_played ?? 0}
            </div>
            <div style={{ fontSize:8, color:'#6b7280' }}>partidas</div>
          </div>
          {iso2 && (
            <span
              className={`fi fi-${iso2}`}
              style={{ display:'inline-block', width:flagW, height:flagH, borderRadius:3, boxShadow:'0 1px 4px rgba(0,0,0,0.5)' }}
            />
          )}
        </div>

        {/* Bottom-left: alt positions + main position */}
        <div style={{
          position:'absolute', bottom:9, left:11,
          display:'flex', flexDirection:'column', alignItems:'flex-start', gap:2
        }}>
          {altPositions.map(posID => (
            <span key={posID} style={{
              fontSize:9, fontWeight:600, color:'#9ca3af',
              background:'rgba(255,255,255,0.08)',
              borderRadius:3, padding:'1px 5px', lineHeight:1.5, display:'block'
            }}>
              {DETAILED_LABELS[posID] || posID}
            </span>
          ))}
          <span style={{ fontSize:posFz, fontWeight:900, color:'#f9fafb', lineHeight:1, letterSpacing:'0.5px', marginTop:1 }}>
            {DETAILED_LABELS[player.detailed_position_id] || '?'}
          </span>
        </div>

        {/* Bottom-right: team code */}
        <div style={{ position:'absolute', bottom:9, right:11 }}>
          <span style={{ fontSize:11, fontWeight:700, color:'#6b7280', letterSpacing:'0.5px' }}>
            {player.team_short_code || '—'}
          </span>
        </div>
      </div>

      {/* ── BOTTOM ── */}
      <div style={{
        background:'#111827',
        padding: bottomPad,
        display:'flex', flexDirection:'column', gap,
      }}>
        {/* Player name */}
        <div style={{
          fontSize:nameFz, fontWeight:800, color:'#f9fafb',
          textTransform:'uppercase', letterSpacing:'0.5px', textAlign:'center',
          whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
          paddingBottom: compact ? 5 : 8,
          borderBottom:'1px solid rgba(255,255,255,0.08)'
        }}>
          {displayName}
        </div>

        {/* Attribute grid — 3×2 */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'3px 8px' }}>
          {attrs.map(([label, color, key]) => (
            <div key={label} style={{ display:'flex', alignItems:'center', gap:3 }}>
              <span style={{
                fontSize:attrLabelFz, fontWeight:800, textTransform:'uppercase',
                width:attrLabelW, flexShrink:0, color
              }}>{label}</span>
              <span style={{ fontSize:attrValFz, fontWeight:900, width:attrValW, textAlign:'right', color }}>
                {Number.isFinite(player[key] || 0) ? (player[key] || 0).toFixed(1) : '0.0'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </button>
  );
}
```

- [ ] **Step 2: Verificar no dev server**

```bash
npm run dev
```

Abrir o app, ir para um draft na fase de titulares, clicar em um slot. No PickPanel as cartas devem aparecer normais (210px). Sem erros no console.

- [ ] **Step 3: Commit**

```bash
git add src/components/DraftPlayerCard.jsx
git commit -m "feat: add compact prop to DraftPlayerCard (140px variant)"
```

---

## Task 2: PickPanel — prop `fadingOut` + passar player object

**Files:**
- Modify: `src/components/PickPanel.jsx`

Contexto: atualmente `onClick={() => onPickPlayer(player.id)`. Precisa passar o objeto completo. Também precisa do fade-out via prop.

- [ ] **Step 1: Adicionar `fadingOut` e mudar callback para objeto player**

Substituir o conteúdo completo de `src/components/PickPanel.jsx`:

```jsx
import React from 'react';
import DraftPlayerCard from './DraftPlayerCard.jsx';

const DETAILED_TO_BASIC = {
  1:1, 2:2, 3:2, 4:2, 5:3, 6:3, 7:3, 8:3, 9:3, 10:4, 11:4, 12:4, 13:4
};

const DETAILED_LABELS = {
  1:'GOL', 2:'ZAG', 3:'LD', 4:'LE', 5:'VOL',
  6:'MEI', 7:'MAT', 8:'ME', 9:'MD', 10:'CA', 11:'PE', 12:'PD', 13:'2AT'
};

const POS_COLORS = {
  1: 'border-blue-500 bg-blue-900/60 text-blue-300',
  2: 'border-green-600 bg-green-900/60 text-green-300',
  3: 'border-yellow-500 bg-yellow-900/60 text-yellow-300',
  4: 'border-red-500 bg-red-900/60 text-red-300',
};

export default function PickPanel({ options, slotDetailedPositionId, isCaptainPick = false, onPickPlayer, onClose, fadingOut = false }) {
  if (!options) return null;

  const basicPos = DETAILED_TO_BASIC[slotDetailedPositionId] || 1;
  const posLabel = isCaptainPick ? 'CAPITÃO' : (DETAILED_LABELS[slotDetailedPositionId] || '?');
  const badgeClass = isCaptainPick
    ? 'border-yellow-500 bg-yellow-900/30 text-yellow-300'
    : (POS_COLORS[basicPos] || POS_COLORS[1]);

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 overflow-y-auto"
      style={{
        opacity: fadingOut ? 0 : 1,
        pointerEvents: fadingOut ? 'none' : 'auto',
        transition: 'opacity 0.3s ease',
      }}
    >
      <div className="flex flex-col items-center justify-center min-h-full p-3 sm:p-4 gap-4 sm:gap-6">
        <div className="text-center">
          <span className={`border text-sm font-bold px-4 py-1.5 rounded-lg ${badgeClass}`}>
            {isCaptainPick ? '👑 CAPITÃO' : posLabel}
          </span>
          <p className="text-draft-gold font-semibold mt-2">Escolha um jogador</p>
        </div>
        <div className="flex flex-nowrap gap-3 overflow-x-auto w-full pb-2 sm:flex-wrap sm:justify-center sm:overflow-x-visible">
          {options.map(player => (
            <DraftPlayerCard
              key={player.id}
              player={player}
              isMyTurn
              onClick={() => onPickPlayer(player)}
            />
          ))}
        </div>
        <button
          onClick={onClose}
          className="text-xs text-gray-600 hover:text-gray-400 border border-gray-700 px-4 py-2 rounded-lg"
        >
          ← Voltar
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar**

```bash
npm run dev
```

Abrir draft, clicar num slot. O PickPanel deve abrir normalmente. Ao clicar "← Voltar" deve fechar. Sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/components/PickPanel.jsx
git commit -m "feat: PickPanel passes full player object and supports fadingOut prop"
```

---

## Task 3: Draft.jsx — animação + campo com cartas

**Files:**
- Modify: `src/pages/Draft.jsx`

Contexto: precisamos de 3 novos estados, um novo `handlePickPlayer`, e redesenho do campo. O campo atual usa `w-16 h-20` boxes. Vai virar cartas compactas de 140px.

- [ ] **Step 1: Adicionar keyframe CSS e novos estados**

Logo após os imports existentes (linha 1-5 de `src/pages/Draft.jsx`), adicionar o keyframe via `<style>` — isso será feito no JSX. Primeiro, adicionar os novos estados dentro de `export default function Draft`:

Localizar o bloco de estados no início do componente (após `const [error, setError] = useState(null);`) e adicionar:

```js
const [pendingPick, setPendingPick] = useState(null);
// { player: PlayerObject, slotPosition: number }
const [pickedPlayers, setPickedPlayers] = useState({});
// { [slotPosition]: PlayerObject } — persiste cartas confirmadas para renderização
const [isAnimatingOut, setIsAnimatingOut] = useState(false);
const [poppingSlot, setPoppingSlot] = useState(null);
```

- [ ] **Step 2: Reescrever `handlePickPlayer`**

Localizar a função `handlePickPlayer` (atual, linhas 120-137) e substituí-la por:

```js
const handlePickPlayer = (player) => {
  const slotPosition = activeSlot;

  // 1. Guarda player no mapa permanente e no pendingPick (otimista)
  setPickedPlayers(prev => ({ ...prev, [slotPosition]: player }));
  setPendingPick({ player, slotPosition });
  setPoppingSlot(slotPosition);

  // 2. Fade-out do overlay
  setIsAnimatingOut(true);

  // 3. Após 300ms, desmonta overlay e dispara pop
  setTimeout(() => {
    setOptions(null);
    setActiveSlot(null);
    setIsAnimatingOut(false);
    setPendingPick(null);
    setTimeout(() => setPoppingSlot(null), 500);
  }, 300);

  // 4. Chama API em paralelo
  setLoading(true);
  authFetch(`${API_URL}/drafts/${draftId}/picks`, {
    method: 'POST',
    body: JSON.stringify({ player_id: player.id, slot_position: slotPosition }),
  })
    .then(res => res.json().then(data => ({ ok: res.ok, data })))
    .then(({ ok, data }) => {
      if (!ok) throw new Error(data.error);
      return loadDraft();
    })
    .catch(e => {
      setError(e.message);
      // Reverte UI otimista em caso de erro
      setPickedPlayers(prev => {
        const next = { ...prev };
        delete next[slotPosition];
        return next;
      });
    })
    .finally(() => setLoading(false));
};
```

- [ ] **Step 3: Redesenhar o campo — slots com DraftPlayerCard compact**

Localizar o bloco `{!isBenchPhase && (` (campo de titulares) e substituir o conteúdo completo da div interna pela versão com cartas. O bloco a substituir vai da linha `{!isBenchPhase && (` até o fechamento correspondente `)}`.

Substituir por:

```jsx
{!isBenchPhase && (
  <>
    <style>{`
      @keyframes card-pop {
        0%   { transform: scale(0.3); opacity: 0; }
        60%  { transform: scale(1.08); opacity: 1; }
        100% { transform: scale(1);   opacity: 1; }
      }
    `}</style>
    <div className="bg-green-950/40 border border-green-900/30 rounded-2xl p-3 mb-4">
      <div className="flex flex-col gap-3">
        {[4, 3, 2, 1].map(basicPos => {
          const rowSlots = starterSlots.filter(s =>
            DETAILED_TO_BASIC[s.detailed_position_id] === basicPos
          );
          if (rowSlots.length === 0) return null;
          return (
            <div key={basicPos} className="flex gap-2 justify-center overflow-x-auto pb-1">
              {rowSlots.map(s => {
                const posLabel = DETAILED_LABELS[s.detailed_position_id] || '?';
                const playerObj = pickedPlayers[s.position]
                  ?? (pendingPick?.slotPosition === s.position ? pendingPick.player : null);

                if (playerObj) {
                  return (
                    <div
                      key={s.position}
                      style={poppingSlot === s.position
                        ? { animation: 'card-pop 0.45s cubic-bezier(0.34,1.56,0.64,1) both', flexShrink: 0 }
                        : { flexShrink: 0 }
                      }
                    >
                      <DraftPlayerCard player={playerObj} compact isMyTurn={false} />
                    </div>
                  );
                }

                return (
                  <button
                    key={s.position}
                    onClick={() => handleSlotClick(s.position)}
                    style={{ width: 140, minHeight: 182, flexShrink: 0 }}
                    className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-600 hover:border-draft-green hover:bg-draft-green/10 transition-all"
                  >
                    <span className="text-sm font-bold text-gray-400">{posLabel}</span>
                    <span className="text-gray-600 mt-1 text-lg">+</span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  </>
)}
```

- [ ] **Step 4: Adicionar import de DraftPlayerCard no topo de Draft.jsx**

Verificar se `DraftPlayerCard` já é importado. Se não, adicionar:

```js
import DraftPlayerCard from '../components/DraftPlayerCard.jsx';
```

(Adicionar junto aos outros imports no topo do arquivo.)

- [ ] **Step 5: Atualizar a renderização do PickPanel para passar `fadingOut`**

Localizar o bloco `{options && (` no final do JSX de Draft.jsx e atualizar:

```jsx
{options && (
  <PickPanel
    options={options}
    slotDetailedPositionId={
      activeSlot > 11
        ? null
        : (formationSlots[activeSlot - 1]?.detailed_position_id ?? null)
    }
    onPickPlayer={handlePickPlayer}
    onClose={() => { setOptions(null); setActiveSlot(null); }}
    fadingOut={isAnimatingOut}
  />
)}
```

- [ ] **Step 6: Verificar fluxo completo**

```bash
npm run dev
```

Testar na sequência:
1. Abrir um draft na fase de titulares
2. Campo exibe cartas compactas (140px) nos slots vazios com borda dashed e label + "+"
3. Clicar num slot → PickPanel abre normalmente
4. Clicar numa carta → overlay faz fade-out em ~300ms → carta aparece no slot com animação de pop (efeito mola)
5. Escolher mais 2-3 jogadores — cartas aparecem no campo sem erros
6. Sem erros no console

- [ ] **Step 7: Commit**

```bash
git add src/pages/Draft.jsx
git commit -m "feat: card-pop animation and compact DraftPlayerCard field layout"
```

---

## Self-Review

**Spec coverage:**
- ✅ DraftPlayerCard compact (140px) — Task 1
- ✅ PickPanel fadingOut — Task 2
- ✅ PickPanel passa player object (não player.id) — Task 2
- ✅ handlePickPlayer aceita player object — Task 3 Step 2
- ✅ Estado otimista com pendingPick — Task 3 Step 2
- ✅ pickedPlayers map para renderização pós-confirmação — Task 3 Step 2
- ✅ Keyframe card-pop — Task 3 Step 3
- ✅ Campo com DraftPlayerCard compact nos slots preenchidos — Task 3 Step 3
- ✅ Placeholders 140px nos slots vazios — Task 3 Step 3
- ✅ Revert otimista em caso de erro de API — Task 3 Step 2
- ✅ overflow-x: auto nas linhas (para formações com 4 na defesa) — Task 3 Step 3

**Placeholder scan:** Sem TODOs, TBDs ou "handle edge cases" — cada step tem código completo.

**Type consistency:**
- `handlePickPlayer(player)` definido em Task 3 Step 2, chamado como `onPickPlayer(player)` em Task 2 ✅
- `pickedPlayers[s.position]` setado com `player` object em Task 3 Step 2, lido em Task 3 Step 3 ✅
- `pendingPick.player` setado em Task 3 Step 2, lido em Task 3 Step 3 ✅
- `fadingOut` definido em Task 2, passado em Task 3 Step 5 ✅
