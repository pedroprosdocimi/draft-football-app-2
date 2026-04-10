# Draft — Campo de Cartas e Animação de Pick

## Goal

Ao escolher uma carta no PickPanel, o overlay faz fade-out e a carta aparece no slot correto do campo com uma animação de pop. O campo da formação exibe cartas no formato DraftPlayerCard (variante compacta, 140px) em vez de mini-boxes.

## Architecture

Dois eixos de mudança independentes:

1. **DraftPlayerCard** ganha prop `compact` que reduz as dimensões para 140px sem mudar a estrutura visual.
2. **Draft.jsx** é redesenhado para: (a) mostrar cartas compactas nos slots preenchidos e placeholders do mesmo tamanho nos slots vazios; (b) gerenciar estado de animação otimista — a carta fica visível no slot imediatamente após o clique, antes da confirmação da API.

O PickPanel recebe prop `fadingOut` para executar o fade-out de 300ms antes de ser desmontado.

## Tech Stack

React (sem libs externas de animação) — CSS transitions + keyframes nativos.

---

## Spec

### 1. DraftPlayerCard — prop `compact`

```jsx
<DraftPlayerCard player={player} compact />
```

Quando `compact={true}`:

| Propriedade | Normal | Compact |
|---|---|---|
| Largura total | 210px | 140px |
| Altura seção superior (jersey) | 120px | 80px |
| Padding seção inferior | 8px 12px 17px | 6px 8px 12px |
| Font nome do jogador | 15px | 11px |
| Font score (topo-esquerdo) | 26px | 18px |
| Font minutos/partidas | 14px | 10px |
| Font posição (topo-esquerdo) | 20px | 14px |
| Font atributos label | 14px | 10px |
| Font atributos valor | 15px | 11px |
| Largura atributo label (`width`) | 34px | 24px |
| Largura atributo valor (`width`) | 36px | 26px |
| Largura flag | 28px | 20px |
| Jersey SVG width | 108px | 72px |

Todas as outras propriedades (cores, bordas, estrutura JSX) permanecem iguais.

O prop `isMyTurn` e `onClick` continuam funcionando normalmente na versão compacta.

### 2. PickPanel — prop `fadingOut`

```jsx
<PickPanel fadingOut={isAnimatingOut} ... />
```

Quando `fadingOut={true}`, o overlay aplica:
```css
opacity: 0;
pointer-events: none;
transition: opacity 0.3s ease;
```

O componente em si não se desmonta — Draft.jsx controla o unmount após 300ms.

### 3. Draft.jsx — estado de animação

Novos estados adicionados:

```js
const [pendingPick, setPendingPick] = useState(null);
// { player: PlayerObject, slotPosition: number }

const [isAnimatingOut, setIsAnimatingOut] = useState(false);

const [poppingSlot, setPoppingSlot] = useState(null);
// slotPosition do slot que acabou de receber carta (para aplicar pop)
```

### 4. Draft.jsx — fluxo de pick

Substituição de `handlePickPlayer`:

```js
const handlePickPlayer = async (player) => {
  // 1. Inicia fade-out do overlay
  setIsAnimatingOut(true);

  // 2. Após 300ms, desmonta overlay e exibe carta otimista no slot
  setTimeout(() => {
    setOptions(null);
    setIsAnimatingOut(false);
    setPendingPick({ player, slotPosition: activeSlot });
    setPoppingSlot(activeSlot);
    setActiveSlot(null);
    // Remove classe de pop após animação terminar
    setTimeout(() => setPoppingSlot(null), 500);
  }, 300);

  // 3. Chama API em paralelo
  setLoading(true);
  try {
    const res = await authFetch(`${API_URL}/drafts/${draftId}/picks`, {
      method: 'POST',
      body: JSON.stringify({ player_id: player.id, slot_position: activeSlot }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setPendingPick(null);
    await loadDraft();
  } catch (e) {
    setError(e.message);
    setPendingPick(null);  // reverte UI otimista em caso de erro
  } finally {
    setLoading(false);
  }
};
```

**Nota:** `handlePickPlayer` recebe o objeto `player` completo (não só o ID) para renderização otimista. `PickPanel` passa `player` (não `player.id`) para `onPickPlayer`.

### 5. Draft.jsx — renderização dos slots

A lógica de lookup do slot preenchido passa a considerar também `pendingPick`:

```js
// Para cada slot, resolve o "pick" a exibir:
const resolvedPick = picksBySlot[s.position]
  ?? (pendingPick?.slotPosition === s.position ? pendingPick : null);
```

Slots preenchidos renderizam:
```jsx
<div
  key={s.position}
  style={poppingSlot === s.position ? { animation: 'card-pop 0.45s cubic-bezier(0.34,1.56,0.64,1) both' } : {}}
>
  <DraftPlayerCard
    player={resolvedPick.player ?? resolvedPick}  // pendingPick.player ou pick do draft
    compact
    isMyTurn={false}
  />
</div>
```

Slots vazios renderizam um placeholder com as mesmas dimensões de `DraftPlayerCard compact` (140px × ~180px):
```jsx
<button
  onClick={() => handleSlotClick(s.position)}
  style={{ width: 140, minHeight: 180, borderRadius: 10, border: '2px dashed ...', ... }}
>
  <span>{posLabel}</span>
  <span>+</span>
</button>
```

### 6. Keyframe de pop

Adicionado via `<style>` tag no JSX de Draft.jsx (ou inline via `document`):

```css
@keyframes card-pop {
  0%   { transform: scale(0.3); opacity: 0; }
  60%  { transform: scale(1.08); opacity: 1; }
  100% { transform: scale(1);   opacity: 1; }
}
```

### 7. Campo — layout após mudança

O campo (`bg-green-950/40`) passa a ter `overflow-x: auto` para acomodar linhas com muitas posições (ex: 4 zagueiros em 4-4-2). Cada linha é um `flex-row gap-3 justify-center`. O scroll vertical permanece da página.

### 8. O que NÃO muda

- Fase de bench: continua mostrando os mini-cards de texto simples (BENCH_SLOTS)
- Fase de capitão: sem alterações
- Fase de formação: sem alterações
- PlayerStatsModal: sem alterações
- Admin: sem alterações

---

## Fluxo completo (sequência)

```
usuário clica carta no PickPanel
  → isAnimatingOut = true  (PickPanel faz fade-out 300ms)
  → authFetch POST /picks  (paralelo)
  ← 300ms depois:
      options = null, isAnimatingOut = false
      pendingPick = { player, slotPosition }
      poppingSlot = slotPosition
      campo renderiza DraftPlayerCard compact com animação pop
  ← 500ms depois:
      poppingSlot = null
  ← API responde OK:
      pendingPick = null
      loadDraft() → picks atualizado → campo estável
  ← API responde erro:
      pendingPick = null (carta desaparece)
      error exibido
```
