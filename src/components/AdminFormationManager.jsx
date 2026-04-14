import React, { useEffect, useState } from 'react';
import { API_URL } from '../config.js';
import FormationPreview from './FormationPreview.jsx';

export default function AdminFormationManager() {
  const [formations, setFormations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingName, setSavingName] = useState(null);
  const [message, setMessage] = useState(null);

  const loadFormations = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('draft_token');
      const response = await fetch(`${API_URL}/admin/formations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Nao foi possivel carregar as formacoes.');
      }

      setFormations(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFormations();
  }, []);

  const handleToggle = async (formationName, nextActive) => {
    setSavingName(formationName);
    setMessage(null);
    setError(null);

    try {
      const token = localStorage.getItem('draft_token');
      const response = await fetch(`${API_URL}/admin/formations/${encodeURIComponent(formationName)}/active`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ active: nextActive }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Nao foi possivel atualizar a formacao.');
      }

      setFormations((current) => current.map((formation) => (
        formation.name === formationName
          ? { ...formation, active: nextActive }
          : formation
      )));
      setMessage('Formacoes atualizadas.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingName(null);
    }
  };

  const activeCount = formations.filter((formation) => formation.active).length;

  return (
    <div className="card mb-6 overflow-hidden">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Formacoes do Draft</h2>
          <p className="mt-1 text-sm text-gray-400">
            Ative ou desative quais esquemas podem aparecer na escolha do draft.
          </p>
        </div>
        <div className="rounded-xl border border-emerald-900/60 bg-emerald-950/40 px-3 py-2 text-right">
          <div className="text-xs uppercase tracking-[0.2em] text-emerald-300/70">Ativas</div>
          <div className="text-lg font-black text-emerald-300">{activeCount}</div>
        </div>
      </div>

      {message && <p className="mb-3 text-sm text-emerald-300">{message}</p>}
      {error && <p className="mb-3 text-sm text-red-300">{error}</p>}

      {loading ? (
        <p className="py-8 text-center text-sm text-gray-500">Carregando formacoes...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="pb-3 pr-4 font-medium">Formacao</th>
                <th className="pb-3 pr-4 font-medium">Desenho</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 font-medium text-right">Acao</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {formations.map((formation) => {
                const isSaving = savingName === formation.name;

                return (
                  <tr key={formation.name} className="align-top">
                    <td className="py-4 pr-4">
                      <div className="font-mono text-2xl font-black text-white">{formation.name}</div>
                      <div className="mt-1 text-xs text-gray-500">
                        {formation.active ? 'Disponivel no draft' : 'Oculta na escolha do draft'}
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      <FormationPreview
                        formation={formation}
                        containerClassName="h-72 max-w-[220px]"
                        badgeClassName="h-9 w-9 text-[9px]"
                      />
                    </td>
                    <td className="py-4 pr-4">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] ${
                        formation.active
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                          : 'border-gray-700 bg-gray-800 text-gray-400'
                      }`}>
                        {formation.active ? 'Ativa' : 'Inativa'}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <label className="inline-flex items-center gap-3">
                        <span className="text-xs text-gray-500">Permitir</span>
                        <button
                          type="button"
                          onClick={() => handleToggle(formation.name, !formation.active)}
                          disabled={isSaving}
                          className={`relative h-7 w-14 rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                            formation.active
                              ? 'border-emerald-500/50 bg-emerald-500/20'
                              : 'border-gray-700 bg-gray-800'
                          }`}
                        >
                          <span
                            className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${
                              formation.active ? 'left-8' : 'left-1'
                            }`}
                          />
                        </button>
                      </label>
                      {isSaving && <div className="mt-2 text-xs text-gray-500">Salvando...</div>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
