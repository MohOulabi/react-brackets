import { describe, expect, test } from 'bun:test';
import { bracketSize, eliminationRoundName, standardOrder } from '../src';

describe('bracketSize', () => {
  test.each([
    [2, 2],
    [3, 4],
    [8, 8],
    [9, 16],
    [33, 64],
  ])('%i entrants fit a bracket of %i', (entrants, size) => {
    expect(bracketSize(entrants)).toBe(size);
  });
});

describe('standardOrder', () => {
  test('keeps the top seeds apart', () => {
    expect(standardOrder(8)).toEqual([1, 8, 4, 5, 2, 7, 3, 6]);
  });

  test('pairs every seed with its mirror', () => {
    const order = standardOrder(16);
    for (let index = 0; index < order.length; index += 2) {
      expect((order[index] ?? 0) + (order[index + 1] ?? 0)).toBe(17);
    }
  });
});

test('names the late rounds', () => {
  expect([0, 1, 2, 3].map((index) => eliminationRoundName(index, 4))).toEqual([
    'Round 1',
    'Quarterfinals',
    'Semifinals',
    'Final',
  ]);
});
