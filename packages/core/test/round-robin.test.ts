import { describe, expect, test } from 'bun:test';
import { allMatches, qualifiers, reportResult, roundRobin, type Stage, standings } from '../src';
import { players } from './fixtures';

const pairings = (stage: Stage) =>
  allMatches(stage).map((match) =>
    match.slots
      .map((slot) => slot.participantId)
      .sort()
      .join('-'),
  );

describe('roundRobin', () => {
  test.each([2, 3, 4, 5, 6, 7, 8])('pairs everyone exactly once with %i participants', (count) => {
    const stage = roundRobin(players(count));
    const pairs = pairings(stage);

    expect(pairs).toHaveLength((count * (count - 1)) / 2);
    expect(new Set(pairs).size).toBe(pairs.length);
    expect(stage.groups[0]?.rounds).toHaveLength(count % 2 === 0 ? count - 1 : count);
  });

  test('never schedules a participant twice in one round', () => {
    for (const round of roundRobin(players(8)).groups[0]?.rounds ?? []) {
      const ids = round.matches.flatMap((match) => match.slots.map((slot) => slot.participantId));
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  test('plays a second leg with sides swapped', () => {
    const stage = roundRobin(players(4), { legs: 2 });
    const [first] = allMatches(stage);
    const mirror = stage.groups[0]?.rounds[3]?.matches[0];

    expect(stage.groups[0]?.rounds).toHaveLength(6);
    expect(mirror?.slots.map((slot) => slot.participantId)).toEqual(
      first?.slots.map((slot) => slot.participantId).reverse(),
    );
  });

  test('snake seeds participants into groups', () => {
    const stage = roundRobin(players(8), { groups: 2 });
    const members = stage.groups.map((group) =>
      [
        ...new Set(
          group.rounds.flatMap((round) =>
            round.matches.flatMap((match) => match.slots.map((slot) => slot.participantId)),
          ),
        ),
      ].sort(),
    );

    expect(stage.groups.map((group) => group.name)).toEqual(['Group A', 'Group B']);
    expect(members).toEqual([
      ['p1', 'p4', 'p5', 'p8'],
      ['p2', 'p3', 'p6', 'p7'],
    ]);
  });
});

describe('standings', () => {
  test('ranks by points, then difference, then score', () => {
    let stage = roundRobin(players(3));
    for (const match of allMatches(stage)) {
      const [home, away] = match.slots.map((slot) => slot.participantId);
      const scores: [number, number] =
        home === 'p1' || away === 'p1' ? (home === 'p1' ? [3, 0] : [0, 3]) : [1, 1];
      stage = reportResult(stage, match.id, { scores });
    }
    const table = standings(stage);

    expect(table.map((row) => row.participantId)).toEqual(['p1', 'p2', 'p3']);
    expect(table[0]).toMatchObject({ played: 2, wins: 2, points: 6, scored: 6, conceded: 0 });
    expect(table[1]).toMatchObject({ draws: 1, losses: 1, points: 1 });
  });

  test('supports custom points', () => {
    let stage = roundRobin(players(2));
    stage = reportResult(stage, 'main.g1.r1.m1', { scores: [2, 1] });

    expect(standings(stage, undefined, { points: { win: 2, draw: 1, loss: 0 } })[0]?.points).toBe(
      2,
    );
  });

  test('picks qualifiers group by group', () => {
    let stage = roundRobin(players(8), { groups: 2 });
    for (const match of allMatches(stage)) {
      const [home, away] = match.slots.map((slot) => Number(slot.participantId?.slice(1)));
      stage = reportResult(stage, match.id, {
        scores: (home ?? 0) < (away ?? 0) ? [1, 0] : [0, 1],
      });
    }

    expect(qualifiers(stage, 2).map((participant) => participant.id)).toEqual([
      'p1',
      'p2',
      'p4',
      'p3',
    ]);
  });
});
