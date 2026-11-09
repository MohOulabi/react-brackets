import { resolve } from '../resolve';
import { bracketSize, eliminationRoundName, type Seeding, seedPositions } from '../seeding';
import { assertEntrants, createMatch, loserOf, winnerOf } from '../stage';
import type { Group, Id, Match, Participant, Round, Slot, Stage } from '../types';
import { knockoutRounds, type RoundNamer } from './single-elimination';

/**
 * - `reset`: if the losers bracket champion wins the final, a second final decides it.
 * - `single`: one final, whatever happens.
 * - `none`: no grand final.
 */
export type GrandFinal = 'single' | 'reset' | 'none';

export interface DoubleEliminationOptions {
  /**
   * Prefixes every group, round and match id. Groups are `{id}.wb`, `{id}.lb` and `{id}.gf`.
   * @defaultValue 'main'
   */
  id?: Id;
  /**
   * How the winners bracket is seeded. See `SingleEliminationOptions.seeding`.
   * @defaultValue 'standard'
   */
  seeding?: Seeding;
  /**
   * How the stage ends.
   * @defaultValue 'reset'
   */
  grandFinal?: GrandFinal;
  /**
   * Names the winners bracket rounds.
   * @defaultValue `Round 1`… `Semifinals` and `Winners final`
   */
  roundName?: RoundNamer;
}

/**
 * Builds a double elimination stage: a winners bracket, a losers bracket fed by
 * its losers, and a grand final. Everyone is out after their second loss.
 *
 * @param participants In seed order. At least three, with unique ids.
 * @example
 * const stage = doubleElimination(teams, { grandFinal: 'single' });
 */
export function doubleElimination(
  participants: Participant[],
  options: DoubleEliminationOptions = {},
): Stage {
  const { id = 'main', seeding = 'standard', grandFinal = 'reset', roundName } = options;
  assertEntrants(participants, 3);

  const entrants = seedPositions(bracketSize(participants.length), seeding).map(
    (seed) => participants[seed - 1] ?? null,
  );
  const winners = knockoutRounds(`${id}.wb`, entrants, roundName ?? winnersRoundName);
  const losers = losersRounds(`${id}.lb`, winners);

  const groups: Group[] = [
    { id: `${id}.wb`, kind: 'winners', name: 'Winners bracket', rounds: winners },
    { id: `${id}.lb`, kind: 'losers', name: 'Losers bracket', rounds: losers },
  ];

  const winnersFinal = winners.at(-1)?.matches[0];
  const losersFinal = losers.at(-1)?.matches[0];
  if (grandFinal !== 'none' && winnersFinal && losersFinal) {
    groups.push(grandFinalGroup(`${id}.gf`, winnersFinal, losersFinal, grandFinal === 'reset'));
  }

  return resolve({ id, format: 'double-elimination', participants, groups });
}

function winnersRoundName(index: number, total: number): string {
  return index === total - 1 ? 'Winners final' : eliminationRoundName(index, total);
}

/**
 * Losers rounds alternate: a "minor" round where losers bracket survivors play
 * each other, then a "major" round where they meet the next winners bracket
 * losers. Drop-ins are mirrored every other round to delay rematches.
 */
function losersRounds(groupId: Id, winners: Round[]): Round[] {
  const rounds: Round[] = [];
  const total = (winners.length - 1) * 2;
  let survivors: Match[] = [];

  const push = (pairs: [Slot, Slot][]) => {
    const index = rounds.length;
    const roundId = `${groupId}.r${index + 1}`;
    const matches = pairs.map((slots, position) =>
      createMatch(`${roundId}.m${position + 1}`, slots),
    );
    rounds.push({
      id: roundId,
      name: index === total - 1 ? 'Losers final' : `Round ${index + 1}`,
      matches,
    });
    survivors = matches;
  };

  winners.slice(0, -1).forEach((_, index) => {
    if (index === 0) {
      const dropped = winners[0]?.matches ?? [];
      push(pairsOf(dropped).map(([top, bottom]) => [loserOf(top.id), loserOf(bottom.id)]));
    } else {
      push(pairsOf(survivors).map(([top, bottom]) => [winnerOf(top.id), winnerOf(bottom.id)]));
    }

    const incoming = winners[index + 1]?.matches ?? [];
    const ordered = index % 2 === 0 ? [...incoming].reverse() : incoming;
    push(
      survivors.map((survivor, position) => {
        const dropIn = ordered[position];
        if (!dropIn) throw new Error('Losers bracket is out of step with the winners bracket.');
        return [winnerOf(survivor.id), loserOf(dropIn.id)];
      }),
    );
  });

  return rounds;
}

function grandFinalGroup(
  groupId: Id,
  winnersFinal: Match,
  losersFinal: Match,
  reset: boolean,
): Group {
  const first = createMatch(`${groupId}.r1.m1`, [
    winnerOf(winnersFinal.id),
    winnerOf(losersFinal.id),
  ]);
  const rounds: Round[] = [{ id: `${groupId}.r1`, name: 'Grand final', matches: [first] }];

  if (reset) {
    const second: Match = {
      ...createMatch(`${groupId}.r2.m1`, [loserOf(first.id), winnerOf(first.id)]),
      playedIf: { matchId: first.id, winner: 1 },
    };
    rounds.push({ id: `${groupId}.r2`, name: 'Reset', matches: [second] });
  }

  return { id: groupId, kind: 'grand-final', name: 'Grand final', rounds };
}

function pairsOf(matches: Match[]): [Match, Match][] {
  const pairs: [Match, Match][] = [];
  for (let index = 0; index + 1 < matches.length; index += 2) {
    const top = matches[index];
    const bottom = matches[index + 1];
    if (top && bottom) pairs.push([top, bottom]);
  }
  return pairs;
}
