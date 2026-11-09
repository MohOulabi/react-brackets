import { describe, expect, test } from 'bun:test';
import { fromRounds, type Group, layoutGroup, roundRobin, singleElimination } from '../src';
import { players } from './fixtures';

const firstGroup = (count: number): Group => {
  const group = singleElimination(players(count)).groups[0];
  if (!group) throw new Error('missing group');
  return group;
};

const rowsOf = (layout: ReturnType<typeof layoutGroup>) =>
  layout.columns.map((column) => column.cells.map((cell) => cell.row));

describe('layoutGroup', () => {
  test('centres each match between its feeders', () => {
    const layout = layoutGroup(firstGroup(8));

    expect(layout.rows).toBe(8);
    expect(rowsOf(layout)).toEqual([[0, 2, 4, 6], [1, 5], [3]]);
    expect(layout.edges).toHaveLength(6);
    expect(layout.edges[0]).toEqual({ from: 'main.r1.m1', to: 'main.r2.m1', slot: 0 });
  });

  test('mirrors halves around the final', () => {
    const layout = layoutGroup(firstGroup(8), { mirror: true });

    expect(layout.columns.map((column) => column.side)).toEqual([
      'start',
      'start',
      'center',
      'end',
      'end',
    ]);
    expect(layout.columns.map((column) => column.round.name)).toEqual([
      'Quarterfinals',
      'Semifinals',
      'Final',
      'Semifinals',
      'Quarterfinals',
    ]);
    expect(rowsOf(layout)).toEqual([[0, 2], [1], [1], [1], [0, 2]]);
    expect(layout.rows).toBe(4);
  });

  test('keeps a losers bracket shape level across equal rounds', () => {
    const match = { participants: [null, null] as [null, null] };
    const stage = fromRounds([
      { name: 'L1', matches: [match, match] },
      { name: 'L2', matches: [match, match] },
      { name: 'L3', matches: [match] },
      { name: 'L4', matches: [match] },
    ]);
    const group = stage.groups[0];
    if (!group) throw new Error('missing group');

    expect(rowsOf(layoutGroup(group))).toEqual([[0, 2], [0, 2], [1], [1]]);
  });

  test('stacks unlinked matches from the top of each column', () => {
    const stage = fromRounds([
      { name: 'Day 1', matches: [{ participants: [{ name: 'A' }, { name: 'B' }] }] },
      {
        name: 'Day 2',
        matches: [{ participants: [{ name: 'C' }, { name: 'D' }] }, { participants: [null, null] }],
      },
    ]);
    const group = stage.groups[0];
    if (!group) throw new Error('missing group');

    expect(rowsOf(layoutGroup(group))).toEqual([[0], [0, 2]]);
  });
});

test('starts every pool round at the top', () => {
  const group = roundRobin(players(4)).groups[0];
  if (!group) throw new Error('missing group');

  expect(rowsOf(layoutGroup(group))).toEqual([
    [0, 2],
    [0, 2],
    [0, 2],
  ]);
  expect(layoutGroup(group).edges).toHaveLength(0);
});
