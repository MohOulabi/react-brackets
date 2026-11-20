import { resolve } from '../resolve';
import { assertEntrants, createMatch } from '../stage';
import type { Group, Id, Match, Participant, Round, Stage } from '../types';

export interface RoundRobinOptions {
  /**
   * Prefixes every group, round and match id. Groups are `{id}.g1`, `{id}.g2`…
   * @defaultValue 'main'
   */
  id?: Id;
  /**
   * How participants are grouped. A number splits them into that many groups, snake seeded so the top seeds
   * spread out. Lists of participant ids set the groups yourself, for example the top and bottom halves of a
   * table before a split. Every participant goes in exactly one group.
   * @defaultValue 1
   */
  groups?: number | Id[][];
  /**
   * How many times every pairing plays. Sides swap from one leg to the next.
   * @defaultValue 1
   */
  legs?: number;
  /**
   * Names each group from its index, counting from 0.
   * @defaultValue `Group A`, `Group B`…
   */
  groupName?: (index: number) => string;
}

const letterName = (index: number) => `Group ${String.fromCharCode(65 + index)}`;

/**
 * Builds a league where everyone in a group plays everyone else once per leg.
 * Nobody plays twice in a round, and an odd group gets a rest round. Rank the
 * result with `standings`.
 *
 * @param participants In seed order. At least two per group, with unique ids.
 * @example
 * const stage = roundRobin(teams, { groups: 2 });
 */
export function roundRobin(participants: Participant[], options: RoundRobinOptions = {}): Stage {
  const { id = 'main', groups: grouping = 1, legs = 1, groupName = letterName } = options;
  if (!Number.isInteger(legs) || legs < 1)
    throw new RangeError('`legs` must be a whole number, 1 or more.');
  const grouped =
    typeof grouping === 'number'
      ? snakeGroups(participants, grouping)
      : chosenGroups(participants, grouping);

  const groups: Group[] = grouped.map((members, index) => {
    const groupId = `${id}.g${index + 1}`;
    return {
      id: groupId,
      kind: 'pool',
      name: groupName(index),
      rounds: circleRounds(groupId, members, legs),
    };
  });

  return resolve({ id, format: 'round-robin', participants, groups });
}

function snakeGroups(participants: Participant[], count: number): Participant[][] {
  assertEntrants(participants, 2 * count);
  return snake(participants, count);
}

/** The groups as listed, checked so nobody is left out or placed twice. */
function chosenGroups(participants: Participant[], groups: Id[][]): Participant[][] {
  assertEntrants(participants, 2 * groups.length);
  const byId = new Map(participants.map((participant) => [participant.id, participant]));
  const placed = new Set<Id>();
  const members = groups.map((ids) => {
    if (ids.length < 2) throw new RangeError('Every group needs at least two participants.');
    return ids.map((participantId) => {
      const participant = byId.get(participantId);
      if (!participant) throw new Error(`Participant "${participantId}" is not in this stage.`);
      if (placed.has(participantId)) {
        throw new Error(`Participant "${participantId}" is in more than one group.`);
      }
      placed.add(participantId);
      return participant;
    });
  });
  const missing = participants.find((participant) => !placed.has(participant.id));
  if (missing) throw new Error(`Participant "${missing.id}" is not in any group.`);
  return members;
}

function snake<T>(items: T[], count: number): T[][] {
  const buckets: T[][] = Array.from({ length: count }, () => []);
  items.forEach((item, index) => {
    const lap = Math.floor(index / count);
    const position = index % count;
    buckets[lap % 2 === 0 ? position : count - 1 - position]?.push(item);
  });
  return buckets;
}

/**
 * The circle method: one seat stays fixed while the rest rotate, so every pair
 * meets exactly once per leg. An odd group gets an empty seat, which means a rest round.
 */
function circleRounds(groupId: Id, members: Participant[], legs: number): Round[] {
  let seats: (Id | null)[] = members.map((member) => member.id);
  if (seats.length % 2 === 1) seats.push(null);
  const schedule: [Id, Id][][] = [];

  for (let index = 0; index < seats.length - 1; index++) {
    const pairs: [Id, Id][] = [];
    for (let seat = 0; seat < seats.length / 2; seat++) {
      const home = seats[seat];
      const away = seats[seats.length - 1 - seat];
      if (!home || !away) continue;
      pairs.push(seat === 0 && index % 2 === 1 ? [away, home] : [home, away]);
    }
    schedule.push(pairs);
    seats = [seats[0] ?? null, seats.at(-1) ?? null, ...seats.slice(1, -1)];
  }

  const swapped = schedule.map((pairs) => pairs.map(([home, away]): [Id, Id] => [away, home]));
  const all = Array.from({ length: legs }, (_, leg) => (leg % 2 === 0 ? schedule : swapped)).flat();
  return all.map((pairs, index) => roundOf(groupId, index, pairs));
}

function roundOf(groupId: Id, index: number, pairs: [Id, Id][]): Round {
  const roundId = `${groupId}.r${index + 1}`;
  const matches: Match[] = pairs.map(([home, away], position) =>
    createMatch(`${roundId}.m${position + 1}`, [{ participantId: home }, { participantId: away }]),
  );
  return { id: roundId, name: `Round ${index + 1}`, matches };
}
