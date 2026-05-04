import React, { useEffect, useMemo, useState } from 'react';
import { API_URL } from '../config.js';

function authHeaders() {
  const token = localStorage.getItem('draft_token');
  return { Authorization: `Bearer ${token}` };
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

const CARTOLA_POS = {
  1: 'GOL',
  2: 'LAT',
  3: 'ZAG',
  4: 'MEI',
  5: 'ATA',
  6: 'TEC',
};

export default function CartolaMappingPanel() {
  const [teams, setTeams] = useState([]);
  const [teamId, setTeamId] = useState('');
  const [players, setPlayers] = useState([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);

  const [cartolaPlayers, setCartolaPlayers] = useState([]);
  const [loadingCartola, setLoadingCartola] = useState(false);
  const [cartolaSearch, setCartolaSearch] = useState('');
  const [onlyProbables, setOnlyProbables] = useState(true);
  const [selectedCartola, setSelectedCartola] = useState(null);

  const [localEdits, setLocalEdits] = useState({}); // { playerId: string }
  const [savingId, setSavingId] = useState(null);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/admin/teams`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => setTeams(data.data || []))
      .catch(() => setTeams([]));
  }, []);

  const loadTeamPlayers = async (tid) => {
    if (!tid) return;
    setLoadingPlayers(true);
    setMsg(null);
    try {
      const res = await fetch(`${API_URL}/admin/players?team_id=${tid}`, { headers: authHeaders() });
      const data = await res.json();
      setPlayers(data.data || []);
      setLocalEdits({});
    } catch {
      setPlayers([]);
    } finally {
      setLoadingPlayers(false);
    }
  };

  const loadCartolaMarket = async () => {
    setLoadingCartola(true);
    setMsg(null);
    try {
      const res = await fetch(`${API_URL}/admin/cartola/market-players`, { headers: authHeaders() });
      const data = await res.json();
      setCartolaPlayers(data.data || []);
    } catch {
      setCartolaPlayers([]);
    } finally {
      setLoadingCartola(false);
    }
  };

  useEffect(() => {
    if (!teamId) return;
    loadTeamPlayers(teamId);
  }, [teamId]);

  useEffect(() => {
    loadCartolaMarket();
  }, []);

  const filteredCartola = useMemo(() => {
    const q = normalizeText(cartolaSearch);
    return (cartolaPlayers || [])
      .filter((p) => (onlyProbables ? Number(p.status_id) === 7 : true))
      .filter((p) => {
        if (!q) return true;
        return (
          normalizeText(p.apelido).includes(q) ||
          normalizeText(p.nome).includes(q) ||
          String(p.atleta_id || '').includes(q)
        );
      })
      .slice(0, 250);
  }, [cartolaPlayers, cartolaSearch, onlyProbables]);

  const handleApplySelectedToPlayer = (playerId) => {
    if (!selectedCartola) return;
    setLocalEdits((prev) => ({ ...prev, [playerId]: String(selectedCartola.atleta_id) }));
  };

  const handleSave = async (playerId) => {
    const raw = localEdits[playerId];
    const value = raw == null ? '' : String(raw).trim();
    const cartolaId = value === '' ? null : Number(value);
    if (cartolaId !== null && (!Number.isFinite(cartolaId) || cartolaId <= 0)) {
      setMsg('cartola_id invalido.');
      return;
    }

    setSavingId(playerId);
    setMsg(null);
    try {
      const res = await fetch(`${API_URL}/admin/players/${playerId}/cartola-id`, {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartola_id: cartolaId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao salvar.');

      setPlayers((prev) =>
        prev.map((p) => (p.id === playerId ? { ...p, cartola_id: cartolaId } : p)),
      );
      setLocalEdits((prev) => {
        const copy = { ...prev };
        delete copy[playerId];
        return copy;
      });
      setMsg('Salvo.');
    } catch (err) {
      setMsg(err.message);
    } finally {
      setSavingId(null);
    }
  };

  const handleClear = (playerId) => {
    setLocalEdits((prev) => ({ ...prev, [playerId]: '' }));
  };

  return (
    <div className="card mt-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-white mb-1">Mapeamento Cartola</h2>
          <p className="text-sm text-gray-400">
            Vincule manualmente o <span className="text-white font-semibold">cartola_id</span> nos jogadores do nosso banco.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={loadCartolaMarket}
            className="rounded-lg border border-gray-800 bg-gray-800/40 px-3 py-2 text-xs font-semibold text-gray-200 hover:bg-gray-800/70"
            disabled={loadingCartola}
          >
            {loadingCartola ? 'Atualizando...' : 'Atualizar Cartola'}
          </button>
        </div>
      </div>

      {msg && (
        <div className="mt-3 rounded-lg border border-gray-800 bg-gray-800/40 px-3 py-2 text-xs text-gray-200">
          {msg}
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Jogadores (nosso banco)</p>
              <p className="text-sm text-white">Escolha um time e preencha o cartola_id.</p>
            </div>

            <select
              className="input-field"
              style={{ minWidth: 220 }}
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
            >
              <option value="">Selecione um time</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.short_code ? `${t.short_code} - ` : ''}
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-3">
            {loadingPlayers && (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-700 border-t-draft-gold" />
                Carregando jogadores...
              </div>
            )}

            {!loadingPlayers && teamId && players.length === 0 && (
              <div className="text-xs text-gray-500">Nenhum jogador encontrado para este time.</div>
            )}

            {!teamId && <div className="text-xs text-gray-500">Selecione um time para listar jogadores.</div>}

            {players.length > 0 && (
              <div className="mt-2 space-y-2">
                {players.map((p) => {
                  const editVal = localEdits[p.id];
                  const value = editVal != null ? editVal : p.cartola_id != null ? String(p.cartola_id) : '';
                  return (
                    <div key={p.id} className="rounded-lg border border-gray-800 bg-gray-800/30 px-3 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{p.display_name || p.name}</p>
                          <p className="text-xs text-gray-500 truncate">
                            {p.position_name || '-'} {p.detailed_position_name ? `• ${p.detailed_position_name}` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            className="input-field"
                            style={{ width: 110 }}
                            inputMode="numeric"
                            placeholder="cartola_id"
                            value={value}
                            onChange={(e) => setLocalEdits((prev) => ({ ...prev, [p.id]: e.target.value }))}
                          />
                          <button
                            type="button"
                            onClick={() => handleApplySelectedToPlayer(p.id)}
                            disabled={!selectedCartola}
                            className="rounded-lg border border-gray-800 bg-gray-900/40 px-2.5 py-2 text-xs font-semibold text-gray-200 hover:bg-gray-800/70 disabled:opacity-40"
                            title={selectedCartola ? `Usar atleta_id ${selectedCartola.atleta_id}` : 'Selecione um jogador do Cartola ao lado'}
                          >
                            Usar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSave(p.id)}
                            disabled={savingId === p.id}
                            className="rounded-lg bg-draft-gold px-3 py-2 text-xs font-semibold text-black hover:bg-yellow-300 disabled:opacity-60"
                          >
                            {savingId === p.id ? 'Salvando...' : 'Salvar'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleClear(p.id)}
                            className="rounded-lg border border-gray-800 bg-gray-900/40 px-2.5 py-2 text-xs font-semibold text-gray-200 hover:bg-gray-800/70"
                            title="Limpar (seta NULL)"
                          >
                            Limpar
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cartola (mercado)</p>
              <p className="text-sm text-white">Busque e selecione um atleta para aplicar o ID.</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <label className="flex items-center gap-2 text-xs text-gray-400">
                <input
                  type="checkbox"
                  checked={onlyProbables}
                  onChange={(e) => setOnlyProbables(e.target.checked)}
                />
                Somente provaveis
              </label>
              <input
                className="input-field"
                style={{ width: 220 }}
                placeholder="Buscar por nome, apelido ou ID..."
                value={cartolaSearch}
                onChange={(e) => setCartolaSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-3">
            {loadingCartola && (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-700 border-t-draft-gold" />
                Carregando Cartola...
              </div>
            )}

            {!loadingCartola && filteredCartola.length === 0 && (
              <div className="text-xs text-gray-500">Nenhum atleta encontrado.</div>
            )}

            {filteredCartola.length > 0 && (
              <div className="mt-2 max-h-[520px] overflow-y-auto space-y-2 pr-1">
                {filteredCartola.map((p) => {
                  const isSelected = selectedCartola?.atleta_id === p.atleta_id;
                  return (
                    <button
                      key={p.atleta_id}
                      type="button"
                      onClick={() => setSelectedCartola(p)}
                      className={`w-full text-left rounded-lg border px-3 py-2 transition-colors ${
                        isSelected
                          ? 'border-draft-gold bg-draft-gold/10'
                          : 'border-gray-800 bg-gray-800/30 hover:bg-gray-800/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">
                            {p.apelido || p.nome || 'Sem nome'}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            ID {p.atleta_id} • {CARTOLA_POS[p.posicao_id] || `POS ${p.posicao_id}`} • clube {p.clube_id}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 text-[11px] px-2 py-0.5 rounded-full border ${
                            Number(p.status_id) === 7
                              ? 'border-green-700/60 bg-green-900/30 text-green-300'
                              : 'border-gray-700 bg-gray-900/20 text-gray-400'
                          }`}
                        >
                          {Number(p.status_id) === 7 ? 'Provavel' : `Status ${p.status_id}`}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

