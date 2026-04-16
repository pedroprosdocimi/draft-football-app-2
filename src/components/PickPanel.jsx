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
      }}
    >
      <div className="flex flex-col items-center justify-center min-h-full p-3 sm:p-4 gap-4 sm:gap-6">
        <div className="text-center">
          <span className={`border text-sm font-bold px-4 py-1.5 rounded-lg ${badgeClass}`}>
            {isCaptainPick ? 'CAPITAO' : posLabel}
          </span>
          <p className="text-draft-gold font-semibold mt-2">Escolha um jogador</p>
        </div>
        <div className="relative w-full">
          <div
            ref={scrollerRef}
            className="flex flex-nowrap gap-3 overflow-x-auto w-full pb-2 snap-x snap-mandatory sm:flex-wrap sm:justify-center sm:overflow-x-visible"
            style={{
              paddingLeft: sidePadding,
              paddingRight: sidePadding,
            }}
          >
            {visibleOptions.length > 0 ? (
              visibleOptions.map((player) => (
                <div key={player.id} className="snap-center">
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
