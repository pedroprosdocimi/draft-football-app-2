import { useEffect, useState } from 'react';
import PlayerFigure, { NATIONAL_KITS } from './PlayerFigure.jsx';
import { nationalityToIso2 } from '../utils/nationality.js';
import { getDetailedPositionLabel, matchesDetailedPositionSlot } from '../utils/positions.js';

const BENCH_SLOT_META = {
  12: { label: 'GOL RES' },
  13: { label: 'DEF RES' },
  14: { label: 'DEF RES' },
  15: { label: 'M/A RES' },
  16: { label: 'M/A RES' },
  17: { label: 'M/A RES' },
  18: { label: 'M/A RES' },
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
    : (DETAIL_TO_POS_COLOR[normalizedSlotPositionId] ?? '#f5a623');

  const slotChipLabel = posLabel || 'VAGA';

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
