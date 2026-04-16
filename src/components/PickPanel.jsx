import React, { useEffect, useRef, useState } from 'react';
import DraftPlayerCard from './DraftPlayerCard.jsx';
import { getDetailedPositionLabel, matchesDetailedPositionSlot } from '../utils/positions.js';

const DETAILED_TO_BASIC = {
  1: 1, 2: 2, 3: 2, 4: 2, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3, 10: 4, 11: 4, 12: 4, 13: 4,
};

const POS_COLORS = {
  1: 'border-blue-500 bg-blue-900/60 text-blue-300',
  2: 'border-green-600 bg-green-900/60 text-green-300',
  3: 'border-yellow-500 bg-yellow-900/60 text-yellow-300',
  4: 'border-red-500 bg-red-900/60 text-red-300',
};

const BENCH_SLOT_META = {
  12: { label: 'GOL RES', basicPos: 1 },
  13: { label: 'DEF RES', basicPos: 2 },
  14: { label: 'DEF RES', basicPos: 2 },
  15: { label: 'M/A RES', basicPos: 3 },
  16: { label: 'M/A RES', basicPos: 3 },
  17: { label: 'M/A RES', basicPos: 3 },
  18: { label: 'M/A RES', basicPos: 3 },
};

const CARD_WIDTH = 210;
const CARD_GAP = 12;

