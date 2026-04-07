import React from 'react';

const DETAILED_LABELS = {
  1:'GOL', 2:'ZAG', 3:'LD', 4:'LE', 5:'VOL',
  6:'MEI', 7:'MAT', 8:'ME', 9:'MD', 10:'CA', 11:'PE', 12:'PD', 13:'2AT'
};

const POS_COLORS = {
  1: { bg: 'bg-blue-600', border: 'border-blue-500', btn: 'border-blue-500 bg-blue-900/60 hover:bg-blue-800/80', glow: 'hover:shadow-blue-600/40' },
  2: { bg: 'bg-green-700', border: 'border-green-600', btn: 'border-green-600 bg-green-900/60 hover:bg-green-800/80', glow: 'hover:shadow-green-700/40' },
  3: { bg: 'bg-yellow-600', border: 'border-yellow-500', btn: 'border-yellow-500 bg-yellow-900/60 hover:bg-yellow-800/80', glow: 'hover:shadow-yellow-600/40' },
  4: { bg: 'bg-red-600', border: 'border-red-500', btn: 'border-red-500 bg-red-900/60 hover:bg-red-800/80', glow: 'hover:shadow-red-600/40' },
};

const DEFAULT_COLORS = { bg: 'bg-gray-600', border: 'border-gray-500', btn: 'border-gray-500 bg-gray-800', glow: '' };

export default function PlayerCard({ player, onClick, isMyTurn, compact = false, card = false, isCaptain = false }) {
  const colors = POS_COLORS[player.position_id] || DEFAULT_COLORS;
  const posLabel = DETAILED_LABELS[player.detailed_position_id] || '?';
  const displayName = player.display_name || player.name;

  if (compact) {
    return (
      <button
        onClick={onClick}
        disabled={!isMyTurn}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${
          isMyTurn ? 'hover:bg-gray-700 cursor-pointer active:scale-95' : 'opacity-60 cursor-default'
        }`}
      >
        <div className={`w-8 h-8 rounded-full ${colors.bg} overflow-hidden flex-shrink-0 flex items-center justify-center`}>
          {player.team_logo_url
            ? <img src={player.team_logo_url} alt={player.team_short_code} className="w-5 h-5 object-contain" />
            : <span className="text-white text-xs font-bold">{player.team_short_code?.slice(0,3) || '?'}</span>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-white truncate">{displayName}</div>
          <div className="text-xs text-gray-400">{player.team_short_code || '—'}</div>
        </div>
        <span className={`${colors.bg} text-white text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0`}>
          {posLabel}
        </span>
      </button>
    );
  }

  if (card) {
    return (
      <button
        onClick={isMyTurn ? onClick : undefined}
        disabled={!isMyTurn}
        className={`w-40 flex-shrink-0 flex flex-col bg-gray-800 border rounded-xl overflow-hidden transition-all text-left
          ${isMyTurn
            ? `${colors.border} hover:border-draft-green hover:scale-105 hover:shadow-lg ${colors.glow} cursor-pointer active:scale-100`
            : 'border-gray-700 opacity-80 cursor-default'
          }`}
      >
        <div className="relative bg-gray-900 h-36 w-full overflow-hidden flex-shrink-0">
          <div className={`absolute top-0 left-0 right-0 h-1.5 z-10 ${colors.bg}`} />
          {player.team_logo_url
            ? <img src={player.team_logo_url} alt={player.team_short_code}
                className="absolute inset-0 w-full h-full object-contain p-6 opacity-20" />
            : null}
          <div className={`absolute bottom-0 left-0 right-0 z-20 ${colors.bg} text-white text-sm font-bold py-1 text-center`}>
            {posLabel}
          </div>
          {isCaptain && (
            <div className="absolute top-2 right-2 z-20 w-6 h-6 bg-black rounded-full flex items-center justify-center border-2 border-gray-300 shadow-lg">
              <span className="text-white text-xs font-black leading-none">C</span>
            </div>
          )}
        </div>
        <div className="flex flex-col p-2 gap-1.5 flex-1 items-center">
          <span className="font-extrabold text-white text-sm leading-tight line-clamp-2 text-center">
            {displayName}
          </span>
          <span className="text-xs text-gray-400">{player.team_short_code || '—'}</span>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={!isMyTurn}
      className={`card text-left w-full transition-all ${
        isMyTurn ? 'hover:border-draft-green hover:bg-gray-800 cursor-pointer active:scale-95' : 'opacity-50 cursor-default'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-full ${colors.bg} overflow-hidden flex-shrink-0 flex items-center justify-center`}>
          {player.team_logo_url
            ? <img src={player.team_logo_url} alt={player.team_short_code} className="w-8 h-8 object-contain" />
            : <span className="text-white text-sm font-bold">{player.team_short_code?.slice(0,3) || '?'}</span>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white truncate">{displayName}</div>
          <div className="text-sm text-gray-400">{player.team_short_code || '—'}</div>
        </div>
        <span className={`${colors.bg} text-white text-xs font-bold px-2 py-0.5 rounded`}>{posLabel}</span>
      </div>
    </button>
  );
}
