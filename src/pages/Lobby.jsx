import React, { useState, useEffect } from 'react';
// TODO(Task 9): socket.io removed — replace with REST/SSE
const socket = { on: () => {}, off: () => {}, emit: () => {}, once: () => {}, connected: false };
import FormationPickerPhase from '../components/FormationPickerPhase.jsx';

const FORMATION_DETAILS = {
  '4-3-3': { GOL: 1, LAT: 2, ZAG: 2, MEI: 3, ATA: 3 },
  '4-4-2': { GOL: 1, LAT: 2, ZAG: 2, MEI: 4, ATA: 2 },
  '3-5-2': { GOL: 1, LAT: 0, ZAG: 3, MEI: 5, ATA: 2 },
  '4-5-1': { GOL: 1, LAT: 2, ZAG: 2, MEI: 5, ATA: 1 },
  '3-4-3': { GOL: 1, LAT: 0, ZAG: 3, MEI: 4, ATA: 3 },
};
function formationTotal(f) {
  const d = FORMATION_DETAILS[f];
  return d ? Object.values(d).reduce((a, b) => a + b, 0) : 11;
}

// value: 'YYYY-MM-DDTHH:MM' (horário de Brasília)
function DateTimePicker({ label, icon, hint, value, onChange }) {
  const datePart = value ? value.split('T')[0] : '';
  const timePart = value ? value.split('T')[1] : '';

  const setDate = (d) => {
    if (!d) { onChange(''); return; }
    onChange(`${d}T${timePart || '00:00'}`);
  };
  const setTime = (t) => {
    if (!datePart) return;
    onChange(`${datePart}T${t}`);
  };

  const todayStr = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  const tomorrowStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  };

  const formatted = datePart && timePart
    ? `${datePart.split('-').reverse().join('/')} às ${timePart}`
    : null;

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <div>
            <p className="text-sm font-semibold text-white">{label}</p>
            <p className="text-xs text-gray-500">{hint}</p>
          </div>
        </div>
        {value && (
          <button onClick={() => onChange('')} className="text-gray-600 hover:text-red-400 text-sm transition-colors" title="Limpar">✕</button>
        )}
      </div>

      {/* Date shortcuts */}
      <div className="flex gap-1.5">
        <button
          onClick={() => setDate(todayStr())}
          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${datePart === todayStr() ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
        >
          Hoje
        </button>
        <button
          onClick={() => setDate(tomorrowStr())}
          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${datePart === tomorrowStr() ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
        >
          Amanhã
        </button>
      </div>

      {/* Date + Time inputs */}
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">Data</label>
          <input
            type="date"
            value={datePart}
            onChange={e => setDate(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <div className="w-28">
          <label className="block text-xs text-gray-500 mb-1">Hora</label>
          <input
            type="time"
            value={timePart}
            onChange={e => setTime(e.target.value)}
            disabled={!datePart}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 disabled:opacity-40 transition-colors"
          />
        </div>
      </div>

      {/* Preview */}
      {formatted ? (
        <div className="flex items-center gap-2 bg-blue-950/40 border border-blue-800/40 rounded-lg px-3 py-1.5">
          <span className="text-blue-400 text-xs">⏰</span>
          <span className="text-blue-300 text-xs font-medium">{formatted} (horário de Brasília)</span>
        </div>
      ) : (
        <p className="text-xs text-gray-600 italic">Não definido — selecione data e hora acima</p>
      )}
    </div>
  );
}

const BENCH_SLOT_IDS = [21, 22, 23, 24, 25];

function participantPicksDone(participant, phase) {
  if (!participant?.picks) return 0;
  if (phase === 'bench') return participant.picks.filter(p => BENCH_SLOT_IDS.includes(p.position_id)).length;
  return participant.picks.filter(p => !BENCH_SLOT_IDS.includes(p.position_id)).length;
}

const SPECTATOR_ADMIN_ID = 'SPECTATOR';

export default function Lobby({ roomCode, participantId, isAdmin, initialState, onLeave, onGoHome }) {
  const isSpectatorAdmin = participantId === SPECTATOR_ADMIN_ID;
  const [roomState, setRoomState] = useState(initialState || null);
  const [draftMode, setDraftMode] = useState('realtime');
  const [deadline, setDeadline] = useState('');
  const [startTime, setStartTime] = useState('');
  const [allowRepeatPlayers, setAllowRepeatPlayers]   = useState(false);
  const [restrictClubPerTeam, setRestrictClubPerTeam] = useState(false);
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(() => new Date());

  const [formationPhaseActive, setFormationPhaseActive] = useState(false);
  const [myChosenFormation, setMyChosenFormation] = useState(null);
  const [formationTimerSeconds, setFormationTimerSeconds] = useState(30);

  useEffect(() => {
    const onRoomState = (state) => {
      setRoomState(state);
    };
    socket.on('room_state', onRoomState);
    return () => { socket.off('room_state', onRoomState); };
  }, [participantId]);

  useEffect(() => {
    const onFormationStart = (data) => {
      // Only handle parallel mode here (no players field).
      // Realtime/simultaneous: App.jsx navigates to Draft.jsx instead.
      if (data.players === undefined) {
        setFormationPhaseActive(true);
        setFormationTimerSeconds(data.timerSeconds);
        setMyChosenFormation(null);
      }
    };
    // timer_tick fires for any active timer; only update formation timer when overlay is visible
    const onTimerTick = ({ timeLeft }) => {
      setFormationTimerSeconds(timeLeft);
    };
    socket.on('formation_phase_start', onFormationStart);
    socket.on('timer_tick', onTimerTick);
    return () => {
      socket.off('formation_phase_start', onFormationStart);
      socket.off('timer_tick', onTimerTick);
    };
  }, []);

  // Tick every second for countdown display
  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  const handleToggleReady = () => {
    socket.emit('toggle_ready', { roomCode, participantId });
  };

  const toBRT = (dt) => dt ? `${dt}-03:00` : null;

  const handleStartDraft = () => {
    socket.emit('start_draft', {
      roomCode,
      participantId,
      mode: draftMode,
      startTime: (draftMode === 'parallel' && startTime) ? toBRT(startTime) : null,
      deadline: (draftMode === 'parallel' && deadline) ? toBRT(deadline) : null,
      allowRepeatPlayers,
      restrictClubPerTeam,
    });
  };

  const handleLeave = () => {
    socket.emit('leave_room', { roomCode, participantId });
    socket.once('left_room', () => onLeave?.());
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const allReady = roomState?.participants?.every(p => roomState?.readyStatus?.[p.id]);
  const hasEnoughPlayers = (roomState?.participants?.length ?? 0) >= 1;
  const canStart = isAdmin && allReady && hasEnoughPlayers;

  const isParallelWaiting = roomState?.status === 'parallel_waiting';
  const currentPickerId = roomState?.currentPickerId;
  const parallelCurrentDrafter = roomState?.participants?.find(p => p.id === currentPickerId);
  const roomDeadline = roomState?.deadline ? new Date(roomState.deadline) : null;
  const roomStartTime = roomState?.startTime ? new Date(roomState.startTime) : null;
  const beforeStart = roomStartTime ? now < roomStartTime : false;

  function formatCountdown(target) {
    const diff = Math.max(0, Math.floor((target - now) / 1000));
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
    if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`;
    return `${s}s`;
  }

  const handleStartMyTurn = () => {
    socket.emit('start_my_turn', { roomCode, participantId });
  };

  if (isParallelWaiting || (roomState?.mode === 'parallel' && roomState?.status !== 'lobby')) {
    const activeStatus = roomState?.status;
    const phaseLabel = activeStatus === 'bench_drafting' ? 'Reservas'
      : activeStatus === 'captain_drafting' ? 'Capitão'
      : 'Draft completo por jogador';
    const participants = roomState?.participants || [];

    const me = participants.find(p => p.id === participantId);
    const meCompleted = !!me?.captainId;
    const meHasFormation = !!me?.formation;
    const isSomeoneActive = !isParallelWaiting;
    const meCanStart = !meCompleted && meHasFormation && isParallelWaiting;

    const bannerClass = meCompleted
      ? 'bg-draft-green/10 border-draft-green'
      : isSomeoneActive
        ? 'bg-orange-900/20 border-orange-700'
        : meCanStart
          ? 'bg-blue-900/20 border-blue-500'
          : 'bg-gray-800/50 border-gray-700';

    return (
      <div className="min-h-screen p-4 max-w-2xl mx-auto">
        <div className="text-center mb-8 pt-6 relative">
          <button
            onClick={onGoHome}
            className="absolute left-0 top-6 text-sm text-gray-500 hover:text-white transition-colors px-2 py-1 rounded"
          >
            ← Início
          </button>
          <h1 className="text-3xl font-bold mb-1">⚽ Draft Paralelo</h1>
          <p className="text-gray-500 text-sm font-mono">{roomCode}</p>
          <div className="mt-2 inline-flex items-center gap-1.5 bg-blue-900/30 border border-blue-700/50 text-blue-300 text-xs font-semibold px-3 py-1 rounded-full">
            👤 Fase: {phaseLabel}
          </div>
          {roomStartTime && (
            <div className={`mt-2 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${
              beforeStart
                ? 'bg-blue-900/30 border border-blue-700/50 text-blue-300'
                : 'bg-draft-green/20 border border-draft-green/40 text-green-300'
            }`}>
              {beforeStart ? `🕐 Abre em ${formatCountdown(roomStartTime)}` : `✅ Aberto desde ${roomStartTime.toLocaleString('pt-BR')}`}
            </div>
          )}
          {roomDeadline && (
            <div className="mt-2 inline-flex items-center gap-1.5 bg-orange-900/30 border border-orange-700/50 text-orange-300 text-xs font-semibold px-3 py-1 rounded-full">
              ⏰ Encerra: {roomDeadline.toLocaleString('pt-BR')}
            </div>
          )}
        </div>

        {/* Banner: my state */}
        <div className={`mb-6 rounded-xl p-4 border ${bannerClass} text-center`}>
          {meCompleted ? (
            <p className="text-draft-green font-semibold text-lg">✅ Seu draft está completo!</p>
          ) : isSomeoneActive ? (
            <div>
              <p className="text-orange-300 font-semibold">
                🔄 {parallelCurrentDrafter?.name || '...'} está draftando agora...
              </p>
              <p className="text-gray-400 text-sm mt-1">Aguarde terminar para iniciar o seu.</p>
            </div>
          ) : meCanStart ? (
            <>
              {beforeStart ? (
                <>
                  <p className="text-blue-300 font-bold text-lg mb-1">Draft ainda não abriu</p>
                  <p className="text-blue-400 text-2xl font-mono font-bold mb-3">{formatCountdown(roomStartTime)}</p>
                  <button disabled className="btn-primary text-base px-8 py-3 opacity-40 cursor-not-allowed">
                    🔒 Aguardando abertura...
                  </button>
                </>
              ) : (
                <>
                  <p className="text-white font-bold text-lg mb-3">Ninguém draftando! É sua vez.</p>
                  <button onClick={handleStartMyTurn} className="btn-primary text-base px-8 py-3">
                    🚀 Iniciar meu Draft
                  </button>
                </>
              )}
            </>
          ) : (
            <p className="text-gray-500">Aguardando próxima fase...</p>
          )}
        </div>

        {/* Pick counts per participant */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-400 mb-3">Progresso dos Times</h2>
          <div className="space-y-3">
            {participants.map(p => {
              const mainTotal = p.formation ? formationTotal(p.formation) : 0;
              const total = mainTotal + 5; // +5 bench slots
              const mainDone = participantPicksDone(p, 'main');
              const benchDone = participantPicksDone(p, 'bench');
              const done = mainDone + benchDone;
              const hasCaptain = !!p.captainId;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              const isCurrent = p.id === currentPickerId;
              return (
                <div key={p.id}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className={`flex items-center gap-1.5 ${p.id === participantId ? 'text-white font-semibold' : 'text-gray-300'}`}>
                      {isCurrent && <span className="w-2 h-2 rounded-full bg-draft-gold animate-pulse inline-block" />}
                      {p.id === roomState?.adminId ? '👑' : ''}
                      {p.name}
                      {p.id === participantId && <span className="text-xs text-gray-500">(você)</span>}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {hasCaptain ? '✓ Capitão' : `${done}/${total} picks`}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        hasCaptain ? 'bg-draft-green' : isCurrent ? 'bg-draft-gold' : 'bg-gray-600'
                      }`}
                      style={{ width: hasCaptain ? '100%' : `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {formationPhaseActive && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <FormationPickerPhase
            timerSeconds={formationTimerSeconds}
            myChosenFormation={myChosenFormation}
            participants={[]}
            onPick={(formation) => {
              setMyChosenFormation(formation);
              socket.emit('submit_formation', { roomCode, participantId, formation });
            }}
          />
        </div>
      )}
      <div className="min-h-screen p-4 max-w-4xl mx-auto">
        <div className="text-center mb-8 pt-6 relative">
          <button
            onClick={handleLeave}
            className="absolute left-0 top-6 text-sm text-gray-500 hover:text-red-400 transition-colors px-2 py-1 rounded"
          >
            ← Sair
          </button>
          <h1 className="text-3xl font-bold mb-2">⚽ Draft Draft Football</h1>
          <div className="flex items-center justify-center gap-3">
            <span className="text-gray-400">Código da sala:</span>
            <button
              onClick={copyCode}
              className="font-mono text-2xl font-bold text-draft-gold bg-gray-800 px-4 py-1 rounded-lg hover:bg-gray-700 transition-colors"
            >
              {roomCode}
            </button>
            <span className="text-xs text-gray-500">{copied ? '✓ Copiado!' : 'clique para copiar'}</span>
          </div>
          {(roomState?.entry_fee ?? 0) > 0 && (
            <div className="mt-3 inline-flex items-center gap-1.5 bg-yellow-900/30 border border-yellow-700/50 text-yellow-300 text-sm font-semibold px-3 py-1 rounded-full">
              🪙 Taxa de entrada: {roomState.entry_fee} moedas
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Participants */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 text-gray-300">
              Participantes ({roomState?.participants.length || 0})
            </h2>
            <div className="space-y-2">
              {roomState?.participants.map(p => (
                <div key={p.id} className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{p.id === roomState.adminId ? '👑' : '👤'}</span>
                    <span className={p.id === participantId ? 'font-semibold text-white' : 'text-gray-300'}>
                      {p.name}
                      {p.id === participantId && <span className="text-xs text-gray-500 ml-1">(você)</span>}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className={`text-sm px-2 py-0.5 rounded flex items-center gap-1 ${roomState?.readyStatus?.[p.id] ? 'bg-draft-green/30 text-green-400' : 'bg-gray-700 text-gray-500'}`}>
                      {roomState?.readyStatus?.[p.id] ? '✓ Pronto' : 'Aguardando'}
                    </span>
                    {p.id === participantId && !isSpectatorAdmin && (
                      <button
                        onClick={handleToggleReady}
                        className={`ml-2 text-xs px-2 py-0.5 rounded border transition-all ${
                          roomState?.readyStatus?.[p.id]
                            ? 'border-draft-green bg-draft-green/20 text-green-400'
                            : 'border-gray-600 text-gray-400 hover:border-gray-500'
                        }`}
                      >
                        {roomState?.readyStatus?.[p.id] ? '✓ Estou pronto' : 'Não estou pronto'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {isSpectatorAdmin && (
                <div className="flex items-center gap-2 bg-blue-900/20 border border-blue-700/40 rounded-lg px-3 py-2">
                  <span className="text-lg">👑</span>
                  <span className="text-blue-300 font-semibold text-sm">Admin (observador)</span>
                </div>
              )}
            </div>
            {(roomState?.participants.length ?? 0) < 1 && (
              <p className="text-gray-600 text-sm mt-3 text-center">
                Compartilhe o código para os participantes entrarem
              </p>
            )}
          </div>

          {/* Right column — ready info */}
          {!isSpectatorAdmin ? (
            <div className="card flex flex-col items-center justify-center text-center py-8 gap-3">
              <div className="text-4xl">⚽</div>
              <p className="text-gray-300 font-semibold">Sua formação será escolhida no draft</p>
              <p className="text-gray-600 text-sm">Clique em "Estou pronto" quando quiser indicar que está preparado.</p>
            </div>
          ) : (
            <div className="card flex flex-col items-center justify-center text-center py-8">
              <div className="text-4xl mb-3">👁️</div>
              <p className="text-gray-300 font-semibold">Você está como observador</p>
              <p className="text-gray-600 text-sm mt-1">Gerencie a sala sem participar do draft</p>
            </div>
          )}
        </div>

        {/* Start button */}
        <div className="mt-8 text-center">
          {isAdmin ? (
            <div className="space-y-4">
              {/* Mode selector */}
              <div>
                <p className="text-sm text-gray-400 mb-2">Modo do draft</p>
                <div className="inline-flex bg-gray-800 rounded-lg p-1 gap-1">
                  <button
                    onClick={() => setDraftMode('realtime')}
                    className={`px-5 py-2.5 rounded-md text-sm font-medium transition-all ${
                      draftMode === 'realtime'
                        ? 'bg-draft-green text-white shadow'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    ⚡ Tempo Real
                  </button>
                  <button
                    onClick={() => setDraftMode('parallel')}
                    className={`px-5 py-2.5 rounded-md text-sm font-medium transition-all ${
                      draftMode === 'parallel'
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    👤 Paralelo
                  </button>
                  <button
                    onClick={() => setDraftMode('simultaneous')}
                    className={`px-5 py-2.5 rounded-md text-sm font-medium transition-all ${
                      draftMode === 'simultaneous'
                        ? 'bg-purple-600 text-white shadow'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    ⚡ Simultâneo
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-1.5">
                  {draftMode === 'realtime'
                    ? 'Todos escolhem em ordem cobra, alternando a cada pick'
                    : draftMode === 'parallel'
                      ? 'Cada jogador faz todos os seus picks de uma vez, um por vez'
                      : 'Todos escolhem ao mesmo tempo — ~21 min para 10 jogadores'}
                </p>
              </div>

              {/* Start time + Deadline — parallel only */}
              {draftMode === 'parallel' && (
                <div className="space-y-3">
                  <DateTimePicker
                    label="Horário de início"
                    icon="🟢"
                    hint="Jogadores entram antes, mas só draftam a partir daqui"
                    value={startTime}
                    onChange={setStartTime}
                  />
                  <DateTimePicker
                    label="Horário de encerramento"
                    icon="🔴"
                    hint="Times incompletos são gerados automaticamente ao fim do prazo"
                    value={deadline}
                    onChange={setDeadline}
                  />
                </div>
              )}

              {/* Pool rules */}
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-400 mb-2">Jogadores entre times</p>
                  <div className="inline-flex bg-gray-800 rounded-lg p-1 gap-1">
                    <button
                      onClick={() => setAllowRepeatPlayers(false)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        !allowRepeatPlayers ? 'bg-draft-green text-white shadow' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Únicos
                    </button>
                    <button
                      onClick={() => setAllowRepeatPlayers(true)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        allowRepeatPlayers ? 'bg-yellow-600 text-white shadow' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Podem repetir
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 mt-1.5">
                    {allowRepeatPlayers ? 'O mesmo jogador pode estar em vários times' : 'Cada jogador só pode estar em um time'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-400 mb-2">Clube por time</p>
                  <div className="inline-flex bg-gray-800 rounded-lg p-1 gap-1">
                    <button
                      onClick={() => setRestrictClubPerTeam(false)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        !restrictClubPerTeam ? 'bg-draft-green text-white shadow' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Livre
                    </button>
                    <button
                      onClick={() => setRestrictClubPerTeam(true)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        restrictClubPerTeam ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      1 por clube
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 mt-1.5">
                    {restrictClubPerTeam ? 'Máximo 1 jogador de cada clube por time' : 'Sem restrição de clube por time'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleStartDraft}
                disabled={!canStart}
                className="btn-primary text-lg px-10 py-4 disabled:opacity-40"
              >
                {canStart
                  ? 'Iniciar Draft'
                  : allReady
                    ? 'Iniciar Draft'
                    : 'Aguardando todos ficarem prontos...'}
              </button>
              {!allReady && hasEnoughPlayers && (
                <p className="text-gray-500 text-sm mt-2">Aguarde — nem todos estão prontos ainda.</p>
              )}
            </div>
          ) : (
            <div className="card inline-block px-8 py-4">
              <p className="text-gray-400">
                {!allReady && hasEnoughPlayers && (
                  <span className="block text-gray-500 text-sm">Aguarde — nem todos estão prontos ainda.</span>
                )}
                {allReady && hasEnoughPlayers && (
                  <span className="block text-gray-400 text-sm">Aguardando admin iniciar...</span>
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
