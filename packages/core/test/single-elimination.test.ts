import { describe, expect, test } from 'bun:test';
import { allMatches, singleElimination } from '../src';
import { players } from './fixtures';

describe('singleElimination', () => {
  test('builds a full bracket of eight', () => {
    const stage = singleElimination(players(8));
    const [bracket] = stage.groups;

    expect(bracket?.rounds.map((round) => round.matches.length)).toEqual([4, 2, 1]);
    expect(bracket?.rounds.map((round) => round.name)).toEqual([
      'Quarterfinals',
      'Semifinals',
      'Final',
    ]);
    expect(bracket?.rounds[0]?.matches[0]?.slots.map((slot) => slot.participantId)).toEqual([
      'p1',
      'p8',
    ]);
    expect(bracket?.rounds[0]?.matches.every((match) => match.status === 'ready')).toBe(true);
    expect(bracket?.rounds[1]?.matches[0]?.slots[0].origin).toEqual({
      matchId: 'main.r1.m1',
      outcome: 'winner',
    });
  });

  test.each([3, 5, 6, 7, 13, 33])('gives byes to the top seeds with %i entrants', (count) => {
    const stage = singleElimination(players(count));
    const firstRound = stage.groups[0]?.rounds[0]?.matches ?? [];
    const byeMatches = firstRound.filter((match) => match.slots.some((slot) => slot.bye));
    const advanced = byeMatches.map((match) => match.slots[match.winner ?? 0].participantId);

    expect(byeMatches).toHaveLength(firstRound.length * 2 - count);
    expect(byeMatches.every((match) => match.status === 'completed')).toBe(true);
    expect(firstRound.some((match) => match.slots.every((slot) => slot.bye))).toBe(false);
    expect(advanced.sort()).toEqual(
      players(byeMatches.length)
        .map((player) => player.id)
        .sort(),
    );
  });

  test('moves bye winners straight into round two', () => {
    const stage = singleElimination(players(3));
    const final = stage.groups[0]?.rounds[1]?.matches[0];

    expect(final?.slots[0].participantId).toBe('p1');
    expect(final?.status).toBe('waiting');
  });

  test('can skip a match when sequential seeding leaves two byes', () => {
    const stage = singleElimination(players(5), { seeding: 'sequential' });
    const statuses = stage.groups[0]?.rounds[0]?.matches.map((match) => match.status);

    expect(statuses).toEqual(['ready', 'ready', 'completed', 'skipped']);
    expect(stage.groups[0]?.rounds[1]?.matches[1]?.status).toBe('completed');
  });

  test('adds a third place match fed by the semifinal losers', () => {
    const stage = singleElimination(players(4), { thirdPlace: true });
    const third = stage.groups[1];

    expect(third?.kind).toBe('third-place');
    expect(third?.rounds[0]?.matches[0]?.slots.map((slot) => slot.origin?.outcome)).toEqual([
      'loser',
      'loser',
    ]);
  });

  test('gives every match a unique id', () => {
    const matches = allMatches(singleElimination(players(33), { thirdPlace: true }));
    expect(new Set(matches.map((match) => match.id)).size).toBe(matches.length);
  });

  test('rejects too few or duplicate participants', () => {
    expect(() => singleElimination(players(1))).toThrow(RangeError);
    expect(() => singleElimination([...players(2), { id: 'p1', name: 'Again' }])).toThrow('unique');
  });
});
