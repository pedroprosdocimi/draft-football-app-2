# PickPanel Redesign — Spec (Sub-projeto 2)

## Goal
Rewrite `src/components/PickPanel.jsx` with the "convocação" card model (Copa do Mundo 2026 identity), preserving all existing logic. Add `.pp-*` CSS to `src/index.css`.

## Files Changed
| Action | File |
|--------|------|
| Append CSS | `src/index.css` |
| Rewrite | `src/components/PickPanel.jsx` |

---

## CSS Block (appended to `src/index.css`)

Add two new tokens to the existing `:root` block:
```css
--line-soft: #1e2530;
--text-4: #4a4f56;
```

Then append a `/* ===== PickPanel =====` block with all `.pp-*` classes (see Section below). **Omit** all `.pp-flag`, `.pp-flag-bra`, `.pp-flag-diamond`, `.pp-flag-sun`, `.pp-flag-dot`, `.pp-flag-cross-*`, `.pp-flag-star` rules — these are replaced by `flag-icons` in the app.

### Classes to include
`.pp-stage`, `.pp-stage.mobile`, `.pp-stage.desktop`, `.pp-stage::after`, `.pp-top`, `.pp-meta`, `.pp-meta .pp-meta-dot`, `.pp-meta .pp-meta-round`, `.pp-close`, `.pp-body`, `.pp-heading`, `.pp-heading.is-in`, `@keyframes pp-title-in`, `.pp-eyebrow`, `.pp-eyebrow .pp-dot`, `.pp-title`, `.pp-subtitle`, `.pp-slot-chip`, `.pp-slot-chip .pp-slot-dot`, `.pp-slot-chip.is-captain`, `.pp-rail-wrap`, `.pp-rail`, `.pp-stage.desktop .pp-rail`, `.pp-stage.desktop .pp-card`, `.pp-burst`, `@keyframes pp-burst`, `.pp-card`, `.pp-card.is-in`, `@keyframes pp-card-in`, `.pp-card:hover`, `.pp-card-stripe`, `.pp-card-header`, `.pp-ovr`, `.pp-ovr-num`, `.pp-ovr-lbl`, `.pp-chip`, `.pp-chip-dot`, `.pp-flag-bg`, `.pp-flag-fill`, `.pp-flag-veil`, `.pp-card-body`, `.pp-photo-wrap`, `.pp-fig`, `.pp-card-foot`, `.pp-name`, `.pp-foot-row`, `.pp-hint`, `.pp-hint kbd`, `.pp-confirm-back`, `@keyframes pp-fadein`, `.pp-confirm`, `@keyframes pp-confirm-in`, `.pp-confirm-eyebrow`, `.pp-confirm-eyebrow .pp-dot`, `.pp-confirm-text`, `.pp-confirm-text strong`, `.pp-confirm-actions`, `.pp-confirm .btn`

**Source:** `C:\Users\pA\Downloads\design_handoff_cartinhas\pickpanel.css` (copy verbatim, skipping flag-only rules listed above).

---

## PickPanel.jsx — New Implementation

### Props (unchanged)
```ts
options: PlayerObject[] | null
slotDetailedPositionId: number | null
slotPosition: number | null
isCaptainPick?: boolean        // default false
onPickPlayer: (player) => void
onClose: () => void
fadingOut?: boolean            // default false
```

### State (same as current)
```js
const [confirmPlayer, setConfirmPlayer] = useState(null);
const [isEntering, setIsEntering] = useState(false);
```
Remove: `selectedCard`, `sidePadding`, `canScrollLeft`, `canScrollRight` (no longer needed — css handles scroll).
Remove: `scrollerRef` and all scroll-arrow logic.

### Logic preserved
```js
// same as current PickPanel
const safeOptions = options || [];
const benchMeta = slotPosition ? BENCH_SLOT_META[slotPosition] : null;
const isBenchSlot = Boolean(benchMeta);
const basicPos = isBenchSlot ? benchMeta.basicPos : (DETAILED_TO_BASIC[slotDetailedPositionId] || 1);
const posLabel = isCaptainPick ? 'CAPITAO'
  : isBenchSlot ? benchMeta.label
  : getDetailedPositionLabel(slotDetailedPositionId);
const normalizedSlotPositionId = Number(slotDetailedPositionId);
const visibleOptions = isCaptainPick || isBenchSlot || isNaN(normalizedSlotPositionId) || normalizedSlotPositionId <= 0
  ? safeOptions
  : safeOptions.filter(p => matchesDetailedPositionSlot(p, normalizedSlotPositionId));

// isEntering animation trigger (same useEffect as current)
useEffect(() => {
  setIsEntering(false);
  const id = requestAnimationFrame(() => setIsEntering(true));
  return () => cancelAnimationFrame(id);
}, [options, slotDetailedPositionId, slotPosition, isCaptainPick]);
```

