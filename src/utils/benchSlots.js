import { matchesDetailedPositionSlot } from './positions.js';

// Bench slot constraints (RES 1..7) mirrored from the backend.
// The UI only shows "RES 1..7"; eligibility is enforced by these rules.
export const BENCH_SLOT_IDS = [12, 13, 14, 15, 16, 17, 18];

export const BENCH_SLOT_DETAILED_POSITIONS = {
  // RES 1: GK
  12: [1],
  // RES 2: ZAG
  13: [2],
  // RES 3: ZAG or fullback
  14: [2, 3, 4],
  // RES 4: MC, VOL, MD, ME
  15: [6, 5, 9, 8],
  // RES 5: MEI, MD, ME, PE, PD
  16: [7, 9, 8, 11, 12],
  // RES 6: PE, PD, ATA
  17: [11, 12, 10],
  // RES 7: ATA
  18: [10],
};

function getPlayerId(player) {
  return player?.id ?? player?.player_id ?? null;
}

export function canPlayerPlayBenchSlot(player, benchSlotPosition) {
  const allowed = BENCH_SLOT_DETAILED_POSITIONS[Number(benchSlotPosition)] || null;
  if (!player || !allowed) return false;
  return allowed.some((posId) => matchesDetailedPositionSlot(player, posId));
}

// Finds a bench reassignment (mapping slot->player) after removing one bench player
// and inserting an incoming player (typically the displaced starter).
//
// The solver is intentionally small (7 slots) and prefers solutions that keep players
// in their current bench slots whenever possible (minimal changes).
export function findBenchReassignment(benchPlayersBySlot, removedBenchSlotPosition, incomingPlayer) {
  const benchSlots = BENCH_SLOT_IDS;
  const removedSlot = Number(removedBenchSlotPosition);

  const current = {};
  for (const s of benchSlots) {
    current[s] = benchPlayersBySlot?.[s] ?? null;
  }

  const players = [];
  for (const s of benchSlots) {
    if (s === removedSlot) continue;
    if (current[s]) players.push(current[s]);
  }
  if (incomingPlayer) players.push(incomingPlayer);

  if (players.length !== benchSlots.length) return null;

  // Backtracking assignment with pruning by best cost.
  let best = null;
  let bestCost = Number.POSITIVE_INFINITY;
  const used = new Set();
  const assignment = {};

  const orderedSlots = [...benchSlots].sort((a, b) => {
    const aCount = (BENCH_SLOT_DETAILED_POSITIONS[a] || []).length;
    const bCount = (BENCH_SLOT_DETAILED_POSITIONS[b] || []).length;
    // Fill tighter slots first.
    return aCount - bCount;
  });

  function backtrack(idx, cost) {
    if (cost >= bestCost) return;
    if (idx >= orderedSlots.length) {
      best = { ...assignment };
      bestCost = cost;
      return;
    }

    const slot = orderedSlots[idx];
    const currentPlayer = current[slot];
    const currentId = getPlayerId(currentPlayer);

    // Candidate ordering: keep current bench player in the same slot if possible.
    const candidates = [...players].sort((a, b) => {
      const aId = getPlayerId(a);
      const bId = getPlayerId(b);
      const aKeep = currentId && aId === currentId ? 0 : 1;
      const bKeep = currentId && bId === currentId ? 0 : 1;
      return aKeep - bKeep;
    });

    for (const p of candidates) {
      const pid = getPlayerId(p);
      if (!pid || used.has(pid)) continue;
      if (!canPlayerPlayBenchSlot(p, slot)) continue;

      used.add(pid);
      assignment[slot] = p;
      const delta = currentId && pid === currentId ? 0 : 1;
      backtrack(idx + 1, cost + delta);
      used.delete(pid);
      delete assignment[slot];
    }
  }

  backtrack(0, 0);

  if (!best) return null;

  // Convert back to natural bench slot order.
  const normalized = {};
  for (const s of benchSlots) normalized[s] = best[s] ?? null;
  return normalized;
}

