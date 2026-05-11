import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { API_URL } from '../config.js';

function authFetch(url, options = {}) {
  const token = localStorage.getItem('draft_token');
  return fetch(url, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...options.headers },
  });
}

const STATUS_PT = {
  NS: 'Nao iniciado',
  TBA: 'A confirmar',
  PENDING: 'Pendente',
  DELAYED: 'Atrasado',
  '1st': '1o tempo',
  HT: 'Intervalo',
  '2nd': '2o tempo',
  BRK: 'Prorrogacao',
  et: 'Prorr. 1T',
  ETB: 'Intervalo da prorr.',
  '2et': 'Prorr. 2T',
  PEN: 'Penaltis',
  FT: 'Encerrado',
  AET: 'Prorr.',
  FTP: 'Penaltis',
  POST: 'Adiado',
  SUSP: 'Suspenso',
  CANC: 'Cancelado',
  ABAN: 'Abandonado',
};

function formatDayLabel(iso) {
  if (!iso) return 'Data a confirmar';
  return new Date(iso).toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    timeZone: 'America/Sao_Paulo',
  });
}

function formatRoundDate(iso) {
  if (!iso) return '';
  return new Date(`${iso}T00:00:00`).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'America/Sao_Paulo',
  });
}

function formatTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  });
}

function TeamBadge({ team, side }) {
  return (
    <div className={`flex items-center justify-center w-20 ${side === 'away' ? 'justify-end' : 'justify-start'}`}>
      {team.badge_url ? (
        <img
          src={team.badge_url}
          alt={team.short_code}
          className="w-11 h-11 object-contain"
          onError={(event) => { event.target.style.display = 'none'; }}
        />
      ) : (
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold text-white"
          style={{ background: team.primary_color || '#333' }}
        >
          {team.short_code}
        </div>
      )}
    </div>
  );
}

