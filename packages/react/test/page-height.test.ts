import { expect, test } from 'bun:test';
import { heightAt } from '../src/page-height';

const heights = [300, 100, 160];

test('rests on the height of the round in focus', () => {
  for (const fit of ['contain', 'follow'] as const) {
    expect([0, 1, 2].map((page) => heightAt(heights, page, fit))).toEqual([300, 100, 160]);
  }
});

test('contain holds the taller round while both are on screen, settling only at the end', () => {
  expect(heightAt(heights, 0.5, 'contain')).toBe(300);
  expect(heightAt(heights, 0.75, 'contain')).toBe(300);
  expect(heightAt(heights, 0.9, 'contain')).toBeGreaterThan(100);
  expect(heightAt(heights, 1.1, 'contain')).toBeLessThan(160);
  expect(heightAt(heights, 1.5, 'contain')).toBe(160);
});

test('follow blends the two heights under the finger', () => {
  expect(heightAt(heights, 0.5, 'follow')).toBe(200);
  expect(heightAt(heights, 1.25, 'follow')).toBe(115);
});

test('holds the first and last round past either end', () => {
  expect(heightAt(heights, -0.4, 'contain')).toBe(300);
  expect(heightAt(heights, 2.6, 'follow')).toBe(160);
});