export default function PickPanel({ options, slotDetailedPositionId, slotPosition = null, isCaptainPick = false, onPickPlayer, onClose, fadingOut = false }) {
  const scrollerRef = useRef(null);
  const [sidePadding, setSidePadding] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const safeOptions = options || [];

  const benchMeta = slotPosition ? BENCH_SLOT_META[slotPosition] : null;
  const isBenchSlot = Boolean(benchMeta);
  const basicPos = isBenchSlot ? benchMeta.basicPos : (DETAILED_TO_BASIC[slotDetailedPositionId] || 1);
  const posLabel = isCaptainPick
    ? 'CAPITAO'
    : isBenchSlot
      ? benchMeta.label
      : getDetailedPositionLabel(slotDetailedPositionId);
  const badgeClass = isCaptainPick
    ? 'border-yellow-500 bg-yellow-900/30 text-yellow-300'
    : (POS_COLORS[basicPos] || POS_COLORS[1]);
  const normalizedSlotPositionId = Number(slotDetailedPositionId);
  const visibleOptions = isCaptainPick || isBenchSlot || Number.isNaN(normalizedSlotPositionId) || normalizedSlotPositionId <= 0
    ? safeOptions
    : safeOptions.filter((player) => matchesDetailedPositionSlot(player, normalizedSlotPositionId));

  useEffect(() => {
    const updateScroller = () => {
      const element = scrollerRef.current;
      if (!element) {
        setSidePadding(0);
        setCanScrollLeft(false);
        setCanScrollRight(false);
        return;
      }

      const nextPadding = Math.max((element.clientWidth - CARD_WIDTH) / 2, 0);
      setSidePadding(nextPadding);

      const maxScrollLeft = element.scrollWidth - element.clientWidth;
      setCanScrollLeft(element.scrollLeft > 8);
      setCanScrollRight(maxScrollLeft - element.scrollLeft > 8);
    };

    updateScroller();

    const element = scrollerRef.current;
    if (!element) return undefined;

    element.scrollTo({ left: 0, behavior: 'auto' });
    element.addEventListener('scroll', updateScroller, { passive: true });
    window.addEventListener('resize', updateScroller);

    return () => {
      element.removeEventListener('scroll', updateScroller);
      window.removeEventListener('resize', updateScroller);
    };
  }, [visibleOptions.length]);

  useEffect(() => {
    setIsEntering(false);

    const rafId = window.requestAnimationFrame(() => {
      setIsEntering(true);
    });

    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [options, slotDetailedPositionId, slotPosition, isCaptainPick]);

  const handleScrollArrow = (direction) => {
    const element = scrollerRef.current;
    if (!element) return;

    const scrollAmount = Math.max(element.clientWidth * 0.75, CARD_WIDTH + CARD_GAP);
    element.scrollBy({
      left: direction * scrollAmount,
      behavior: 'smooth',
    });
  };

  if (!options) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 overflow-y-auto"
      style={{
        opacity: fadingOut ? 0 : 1,
        pointerEvents: fadingOut ? 'none' : 'auto',
        transition: 'opacity 0.3s ease',
        background:
          'radial-gradient(circle at top, rgba(250,204,21,0.08), transparent 28%), rgba(2,6,23,0.88)',
      }}
    >
      <style>{`
        @keyframes pick-panel-title-in {
          0% {
            opacity: 0;
            transform: translateY(18px) scale(0.96);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes pick-panel-card-in {
          0% {
            opacity: 0;
            transform: translate(var(--burst-x, 0px), var(--burst-y, 0px)) scale(0.2) rotate(var(--card-tilt, 0deg));
            filter: blur(14px);
          }
          58% {
            opacity: 1;
            transform: translate(calc(var(--burst-x, 0px) * -0.08), calc(var(--burst-y, 0px) * -0.08)) scale(1.04) rotate(calc(var(--card-tilt, 0deg) * 0.32));
            filter: blur(0);
          }
          100% {
            opacity: 1;
            transform: translate(0, 0) scale(1) rotate(0deg);
            filter: blur(0);
          }
        }

        @keyframes pick-panel-core-burst {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.2);
          }
          42% {
            opacity: 0.42;
            transform: translate(-50%, -50%) scale(1.18);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(1.85);
          }
        }
      `}</style>
      <div className="flex flex-col items-center justify-center min-h-full p-3 sm:p-4 gap-4 sm:gap-6">
        <div
          className="text-center"
          style={{
            animation: isEntering ? 'pick-panel-title-in 0.42s cubic-bezier(0.22, 1, 0.36, 1) both' : 'none',
          }}
        >
          <span className={`border text-sm font-bold px-4 py-1.5 rounded-lg shadow-[0_12px_32px_rgba(0,0,0,0.22)] ${badgeClass}`}>
            {isCaptainPick ? 'CAPITAO' : posLabel}
          </span>
          <p className="mt-2 text-draft-gold font-semibold">Escolha um jogador</p>
        </div>
        <div className="relative w-full">
          {visibleOptions.length > 0 && (
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(250,204,21,0.4)_0%,rgba(251,191,36,0.18)_28%,rgba(250,204,21,0.08)_48%,transparent_72%)]"
              style={{
                animation: isEntering ? 'pick-panel-core-burst 0.62s cubic-bezier(0.22, 1, 0.36, 1) both' : 'none',
              }}
            />
          )}
          <div
            ref={scrollerRef}
            className="relative z-10 flex flex-nowrap gap-3 overflow-x-auto w-full pb-2 snap-x snap-mandatory sm:flex-wrap sm:justify-center sm:overflow-x-visible"
            style={{
              paddingLeft: sidePadding,
              paddingRight: sidePadding,
            }}
          >
            {visibleOptions.length > 0 ? (
              visibleOptions.map((player, index) => (
                <div
                  key={player.id}
                  className="snap-center"
                  style={{
                    opacity: isEntering ? 1 : 0,
                    animation: isEntering
                      ? `pick-panel-card-in 0.56s cubic-bezier(0.22, 1, 0.36, 1) both`
                      : 'none',
                    animationDelay: `${index * 72}ms`,
                    ['--card-tilt']: `${(index - Math.floor(visibleOptions.length / 2)) * 2.5}deg`,
                    ['--burst-x']: `${(index - Math.floor(visibleOptions.length / 2)) * 54}px`,
                    ['--burst-y']: `${Math.abs(index - Math.floor(visibleOptions.length / 2)) % 2 === 0 ? 24 : -24}px`,
                  }}
                >
                  <DraftPlayerCard
                    player={player}
                    isMyTurn
                    slotPositionId={slotDetailedPositionId}
                    onClick={() => onPickPlayer(player)}
                  />
                </div>
              ))
            ) : (
              <div className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-6 text-center text-sm text-gray-300">
                Nenhum jogador disponível para essa posição.
              </div>
            )}
          </div>

          {visibleOptions.length > 1 && canScrollLeft && (
            <button
              type="button"
              onClick={() => handleScrollArrow(-1)}
              className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/15 bg-black/65 px-3 py-2 text-lg font-black text-white shadow-lg transition hover:bg-black/80 sm:hidden"
              aria-label="Ver opções anteriores"
            >
              {'<'}
            </button>
          )}

          {visibleOptions.length > 1 && canScrollRight && (
            <button
              type="button"
              onClick={() => handleScrollArrow(1)}
              className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/15 bg-black/65 px-3 py-2 text-lg font-black text-white shadow-lg transition hover:bg-black/80 sm:hidden"
              aria-label="Ver próximas opções"
            >
              {'>'}
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-xs text-gray-600 hover:text-gray-400 border border-gray-700 px-4 py-2 rounded-lg"
        >
          Voltar
        </button>
      </div>
    </div>
  );
}
