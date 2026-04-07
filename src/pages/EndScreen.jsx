import React, { useState, useEffect } from 'react';
import { API_URL } from '../config.js';

export default function EndScreen({ draftId, onGoHome }) {
  const [draft, setDraft] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('draft_token');
    fetch(`${API_URL}/drafts/${draftId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setDraft(data));
  }, [draftId]);

  if (!draft) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400 animate-pulse">Carregando resultado...</p>
    </div>
  );

  const DETAILED_LABELS = {
    1:'GOL', 2:'ZAG', 3:'LD', 4:'LE', 5:'VOL',
    6:'MEI', 7:'MAT', 8:'ME', 9:'MD', 10:'CA', 11:'PE', 12:'PD', 13:'2AT'
  };

  const starters = (draft.picks || []).filter(p => p.slot_position <= 11)
    .sort((a, b) => a.slot_position - b.slot_position);
  const bench = (draft.picks || []).filter(p => p.slot_position > 11)
    .sort((a, b) => a.slot_position - b.slot_position);

  return (
    <div className="min-h-screen flex flex-col items-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 mt-8">
          <div className="text-5xl mb-3">🏆</div>
          <h1 className="text-3xl font-bold text-white">Draft Completo!</h1>
          <p className="text-gray-400 text-sm mt-1">{draft.formation}</p>
        </div>

        <div className="card mb-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Titulares</h2>
          <div className="space-y-2">
            {starters.map(p => (
              <div key={p.slot_position} className="flex items-center gap-3 py-1">
                <span className="text-xs font-mono text-gray-500 w-6">{p.slot_position}</span>
                <span className="text-xs bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded font-bold">
                  {DETAILED_LABELS[p.detailed_position_id] || '?'}
                </span>
                <span className="text-sm text-white font-mono truncate flex-1">
                  {p.player_id.slice(0, 8)}…
                  {draft.captain_player_id === p.player_id && (
                    <span className="ml-1 text-draft-gold text-xs">👑</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>

        {bench.length > 0 && (
          <div className="card mb-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Reservas</h2>
            <div className="space-y-2">
              {bench.map(p => (
                <div key={p.slot_position} className="flex items-center gap-3 py-1">
                  <span className="text-xs font-mono text-gray-500 w-6">{p.slot_position}</span>
                  <span className="text-xs bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded font-bold">
                    {DETAILED_LABELS[p.detailed_position_id] || '?'}
                  </span>
                  <span className="text-sm text-white font-mono truncate flex-1">
                    {p.player_id.slice(0, 8)}…
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button onClick={onGoHome} className="btn-primary w-full">← Voltar para início</button>
      </div>
    </div>
  );
}