### New constants (module-level)
```js
// Position accent color — same mapping as DRAFT_DETAIL_TO_LINE in Draft.jsx
const DETAIL_TO_POS_COLOR = {
  1: '#3a86d4',                              // GOL
  2: '#2fa564', 3: '#2fa564', 4: '#2fa564', // DEF
  5: '#f5a623', 6: '#f5a623', 7: '#f5a623', 8: '#f5a623', 9: '#f5a623', // MEIO
  10: '#e0443e', 11: '#e0443e', 12: '#e0443e', 13: '#e0443e',           // ATA
};

// Slot position color — resolved per panel open
// If isCaptainPick → gold (#f5a623)
// Else → DETAIL_TO_POS_COLOR[slotDetailedPositionId] ?? '#f5a623'
```

### Imports
```js
import React, { useEffect, useState } from 'react';
import PlayerFigure, { NATIONAL_KITS } from './PlayerFigure.jsx';
import { nationalityToIso2 } from '../utils/nationality.js';
import { getDetailedPositionLabel, matchesDetailedPositionSlot } from '../utils/positions.js';
```
Remove: `DraftPlayerCard`, `PlayerStatsModal`, `useRef`.

### Helper functions (module-level)
```js
function getSurname(displayName) {
  if (!displayName) return '';
  const parts = displayName.trim().split(/\s+/);
  return (parts[parts.length - 1] || '').toUpperCase().slice(0, 10);
}

function getOvr(player) {
  if (Number.isFinite(player?.avg_score)) return player.avg_score.toFixed(1);
  if (Number.isFinite(player?.score_value)) return player.score_value.toFixed(1);
  return '–';
}
```

### PickPlayerCard sub-component (module-level)
```jsx
function PickPlayerCard({ player, index, total, posColor, onClick }) {
  const iso2 = nationalityToIso2(player?.nationality || '');
  const kit = NATIONAL_KITS[iso2] ?? NATIONAL_KITS['_'];
  const displayName = player?.display_name || player?.name || '';
  const surname = getSurname(displayName);
  const jerseyNumber = player?.jersey_number ?? player?.jersey ?? '';
  const chipLabel = getDetailedPositionLabel(player?.detailed_position_id) || '?';
  const ovr = getOvr(player);

  const mid = Math.floor(total / 2);
  const offset = index - mid;
  const burstX = offset * 54;
  const burstY = Math.abs(offset) % 2 === 0 ? 24 : -24;

  return (
    <button
      className="pp-card is-in"
      onClick={onClick}
      style={{
        '--pos-color': posColor,
        '--burst-x': `${burstX}px`,
        '--burst-y': `${burstY}px`,
        animationDelay: `${index * 72}ms`,
      }}
    >
      <div className="pp-card-stripe" />
      <div className="pp-flag-bg">
        {iso2 && (
          <span
            className={`fi fi-${iso2} pp-flag-fill`}
            style={{ display: 'block', width: '100%', height: '100%', backgroundSize: 'cover', backgroundPosition: 'center' }}
          />
        )}
      </div>
      <div className="pp-flag-veil" />
      <div className="pp-card-body">
        <div className="pp-card-header">
          <div className="pp-ovr">
            <span className="pp-ovr-num">{ovr}</span>
            <span className="pp-ovr-lbl">OVR</span>
          </div>
          <div className="pp-chip">
            <span className="pp-chip-dot" />
            {chipLabel}
          </div>
        </div>
        <div className="pp-photo-wrap">
          <PlayerFigure
            kit={kit}
            number={jerseyNumber}
            surname={surname}
            uid={`pp-${player?.id ?? index}`}
            className="pp-fig"
          />
        </div>
        <div className="pp-card-foot">
          <div className="pp-name">{displayName}</div>
        </div>
      </div>
    </button>
  );
}
```

