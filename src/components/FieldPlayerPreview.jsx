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
