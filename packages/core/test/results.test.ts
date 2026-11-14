import { describe, expect, test } from 'bun:test';
import {
  doubleElimination,
  getMatch,
  reportResult,
  resetResult,
  resolve,
  singleElimination,
} from '../src';
import { players } from './fixtures';

const bracket = () => singleElimination(players(4), { thirdPlace: true });

describe('reportResult', () => {
  test('sends the winner forward and the loser to third place', () => {
    const stage = reportResult(bracket(), 'main.r1.m1', { scores: [3, 1] });

    expect(getMatch(stage, 'main.r1.m1')).toMatchObject({ status: 'completed', winner: 0 });
    expect(getMatch(stage, 'main.r2.m1').slots[0].participantId).toBe('p1');
    expect(getMatch(stage, 'main.third.r1.m1').slots[0].participantId).toBe('p4');
  });

  test('marks a match ready once both sides are known', () => {
    let stage = reportResult(bracket(), 'main.r1.m1', { scores: [3, 1] });
    stage = reportResult(stage, 'main.r1.m2', { scores: [0, 2] });

    expect(getMatch(stage, 'main.r2.m1')).toMatchObject({ status: 'ready', winner: null });
    expect(getMatch(stage, 'main.r2.m1').slots.map((slot) => slot.participantId)).toEqual([
      'p1',
      'p3',
    ]);
  });

  test('keeps live scores without deciding a winner', () => {
    const stage = reportResult(bracket(), 'main.r1.m1', { scores: [1, 0], live: true });

    expect(getMatch(stage, 'main.r1.m1')).toMatchObject({ status: 'live', winner: null });
    expect(getMatch(stage, 'main.r2.m1').slots[0].participantId).toBeNull();
  });

  test('uses an explicit winner to break a tie', () => {
    const stage = reportResult(bracket(), 'main.r1.m1', { scores: [2, 2], winner: 1 });
    expect(getMatch(stage, 'main.r2.m1').slots[0].participantId).toBe('p4');
  });

  test('clears everything downstream when a result is overturned', () => {
    let stage = reportResult(bracket(), 'main.r1.m1', { scores: [3, 1] });
    stage = reportResult(stage, 'main.r1.m2', { scores: [2, 0] });
    stage = reportResult(stage, 'main.r2.m1', { scores: [1, 0] });
    stage = reportResult(stage, 'main.r1.m1', { scores: [0, 3] });

    const final = getMatch(stage, 'main.r2.m1');
    expect(final.slots.map((slot) => slot.participantId)).toEqual(['p4', 'p2']);
    expect(final).toMatchObject({ status: 'ready', winner: null });
    expect(final.slots[0].score).toBeUndefined();
  });

  test('refuses results for matches that are not ready', () => {
    expect(() => reportResult(bracket(), 'main.r2.m1', { scores: [1, 0] })).toThrow('waiting');
    expect(() =>
      reportResult(singleElimination(players(3)), 'main.r1.m1', { scores: [1, 0] }),
    ).toThrow();
  });
});

test('resetResult reopens the match and empties what it fed', () => {
  let stage = reportResult(bracket(), 'main.r1.m1', { scores: [3, 1] });
  stage = resetResult(stage, 'main.r1.m1');

  expect(getMatch(stage, 'main.r1.m1')).toMatchObject({ status: 'ready', winner: null });
  expect(getMatch(stage, 'main.r2.m1').slots[0].participantId).toBeNull();
  expect(getMatch(stage, 'main.third.r1.m1').slots[0].participantId).toBeNull();
});

describe('unchanged parts keep their identity', () => {
  test('a live score copies only the match it changes, its round, group and stage', () => {
    const before = singleElimination(players(8));
    const after = reportResult(before, 'main.r1.m1', { scores: [1, 0], live: true });
    const [r1, r2, r3] = after.groups[0]?.rounds ?? [];

    expect(after).not.toBe(before);
    expect(r1).not.toBe(before.groups[0]?.rounds[0]);
    expect(r1?.matches.slice(1)).toEqual(before.groups[0]?.rounds[0]?.matches.slice(1));
    r1?.matches.slice(1).forEach((match, index) => {
      expect(match).toBe(before.groups[0]?.rounds[0]?.matches[index + 1] as typeof match);
    });
    expect(r2).toBe(before.groups[0]?.rounds[1] as typeof r2);
    expect(r3).toBe(before.groups[0]?.rounds[2] as typeof r3);
  });

  test('a result copies the match it decides and the one the winner moves into', () => {
    const before = singleElimination(players(8));
    const after = reportResult(before, 'main.r1.m1', { scores: [3, 1] });

    expect(getMatch(after, 'main.r1.m2')).toBe(getMatch(before, 'main.r1.m2'));
    expect(getMatch(after, 'main.r2.m1')).not.toBe(getMatch(before, 'main.r2.m1'));
    expect(getMatch(after, 'main.r2.m2')).toBe(getMatch(before, 'main.r2.m2'));
  });

  test('other groups stay the same object', () => {
    const before = doubleElimination(players(8));
    const after = reportResult(before, 'main.wb.r1.m1', { scores: [1, 0], live: true });
    expect(after.groups.slice(1)).toEqual(before.groups.slice(1));
    after.groups.slice(1).forEach((group, index) => {
      expect(group).toBe(before.groups[index + 1] as typeof group);
    });
  });

  test('resolving a resolved stage returns it unchanged', () => {
    const stage = reportResult(singleElimination(players(8)), 'main.r1.m1', { scores: [3, 1] });
    expect(resolve(stage)).toBe(stage);
  });
});
