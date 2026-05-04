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

const POSITION_COLOR_PALETTES = {
  blue: {
    text: '#bfdbfe',
    background: 'rgba(30, 64, 175, 0.82)',
    border: 'rgba(96, 165, 250, 0.5)',
  },
  green: {
    text: '#bbf7d0',
    background: 'rgba(22, 101, 52, 0.82)',
    border: 'rgba(74, 222, 128, 0.45)',
  },
  yellow: {
    text: '#fde68a',
    background: 'rgba(161, 98, 7, 0.82)',
    border: 'rgba(250, 204, 21, 0.45)',
  },
  red: {
    text: '#fecaca',
    background: 'rgba(153, 27, 27, 0.82)',
    border: 'rgba(248, 113, 113, 0.45)',
  },
  neutral: {
    text: '#f9fafb',
    background: 'rgba(2, 6, 23, 0.62)',
    border: 'rgba(255, 255, 255, 0.09)',
  },
};

const POSITION_COLOR_GROUPS = {
  1: 'blue',
  2: 'green',
  3: 'green',
  4: 'green',
  5: 'yellow',
  6: 'yellow',
  7: 'yellow',
  8: 'yellow',
  9: 'yellow',
  10: 'red',
  11: 'red',
  12: 'red',
  13: 'red',
};


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

export function getDetailedPositionPalette(value) {
  const normalizedId = normalizeDetailedPositionId(value);
  const colorGroup = POSITION_COLOR_GROUPS[normalizedId];
  return POSITION_COLOR_PALETTES[colorGroup] || POSITION_COLOR_PALETTES.neutral;
}

export function getPlayerPrimaryDetailedPositionId(player) {
  const normalizedId = normalizeDetailedPositionId(player?.detailed_position_id);
  return Number.isNaN(normalizedId) ? null : normalizedId;
}

export function getPlayerAlternativeDetailedPositionIds(player, limit = 2) {
  const primaryPositionId = getPlayerPrimaryDetailedPositionId(player);
  const alternativePositions = [];

  for (const positionId of player?.alt_positions || []) {
    const normalizedId = normalizeDetailedPositionId(positionId);
    if (!normalizedId || Number.isNaN(normalizedId)) continue;
    if (normalizedId === primaryPositionId) continue;
    if (alternativePositions.includes(normalizedId)) continue;

    alternativePositions.push(normalizedId);
    if (alternativePositions.length >= limit) break;
  }

  return alternativePositions;
}

export function getPlayerEligibleDetailedPositionIds(player, limit = 2) {
  const primaryPositionId = getPlayerPrimaryDetailedPositionId(player);
  if (!primaryPositionId) return [];

  return [primaryPositionId, ...getPlayerAlternativeDetailedPositionIds(player, limit)];
}

export function matchesDetailedPositionSlot(player, slotDetailedPositionId) {
  const normalizedSlotId = normalizeDetailedPositionId(slotDetailedPositionId);

  return getPlayerEligibleDetailedPositionIds(player, 2).includes(normalizedSlotId);
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
