import React, { useState, useEffect } from 'react';
import { API_URL } from '../config.js';

function pickRandomFormations(formations, limit = 5) {
  const shuffled = [...formations];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, limit);
}

export default function FormationPickerPhase({ onPick }) {
  const [formations, setFormations] = useState([]);
  const [chosen, setChosen] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('draft_token');
    fetch(`${API_URL}/formations`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setFormations(pickRandomFormations(data.data || [])))
      .finally(() => setLoading(false));
  }, []);

  const handlePick = (name) => {
    if (chosen) return;
    setChosen(name);
    onPick(name);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 animate-pulse">Carregando formacoes...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md space-y-5">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white">Escolha sua Formacao</h2>
          <p className="text-gray-400 text-sm mt-1">
            {chosen ? 'Formacao escolhida!' : 'Selecione 1 entre 5 formacoes aleatorias'}
          </p>
        </div>
        <div className="space-y-2">
          {formations.map((f) => {
            const isChosen = chosen === f.name;
            return (
              <button
                key={f.name}
                onClick={() => handlePick(f.name)}
                disabled={!!chosen}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                  isChosen
                    ? 'border-draft-green bg-draft-green/20 text-white'
                    : chosen
                      ? 'border-gray-700 text-gray-600 cursor-not-allowed'
                      : 'border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white'
                }`}
              >
                <span className="font-mono font-bold text-lg">{f.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
