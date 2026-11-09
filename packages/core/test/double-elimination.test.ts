import { describe, expect, test } from 'bun:test';
import { allMatches, doubleElimination, getMatch, reportResult, type Stage } from '../src';
import { players } from './fixtures';

const playAll = (stage: Stage, winner: 0 | 1 = 0): Stage => {
  let current = stage;
  for (;;) {
    const ready = allMatches(current).find((match) => match.status === 'ready');
    if (!ready) return current;
    current = reportResult(current, ready.id, { scores: winner === 0 ? [1, 0] : [0, 1] });
  }
};

describe('doubleElimination', () => {
  test('builds winners, losers and grand final groups', () => {
    const stage = doubleElimination(players(8));

    expect(stage.groups.map((group) => group.kind)).toEqual(['winners', 'losers', 'grand-final']);
    expect(stage.groups[1]?.rounds.map((round) => round.matches.length)).toEqual([2, 2, 1, 1]);
    expect(stage.groups[2]?.rounds.map((round) => round.name)).toEqual(['Grand final', 'Reset']);
  });

  test('drops winners bracket losers into the losers bracket', () => {
    let stage = doubleElimination(players(4));
    stage = reportResult(stage, 'main.wb.r1.m1', { scores: [2, 0] });
    stage = reportResult(stage, 'main.wb.r1.m2', { scores: [0, 2] });

    expect(getMatch(stage, 'main.lb.r1.m1').slots.map((slot) => slot.participantId)).toEqual([
      'p4',
      'p2',
    ]);
    expect(getMatch(stage, 'main.lb.r1.m1').status).toBe('ready');
  });

  test('gives every participant two lives', () => {
    const stage = playAll(doubleElimination(players(8)), 1);
    const losses = new Map<string, number>();
    for (const match of allMatches(stage)) {
      if (match.status !== 'completed' || match.winner === null) continue;
      const loser = match.slots[match.winner === 0 ? 1 : 0].participantId;
      if (loser) losses.set(loser, (losses.get(loser) ?? 0) + 1);
    }

    const champion = getMatch(stage, 'main.gf.r2.m1');
    expect(champion.status).toBe('completed');
    expect([...losses.values()].filter((count) => count === 2)).toHaveLength(7);
  });

  test('skips the reset when the winners bracket champion wins the final', () => {
    const stage = playAll(doubleElimination(players(4)), 0);

    expect(getMatch(stage, 'main.gf.r1.m1').status).toBe('completed');
    expect(getMatch(stage, 'main.gf.r2.m1').status).toBe('skipped');
  });

  test('plays the reset when the losers bracket champion wins the final', () => {
    let stage = playAll(doubleElimination(players(4), { grandFinal: 'single' }), 0);
    expect(stage.groups[2]?.rounds).toHaveLength(1);

    stage = doubleElimination(players(4));
    for (const id of [
      'main.wb.r1.m1',
      'main.wb.r1.m2',
      'main.wb.r2.m1',
      'main.lb.r1.m1',
      'main.lb.r2.m1',
    ]) {
      stage = reportResult(stage, id, { scores: [1, 0] });
    }
    stage = reportResult(stage, 'main.gf.r1.m1', { scores: [0, 1] });
    expect(getMatch(stage, 'main.gf.r2.m1').status).toBe('ready');
  });

  test('resolves byes through both brackets', () => {
    const stage = playAll(doubleElimination(players(5)));
    expect(
      allMatches(stage).every(
        (match) => match.status === 'completed' || match.status === 'skipped',
      ),
    ).toBe(true);
  });
});
