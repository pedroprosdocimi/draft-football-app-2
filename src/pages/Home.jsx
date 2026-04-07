import React, { useState, useEffect } from 'react';
import { API_URL } from '../config.js';

function authFetch(url, options = {}) {
  const token = localStorage.getItem('draft_token');
  return fetch(url, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...options.headers },
  });
}

export default function Home({ user, onLogout, onGoAdmin, onStartDraft }) {
  const [activeDrafts, setActiveDrafts] = useState([]);
  const [historyDrafts, setHistoryDrafts] = useState([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    authFetch(`${API_URL}/drafts/active`)
      .then(r => r.json())
      .then(data => { if (data.drafts) setActiveDrafts(data.drafts); })
      .catch(() => {});
    authFetch(`${API_URL}/drafts/history`)
      .then(r => r.json())
      .then(data => { if (data.drafts) setHistoryDrafts(data.drafts); })
      .catch(() => {});
  }, []);

  const handleCreateDraft = async () => {
    setCreating(true);
    setError(null);
    try {
      const res = await authFetch(`${API_URL}/drafts`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onStartDraft(data.id);
    } catch (e) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  };

  const STATUS_LABELS = {
    formation_pick: 'Escolha de formação',
    drafting: 'Titulares',
    bench_drafting: 'Reservas',
    captain_pick: 'Capitão',
    complete: 'Finalizado',
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">⚽</div>
          <h1 className="text-4xl font-bold text-white mb-2">Draft Football</h1>
          <div className="flex items-center justify-center gap-3 mt-4">
            <span className="text-gray-400 text-sm">
              Olá, <span className="text-white font-medium">{user.name?.split(' ')[0]}</span>
              {user.is_admin && (
                <span className="ml-2 text-xs bg-draft-gold/20 text-draft-gold border border-draft-gold/30 px-2 py-0.5 rounded-full">
                  admin
                </span>
              )}
            </span>
            <button onClick={onLogout} className="text-xs text-gray-600 hover:text-red-400 transition-colors">
              Sair
            </button>
          </div>
        </div>

        {activeDrafts.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Seus drafts ativos</p>
            <div className="space-y-2">
              {activeDrafts.map(draft => (
                <div key={draft.id} className="rounded-xl border border-gray-700 bg-gray-800/60 px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-sm">{draft.formation || '—'}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-draft-green/20 text-green-400 border border-draft-green/30">
                        {STATUS_LABELS[draft.status] || draft.status}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => onStartDraft(draft.id)}
                    className="flex-shrink-0 btn-primary text-sm py-1.5 px-4">
                    Continuar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card">
          {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
          <button onClick={handleCreateDraft} disabled={creating} className="btn-primary w-full">
            {creating ? '⚽ Criando...' : '✨ Criar Novo Draft'}
          </button>
        </div>

        {historyDrafts.length > 0 && (
          <div className="mt-6">
            <p className="text-sm font-semibold text-white mb-3">🏆 Drafts anteriores</p>
            <div className="space-y-2">
              {historyDrafts.map(draft => (
                <div key={draft.id}
                  className="rounded-xl border border-gray-700 bg-gray-800/50 px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-white text-sm">{draft.formation}</span>
                    <span className="text-xs text-green-500 bg-green-950/40 border border-green-900/60 px-1.5 py-0.5 rounded">
                      finalizado
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(draft.updated_at).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit' })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {user.is_admin && (
          <div className="mt-4 text-center">
            <button onClick={onGoAdmin}
              className="text-xs text-gray-600 hover:text-draft-gold border border-gray-800 hover:border-gray-600 px-4 py-2 rounded-lg transition-colors">
              ⚙️ Painel Admin
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
