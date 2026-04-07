import React from 'react';
import PlayerCard from './PlayerCard.jsx';
import TeamSlots from './TeamSlots.jsx';

const POSITION_LABELS = { 1: 'GOL', 2: 'LAT', 3: 'ZAG', 4: 'MEI', 5: 'ATA', 21: 'DEF RES 1', 22: 'DEF RES 2', 23: 'M/A RES 1', 24: 'M/A RES 2', 25: 'M/A RES 3' };

const POS_COLORS = {
  1: { border: 'border-blue-500',   bg: 'bg-blue-900/50',   text: 'text-blue-300',   btn: 'border-blue-500 bg-blue-900/60 hover:bg-blue-800/80',   filled: 'bg-blue-600 border-blue-500' },
  2: { border: 'border-green-600',  bg: 'bg-green-900/50',  text: 'text-green-300',  btn: 'border-green-600 bg-green-900/60 hover:bg-green-800/80',  filled: 'bg-green-700 border-green-600' },
  3: { border: 'border-green-600',  bg: 'bg-green-900/50',  text: 'text-green-300',  btn: 'border-green-600 bg-green-900/60 hover:bg-green-800/80',  filled: 'bg-green-700 border-green-600' },
  4: { border: 'border-yellow-500', bg: 'bg-yellow-900/50', text: 'text-yellow-300', btn: 'border-yellow-500 bg-yellow-900/60 hover:bg-yellow-800/80', filled: 'bg-yellow-600 border-yellow-500' },
  5: { border: 'border-red-500',    bg: 'bg-red-900/50',    text: 'text-red-300',    btn: 'border-red-500 bg-red-900/60 hover:bg-red-800/80',    filled: 'bg-red-600 border-red-500' },
};

const FORMATION_COUNTS = {
  '4-3-3': { 1: 1, 2: 2, 3: 2, 4: 3, 5: 3 },
  '4-4-2': { 1: 1, 2: 2, 3: 2, 4: 4, 5: 2 },
  '3-5-2': { 1: 1, 2: 0, 3: 3, 4: 5, 5: 2 },
  '4-5-1': { 1: 1, 2: 2, 3: 2, 4: 5, 5: 1 },
  '3-4-3': { 1: 1, 2: 0, 3: 3, 4: 4, 5: 3 },
};

const BENCH_SLOT_IDS = [21, 22, 23, 24, 25];
const FIELD_ROWS = [[5], [4], [2, 3], [1]];

// ── Timer ring ────────────────────────────────────────────────────────────────
function TimerRing({ timeLeft, total }) {
  const pct = total > 0 ? timeLeft / total : 0;
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;
  const color = pct > 0.5 ? '#22c55e' : pct > 0.25 ? '#eab308' : '#ef4444';
  return (
    <div className="relative flex items-center justify-center w-16 h-16">
      <svg width="64" height="64" className="-rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="#374151" strokeWidth="4" />
        <circle
          cx="32" cy="32" r={r}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.5s linear, stroke 0.5s' }}
        />
      </svg>
      <span className="absolute text-lg font-bold text-white">{timeLeft}</span>
    </div>
  );
}

// ── Formation grid slots ──────────────────────────────────────────────────────
function FilledSlot({ player, posId }) {
  const c = POS_COLORS[posId];
  return (
    <div className={`w-16 h-24 sm:w-20 sm:h-28 flex flex-col rounded-2xl border ${c.border} bg-gray-800/80 overflow-hidden`}>
      <div className="h-12 sm:h-16 w-full overflow-hidden flex-shrink-0">
        {player.photo
          ? <img src={player.photo} className="w-full h-full object-cover object-top" alt="" />
          : <div className={`w-full h-full ${c.bg}`} />}
      </div>
      <div className={`flex-1 ${c.bg} flex flex-col items-center justify-center px-1`}>
        <span className={`text-[10px] font-bold ${c.text} leading-none`}>{POSITION_LABELS[posId]}</span>
        <span className="text-[9px] sm:text-[10px] text-gray-200 leading-none w-full text-center truncate mt-0.5">{player.nickname}</span>
      </div>
    </div>
  );
}

function AvailableSlot({ posId, vagas, total, isMine, hasChosen, onSubmitPosition }) {
  const c = POS_COLORS[posId];
  const isFull = vagas <= 0;
  const disabled = hasChosen || isFull;

  if (isMine) {
    return (
      <div className={`w-16 h-24 sm:w-20 sm:h-28 flex flex-col items-center justify-center gap-0.5 rounded-2xl border-2 ${c.filled} shadow-lg scale-105`}>
        <span className="text-sm font-extrabold text-white">{POSITION_LABELS[posId]}</span>
        <span className="text-[9px] text-white/90 font-semibold">Sua escolha</span>
        <span className={`text-[9px] ${c.text}`}>{vagas}/{total}</span>
      </div>
    );
  }

  return (
    <button
      onClick={() => !disabled && onSubmitPosition(posId)}
      disabled={disabled}
      className={`w-16 h-24 sm:w-20 sm:h-28 flex flex-col items-center justify-center gap-0.5 rounded-2xl border-2 transition-all
        ${disabled
          ? 'border-gray-700 bg-gray-800/40 opacity-50 cursor-not-allowed'
          : `${c.btn} hover:scale-105 active:scale-95 cursor-pointer`
        }`}
    >
      <span className={`text-sm font-extrabold ${disabled ? 'text-gray-500' : c.text}`}>{POSITION_LABELS[posId]}</span>
      <span className={`text-[9px] font-medium ${isFull ? 'text-red-400' : disabled ? 'text-gray-600' : 'text-gray-300'}`}>
        {vagas}/{total} vagas
      </span>
      {isFull && <span className="text-[8px] text-red-400 font-bold">Cheio</span>}
    </button>
  );
}

