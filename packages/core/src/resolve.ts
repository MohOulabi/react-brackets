import { allMatches, mapMatches, opponentOf } from './stage';
import type { Id, Match, Slot, SlotOrigin, Stage } from './types';

type Visit = (matchId: Id) => Match;

interface Outcome {
  participantId: Id | null;
  bye: boolean;
  decided: boolean;
}

/**
 * Fills slots from the matches they depend on and derives every match status.
 * Slots whose origin is still undecided keep their current participant, so
 * display-only data (no results yet) is never wiped.
 */
export function resolve(stage: Stage): Stage {
  const source = new Map(allMatches(stage).map((match) => [match.id, match]));
  const resolved = new Map<Id, Match>();

  const visit: Visit = (matchId) => {
    const cached = resolved.get(matchId);
    if (cached) return cached;
    const match = source.get(matchId);
    if (!match) throw new Error(`Match "${matchId}" references an unknown match.`);
    const next = resolveMatch(match, visit);
    resolved.set(matchId, next);
    return next;
  };

  return mapMatches(stage, (match) => visit(match.id));
}

/** The match with its slots and status worked out, or the same object when nothing changed. */
function resolveMatch(match: Match, visit: Visit): Match {
  const next = settle(match, visit);
  return next.status === match.status &&
    next.winner === match.winner &&
    next.slots[0] === match.slots[0] &&
    next.slots[1] === match.slots[1]
    ? match
    : next;
}

function settle(match: Match, visit: Visit): Match {
  const slots: [Slot, Slot] = [
    resolveSlot(match.slots[0], visit),
    resolveSlot(match.slots[1], visit),
  ];
  const [first, second] = slots;

  if (match.playedIf) {
    const { winner } = visit(match.playedIf.matchId);
    if (winner === null) return { ...match, slots, status: 'waiting', winner: null };
    if (winner !== match.playedIf.winner) {
      return {
        ...match,
        slots: [clearScore(first), clearScore(second)],
        status: 'skipped',
        winner: null,
      };
    }
  }

  if (first.bye && second.bye) {
    return {
      ...match,
      slots: [clearScore(first), clearScore(second)],
      status: 'skipped',
      winner: null,
    };
  }

  if (first.bye || second.bye) {
    const advancing = first.bye ? 1 : 0;
    const ready = slots[advancing].participantId !== null;
    return {
      ...match,
      slots: [clearScore(first), clearScore(second)],
      status: ready ? 'completed' : 'waiting',
      winner: ready ? advancing : null,
    };
  }

  if (first.participantId === null || second.participantId === null) {
    return { ...match, slots, status: 'waiting', winner: null };
  }

  if (match.winner !== null) return { ...match, slots, status: 'completed' };
  if (match.status === 'live' || match.status === 'completed') return { ...match, slots };
  return { ...match, slots, status: 'ready' };
}

function resolveSlot(slot: Slot, visit: Visit): Slot {
  if (!slot.origin) return slot;
  const outcome = outcomeOf(visit(slot.origin.matchId), slot.origin);
  if (!outcome.decided) return slot;

  if (
    outcome.bye
      ? slot.bye && slot.participantId === null
      : !slot.bye && slot.participantId === outcome.participantId
  ) {
    return slot;
  }
  const { bye: _bye, ...rest } = slot;
  return outcome.bye
    ? { ...rest, participantId: null, bye: true }
    : { ...rest, participantId: outcome.participantId };
}

function outcomeOf(match: Match, origin: SlotOrigin): Outcome {
  if (match.status === 'skipped') return { participantId: null, bye: true, decided: true };
  if (match.winner === null) return { participantId: null, bye: false, decided: false };

  const slot = match.slots[origin.outcome === 'winner' ? match.winner : opponentOf(match.winner)];
  return { participantId: slot.participantId, bye: slot.bye === true, decided: true };
}

function clearScore(slot: Slot): Slot {
  if (!('score' in slot)) return slot;
  const { score: _score, ...rest } = slot;
  return rest;
}
