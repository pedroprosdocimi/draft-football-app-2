import React, { useEffect, useRef, useState } from 'react';
import { API_URL } from '../config.js';
import FormationPreview from './FormationPreview.jsx';

function pickRandomFormations(formations, limit = 5) {
  const shuffled = [...formations];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, limit);
}

function FormationCard({ formation, chosen, onPick }) {
  const isChosen = chosen === formation.name;
  const isDisabled = !!chosen;
  const touchStateRef = useRef({ startX: 0, startY: 0, moved: false });

  const handleTouchStart = (event) => {
    const touch = event.touches[0];
    if (!touch) return;

    touchStateRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      moved: false,
    };
  };

  const handleTouchMove = (event) => {
    const touch = event.touches[0];
    if (!touch) return;

    const deltaX = Math.abs(touch.clientX - touchStateRef.current.startX);
    const deltaY = Math.abs(touch.clientY - touchStateRef.current.startY);

    if (deltaX > 10 || deltaY > 10) {
      touchStateRef.current.moved = true;
    }
  };

  const handlePick = () => {
    if (touchStateRef.current.moved) {
      touchStateRef.current.moved = false;
      return;
    }

    onPick(formation.name);
  };

  return (
    <button
      type="button"
      onClick={handlePick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      disabled={isDisabled}
      className={`group relative w-full overflow-hidden rounded-[36px] border p-6 text-left transition-all duration-200 ${
        isChosen
          ? 'border-draft-green bg-emerald-500/10 shadow-[0_0_0_1px_rgba(34,197,94,0.15),0_24px_60px_rgba(6,95,70,0.25)]'
          : isDisabled
            ? 'border-gray-800 bg-gray-900/70 opacity-50'
            : 'border-gray-800 bg-gray-900/90 hover:-translate-y-1 hover:border-emerald-400/40 hover:bg-gray-900'
      }`}
      style={{ touchAction: 'pan-x' }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.06),transparent_28%)]" />
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/5 to-transparent" />
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="relative z-10">
          <p className="text-[10px] uppercase tracking-[0.28em] text-emerald-300/70">
            Formacao
          </p>
          <h2 className="mt-2 font-mono text-3xl font-black text-white">
            {formation.name}
          </h2>
        </div>
        {isChosen && (
          <span className="relative z-10 rounded-full border border-draft-green/60 bg-draft-green/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-draft-green">
            Escolhida
          </span>
        )}
      </div>

      <div className="relative z-10">
        <FormationPreview formation={formation} />
      </div>
    </button>
  );
}

export default function FormationPickerPhase({ onPick }) {
  const [formations, setFormations] = useState([]);
  const [chosen, setChosen] = useState(null);
  const [pendingFormation, setPendingFormation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('draft_token');

    fetch(`${API_URL}/formations`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Nao foi possivel carregar as formacoes.');
        }
        setFormations(pickRandomFormations(data.data || []));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handlePick = (name) => {
    if (chosen) return;
    setPendingFormation(name);
  };

  const handleConfirmPick = async () => {
    if (!pendingFormation || chosen) return;

    const formationName = pendingFormation;
    setChosen(formationName);
    setPendingFormation(null);
    await onPick(formationName);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 animate-pulse">Carregando formacoes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="rounded-2xl border border-red-800 bg-red-950/40 px-6 py-5 text-center">
          <p className="text-sm font-semibold text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <p className="text-[11px] uppercase tracking-[0.4em] text-emerald-300/70">
            Draft setup
          </p>
          <h1 className="mt-4 text-3xl font-black text-white sm:text-4xl">
            Escolha 1 entre 5 formacoes aleatorias
          </h1>
          <p className="mt-3 text-sm text-gray-400 sm:text-base">
            Cada card mostra o desenho tatico da equipe antes do primeiro pick.
          </p>
        </div>

        <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 snap-x snap-mandatory md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 xl:grid-cols-3">
          {formations.map((formation) => (
            <div key={formation.name} className="w-[calc(100vw-2rem)] max-w-[380px] flex-none snap-center md:w-auto md:max-w-none">
              <FormationCard
                formation={formation}
                chosen={chosen}
                onPick={handlePick}
              />
            </div>
          ))}
        </div>

        {pendingFormation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
            <div className="w-full max-w-md rounded-[28px] border border-emerald-400/25 bg-gray-950 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
              <p className="text-[11px] uppercase tracking-[0.3em] text-emerald-300/70">
                Confirmacao
              </p>
              <h2 className="mt-3 text-2xl font-black text-white">
                Confirmar {pendingFormation}?
              </h2>
              <p className="mt-3 text-sm text-gray-400">
                Ao confirmar, essa sera a formacao do seu draft e a escolha dos jogadores comeca em seguida.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleConfirmPick}
                  className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-gray-950 transition hover:bg-emerald-400"
                >
                  Confirmar
                </button>
                <button
                  type="button"
                  onClick={() => setPendingFormation(null)}
                  className="rounded-2xl border border-gray-700 px-4 py-3 text-sm font-semibold text-gray-200 transition hover:border-gray-500 hover:bg-white/5"
                >
                  Voltar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
