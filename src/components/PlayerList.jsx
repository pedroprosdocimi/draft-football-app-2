import React, { useState, useMemo } from 'react';
import PlayerCard from './PlayerCard.jsx';

const POSITION_FILTERS = [
  { id: 0, label: 'Todos' },
  { id: 1, label: 'GOL' },
  { id: 2, label: 'DEF' },
  { id: 3, label: 'MEI' },
  { id: 4, label: 'ATA' },
];

export default function PlayerList({ players, pickedIds = new Set(), isMyTurn, onPick }) {
  const [search, setSearch] = useState('');
  const [posFilter, setPosFilter] = useState(0);

  const available = useMemo(() => {
    return players
      .filter(p => !pickedIds.has(p.id))
      .filter(p => posFilter === 0 || p.position_id === posFilter)
      .filter(p => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (p.display_name || p.name)?.toLowerCase().includes(q) ||
               p.team_short_code?.toLowerCase().includes(q);
      });
  }, [players, pickedIds, posFilter, search]);

  return (
    <div className="flex flex-col h-full">
      <div className="mb-3">
        <input type="text" className="input-field text-sm" placeholder="Buscar jogador ou clube..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="flex gap-1 mb-3 flex-wrap">
        {POSITION_FILTERS.map(({ id, label }) => (
          <button key={id} onClick={() => setPosFilter(id)}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              posFilter === id ? 'bg-draft-green text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}>{label}</button>
        ))}
      </div>
      <div className="text-xs text-gray-600 mb-2">{available.length} jogadores disponíveis</div>
      <div className="flex-1 overflow-y-auto space-y-0.5">
        {available.map(player => (
          <PlayerCard key={player.id} player={player} compact isMyTurn={isMyTurn}
            onClick={() => onPick(player.id)} />
        ))}
      </div>
    </div>
  );
}
