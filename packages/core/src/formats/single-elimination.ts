import { resolve } from '../resolve';
import { bracketSize, eliminationRoundName, type Seeding, seedPositions } from '../seeding';
import { assertEntrants, createMatch, entrantSlot, loserOf, winnerOf } from '../stage';
import type { Group, Id, Match, Participant, Round, Stage } from '../types';

/**
 * Names a round from its position: `index` counts from 0 and `total` is the
 * number of rounds. Return any string, for example a translation.
 */
export type RoundNamer = (index: number, total: number) => string;

export interface SingleEliminationOptions {
  /**
   * Prefixes every group, round and match id. Change it when one page shows
   * several stages.
   * @defaultValue 'main'
   */
  id?: Id;
  /**
   * `standard` keeps the top seeds apart until the late rounds (1 v 8, 4 v 5,
   * 2 v 7, 3 v 6). `sequential` pairs entrants in the order given (1 v 2, 3 v 4).
   * @defaultValue 'standard'
   */
  seeding?: Seeding;
  /**
   * Adds a match between the two semifinal losers, in its own group.
   * @defaultValue false
   */
  thirdPlace?: boolean;
  /**
   * Names each round.
   * @defaultValue `Round 1`, `Round 2`… then `Quarterfinals`, `Semifinals` and `Final`
   */
  roundName?: RoundNamer;
}

/**
 * Builds a knockout bracket. Any number of participants works: when the field is
 * not a power of two, the top seeds get byes, which resolve on their own.
 *
 * @param participants In seed order: the first one is the top seed. At least two, with unique ids.
 * @example
 * const stage = singleElimination(teams, { thirdPlace: true });
 */
export function singleElimination(
  participants: Participant[],
  options: SingleEliminationOptions = {},
): Stage {
  const { id = 'main', seeding = 'standard', thirdPlace = false, roundName } = options;
  assertEntrants(participants, 2);

  const entrants = seedPositions(bracketSize(participants.length), seeding).map(
    (seed) => participants[seed - 1] ?? null,
  );
  const rounds = knockoutRounds(id, entrants, roundName ?? eliminationRoundName);
  const groups: Group[] = [{ id, kind: 'bracket', name: 'Bracket', rounds }];

  const semifinals = rounds.at(-2);
  if (thirdPlace && semifinals?.matches.length === 2) {
    groups.push(thirdPlaceGroup(id, semifinals));
  }

  return resolve({ id, format: 'single-elimination', participants, groups });
}

export function knockoutRounds(
  groupId: Id,
  entrants: (Participant | null)[],
  roundName: RoundNamer,
): Round[] {
  const total = Math.log2(entrants.length);
  const rounds: Round[] = [];
  let previous: Match[] = [];

  for (let index = 0; index < total; index++) {
    const roundId = `${groupId}.r${index + 1}`;
    const count = entrants.length / 2 ** (index + 1);
    const matches = Array.from({ length: count }, (_, position) => {
      const id = `${roundId}.m${position + 1}`;
      if (index === 0) {
        return createMatch(id, [
          entrantSlot(entrants[position * 2] ?? null),
          entrantSlot(entrants[position * 2 + 1] ?? null),
        ]);
      }
      const [top, bottom] = [previous[position * 2], previous[position * 2 + 1]];
      if (!top || !bottom) throw new Error('Knockout rounds must halve in size.');
      return createMatch(id, [winnerOf(top.id), winnerOf(bottom.id)]);
    });
    rounds.push({ id: roundId, name: roundName(index, total), matches });
    previous = matches;
  }

  return rounds;
}

function thirdPlaceGroup(stageId: Id, semifinals: Round): Group {
  const [first, second] = semifinals.matches;
  if (!first || !second) throw new Error('A third place match needs two semifinals.');
  const id = `${stageId}.third`;
  return {
    id,
    kind: 'third-place',
    name: 'Third place',
    rounds: [
      {
        id: `${id}.r1`,
        name: 'Third place',
        matches: [createMatch(`${id}.r1.m1`, [loserOf(first.id), loserOf(second.id)])],
      },
    ],
  };
}
