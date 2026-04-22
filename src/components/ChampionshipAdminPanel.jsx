import React, { useEffect, useMemo, useState } from 'react';
import { API_URL } from '../config.js';

function authFetch(path, options = {}) {
  const token = localStorage.getItem('draft_token');
  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}

function typeLabel(type) {
  if (type === 'league') return 'Pontos corridos';
  if (type === 'knockout') return 'Mata-mata';
  if (type === 'hybrid') return 'Misto';
  return type;
}

function typeBadge(type) {
  if (type === 'league') return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
  if (type === 'knockout') return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
  return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
}

function roundLabel(round) {
  return `Rodada ${round.number}`;
}

function shareLink(shareCode) {
  return `${window.location.origin}${window.location.pathname}?championship=${shareCode}`;
}

function powerOfTwoOptions(limit) {
  const items = [];
  for (let value = 2; value <= limit; value *= 2) {
    items.push(value);
  }
  return items;
}

export default function ChampionshipAdminPanel() {
  const [championships, setChampionships] = useState([]);
  const [joinRequestsByChampionship, setJoinRequestsByChampionship] = useState({});
  const [users, setUsers] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [seasonId, setSeasonId] = useState('');
  const [rounds, setRounds] = useState([]);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [form, setForm] = useState({
    name: '',
    type: 'league',
    startRoundNumber: '',
    endRoundNumber: '',
    leaguePhaseStartRoundNumber: '',
    leaguePhaseEndRoundNumber: '',
    knockoutSize: '',
    participantUserIDs: [],
  });

  const loadChampionships = async () => {
    const res = await authFetch('/championships');
    const data = await res.json();
    if (res.ok) {
      const items = data.data || [];
      setChampionships(items);
      await loadJoinRequests(items);
    }
  };

  const loadJoinRequests = async (items) => {
    const nextEntries = await Promise.all(
      (items || []).map(async (item) => {
        const res = await authFetch(`/admin/championships/${item.id}/join-requests`);
        const data = await res.json();
        return [item.id, data.data || []];
      })
    );
    setJoinRequestsByChampionship(Object.fromEntries(nextEntries));
  };

  useEffect(() => {
    const load = async () => {
      const [usersRes, seasonsRes] = await Promise.all([
        authFetch('/users?page=1&page_size=500'),
        authFetch('/admin/seasons'),
      ]);
      const [usersData, seasonsData] = await Promise.all([usersRes.json(), seasonsRes.json()]);
      setUsers((usersData.data || []).filter((item) => item.team_name));
      const nextSeasons = seasonsData.data || [];
      setSeasons(nextSeasons);
      if (nextSeasons[0]?.id) setSeasonId(nextSeasons[0].id);
      loadChampionships();
    };
    load().catch(() => setMessage({ type: 'error', text: 'Nao foi possivel carregar os dados de campeonatos.' }));
  }, []);

  useEffect(() => {
    if (!seasonId) return;
    authFetch(`/admin/rounds?season_id=${seasonId}`)
      .then((res) => res.json())
      .then((data) => setRounds(data.data || []))
      .catch(() => setRounds([]));
  }, [seasonId]);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter((user) =>
      `${user.team_name} ${user.name}`.toLowerCase().includes(term)
    );
  }, [users, search]);

  const selectedCount = form.participantUserIDs.length;
  const knockoutOptions = powerOfTwoOptions(selectedCount);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleParticipant = (userId) => {
    setForm((prev) => {
      const exists = prev.participantUserIDs.includes(userId);
      const next = exists
        ? prev.participantUserIDs.filter((id) => id !== userId)
        : [...prev.participantUserIDs, userId];

      let knockoutSize = prev.knockoutSize;
      if (prev.type === 'hybrid' && knockoutSize && Number(knockoutSize) > next.length) {
        knockoutSize = '';
      }

      return { ...prev, participantUserIDs: next, knockoutSize };
    });
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    const payload = {
      name: form.name,
      type: form.type,
      participant_user_ids: form.participantUserIDs,
    };

    if (form.type === 'league' || form.type === 'knockout') {
      payload.start_round_number = Number(form.startRoundNumber);
    }
    if (form.type === 'league') {
      payload.end_round_number = Number(form.endRoundNumber);
    }
    if (form.type === 'hybrid') {
      payload.league_phase_start_round_number = Number(form.leaguePhaseStartRoundNumber);
      payload.league_phase_end_round_number = Number(form.leaguePhaseEndRoundNumber);
      payload.knockout_size = Number(form.knockoutSize);
    }

    try {
      const res = await authFetch('/admin/championships', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Nao foi possivel criar o campeonato.');

      setForm({
        name: '',
        type: 'league',
        startRoundNumber: '',
        endRoundNumber: '',
        leaguePhaseStartRoundNumber: '',
        leaguePhaseEndRoundNumber: '',
        knockoutSize: '',
        participantUserIDs: [],
      });
      setMessage({
        type: 'success',
        text: `Campeonato criado. Link: ${shareLink(data.data.share_code)}`,
      });
      loadChampionships();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const copyLink = async (code) => {
    try {
      await navigator.clipboard.writeText(shareLink(code));
      setMessage({ type: 'success', text: 'Link copiado para a area de transferencia.' });
    } catch {
      setMessage({ type: 'error', text: 'Nao foi possivel copiar o link agora.' });
    }
  };

  const reviewJoinRequest = async (championshipId, requestId, action) => {
    try {
      const res = await authFetch(`/admin/championships/${championshipId}/join-requests/${requestId}/${action}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Nao foi possivel revisar a solicitacao.');
      setMessage({
        type: 'success',
        text: action === 'approve' ? 'Solicitacao aprovada.' : 'Solicitacao recusada.',
      });
      await loadChampionships();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <section className="card mb-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Campeonatos</h2>
          <p className="text-sm text-gray-400">So admins podem criar e compartilhar campeonatos.</p>
        </div>
        <span className="rounded-full border border-draft-gold/30 bg-draft-gold/10 px-3 py-1 text-xs font-semibold text-draft-gold">
          {championships.length} cadastrados
        </span>
      </div>

      {message && (
        <div className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
          message.type === 'success'
            ? 'border-green-500/30 bg-green-500/10 text-green-300'
            : 'border-red-500/30 bg-red-500/10 text-red-300'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleCreate} className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Nome</span>
              <input
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="input-field"
                placeholder="Ex.: Copa de Julho"
                required
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Tipo</span>
              <select
                value={form.type}
                onChange={(e) => updateField('type', e.target.value)}
                className="input-field"
              >
                <option value="league">Pontos corridos</option>
                <option value="knockout">Mata-mata</option>
                <option value="hybrid">Misto</option>
              </select>
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Temporada</span>
              <select
                value={seasonId}
                onChange={(e) => setSeasonId(e.target.value)}
                className="input-field"
              >
                <option value="">Selecione</option>
                {seasons.map((season) => (
                  <option key={season.id} value={season.id}>{season.name}</option>
                ))}
              </select>
            </label>

            {(form.type === 'league' || form.type === 'knockout') && (
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {form.type === 'knockout' ? 'Rodada inicial' : 'Rodada inicial'}
                </span>
                <select
                  value={form.startRoundNumber}
                  onChange={(e) => updateField('startRoundNumber', e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="">Selecione</option>
                  {rounds.map((round) => (
                    <option key={round.id} value={round.number}>{roundLabel(round)}</option>
                  ))}
                </select>
              </label>
            )}

            {form.type === 'league' && (
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Rodada final</span>
                <select
                  value={form.endRoundNumber}
                  onChange={(e) => updateField('endRoundNumber', e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="">Selecione</option>
                  {rounds.map((round) => (
                    <option key={round.id} value={round.number}>{roundLabel(round)}</option>
                  ))}
                </select>
              </label>
            )}
          </div>

          {form.type === 'hybrid' && (
            <div className="grid gap-3 md:grid-cols-3">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Inicio pontos corridos</span>
                <select
                  value={form.leaguePhaseStartRoundNumber}
                  onChange={(e) => updateField('leaguePhaseStartRoundNumber', e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="">Selecione</option>
                  {rounds.map((round) => (
                    <option key={round.id} value={round.number}>{roundLabel(round)}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Fim pontos corridos</span>
                <select
                  value={form.leaguePhaseEndRoundNumber}
                  onChange={(e) => updateField('leaguePhaseEndRoundNumber', e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="">Selecione</option>
                  {rounds.map((round) => (
                    <option key={round.id} value={round.number}>{roundLabel(round)}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Classificam</span>
                <select
                  value={form.knockoutSize}
                  onChange={(e) => updateField('knockoutSize', e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="">Selecione</option>
                  {knockoutOptions.map((value) => (
                    <option key={value} value={value}>{value} times</option>
                  ))}
                </select>
              </label>
            </div>
          )}

          <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">Participantes</p>
                <p className="text-xs text-gray-500">{selectedCount} selecionados</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, participantUserIDs: users.map((item) => item.id) }))}
                  className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-300 transition-colors hover:border-gray-500 hover:text-white"
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, participantUserIDs: [] }))}
                  className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-300 transition-colors hover:border-gray-500 hover:text-white"
                >
                  Limpar
                </button>
              </div>
            </div>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field mb-3"
              placeholder="Buscar por nome do time ou tecnico"
            />

            <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {filteredUsers.map((user) => {
                const checked = form.participantUserIDs.includes(user.id);
                return (
                  <label
                    key={user.id}
                    className={`flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2 transition-colors ${
                      checked
                        ? 'border-draft-green/40 bg-draft-green/10'
                        : 'border-gray-800 bg-gray-900/50 hover:border-gray-700'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">{user.team_name}</p>
                      <p className="text-xs text-gray-500">{user.name}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleParticipant(user.id)}
                      className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-draft-green focus:ring-draft-green"
                    />
                  </label>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Criando campeonato...' : 'Criar campeonato'}
          </button>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">Campeonatos criados</p>
              <p className="text-xs text-gray-500">Links prontos para compartilhar.</p>
            </div>
          </div>

          <div className="space-y-3">
            {championships.length === 0 && (
              <div className="rounded-xl border border-dashed border-gray-800 px-4 py-6 text-center text-sm text-gray-500">
                Nenhum campeonato criado ainda.
              </div>
            )}

            {championships.map((item) => (
              <div key={item.id} className="rounded-xl border border-gray-800 bg-black/20 p-4">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{item.name}</p>
                    <p className="text-xs text-gray-500">
                      Rodadas {item.start_round_number} a {item.end_round_number} • {item.participant_count} participantes
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <span className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${typeBadge(item.type)}`}>
                      {typeLabel(item.type)}
                    </span>
                    {item.pending_join_request_count > 0 && (
                      <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[11px] font-semibold text-amber-300">
                        {item.pending_join_request_count} pendente{item.pending_join_request_count > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-gray-800 bg-gray-950/60 px-3 py-2 text-xs text-gray-400">
                  {shareLink(item.share_code)}
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => copyLink(item.share_code)}
                    className="rounded-lg border border-gray-700 px-3 py-2 text-xs font-semibold text-gray-200 transition-colors hover:border-gray-500 hover:text-white"
                  >
                    Copiar link
                  </button>
                  <a
                    href={shareLink(item.share_code)}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-draft-gold/30 bg-draft-gold/10 px-3 py-2 text-xs font-semibold text-draft-gold transition-colors hover:bg-draft-gold/20"
                  >
                    Abrir
                  </a>
                </div>

                {(joinRequestsByChampionship[item.id] || []).length > 0 && (
                  <div className="mt-4 rounded-xl border border-gray-800 bg-gray-950/40 p-3">
                    <div className="mb-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Solicitações de participação
                      </p>
                      <p className="text-[11px] text-gray-600">
                        Aprove ou recuse os pedidos recebidos pelo link compartilhável.
                      </p>
                    </div>

                    <div className="space-y-2">
                      {joinRequestsByChampionship[item.id].map((request) => {
                        const isPending = request.status === 'pending';
                        const statusClass = isPending
                          ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                          : request.status === 'approved'
                            ? 'border-green-500/30 bg-green-500/10 text-green-300'
                            : 'border-red-500/30 bg-red-500/10 text-red-300';

                        return (
                          <div
                            key={request.id}
                            className="rounded-xl border border-gray-800 bg-black/30 px-3 py-3"
                          >
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                              <div>
                                <p className="text-sm font-semibold text-white">{request.team_name || 'Time sem nome'}</p>
                                <p className="text-xs text-gray-500">{request.coach_name || 'Técnico não informado'}</p>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${statusClass}`}>
                                  {request.status === 'pending'
                                    ? 'Pendente'
                                    : request.status === 'approved'
                                      ? 'Aprovado'
                                      : 'Recusado'}
                                </span>

                                {isPending && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => reviewJoinRequest(item.id, request.id, 'approve')}
                                      className="rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-xs font-semibold text-green-300 transition-colors hover:bg-green-500/20"
                                    >
                                      Aprovar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => reviewJoinRequest(item.id, request.id, 'decline')}
                                      className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/20"
                                    >
                                      Recusar
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </form>
    </section>
  );
}
