import { describe, expect, test } from 'bun:test';
import { layoutGroup, singleElimination } from '@react-brackets/core';
import {
  connectorPieces,
  frameAt,
  heightAt,
  listGeometry,
  type Metrics,
  mirrorPaged,
  mirrorTree,
  pagedGeometry,
  treeGeometry,
  valueAt,
} from '../src/geometry';

const metrics: Metrics = {
  matchWidth: 200,
  matchHeight: 60,
  matchGap: 12,
  columnGap: 40,
  titleHeight: 30,
};

const teams = (count: number) =>
  Array.from({ length: count }, (_, index) => ({ id: `t${index + 1}`, name: `Team ${index + 1}` }));

const group = () => {
  const stage = singleElimination(teams(8));
  const first = stage.groups[0];
  if (!first) throw new Error('no group');
  return first;
};

describe('tree geometry', () => {
  test('places each round in its own column, every match centred on the two feeding it', () => {
    const tree = treeGeometry(layoutGroup(group()), metrics);
    const at = (id: string) => tree.matches.get(id);

    expect(tree.width).toBe(3 * 200 + 2 * 40);
    expect(at('main.r1.m1')).toEqual({ x: 0, y: 36, width: 200, height: 60 });
    expect(at('main.r1.m2')?.y).toBe(36 + 72);
    expect(at('main.r2.m1')?.x).toBe(240);
    const feeders = ((at('main.r1.m1')?.y ?? 0) + (at('main.r1.m2')?.y ?? 0)) / 2;
    expect(at('main.r2.m1')?.y).toBe(feeders);
    expect(tree.height).toBe(30 + 4 * 72);
  });
});

describe('paged geometry', () => {
  const paged = pagedGeometry(group(), metrics, 250);

  test('has a frame for every page, the round in focus at the start', () => {
    expect(paged.pages).toBe(3);
    const semi = paged.matches.get('main.r2.m1') ?? [];
    expect(semi.length).toBe(9);
    // Page 0: next to the first round. Page 1: in focus, stacked tightly at the top.
    expect([semi[0], semi[2]]).toEqual([250, 1]);
    expect([semi[3], semi[4], semi[5]]).toEqual([0, 36, 1]);
  });

  test('slides a passed round away, fading, from where it was in focus', () => {
    const first = paged.matches.get('main.r1.m3') ?? [];
    expect([first[0], first[2]]).toEqual([0, 1]);
    expect([first[3], first[4], first[5]]).toEqual([-250, first[1], 0]);
    expect(frameAt(first, 0.5)).toEqual([-125, first[1] ?? 0, 0.5]);
  });

  test('fits its height to the round in focus', () => {
    expect(paged.heights).toEqual([30 + 8 * 36, 30 + 4 * 36, 30 + 2 * 36]);
    expect(valueAt(paged.heights, 1.5)).toBe(30 + 3 * 36);
  });

  test('holds the first and last page when a position runs past them', () => {
    const final = paged.matches.get('main.r3.m1') ?? [];
    expect(frameAt(final, -0.4)).toEqual(frameAt(final, 0));
    expect(frameAt(final, 2.6)).toEqual(frameAt(final, 2));
  });
});

describe('cards of their own height', () => {
  // The second first-round match has opened to twice the height.
  const tall = { ...metrics, heights: new Map([['main.r1.m2', 120]]) };

  test('push the cards below them down, and keep their own height', () => {
    const tree = treeGeometry(layoutGroup(group()), tall);
    const second = tree.matches.get('main.r1.m2');
    const third = tree.matches.get('main.r1.m3');
    expect(second?.height).toBe(120);
    expect(third?.y).toBe((second?.y ?? 0) + 120 + metrics.matchGap);
  });

  test('centre the next match between the two that feed it', () => {
    const tree = treeGeometry(layoutGroup(group()), tall);
    const centre = (id: string) => {
      const box = tree.matches.get(id);
      return (box?.y ?? 0) + (box?.height ?? 0) / 2;
    };
    expect(centre('main.r2.m1')).toBe((centre('main.r1.m1') + centre('main.r1.m2')) / 2);
  });

  test('make the page taller while that round is in view, and only then', () => {
    const even = pagedGeometry(group(), metrics, 250);
    const paged = pagedGeometry(group(), tall, 250);
    expect(paged.heights[0]).toBe((even.heights[0] ?? 0) + 60);
    expect(paged.heights[2]).toBe(even.heights[2]);
  });

  test('stack in a list one under another', () => {
    const list = listGeometry(group(), tall, 300);
    const third = list.matches.get('main.r1.m3') ?? [];
    expect(third[1]).toBe(30 + 60 + 12 + 120 + 12);
  });
});

