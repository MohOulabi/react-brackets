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
   * Splits participants into this many groups, snake seeded so the top seeds spread out.
   * @defaultValue 1
   */
  groups?: number;
  /**
   * `2` plays every pairing twice, with sides swapped in the second leg.
   * @defaultValue 1
   */
  legs?: 1 | 2;
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
  const { id = 'main', groups: count = 1, legs = 1, groupName = letterName } = options;
  assertEntrants(participants, 2 * count);

  const groups: Group[] = snake(participants, count).map((members, index) => {
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
function circleRounds(groupId: Id, members: Participant[], legs: 1 | 2): Round[] {
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

  const rematches =
    legs === 2 ? schedule.map((pairs) => pairs.map(([home, away]): [Id, Id] => [away, home])) : [];
  return [...schedule, ...rematches].map((pairs, index) => roundOf(groupId, index, pairs));
}

function roundOf(groupId: Id, index: number, pairs: [Id, Id][]): Round {
  const roundId = `${groupId}.r${index + 1}`;
  const matches: Match[] = pairs.map(([home, away], position) =>
    createMatch(`${roundId}.m${position + 1}`, [{ participantId: home }, { participantId: away }]),
  );
  return { id: roundId, name: `Round ${index + 1}`, matches };
}
