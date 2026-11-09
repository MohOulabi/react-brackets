import { describe, expect, test } from 'bun:test';
import {
  allMatches,
  nextSwissRound,
  reportResult,
  type Stage,
  swiss,
  swissRoundsLeft,
} from '../src';
import { players } from './fixtures';

const finishRound = (stage: Stage): Stage =>
  allMatches(stage)
    .filter((match) => match.status === 'ready')
    .reduce((current, match) => reportResult(current, match.id, { scores: [1, 0] }), stage);

const playThrough = (stage: Stage): Stage => {
  let current = finishRound(stage);
  while (swissRoundsLeft(current) > 0) current = finishRound(nextSwissRound(current));
  return current;
};

describe('swiss', () => {
  test('folds the field in half for round one', () => {
    const stage = swiss(players(8));
    const pairs = stage.groups[0]?.rounds[0]?.matches.map((match) =>
      match.slots.map((slot) => slot.participantId),
    );

    expect(swissRoundsLeft(stage)).toBe(2);
    expect(pairs).toEqual([
      ['p1', 'p5'],
      ['p2', 'p6'],
      ['p3', 'p7'],
      ['p4', 'p8'],
    ]);
  });

  test('never pairs the same participants twice', () => {
    const stage = playThrough(swiss(players(8), { rounds: 5 }));
    const pairs = allMatches(stage).map((match) =>
      match.slots
        .map((slot) => slot.participantId)
        .sort()
        .join('-'),
    );

    expect(stage.groups[0]?.rounds).toHaveLength(5);
    expect(new Set(pairs).size).toBe(pairs.length);
  });

  test('pairs participants with the same record', () => {
    const stage = nextSwissRound(finishRound(swiss(players(8))));
    const [first] = stage.groups[0]?.rounds[1]?.matches ?? [];

    expect(first?.slots.map((slot) => slot.participantId)).toEqual(['p1', 'p2']);
  });

  test('gives the first bye to the lowest seed', () => {
    const [round] = swiss(players(5)).groups[0]?.rounds ?? [];
    const bye = round?.matches.find((match) => match.slots.some((slot) => slot.bye));

    expect(bye?.slots[0].participantId).toBe('p5');
    expect(round?.matches[0]?.slots.map((slot) => slot.participantId)).toEqual(['p1', 'p3']);
  });

  test('hands out at most one bye per participant', () => {
    const stage = playThrough(swiss(players(5), { rounds: 4 }));
    const byes = allMatches(stage)
      .filter((match) => match.slots.some((slot) => slot.bye))
      .map((match) => match.slots[0].participantId);

    expect(byes).toHaveLength(4);
    expect(new Set(byes).size).toBe(4);
  });

  test('waits for the current round and stops after the last', () => {
    expect(() => nextSwissRound(swiss(players(4)))).toThrow('Finish the current');
    expect(() => nextSwissRound(playThrough(swiss(players(4))))).toThrow('Every Swiss round');
  });
});
