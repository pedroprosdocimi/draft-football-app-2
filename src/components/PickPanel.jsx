import React from 'react';
import PlayerCard from './PlayerCard.jsx';

// Maps detailed_position_id → basic position_id (for color grouping)
const DETAILED_TO_BASIC = {
  1:1, 2:2, 3:2, 4:2, 5:3, 6:3, 7:3, 8:3, 9:3, 10:4, 11:4, 12:4, 13:4
};

const DETAILED_LABELS = {
  1:'GOL', 2:'ZAG', 3:'LD', 4:'LE', 5:'VOL',
  6:'MEI', 7:'MAT', 8:'ME', 9:'MD', 10:'CA', 11:'PE', 12:'PD', 13:'2AT'
};

const POS_COLORS = {
  1: 'border-blue-500 bg-blue-900/60 text-blue-300',
  2: 'border-green-600 bg-green-900/60 text-green-300',
  3: 'border-yellow-500 bg-yellow-900/60 text-yellow-300',
  4: 'border-red-500 bg-red-900/60 text-red-300',
};

export default function PickPanel({ options, slotDetailedPositionId, isCaptainPick = false, onPickPlayer, onClose }) {
  if (!options) return null;

  const basicPos = DETAILED_TO_BASIC[slotDetailedPositionId] || 1;
  const posLabel = isCaptainPick ? 'CAPITÃO' : (DETAILED_LABELS[slotDetailedPositionId] || '?');
  const badgeClass = isCaptainPick
    ? 'border-yellow-500 bg-yellow-900/30 text-yellow-300'
    : (POS_COLORS[basicPos] || POS_COLORS[1]);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 overflow-y-auto">
      <div className="flex flex-col items-center justify-center min-h-full p-3 sm:p-4 gap-4 sm:gap-6">
        <div className="text-center">
          <span className={`border text-sm font-bold px-4 py-1.5 rounded-lg ${badgeClass}`}>
            {isCaptainPick ? '👑 CAPITÃO' : posLabel}
          </span>
          <p className="text-draft-gold font-semibold mt-2">Escolha um jogador</p>
        </div>
        <div className="flex flex-nowrap gap-3 overflow-x-auto w-full pb-2 sm:flex-wrap sm:justify-center sm:overflow-x-visible">
          {options.map(player => (
            <PlayerCard
              key={player.id}
              player={player}
              card
              isMyTurn
              onClick={() => onPickPlayer(player.id)}
            />
          ))}
        </div>
        <button onClick={onClose}
          className="text-xs text-gray-600 hover:text-gray-400 border border-gray-700 px-4 py-2 rounded-lg">
          ← Voltar
        </button>
      </div>
    </div>
  );
}