// ── Visual formation picker with vagas info ───────────────────────────────────
function SimultaneousFormationPicker({ formation, myPicks, positionSlots, confirmedPositions, participantId, onSubmitPosition }) {
  const counts = FORMATION_COUNTS[formation] || {};
  const myChoice = confirmedPositions?.[participantId];
  const hasChosen = myChoice !== undefined && myChoice !== null;

  const mainPicks = (myPicks || []).filter(p => !BENCH_SLOT_IDS.includes(p.position_id));
  const picksByPos = {};
  for (const pick of mainPicks) {
    if (!picksByPos[pick.position_id]) picksByPos[pick.position_id] = [];
    picksByPos[pick.position_id].push(pick);
  }

  const buildSlots = (posId) => {
    const total = counts[posId] || 0;
    if (total === 0) return [];
    const filled = picksByPos[posId] || [];
    const remaining = Math.max(0, total - filled.length);
    return [
      ...filled.map(player => ({ type: 'filled', player, posId })),
      ...Array.from({ length: remaining }, (_, i) => ({ type: 'available', posId, key: `${posId}-avail-${i}` })),
    ];
  };

  const renderRow = (posIds) => {
    let slots;
    if (posIds.includes(2) && posIds.includes(3)) {
      const latSlots = buildSlots(2);
      const zagSlots = buildSlots(3);
      slots = latSlots.length >= 2
        ? [latSlots[0], ...zagSlots, latSlots[1]]
        : [...latSlots, ...zagSlots];
    } else {
      slots = posIds.flatMap(buildSlots);
    }
    if (slots.length === 0) return null;
    return (
      <div className="flex gap-1.5 justify-center">
        {slots.map((slot, i) => {
          if (slot.type === 'filled') {
            return <FilledSlot key={slot.player.player_id} player={slot.player} posId={slot.posId} />;
          }
          const slotData = positionSlots?.[slot.posId] || { vagas: 0, total: 0 };
          return (
            <AvailableSlot
              key={slot.key || `avail-${i}`}
              posId={slot.posId}
              vagas={slotData.vagas}
              total={slotData.total}
              isMine={myChoice === slot.posId}
              hasChosen={hasChosen}
              onSubmitPosition={onSubmitPosition}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-green-950/40 border border-green-900/30 rounded-2xl p-3 flex flex-col gap-1.5 w-full">
      {FIELD_ROWS.map(posIds => {
        const row = renderRow(posIds);
        if (!row) return null;
        return <div key={posIds.join('-')}>{row}</div>;
      })}
    </div>
  );
}

// ── Phase 1: Position Selection ───────────────────────────────────────────────
function PositionPhase({ round, totalRounds, timerSeconds, positionSlots, confirmedPositions, participantId, participants, onSubmitPosition, formation, myPicks }) {
  const myChoice = confirmedPositions?.[participantId];
  const hasChosen = myChoice !== undefined && myChoice !== null;

  return (
    <div className="flex flex-col gap-4 items-center w-full">
      {/* Header */}
      <div className="text-center">
        <div className="text-gray-400 text-sm uppercase tracking-wider">Rodada simultânea</div>
        <div className="text-white text-2xl font-bold">{round} / {totalRounds}</div>
      </div>

      {/* Timer */}
      <TimerRing timeLeft={timerSeconds} total={30} />

      {/* Status message */}
      {hasChosen ? (
        <div className="text-green-400 font-semibold text-sm bg-green-900/30 border border-green-700 rounded-lg px-4 py-2">
          Posição confirmada: {POSITION_LABELS[myChoice]} — aguardando os outros...
        </div>
      ) : (
        <div className="text-yellow-400 text-sm">Toque na posição que deseja draftar</div>
      )}

      {/* Formation-based picker */}
      <SimultaneousFormationPicker
        formation={formation}
        myPicks={myPicks}
        positionSlots={positionSlots}
        confirmedPositions={confirmedPositions}
        participantId={participantId}
        onSubmitPosition={onSubmitPosition}
      />

      {/* Who confirmed */}
      <div className="w-full">
        <div className="text-gray-500 text-xs uppercase tracking-wider mb-2">Confirmações</div>
        <div className="flex flex-col gap-1">
          {participants?.map(p => {
            const pos = confirmedPositions?.[p.id];
            return (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span className={p.id === participantId ? 'text-draft-green font-semibold' : 'text-gray-300'}>
                  {p.name}
                </span>
                {pos !== undefined && pos !== null ? (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${POS_COLORS[pos]?.filled?.split(' ')[0] || 'bg-gray-600'} text-white`}>
                    {POSITION_LABELS[pos]}
                  </span>
                ) : (
                  <span className="text-gray-600 text-xs">aguardando...</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Phase 2: Player Selection ─────────────────────────────────────────────────
function PlayerPhase({ timerSeconds, options, chosenPlayer, onSubmitPlayer, clubMatches, positionAverages, scoutPositionAverages, isBenchRound, benchSlotId, myPicks }) {
  const hasChosen = chosenPlayer != null;
  const benchPicksDone = isBenchRound ? (myPicks || []).filter(p => BENCH_SLOT_IDS.includes(p.position_id)).length : 0;
  const headerLabel = isBenchRound
    ? `Escolha de jogador reserva ${benchPicksDone + 1}/5`
    : 'Escolha seu jogador';

  return (
    <div className="flex flex-col gap-4 items-center w-full">
      {/* Header */}
      <div className="text-center">
        <div className="text-gray-400 text-sm uppercase tracking-wider">{headerLabel}</div>
        <div className="text-gray-400 text-sm mt-1">Apenas você vê esta lista</div>
      </div>

      {/* Timer */}
      <TimerRing timeLeft={timerSeconds} total={60} />

      {hasChosen ? (
        <div className="text-green-400 font-semibold text-sm bg-green-900/30 border border-green-700 rounded-lg px-4 py-2">
          {chosenPlayer.nickname} confirmado — aguardando os outros...
        </div>
      ) : options.length === 0 ? (
        <div className="text-gray-400 text-sm bg-gray-800 border border-gray-700 rounded-lg px-4 py-2">
          Nenhum jogador disponível para esta posição nesta rodada.
        </div>
      ) : (
        <div className="text-yellow-400 text-sm">Escolha antes do tempo acabar!</div>
      )}

      {/* Player cards — same layout as PickPanel */}
      <div className="flex flex-nowrap gap-3 overflow-x-auto w-full pb-2 sm:flex-wrap sm:justify-center sm:overflow-x-visible">
        {options.map(player => (
          <PlayerCard
            key={player.player_id}
            player={player}
            card={true}
            isMyTurn={!hasChosen}
            match={clubMatches?.[player.club_id] || clubMatches?.[String(player.club_id)] || null}
            onClick={() => onSubmitPlayer(player.player_id)}
            positionAverages={positionAverages || {}}
            scoutPositionAverages={scoutPositionAverages || {}}
          />
        ))}
      </div>
    </div>
  );
}

// ── Compact formation (mobile only) ───────────────────────────────────────────
function MobileTeam({ myPicks, formation, clubs, captainId }) {
  if (!formation) return null;
  const picksWithClub = (myPicks || []).map(p => ({
    ...p,
    club: clubs?.[p.club_id] || clubs?.[String(p.club_id)] || null,
  }));
  return (
    <div className="md:hidden mt-4 border-t border-gray-800 pt-4 w-full">
      <TeamSlots formation={formation} picks={picksWithClub} captainId={captainId} />
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────
export default function SimultaneousView({
  phase,               // 'position' | 'player'
  round,
  totalRounds,
  timerSeconds,
  positionSlots,
  confirmedPositions,
  playerOptions,
  participantId,
  participants,
  chosenPlayer,
  onSubmitPosition,
  onSubmitPlayer,
  clubMatches,
  positionAverages,
  scoutPositionAverages,
  isBenchRound,
  benchSlotId,
  myPicks,
  formation,
  clubs,
  captainId,
}) {
  if (phase === 'position') {
    return (
      <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center">
        <PositionPhase
          round={round}
          totalRounds={totalRounds}
          timerSeconds={timerSeconds}
          positionSlots={positionSlots}
          confirmedPositions={confirmedPositions}
          participantId={participantId}
          participants={participants}
          onSubmitPosition={onSubmitPosition}
          formation={formation}
          myPicks={myPicks}
        />
        <MobileTeam myPicks={myPicks} formation={formation} clubs={clubs} captainId={captainId} />
      </div>
    );
  }

  if (phase === 'player') {
    return (
      <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center">
        <PlayerPhase
          timerSeconds={timerSeconds}
          options={playerOptions || []}
          chosenPlayer={chosenPlayer}
          onSubmitPlayer={onSubmitPlayer}
          clubMatches={clubMatches}
          positionAverages={positionAverages}
          scoutPositionAverages={scoutPositionAverages}
          isBenchRound={isBenchRound}
          benchSlotId={benchSlotId}
          myPicks={myPicks}
        />
        <MobileTeam myPicks={myPicks} formation={formation} clubs={clubs} captainId={captainId} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 gap-4 text-gray-400">
      <span>Aguardando próxima rodada...</span>
      <MobileTeam myPicks={myPicks} formation={formation} clubs={clubs} captainId={captainId} />
    </div>
  );
}
