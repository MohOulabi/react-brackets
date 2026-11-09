import { resolve } from '../resolve';
import { assertEntrants, createMatch } from '../stage';
import { standings } from '../standings';
import type { Group, Id, Match, Participant, Slot, Stage } from '../types';

export interface SwissOptions {
  /**
   * Prefixes every group, round and match id.
   * @defaultValue 'main'
   */
  id?: Id;
  /**
   * How many rounds to play.
   * @defaultValue enough to leave one unbeaten player: ⌈log₂ participants⌉
   */
  rounds?: number;
}

/**
 * Starts a Swiss stage with its first round paired: the top half of the field
 * meets the bottom half. Pair each following round with `nextSwissRound` once
 * the current one is finished.
 *
 * @param participants In seed order. At least two, with unique ids.
 * @example
 * let stage = swiss(players, { rounds: 5 });
 */
export function swiss(participants: Participant[], options: SwissOptions = {}): Stage {
  const { id = 'main', rounds = Math.ceil(Math.log2(participants.length)) } = options;
  assertEntrants(participants, 2);

  const group: Group = {
    id: `${id}.swiss`,
    kind: 'pool',
    name: 'Swiss',
    rounds: [],
    meta: { rounds },
  };
  return nextSwissRound({ id, format: 'swiss', participants, groups: [group] });
}

/** How many Swiss rounds are still to be paired. */
export function swissRoundsLeft(stage: Stage): number {
  const group = swissGroup(stage);
  return Number(group.meta?.rounds ?? 0) - group.rounds.length;
}

/**
 * Pairs the next Swiss round: players on equal records meet, highest first, and
 * nobody plays the same opponent twice. With an odd field, the lowest-ranked
 * player without a bye sits out and gets a win.
 *
 * @throws When the current round is unfinished, or every round has been played.
 */
export function nextSwissRound(stage: Stage): Stage {
  const group = swissGroup(stage);
  if (swissRoundsLeft(stage) <= 0) throw new Error('Every Swiss round has been played.');

  const unfinished = group.rounds.flatMap((round) => round.matches).some(isOpen);
  if (unfinished) throw new Error('Finish the current Swiss round before pairing the next one.');

  const history = new Set<string>();
  const byes = new Set<Id>();
  for (const match of group.rounds.flatMap((round) => round.matches)) {
    const [first, second] = match.slots.map((slot) => slot.participantId);
    const solo = first ?? second;
    if (first && second) history.add(pairKey(first, second));
    else if (solo) byes.add(solo);
  }

  let ranked =
    group.rounds.length === 0
      ? stage.participants.map((participant) => participant.id)
      : standings(stage, group.id).map((row) => row.participantId);

  let bye: Id | undefined;
  if (ranked.length % 2 === 1) {
    bye = [...ranked].reverse().find((id) => !byes.has(id)) ?? ranked.at(-1);
    ranked = ranked.filter((id) => id !== bye);
  }
  if (group.rounds.length === 0) ranked = foldHalves(ranked);

  const pairs = pairUp(ranked, history) ?? pairUp(ranked, new Set());
  if (!pairs) throw new Error('Could not pair the next Swiss round.');

  const index = group.rounds.length;
  const roundId = `${group.id}.r${index + 1}`;
  const slots: [Slot, Slot][] = pairs.map(([home, away]) => [
    { participantId: home },
    { participantId: away },
  ]);
  if (bye) slots.push([{ participantId: bye }, { participantId: null, bye: true }]);

  const matches: Match[] = slots.map((pair, position) =>
    createMatch(`${roundId}.m${position + 1}`, pair),
  );
  const next: Group = {
    ...group,
    rounds: [...group.rounds, { id: roundId, name: `Round ${index + 1}`, matches }],
  };

  return resolve({
    ...stage,
    groups: stage.groups.map((item) => (item.id === group.id ? next : item)),
  });
}

function swissGroup(stage: Stage): Group {
  const group = stage.groups[0];
  if (stage.format !== 'swiss' || !group)
    throw new Error(`Stage "${stage.id}" is not a Swiss stage.`);
  return group;
}

function isOpen(match: Match): boolean {
  return match.status !== 'completed' && match.status !== 'skipped';
}

const pairKey = (a: Id, b: Id) => (a < b ? `${a}|${b}` : `${b}|${a}`);

/** Round one pairs the top half against the bottom half: 1 v 5, 2 v 6, and so on. */
function foldHalves(ids: Id[]): Id[] {
  const half = Math.ceil(ids.length / 2);
  return ids.slice(0, half).flatMap((id, index) => {
    const opponent = ids[index + half];
    return opponent ? [id, opponent] : [id];
  });
}

function pairUp(pool: Id[], history: Set<string>): [Id, Id][] | null {
  const [first, ...rest] = pool;
  if (first === undefined) return [];
  for (const [index, opponent] of rest.entries()) {
    if (history.has(pairKey(first, opponent))) continue;
    const remaining = pairUp([...rest.slice(0, index), ...rest.slice(index + 1)], history);
    if (remaining) return [[first, opponent], ...remaining];
  }
  return null;
}