export default function FixturesBrowser({
  onBack,
  backLabel = '<- Voltar',
  embedded = false,
  initialRoundNumber = null,
}) {
  const [data, setData] = useState(null);
  const [round, setRound] = useState(initialRoundNumber);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback((roundNumber) => {
    setLoading(true);
    setError('');

    const url = roundNumber ? `${API_URL}/fixtures?round=${roundNumber}` : `${API_URL}/fixtures`;

    authFetch(url)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || 'Erro ao carregar partidas.');
        }
        return payload;
      })
      .then((payload) => {
        setData(payload);
        setRound(payload.round?.number || 1);
      })
      .catch((err) => setError(err.message || 'Erro ao carregar partidas.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load(initialRoundNumber);
  }, [initialRoundNumber, load]);

  // Lock body scroll when shown as a full page (not embedded)
  useEffect(() => {
    if (embedded) return undefined;
    const body = document.body;
    const root = document.documentElement;
    const prevBodyOverflow = body.style.overflow;
    const prevRootOverflow = root.style.overflow;
    const prevBodyOverscroll = body.style.overscrollBehaviorY;
    const prevRootOverscroll = root.style.overscrollBehaviorY;
    body.style.overflow = 'hidden';
    root.style.overflow = 'hidden';
    body.style.overscrollBehaviorY = 'none';
    root.style.overscrollBehaviorY = 'none';
    return () => {
      body.style.overflow = prevBodyOverflow;
      root.style.overflow = prevRootOverflow;
      body.style.overscrollBehaviorY = prevBodyOverscroll;
      root.style.overscrollBehaviorY = prevRootOverscroll;
    };
  }, [embedded]);

  const goRound = (targetRound) => {
    if (!data || targetRound < 1 || targetRound > data.total_rounds) return;
    setRound(targetRound);
    load(targetRound);
  };

  const groupedFixtures = useMemo(() => {
    const groups = new Map();

    for (const fixture of data?.fixtures || []) {
      const key = fixture.starting_at ? fixture.starting_at.slice(0, 10) : 'sem-data';
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          label: formatDayLabel(fixture.starting_at),
          fixtures: [],
        });
      }
      groups.get(key).fixtures.push(fixture);
    }

    return Array.from(groups.values());
  }, [data]);

  return (
    <div className={`${embedded ? 'h-full' : 'h-[100dvh]'} overflow-hidden flex flex-col max-w-lg mx-auto px-4 py-4`}>
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={onBack}
          className="text-xs text-gray-500 hover:text-white transition-colors"
        >
          {backLabel}
        </button>
        <h1 className="text-lg font-bold text-white">Partidas</h1>
      </div>

      <div className="flex items-center justify-between mb-5 bg-gray-900/60 border border-white/8 rounded-2xl px-4 py-3">
        <button
          type="button"
          onClick={() => goRound((round || 1) - 1)}
          disabled={loading || (round || 1) <= 1}
          className="w-8 h-8 flex items-center justify-center rounded-full border border-white/10 text-gray-400 hover:text-white hover:border-white/30 disabled:opacity-30 transition"
        >
          {'<'}
        </button>

        <div className="text-center">
          <p className="text-sm font-semibold text-white">
            {data?.round?.name || (round ? `Rodada ${round}` : '---')}
          </p>
          {data?.round?.starts_at && (
            <p className="text-[11px] text-gray-500">{formatRoundDate(data.round.starts_at)}</p>
          )}
        </div>

        <button
          type="button"
          onClick={() => goRound((round || 1) + 1)}
          disabled={loading || (round || 1) >= (data?.total_rounds || 38)}
          className="w-8 h-8 flex items-center justify-center rounded-full border border-white/10 text-gray-400 hover:text-white hover:border-white/30 disabled:opacity-30 transition"
        >
          {'>'}
        </button>
      </div>

      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-700 border-t-draft-gold" />
        </div>
      )}

      {!loading && error && (
        <p className="text-center text-red-400 text-sm mt-8">{error}</p>
      )}

      {!loading && !error && data && groupedFixtures.length === 0 && (
        <div className="mt-8 rounded-2xl border border-white/8 bg-gray-900/60 px-4 py-6 text-center text-sm text-gray-400">
          Nenhuma partida sincronizada para esta rodada ainda.
        </div>
      )}

      {!loading && !error && data && groupedFixtures.length > 0 && (
        <div className="flex flex-col gap-4 flex-1 min-h-0 overflow-y-auto pr-1 pb-2">
          {groupedFixtures.map((group) => (
            <div key={group.key} className="flex flex-col gap-3">
              <div className="px-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                  {group.label}
                </p>
              </div>

              {group.fixtures.map((fixture) => {
                const hasScore = fixture.home_score != null && fixture.away_score != null;
                const isLive = ['1st', '2nd', 'HT', 'et', '2et', 'ETB', 'PEN', 'BRK'].includes(fixture.status);

                return (
                  <div
                    key={fixture.id}
                    className="flex items-center justify-between bg-gray-900/60 border border-white/8 rounded-2xl px-4 py-3"
                  >
                    <TeamBadge team={fixture.home_team} side="home" />

                    <div className="flex flex-col items-center gap-1 flex-1 px-2">
                      <span className="text-[11px] text-gray-500 font-medium">
                        {fixture.starting_at ? formatTime(fixture.starting_at) : 'A definir'}
                      </span>

                      {hasScore ? (
                        <span className="text-2xl font-black text-white tracking-tight">
                          {fixture.home_score} x {fixture.away_score}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500 font-medium">vs</span>
                      )}

                      <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                        isLive
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : fixture.status === 'FT' || fixture.status === 'AET' || fixture.status === 'FTP'
                            ? 'text-gray-600'
                            : 'text-gray-500'
                      }`}>
                        {STATUS_PT[fixture.status] || fixture.status}
                      </span>
                    </div>

                    <TeamBadge team={fixture.away_team} side="away" />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
