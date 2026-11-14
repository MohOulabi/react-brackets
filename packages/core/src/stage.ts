import type { Id, Match, Participant, Slot, SlotIndex, Stage } from './types';

export function opponentOf(index: SlotIndex): SlotIndex {
  return index === 0 ? 1 : 0;
}

export function createMatch(id: Id, slots: [Slot, Slot]): Match {
  return { id, slots, status: 'waiting', winner: null };
}

export function entrantSlot(participant: Participant | null): Slot {
  return participant ? { participantId: participant.id } : { participantId: null, bye: true };
}

export function winnerOf(matchId: Id): Slot {
  return { participantId: null, origin: { matchId, outcome: 'winner' } };
}

export function loserOf(matchId: Id): Slot {
  return { participantId: null, origin: { matchId, outcome: 'loser' } };
}

/** Every match in the stage, group by group and round by round. */
export function allMatches(stage: Stage): Match[] {
  return stage.groups.flatMap((group) => group.rounds.flatMap((round) => round.matches));
}

/** The match with this id, or `undefined`. */
export function findMatch(stage: Stage, matchId: Id): Match | undefined {
  return allMatches(stage).find((match) => match.id === matchId);
}

/**
 * The match with this id.
 * @throws When the stage has no match with this id.
 */
export function getMatch(stage: Stage, matchId: Id): Match {
  const match = findMatch(stage, matchId);
  if (!match) throw new Error(`Match "${matchId}" does not exist in stage "${stage.id}".`);
  return match;
}

/**
 * Maps every match. Rounds, groups and the stage are copied only where a match
 * changed, so unchanged parts keep their identity and a renderer can skip them.
 */
export function mapMatches(stage: Stage, map: (match: Match) => Match): Stage {
  const groups = shared(stage.groups, (group) => {
    const rounds = shared(group.rounds, (round) => {
      const matches = shared(round.matches, map);
      return matches === round.matches ? round : { ...round, matches };
    });
    return rounds === group.rounds ? group : { ...group, rounds };
  });
  return groups === stage.groups ? stage : { ...stage, groups };
}

/** Like `map`, but returns the same array when every item maps to itself. */
function shared<T>(items: T[], map: (item: T) => T): T[] {
  const mapped = items.map(map);
  return mapped.every((item, index) => item === items[index]) ? items : mapped;
}

/** `true` once every match is completed or skipped. */
export function isComplete(stage: Stage): boolean {
  return allMatches(stage).every(
    (match) => match.status === 'completed' || match.status === 'skipped',
  );
}

/** Participants by id, for looking up names while rendering. */
export function participantMap(stage: Stage): Map<Id, Participant> {
  return new Map(stage.participants.map((participant) => [participant.id, participant]));
}

export function assertEntrants(participants: Participant[], minimum: number): void {
  if (participants.length < minimum) {
    throw new RangeError(`This format needs at least ${minimum} participants.`);
  }
  const ids = new Set(participants.map((participant) => participant.id));
  if (ids.size !== participants.length) {
    throw new Error('Participant ids must be unique.');
  }
}