describe('page height', () => {
  const heights = [300, 100, 160];

  test('rests on the height of the round in focus', () => {
    for (const fit of ['contain', 'follow'] as const) {
      expect(heightAt(heights, 0, fit)).toBe(300);
      expect(heightAt(heights, 1, fit)).toBe(100);
      expect(heightAt(heights, 2, fit)).toBe(160);
    }
  });

  test('holds the taller round while both are on screen, settling only at the end', () => {
    expect(heightAt(heights, 0.5, 'contain')).toBe(300);
    expect(heightAt(heights, 0.75, 'contain')).toBe(300);
    expect(heightAt(heights, 0.9, 'contain')).toBeGreaterThan(100);
    expect(heightAt(heights, 1.1, 'contain')).toBeLessThan(160);
    expect(heightAt(heights, 1.5, 'contain')).toBe(160);
    expect(heightAt(heights, 0.5, 'follow')).toBe(200);
  });
});

describe('list geometry', () => {
  const list = listGeometry(group(), metrics, 300);

  test('stacks each round in a full-width column, the rounds side by side', () => {
    const second = list.matches.get('main.r1.m2') ?? [];
    expect([second[0], second[1], second[2]]).toEqual([0, 30 + 72, 1]);
    expect([second[3], second[5]]).toEqual([-300, 1]);
    const semi = list.matches.get('main.r2.m1') ?? [];
    expect([semi[0], semi[3], semi[4]]).toEqual([300, 0, 30]);
  });

  test('fits its height to the round on show, and has no lines', () => {
    expect(list.heights).toEqual([30 + 4 * 72 - 12, 30 + 2 * 72 - 12, 30 + 60]);
    expect(list.edges).toEqual([]);
  });
});

describe('right to left', () => {
  test('measures every paged x from the other side', () => {
    const flipped = mirrorPaged(pagedGeometry(group(), metrics, 250), 400);
    const semi = flipped.matches.get('main.r2.m1') ?? [];
    // In focus on page 1, it sits against the right edge; on page 0 it waits on the left.
    expect(semi[3]).toBe(400 - 200);
    expect(semi[0]).toBe(400 - 250 - 200);
  });

  test('starts the tree on the right', () => {
    const tree = mirrorTree(treeGeometry(layoutGroup(group()), metrics));
    expect(tree.matches.get('main.r1.m1')?.x).toBe(680 - 200);
    expect(tree.matches.get('main.r3.m1')?.x).toBe(0);
    expect(tree.titles[0]?.x).toBe(480);
  });
});

describe('connector pieces', () => {
  const from = { x: 0, y: 0, width: 100, height: 40 };

  test('runs straight between matches at the same height, with no gap in the middle', () => {
    const line = connectorPieces(from, { x: 140, y: 0, width: 100, height: 40 }, 6, 2);
    expect(line.out).toEqual([100, 19, 21]);
    expect(line.into).toEqual([119, 19, 21]);
    expect(line.turnOut[2]).toBe(0);
  });

  test('turns halfway with rounded corners, going down', () => {
    const line = connectorPieces(from, { x: 140, y: 60, width: 100, height: 40 }, 6, 2);
    expect([line.sx, line.sy]).toEqual([1, 1]);
    expect(line.out).toEqual([100, 19, 15]);
    expect(line.across).toEqual([119, 25, 50]);
    expect(line.into).toEqual([125, 79, 15]);
    expect(line.turnOut).toEqual([115, 19, 1]);
    expect(line.turnIn).toEqual([119, 75, 1]);
  });

  test('meets every corner edge to edge, whichever way it runs', () => {
    const size = 6;
    for (const to of [
      { x: 140, y: 60, width: 100, height: 40 },
      { x: 140, y: -60, width: 100, height: 40 },
      { x: -140, y: 60, width: 100, height: 40 },
      { x: -140, y: -60, width: 100, height: 40 },
    ]) {
      const { out, across, into, turnOut, turnIn, sx, sy } = connectorPieces(from, to, size, 2);
      // The line out ends where the first corner starts, and the line in starts where the second one ends.
      expect(sx > 0 ? out[0] + out[2] : out[0]).toBe(sx > 0 ? turnOut[0] : turnOut[0] + size);
      expect(sx > 0 ? into[0] : into[0] + into[2]).toBe(sx > 0 ? turnIn[0] + size : turnIn[0]);
      // The line across starts where one corner ends, and stops where the other begins.
      const [first, last] = sy > 0 ? [turnOut, turnIn] : [turnIn, turnOut];
      expect(across[1]).toBe(first[1] + size);
      expect(across[1] + across[2]).toBe(last[1]);
    }
  });

  test('leaves from the side facing the next match', () => {
    const back = connectorPieces(
      { ...from, x: 300 },
      { x: 140, y: 0, width: 100, height: 40 },
      0,
      2,
    );
    expect(back.sx).toBe(-1);
    expect(back.out).toEqual([269, 19, 31]);
  });

  test('tightens the turns when the matches are almost level', () => {
    const line = connectorPieces(from, { x: 140, y: 4, width: 100, height: 40 }, 6, 2);
    expect(line.turnOut[2]).toBeCloseTo(1 / 3);
    expect(line.across[2]).toBe(2);
  });
});
