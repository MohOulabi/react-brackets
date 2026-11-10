/** How the paged view's height moves between rounds of different heights. */
export type PageHeight = 'contain' | 'follow';

/** Share of a move spent growing to hold both rounds, and again settling to the new one. */
const SETTLE = 0.25;

/**
 * The paged view's height at a fractional page. `follow` blends the two rounds'
 * heights, so the taller one is cut while it moves. `contain` is as tall as both
 * while they move, growing early and settling late, so neither is cut while on screen.
 */
export function heightAt(heights: number[], position: number, fit: PageHeight): number {
  const last = heights.length - 1;
  if (last <= 0) return heights[0] ?? 0;
  const at = Math.min(Math.max(position, 0), last);
  const page = Math.min(Math.floor(at), last - 1);
  const t = at - page;
  const from = heights[page] ?? 0;
  const to = heights[page + 1] ?? from;
  if (fit === 'follow') return from + (to - from) * t;
  const both = Math.max(from, to);
  return t < 0.5
    ? from + (both - from) * ease(Math.min(1, t / SETTLE))
    : to + (both - to) * ease(Math.min(1, (1 - t) / SETTLE));
}

function ease(t: number): number {
  return t * t * (3 - 2 * t);
}
