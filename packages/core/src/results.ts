import { resolve } from './resolve';
import { allMatches, getMatch, mapMatches } from './stage';
import type { Id, Match, SlotIndex, Stage } from './types';

export interface MatchResult {
  /** Top score first. Leave out to keep the scores already recorded. */
  scores?: [number, number];
  /**
   * The winning slot. Inferred from `scores` when left out; needed to break a
   * tie in an elimination format. `null` records a draw.
   */
  winner?: SlotIndex | null;
  /**
   * Keeps the match open with its current scores, for example while streaming
   * live scores. Nobody advances until a result without `live` is reported.
   * @defaultValue false
   */
  live?: boolean;
}

/**
 * Records a result and returns a new stage, with the winner and loser moved on
 * to whatever matches they feed. Changing an earlier result clears every result
 * that depended on it.
 *
 * @throws When the match is not ready to be played, or was decided by a bye.
 * @example
 * stage = reportResult(stage, 'main.r1.m1', { scores: [3, 1] });
 * stage = reportResult(stage, 'main.r1.m2', { scores: [1, 1], live: true });
 */
export function reportResult(stage: Stage, matchId: Id, result: MatchResult): Stage {
  const match = getMatch(stage, matchId);
  if (!isPlayable(match)) {
    throw new Error(`Match "${matchId}" cannot take a result while it is ${match.status}.`);
  }

  const scores = result.scores ?? [match.slots[0].score, match.slots[1].score];
  const winner = result.live
    ? null
    : result.winner !== undefined
      ? result.winner
      : winnerFromScores(scores);

  const updated: Match = {
    ...match,
    slots: [withScore(match.slots[0], scores[0]), withScore(match.slots[1], scores[1])],
    status: result.live ? 'live' : 'completed',
    winner,
  };

  const outcomeChanged = match.winner !== null && match.winner !== winner;
  const next = replaceMatch(stage, updated);
  return resolve(outcomeChanged ? clearDependents(next, matchId) : next);
}

/**
 * Clears a result and returns a new stage. The match becomes ready again, and
 * every slot and result that depended on it is cleared too.
 */
export function resetResult(stage: Stage, matchId: Id): Stage {
  const match = getMatch(stage, matchId);
  const cleared: Match = {
    ...match,
    slots: [withScore(match.slots[0], undefined), withScore(match.slots[1], undefined)],
    status: 'ready',
    winner: null,
  };
  return resolve(clearDependents(replaceMatch(stage, cleared), matchId));
}

function isPlayable(match: Match): boolean {
  const hasBye = match.slots.some((slot) => slot.bye);
  return (
    !hasBye && (match.status === 'ready' || match.status === 'live' || match.status === 'completed')
  );
}

function winnerFromScores([first, second]: [
  number | undefined,
  number | undefined,
]): SlotIndex | null {
  if (first === undefined || second === undefined || first === second) return null;
  return first > second ? 0 : 1;
}

function withScore<T extends { score?: number }>(slot: T, score: number | undefined): T {
  const { score: _score, ...rest } = slot;
  return (score === undefined ? rest : { ...rest, score }) as T;
}

function replaceMatch(stage: Stage, updated: Match): Stage {
  return mapMatches(stage, (match) => (match.id === updated.id ? updated : match));
}

/** Empties every slot fed by `matchId`, and everything fed by those, recursively. */
function clearDependents(stage: Stage, matchId: Id): Stage {
  const cleared = new Set([matchId]);
  let frontier = [matchId];

  while (frontier.length > 0) {
    const sources = new Set(frontier);
    frontier = allMatches(stage)
      .filter((match) =>
        match.slots.some((slot) => slot.origin && sources.has(slot.origin.matchId)),
      )
      .map((match) => match.id)
      .filter((id) => !cleared.has(id));
    for (const id of frontier) cleared.add(id);
  }
  cleared.delete(matchId);

  return mapMatches(stage, (match) => {
    if (!cleared.has(match.id)) return match;
    const slots = match.slots.map((slot) => {
      const fed =
        slot.origin && (cleared.has(slot.origin.matchId) || slot.origin.matchId === matchId);
      if (!fed) return withScore(slot, undefined);
      const { bye: _bye, score: _score, ...rest } = slot;
      return { ...rest, participantId: null };
    }) as Match['slots'];
    return { ...match, slots, status: 'waiting', winner: null };
  });
}
