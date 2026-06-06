# PickPanel Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite PickPanel with the "convocação" card model (flag bg + PlayerFigure bonequinho + OVR + name), preserving all pick logic.

**Architecture:** Two tasks — (1) CSS appended to `index.css`, (2) `PickPanel.jsx` rewritten. `DraftPlayerCard` is NOT deleted (used by Admin.jsx and PlayerStatsModal.jsx).

**Tech Stack:** React 18, Vite, Tailwind CSS, flag-icons, Bricolage Grotesque + JetBrains Mono (all loaded), `PlayerFigure.jsx` (already exists from Sub-projeto 1).

**Spec:** `docs/superpowers/specs/2026-06-06-pickpanel-design.md`

---

## Task 1: Append `.pp-*` CSS to `src/index.css`

**Files:**
- Modify: `src/index.css` (append at end)

- [ ] **Step 1: Append the following CSS block at the very end of `src/index.css`**

```css
/* ===== PickPanel — Player Selection Overlay ===== */
:root {
  --line-soft:#1e2530;
  --text-4:#4a4f56;
}

.pp-stage{position:relative;width:100%;height:100%;display:flex;flex-direction:column;overflow:hidden;
  color:var(--text);font-family:'Inter',system-ui,sans-serif;
  background:radial-gradient(1200px 600px at 50% -10%,rgba(26,107,60,.18),transparent 60%),
    radial-gradient(700px 400px at 110% 110%,rgba(245,166,35,.07),transparent 70%),var(--bg-950);}
.pp-stage.mobile{border-radius:36px;padding-top:54px;}
.pp-stage.desktop{border-radius:0;}
.pp-stage::after{content:"";position:absolute;inset:0;
  background:repeating-linear-gradient(90deg,transparent 0 30px,rgba(255,255,255,.012) 30px 60px);
  pointer-events:none;}

.pp-top{position:relative;z-index:10;display:flex;align-items:center;justify-content:space-between;padding:16px 18px 0;}
.pp-stage.desktop .pp-top{padding:22px 28px 0;}
.pp-meta{display:flex;align-items:center;gap:10px;font-size:10px;font-weight:700;
  letter-spacing:.18em;text-transform:uppercase;color:var(--text-3);}
.pp-meta .pp-meta-dot{width:3px;height:3px;border-radius:50%;background:var(--text-4);}
.pp-meta .pp-meta-round{color:var(--gold);font-family:'JetBrains Mono',monospace;}
.pp-close{width:30px;height:30px;border-radius:10px;border:1px solid var(--line-soft);
  background:rgba(255,255,255,.02);color:var(--text-3);display:grid;place-items:center;
  cursor:pointer;transition:all .15s ease;}
.pp-close:hover{color:#fff;border-color:#2e353c;background:rgba(255,255,255,.04);}

.pp-body{position:relative;z-index:5;flex:1;min-height:0;display:flex;flex-direction:column;
  align-items:center;justify-content:center;padding:24px 16px;gap:20px;}
.pp-stage.desktop .pp-body{gap:28px;padding:36px 0;}

.pp-heading{text-align:center;position:relative;z-index:5;display:flex;flex-direction:column;
  align-items:center;gap:10px;}
.pp-heading.is-in{animation:pp-title-in .5s cubic-bezier(.22,1,.36,1) forwards;}
@keyframes pp-title-in{from{transform:translateY(12px);}to{transform:translateY(0);}}
.pp-eyebrow{display:inline-flex;align-items:center;gap:6px;font-size:9.5px;font-weight:700;
  letter-spacing:.16em;text-transform:uppercase;color:var(--green-glow);}
.pp-stage.desktop .pp-eyebrow{font-size:11px;}
.pp-eyebrow .pp-dot{width:6px;height:6px;border-radius:50%;background:var(--green-glow);
  box-shadow:0 0 0 0 rgba(70,201,122,.7);animation:pulse 1.8s infinite;}
@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(70,201,122,.7);}50%{box-shadow:0 0 0 6px rgba(70,201,122,0);}}
.pp-title{font-family:'Bricolage Grotesque',sans-serif;font-weight:800;font-size:28px;
  letter-spacing:-.025em;color:#fff;line-height:1;white-space:nowrap;}
.pp-stage.desktop .pp-title{font-size:44px;}
.pp-subtitle{font-size:12px;color:var(--text-2);letter-spacing:.04em;
  display:inline-flex;align-items:center;gap:8px;}
.pp-stage.desktop .pp-subtitle{font-size:14px;}
.pp-slot-chip{display:inline-flex;align-items:center;gap:6px;height:22px;padding:0 9px;
  border-radius:999px;background:rgba(70,201,122,.14);border:1px solid rgba(70,201,122,.3);
  color:var(--green-glow);font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;
  letter-spacing:.06em;text-transform:uppercase;}
.pp-slot-chip .pp-slot-dot{width:6px;height:6px;border-radius:50%;background:var(--pos-color,var(--green-glow));}
.pp-slot-chip.is-captain{background:rgba(245,166,35,.14);border-color:rgba(245,166,35,.35);color:var(--gold);}
.pp-slot-chip.is-captain .pp-slot-dot{background:var(--gold);}

.pp-rail-wrap{position:relative;width:100%;}
.pp-rail{display:flex;gap:16px;overflow-x:auto;padding:24px 18px;
  scroll-snap-type:x mandatory;scrollbar-width:none;justify-content:flex-start;}
.pp-rail::-webkit-scrollbar{display:none;}
.pp-stage.desktop .pp-rail{justify-content:center;overflow-x:auto;flex-wrap:nowrap;gap:14px;padding:24px;}
.pp-stage.desktop .pp-card{--card-w:234px;--card-h:352px;}

.pp-burst{position:absolute;left:50%;top:50%;width:380px;height:380px;border-radius:50%;
  background:radial-gradient(circle,rgba(245,166,35,.20) 0%,rgba(245,166,35,.08) 28%,rgba(245,166,35,.02) 48%,transparent 72%);
  transform:translate(-50%,-50%);pointer-events:none;
  animation:pp-burst .8s cubic-bezier(.22,1,.36,1) forwards;}
@keyframes pp-burst{
  0%{opacity:0;transform:translate(-50%,-50%) scale(.4);}
  100%{opacity:.45;transform:translate(-50%,-50%) scale(1.6);}}

.pp-card{--card-w:230px;--card-h:332px;flex:0 0 var(--card-w);width:var(--card-w);height:var(--card-h);
  scroll-snap-align:start;position:relative;border-radius:18px;
  background:radial-gradient(130% 80% at 50% -6%,color-mix(in oklab,var(--pos-color) 18%,transparent),transparent 58%),
    linear-gradient(180deg,rgba(255,255,255,.03),rgba(255,255,255,.006));
  border:1px solid var(--line-soft);overflow:hidden;cursor:pointer;
  transition:transform .25s ease,border-color .2s ease,box-shadow .25s ease;
  text-align:left;padding:0;font-family:inherit;color:inherit;display:flex;flex-direction:column;}
.pp-card.is-in{animation:pp-card-in .5s cubic-bezier(.22,1,.36,1) forwards;}
@keyframes pp-card-in{0%{transform:translateY(10px);}100%{transform:translateY(0);}}
.pp-card:hover{transform:translateY(-4px) scale(1.02);
  border-color:color-mix(in oklab,var(--pos-color) 50%,transparent);
  box-shadow:0 0 0 1px color-mix(in oklab,var(--pos-color) 30%,transparent) inset,
    0 24px 50px -16px rgba(0,0,0,.7),0 0 60px -10px color-mix(in oklab,var(--pos-color) 28%,transparent);}

.pp-card-stripe{position:absolute;top:0;left:0;right:0;height:3px;background:var(--pos-color);z-index:5;}
.pp-card-header{position:relative;z-index:5;display:flex;align-items:center;justify-content:space-between;padding:0 0 6px;gap:8px;}
.pp-ovr{display:inline-flex;align-items:baseline;gap:4px;}
.pp-ovr-num{font-family:'JetBrains Mono',monospace;font-weight:700;font-size:22px;line-height:1;
  letter-spacing:-.03em;color:var(--pos-color);}
.pp-stage.desktop .pp-ovr-num{font-size:25px;}
.pp-ovr-lbl{font-family:'JetBrains Mono',monospace;font-size:8.5px;font-weight:700;
  letter-spacing:.14em;color:var(--text-4);}
.pp-chip{display:inline-flex;align-items:center;gap:5px;height:22px;padding:0 8px;border-radius:6px;
  background:rgba(0,0,0,.45);border:1px solid color-mix(in oklab,var(--pos-color) 55%,transparent);
  font-family:'JetBrains Mono',monospace;font-weight:700;font-size:10px;letter-spacing:.08em;
  text-transform:uppercase;color:#fff;}
.pp-chip-dot{width:6px;height:6px;border-radius:50%;background:var(--pos-color);}

.pp-flag-bg{position:absolute;inset:0;z-index:0;opacity:.55;pointer-events:none;}
.pp-flag-fill{position:absolute;inset:0;width:100%;height:100%;aspect-ratio:auto;border-radius:0;box-shadow:none;}
.pp-flag-veil{position:absolute;inset:0;z-index:1;pointer-events:none;
  background:radial-gradient(120% 78% at 50% 66%,rgba(8,10,8,.16),rgba(8,10,8,.58) 80%),
    linear-gradient(180deg,rgba(8,10,8,.22) 0%,rgba(8,10,8,.05) 28%,rgba(8,10,8,.82) 100%);}

.pp-card-body{position:relative;z-index:3;flex:1;min-height:0;display:flex;flex-direction:column;padding:12px 12px 14px;}
.pp-photo-wrap{position:relative;flex:1;min-height:0;display:grid;place-items:center;margin:2px 0;}
.pp-photo-wrap .fcard-fig{position:relative;left:auto;bottom:auto;transform:none;
  width:100%;max-width:196px;height:auto;z-index:auto;}
.pp-stage.desktop .pp-photo-wrap .fcard-fig{max-width:212px;}

.pp-card-foot{position:relative;display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;}
.pp-name{font-family:'Bricolage Grotesque',sans-serif;font-weight:800;font-size:21px;
  letter-spacing:-.02em;color:#fff;line-height:1;white-space:nowrap;overflow:hidden;
  text-overflow:ellipsis;max-width:100%;text-shadow:0 2px 14px rgba(0,0,0,.55);}
.pp-stage.desktop .pp-name{font-size:23px;}

.pp-hint{text-align:center;font-size:11px;color:var(--text-4);letter-spacing:.06em;
  display:flex;align-items:center;justify-content:center;gap:8px;}
.pp-hint kbd{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:600;
  padding:2px 6px;border-radius:4px;background:rgba(255,255,255,.05);
  border:1px solid var(--line-soft);color:var(--text-2);}

.pp-confirm-back{position:absolute;inset:0;background:rgba(0,0,0,.65);
  backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);z-index:80;
  display:flex;align-items:center;justify-content:center;padding:24px;
  animation:pp-fadein .2s ease;}
@keyframes pp-fadein{from{opacity:0;}to{opacity:1;}}
.pp-confirm{width:100%;max-width:360px;border-radius:20px;
  background:radial-gradient(800px 400px at 50% 0%,rgba(26,107,60,.18),transparent 60%),var(--bg-900);
  border:1px solid var(--line);padding:22px;box-shadow:0 30px 80px -20px rgba(0,0,0,.9);
  animation:pp-confirm-in .35s cubic-bezier(.22,1,.36,1) forwards;}
@keyframes pp-confirm-in{
  from{opacity:0;transform:translateY(20px) scale(.95);}
  to{opacity:1;transform:translateY(0) scale(1);}}
.pp-confirm-eyebrow{font-size:9.5px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;
  color:var(--green-glow);text-align:center;display:inline-flex;align-items:center;
  gap:6px;justify-content:center;width:100%;}
.pp-confirm-eyebrow .pp-dot{width:6px;height:6px;border-radius:50%;background:var(--green-glow);}
.pp-confirm-text{margin-top:12px;text-align:center;font-size:13px;font-weight:500;
  color:var(--text-2);line-height:1.4;}
.pp-confirm-text strong{display:block;margin-top:6px;font-family:'Bricolage Grotesque',sans-serif;
  font-weight:800;font-size:24px;letter-spacing:-.025em;color:#fff;}
.pp-confirm-actions{margin-top:22px;display:grid;grid-template-columns:1fr 1.4fr;gap:10px;}
.pp-confirm .btn{padding:13px 14px;font-size:13px;}
```

