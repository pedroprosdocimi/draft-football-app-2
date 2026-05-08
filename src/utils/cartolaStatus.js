export const CARTOLA_STATUS = {
  0: { label: null, name: null, tone: 'neutral' },
  2: { label: 'DUV', name: 'Duvida', tone: 'warning' },
  3: { label: 'SUS', name: 'Suspenso', tone: 'danger' },
  5: { label: 'CONT', name: 'Contundido', tone: 'danger' },
  6: { label: 'NULO', name: 'Nulo', tone: 'neutral' },
  7: { label: 'PROV', name: 'Provavel', tone: 'ok' },
};

const TONES = {
  ok: {
    background: 'rgba(16, 185, 129, 0.18)',
    border: 'rgba(16, 185, 129, 0.38)',
    text: '#6ee7b7',
  },
  warning: {
    background: 'rgba(245, 158, 11, 0.18)',
    border: 'rgba(245, 158, 11, 0.38)',
    text: '#fcd34d',
  },
  danger: {
    background: 'rgba(239, 68, 68, 0.18)',
    border: 'rgba(239, 68, 68, 0.38)',
    text: '#fca5a5',
  },
  neutral: {
    background: 'rgba(148, 163, 184, 0.12)',
    border: 'rgba(148, 163, 184, 0.26)',
    text: '#e2e8f0',
  },
};

export function getCartolaStatusMeta(statusId) {
  const id = Number(statusId) || 0;
  const entry = CARTOLA_STATUS[id] || CARTOLA_STATUS[0];
  const tone = TONES[entry.tone] || TONES.neutral;
  return { id, ...entry, ...tone };
}

