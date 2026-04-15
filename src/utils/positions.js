export const ATTACK_POSITION_ID = 10;
export const SECOND_STRIKER_POSITION_ID = 13;

export const DETAILED_LABELS = {
  1: 'GOL',
  2: 'ZAG',
  3: 'LD',
  4: 'LE',
  5: 'VOL',
  6: 'MC',
  7: 'MEI',
  8: 'ME',
  9: 'MD',
  10: 'ATA',
  11: 'PE',
  12: 'PD',
  13: 'ATA',
};

export const DETAILED_POSITION_FILTER_OPTIONS = [
  { id: 1, label: 'Goleiro' },
  { id: 2, label: 'Zagueiro Central' },
  { id: 3, label: 'Lateral Direito' },
  { id: 4, label: 'Lateral Esquerdo' },
  { id: 5, label: 'Volante' },
  { id: 6, label: 'Meio-campista Central' },
  { id: 7, label: 'Meia Atacante' },
  { id: 8, label: 'Meia Esquerda' },
  { id: 9, label: 'Meia Direita' },
  { id: 10, label: 'Atacante' },
  { id: 11, label: 'Ponta Esquerda' },
  { id: 12, label: 'Ponta Direita' },
];

// Positions that are mirror images of each other — should not appear
// as alternatives for one another (e.g. right back should not list left back as alt).
const MIRROR_PAIRS = [
  [3, 4],   // LD ↔ LE
  [8, 9],   // ME ↔ MD
  [11, 12], // PE ↔ PD
];

export function filterMirrorAltPositions(primaryId, altIds) {
  const primary = Number(primaryId);
  const mirrorOfPrimary = MIRROR_PAIRS.find((pair) => pair.includes(primary))
    ?.find((id) => id !== primary) ?? null;
  if (mirrorOfPrimary === null) return altIds;
  return altIds.filter((id) => Number(id) !== mirrorOfPrimary);
}

export function normalizeDetailedPositionId(value) {
  const positionId = Number(value);
  if (positionId === SECOND_STRIKER_POSITION_ID) {
    return ATTACK_POSITION_ID;
  }
  return positionId;
}

export function getDetailedPositionLabel(value) {
  const normalizedId = normalizeDetailedPositionId(value);
  return DETAILED_LABELS[normalizedId] || DETAILED_LABELS[Number(value)] || '?';
}

export function matchesDetailedPositionSlot(player, slotDetailedPositionId) {
  const normalizedSlotId = normalizeDetailedPositionId(slotDetailedPositionId);
  const primaryPositionId = Number(player?.detailed_position_id);

  if (normalizedSlotId === 6) {
    return primaryPositionId === 6;
  }

  const allPositions = [primaryPositionId, ...(player?.alt_positions || [])]
    .map((positionId) => normalizeDetailedPositionId(positionId));

  return allPositions.includes(normalizedSlotId);
}

export function normalizeDetailedPositionText(text) {
  if (!text) return text;

  const normalizedParts = String(text)
    .split(/\s*\/\s*/)
    .map((part) => {
      if (part === 'Centroavante' || part === 'Segundo Atacante' || part === 'CA' || part === 'SA') {
        return 'ATA';
      }
      return part;
    })
    .filter(Boolean);

  return [...new Set(normalizedParts)].join(' / ');
}

export function buildCanonicalPositionWeightsMap(weights = []) {
  const sortedWeights = [...weights].sort((a, b) => {
    const normalizedDiff = normalizeDetailedPositionId(a.detailed_position_id) - normalizeDetailedPositionId(b.detailed_position_id);
    if (normalizedDiff !== 0) return normalizedDiff;

    const priorityA = Number(a.detailed_position_id) === ATTACK_POSITION_ID ? 0 : 1;
    const priorityB = Number(b.detailed_position_id) === ATTACK_POSITION_ID ? 0 : 1;
    if (priorityA !== priorityB) return priorityA - priorityB;

    return String(a.stat_name).localeCompare(String(b.stat_name));
  });

  const map = {};
  for (const weight of sortedWeights) {
    const normalizedId = normalizeDetailedPositionId(weight.detailed_position_id);
    if (!map[normalizedId]) map[normalizedId] = {};
    if (map[normalizedId][weight.stat_name] !== undefined) continue;
    map[normalizedId][weight.stat_name] = weight.weight;
  }

  return map;
}
