import React from 'react';

const FORMATION_DETAILS = {
  '4-3-3': { GOL: 1, LAT: 2, ZAG: 2, MEI: 3, ATA: 3 },
  '4-4-2': { GOL: 1, LAT: 2, ZAG: 2, MEI: 4, ATA: 2 },
  '3-5-2': { GOL: 1, LAT: 0, ZAG: 3, MEI: 5, ATA: 2 },
  '4-5-1': { GOL: 1, LAT: 2, ZAG: 2, MEI: 5, ATA: 1 },
  '3-4-3': { GOL: 1, LAT: 0, ZAG: 3, MEI: 4, ATA: 3 },
};

const VALID_FORMATIONS = ['4-3-3', '4-4-2', '3-5-2', '4-5-1', '3-4-3'];

export default function FormationPickerPhase({
  timerSeconds,
  myChosenFormation,
  participants = [],
  formationChoices = {},
  onPick,
}) {
  const isParallel = participants.length <= 1;

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md mx-auto space-y-5">
      <div className="text-center">
        <h2 className="text-xl font-bold text-white">Escolha sua Formação</h2>
        <p className="text-gray-400 text-sm mt-1">
          {myChosenFormation
            ? 'Formação escolhida! Aguardando...'
            : 'Escolha a formação para o seu time'}
        </p>
      </div>

      <div className="flex justify-center">
        <div className="text-3xl font-mono font-bold text-white">
          {timerSeconds}s
        </div>
      </div>

      <div className="space-y-2">
        {VALID_FORMATIONS.map(f => {
          const details = FORMATION_DETAILS[f];
          const total = Object.values(details).reduce((a, b) => a + b, 0);
          const isChosen = myChosenFormation === f;
          const disabled = !!myChosenFormation;

          return (
            <button
              key={f}
              onClick={() => !disabled && onPick(f)}
              disabled={disabled}
              className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                isChosen
                  ? 'border-draft-green bg-draft-green/20 text-white'
                  : disabled
                    ? 'border-gray-700 text-gray-600 cursor-not-allowed'
                    : 'border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-lg">{f}</span>
                <span className="text-xs text-gray-500">{total} picks</span>
              </div>
              <div className="flex gap-2 mt-1 text-xs text-gray-500">
                {Object.entries(details).filter(([, v]) => v > 0).map(([pos, count]) => (
                  <span key={pos}>{count}x{pos}</span>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {!isParallel && (
        <div className="border-t border-gray-700 pt-4 space-y-1">
          <p className="text-xs text-gray-500 mb-2">Escolhas dos participantes:</p>
          {participants.map(p => {
            const chosen = formationChoices[p.id];
            return (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-300">{p.name}</span>
                {chosen
                  ? <span className="text-draft-green font-mono text-xs">{chosen}</span>
                  : <span className="text-gray-600 text-xs">aguardando...</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