- [ ] **Step 2: Verificar que o bloco foi adicionado corretamente**

Abra `src/index.css` e confirme que o bloco termina com `.pp-confirm .btn{padding:13px 14px;font-size:13px;}`.

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "style: add PickPanel CSS classes to index.css"
```

---

## Task 2: Rewrite `src/components/PickPanel.jsx`

**Files:**
- Modify: `src/components/PickPanel.jsx` (complete rewrite)

**Context:** Current file (296 lines) imports `DraftPlayerCard` and uses a complex scroll system. The new version uses `.pp-*` CSS classes, `PlayerFigure` bonequinho, and `flag-icons`. Do NOT delete `DraftPlayerCard.jsx` — it is used by `Admin.jsx` and `PlayerStatsModal.jsx`.

- [ ] **Step 1: Replace the entire file with the following content**

```jsx
import { useEffect, useState } from 'react';
import PlayerFigure, { NATIONAL_KITS } from './PlayerFigure.jsx';
import { nationalityToIso2 } from '../utils/nationality.js';
import { getDetailedPositionLabel, matchesDetailedPositionSlot } from '../utils/positions.js';

const DETAILED_TO_BASIC = {
  1:1, 2:2, 3:2, 4:2, 5:3, 6:3, 7:3, 8:3, 9:3, 10:4, 11:4, 12:4, 13:4,
};

