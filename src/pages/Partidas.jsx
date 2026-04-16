import React, { useState, useEffect, useCallback } from 'react';
import { API_URL } from '../config.js';

function authFetch(url, options = {}) {
  const token = localStorage.getItem('draft_token');
  return fetch(url, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...options.headers },
  });
}

const STATUS_PT = {
  NS: 'Não iniciado', TBA: 'A confirmar', PENDING: 'Pendente', DELAYED: 'Atrasado',
  '1st': '1º Tempo', HT: 'Intervalo', '2nd': '2º Tempo', BRK: 'Prorrogação',
  et: 'Prorr. 1T', ETB: 'Intervalo Prorr.', '2et': 'Prorr. 2T',
  PEN: 'Pênaltis', FT: 'Encerrado', AET: 'Prorr.', FTP: 'Pênaltis',
  POST: 'Adiado', SUSP: 'Suspenso', CANC: 'Cancelado', ABAN: 'Abandonado',
};

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' });
}

function TeamBadge({ team, side }) {
  return (
    <div className={`flex flex-col items-center gap-1 w-24 ${side === 'away' ? 'items-end' : 'items-start'}`}>
      {team.badge_url ? (
        <img
          src={team.badge_url}
          alt={team.short_code}
          className="w-10 h-10 object-contain"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      ) : (
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white"
          style={{ background: team.primary_color || '#333' }}
        >
          {team.short_code}
        </div>
      )}
      <span className="text-xs font-semibold text-gray-200 text-center leading-tight">
        {team.short_code}
      </span>
    </div>
  );
}

export default function Partidas({ onBack }) {
  const [data, setData] = useState(null);
  const [round, setRound] = useState(null); // null = load default (active)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback((roundNum) => {
    setLoading(true);
    setError('');
    const url = roundNum ? `${API_URL}/fixtures?round=${roundNum}` : `${API_URL}/fixtures`;
    authFetch(url)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setRound(d.round?.number || 1);
      })
      .catch(() => setError('Erro ao carregar partidas.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(null); }, [load]);

  const goRound = (n) => {
    if (!data || n < 1 || n > data.total_rounds) return;
    setRound(n);
    load(n);
  };

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto px-4 py-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={onBack}
          className="text-xs text-gray-500 hover:text-white transition-colors"
        >
          ← Voltar
        </button>
        <h1 className="text-lg font-bold text-white">Partidas</h1>
      </div>

      {/* Round navigator */}
      <div className="flex items-center justify-between mb-5 bg-gray-900/60 border border-white/8 rounded-2xl px-4 py-3">
        <button
          type="button"
          onClick={() => goRound((round || 1) - 1)}
          disabled={loading || (round || 1) <= 1}
          className="w-8 h-8 flex items-center justify-center rounded-full border border-white/10 text-gray-400 hover:text-white hover:border-white/30 disabled:opacity-30 transition"
        >
          ‹
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-white">
            {data?.round?.name || (round ? `Rodada ${round}` : '—')}
          </p>
          {data?.round?.starts_at && (
            <p className="text-[11px] text-gray-500">{formatDate(data.round.starts_at)}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => goRound((round || 1) + 1)}
          disabled={loading || (round || 1) >= (data?.total_rounds || 38)}
          className="w-8 h-8 flex items-center justify-center rounded-full border border-white/10 text-gray-400 hover:text-white hover:border-white/30 disabled:opacity-30 transition"
        >
          ›
        </button>
      </div>

      {/* Content */}
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-700 border-t-draft-gold" />
        </div>
      )}

      {!loading && error && (
        <p className="text-center text-red-400 text-sm mt-8">{error}</p>
      )}

      {!loading && !error && data && (
        <div className="flex flex-col gap-3">
          {(data.fixtures || []).map((f) => {
            const hasScore = f.home_score != null && f.away_score != null;
            const isLive = ['1st', '2nd', 'HT', 'et', '2et', 'ETB', 'PEN', 'BRK'].includes(f.status);
            return (
              <div
                key={f.id}
                className="flex items-center justify-between bg-gray-900/60 border border-white/8 rounded-2xl px-4 py-3"
              >
                {/* Home */}
                <TeamBadge team={f.home_team} side="home" />

                {/* Score / status */}
                <div className="flex flex-col items-center gap-1 flex-1 px-2">
                  {hasScore ? (
                    <span className="text-2xl font-black text-white tracking-tight">
                      {f.home_score} – {f.away_score}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500 font-medium">vs</span>
                  )}
                  <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                    isLive
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : f.status === 'FT' || f.status === 'AET' || f.status === 'FTP'
                        ? 'text-gray-600'
                        : 'text-gray-500'
                  }`}>
                    {STATUS_PT[f.status] || f.status}
                  </span>
                  {!hasScore && f.starting_at && (
                    <span className="text-[10px] text-gray-600">
                      {formatDate(f.starting_at)}
                    </span>
                  )}
                </div>

                {/* Away */}
                <TeamBadge team={f.away_team} side="away" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