### Main return (PickPanel)
```jsx
if (!options) return null;

const posColor = isCaptainPick
  ? '#f5a623'
  : (DETAIL_TO_POS_COLOR[slotDetailedPositionId] ?? '#f5a623');

const slotChipLabel = isCaptainPick ? 'CAPITAO'
  : isBenchSlot ? benchMeta.label
  : (posLabel || 'VAGA');

return (
  <div
    className="fixed inset-0 z-50 pp-stage"
    style={{
      opacity: fadingOut ? 0 : 1,
      pointerEvents: fadingOut ? 'none' : 'auto',
      transition: 'opacity 0.3s ease',
    }}
    onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
  >
    {/* Top bar */}
    <div className="pp-top">
      <div className="pp-meta">
        <span>Copa do Mundo</span>
        <span className="pp-meta-dot" />
        <span className="pp-meta-round">2026</span>
        <span className="pp-meta-dot" />
        <span>Fase de Grupos</span>
      </div>
      <button className="pp-close" onClick={onClose} aria-label="Fechar">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>

    {/* Body */}
    <div className="pp-body">
      <div className={`pp-heading${isEntering ? ' is-in' : ''}`}>
        <div className="pp-eyebrow">
          <span className="pp-dot" />
          <span>{isCaptainPick ? 'Decisão de Capitão' : 'Convocação'}</span>
        </div>
        <div className="pp-title">Escale seu craque</div>
        <div className="pp-subtitle">
          <span className={`pp-slot-chip${isCaptainPick ? ' is-captain' : ''}`}>
            <span className="pp-slot-dot" />
            {slotChipLabel}
          </span>
          <span>Estrelas disponíveis para a vaga</span>
        </div>
      </div>

      <div className="pp-rail-wrap">
        {isEntering && <div className="pp-burst" />}
        <div className="pp-rail">
          {visibleOptions.length > 0 ? (
            visibleOptions.map((player, i) => (
              <PickPlayerCard
                key={player.id}
                player={player}
                index={i}
                total={visibleOptions.length}
                posColor={posColor}
                onClick={() => setConfirmPlayer(player)}
              />
            ))
          ) : (
            <div style={{ color: 'var(--text-3)', fontSize: 13, padding: '24px 0', textAlign: 'center', width: '100%' }}>
              Nenhum jogador disponível para essa posição.
            </div>
          )}
        </div>
      </div>

      <div className="pp-hint">
        <span>Arraste para ver mais · toque para escolher</span>
      </div>
    </div>

    {/* Confirm modal */}
    {confirmPlayer && (
      <div className="pp-confirm-back" onClick={() => setConfirmPlayer(null)}>
        <div className="pp-confirm" onClick={(e) => e.stopPropagation()}>
          <div className="pp-confirm-eyebrow">
            <span className="pp-dot" />
            <span>Confirmar convocação</span>
          </div>
          <div className="pp-confirm-text">
            Escalar para o seu time
            <strong>{confirmPlayer.display_name || confirmPlayer.name}</strong>
          </div>
          <div className="pp-confirm-actions">
            <button className="btn btn-ghost" onClick={() => setConfirmPlayer(null)}>Cancelar</button>
            <button className="btn btn-primary" onClick={() => { onPickPlayer(confirmPlayer); setConfirmPlayer(null); }}>Confirmar</button>
          </div>
        </div>
      </div>
    )}
  </div>
);
```

---

## Notes
- `DraftPlayerCard` import removed from PickPanel. **Do NOT delete** `DraftPlayerCard.jsx` — it is used by `Admin.jsx` and `PlayerStatsModal.jsx`.
- `btn`, `btn-ghost`, `btn-primary` classes already exist in `index.css` ✓
- `PlayerFigure.jsx` always outputs `className="fcard-fig {className}"`. Inside `.pp-photo-wrap`, `fcard-fig`'s `position:absolute` must be overridden. Add to the CSS block:
  ```css
  .pp-photo-wrap .fcard-fig {
    position: relative;
    left: auto;
    bottom: auto;
    transform: none;
    width: 100%;
    max-width: 196px;
    height: auto;
  }
  ```
- `--pos-color` is a per-card CSS custom property set via inline style on each `.pp-card`.