const BENCH_SLOT_META = {
  12: { label: 'GOL RES', basicPos: 1 },
  13: { label: 'DEF RES', basicPos: 2 },
  14: { label: 'DEF RES', basicPos: 2 },
  15: { label: 'M/A RES', basicPos: 3 },
  16: { label: 'M/A RES', basicPos: 3 },
  17: { label: 'M/A RES', basicPos: 3 },
  18: { label: 'M/A RES', basicPos: 3 },
};

const DETAIL_TO_POS_COLOR = {
  1:  '#3a86d4',
  2:  '#2fa564', 3:  '#2fa564', 4:  '#2fa564',
  5:  '#f5a623', 6:  '#f5a623', 7:  '#f5a623', 8:  '#f5a623', 9:  '#f5a623',
  10: '#e0443e', 11: '#e0443e', 12: '#e0443e', 13: '#e0443e',
};

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
          />
        </div>
        <div className="pp-card-foot">
          <div className="pp-name">{displayName}</div>
        </div>
      </div>
    </button>
  );
}

export default function PickPanel({
  options,
  slotDetailedPositionId,
  slotPosition = null,
  isCaptainPick = false,
  onPickPlayer,
  onClose,
  fadingOut = false,
}) {
  const [confirmPlayer, setConfirmPlayer] = useState(null);
  const [isEntering, setIsEntering] = useState(false);

  const safeOptions = options || [];
  const benchMeta = slotPosition ? BENCH_SLOT_META[slotPosition] : null;
  const isBenchSlot = Boolean(benchMeta);
  const basicPos = isBenchSlot ? benchMeta.basicPos : (DETAILED_TO_BASIC[slotDetailedPositionId] || 1);  // eslint-disable-line no-unused-vars
  const posLabel = isCaptainPick
    ? 'CAPITAO'
    : isBenchSlot
      ? benchMeta.label
      : getDetailedPositionLabel(slotDetailedPositionId);
  const normalizedSlotPositionId = Number(slotDetailedPositionId);
  const visibleOptions = isCaptainPick || isBenchSlot || Number.isNaN(normalizedSlotPositionId) || normalizedSlotPositionId <= 0
    ? safeOptions
    : safeOptions.filter((p) => matchesDetailedPositionSlot(p, normalizedSlotPositionId));

  const posColor = isCaptainPick
    ? '#f5a623'
    : (DETAIL_TO_POS_COLOR[slotDetailedPositionId] ?? '#f5a623');

  const slotChipLabel = isCaptainPick
    ? 'CAPITAO'
    : isBenchSlot
      ? benchMeta.label
      : (posLabel || 'VAGA');

  useEffect(() => {
    setIsEntering(false);
    const id = requestAnimationFrame(() => setIsEntering(true));
    return () => cancelAnimationFrame(id);
  }, [options, slotDetailedPositionId, slotPosition, isCaptainPick]);

  if (!options) return null;

  return (
    <div
      className="fixed inset-0 z-50 pp-stage"
      style={{
        opacity: fadingOut ? 0 : 1,
        pointerEvents: fadingOut ? 'none' : 'auto',
        transition: 'opacity 0.3s ease',
      }}
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
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
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
}
```

- [ ] **Step 2: Verificar build sem erros**

```bash
npx vite build 2>&1 | head -40
```

Expected: `✓ built in Xs` sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/components/PickPanel.jsx
git commit -m "feat: rewrite PickPanel with convocacao card model"
```
