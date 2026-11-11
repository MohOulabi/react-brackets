import { describe, expect, test } from 'bun:test';
import {
  doubleTapScale,
  initialTransform,
  rubberBand,
  swipeTarget,
  zoomAround,
  zoomBounds,
  zoomLimits,
} from '../src/motion';
import { resolveSwipe, resolveZoom } from '../src/options';

const swipe = { last: 3, maxRounds: Number.POSITIVE_INFINITY, commit: 0.2, projection: 0.18 };

describe('swipeTarget', () => {
  test('a slow drag past the commit share pages', () => {
    expect(swipeTarget({ ...swipe, position: 1.25, start: 1, velocity: 0 })).toBe(2);
    expect(swipeTarget({ ...swipe, position: 0.75, start: 1, velocity: 0 })).toBe(0);
  });

  test('a slow drag short of it stays', () => {
    expect(swipeTarget({ ...swipe, position: 1.15, start: 1, velocity: 0 })).toBe(1);
  });

  test('a flick is projected ahead', () => {
    expect(swipeTarget({ ...swipe, position: 1.05, start: 1, velocity: 4 })).toBe(2);
    expect(swipeTarget({ ...swipe, position: 1.05, start: 1, velocity: 12 })).toBe(3);
  });

  test('a larger commit share needs a longer drag', () => {
    expect(swipeTarget({ ...swipe, commit: 0.4, position: 1.3, start: 1, velocity: 0 })).toBe(1);
  });

  test('lands within the rounds and the most one swipe can move', () => {
    expect(swipeTarget({ ...swipe, position: 3, start: 3, velocity: 40 })).toBe(3);
    expect(swipeTarget({ ...swipe, position: 0, start: 0, velocity: -40 })).toBe(0);
    expect(swipeTarget({ ...swipe, maxRounds: 1, position: 1.1, start: 0, velocity: 40 })).toBe(1);
  });
});

describe('rubberBand', () => {
  test('gives less the further it is pulled, and never past the dimension', () => {
    const near = rubberBand(50, 300, 0.55);
    const far = rubberBand(500, 300, 0.55);
    expect(near).toBeGreaterThan(0);
    expect(near).toBeLessThan(50);
    expect(far).toBeGreaterThan(near);
    expect(far).toBeLessThan(300);
    expect(rubberBand(-50, 300, 0.55)).toBe(-near);
  });

  test('more elasticity gives more', () => {
    expect(rubberBand(50, 300, 1)).toBeGreaterThan(rubberBand(50, 300, 0.55));
  });

  test('no elasticity, no give', () => {
    expect(rubberBand(50, 300, 0)).toBe(0);
  });
});

const frame = { width: 300, height: 200 };

describe('zoomBounds', () => {
  test('content larger than the frame stays against its edges', () => {
    const content = { width: 600, height: 400 };
    expect(zoomBounds(frame, content, 1, 'start')).toEqual({
      minX: -300,
      maxX: 0,
      minY: -200,
      maxY: 0,
    });
    expect(zoomBounds(frame, content, 1, 'center')).toEqual(zoomBounds(frame, content, 1, 'start'));
  });

  test('content smaller than the frame moves inside it, or sits in the middle', () => {
    const content = { width: 200, height: 100 };
    expect(zoomBounds(frame, content, 1, 'start')).toEqual({
      minX: 0,
      maxX: 100,
      minY: 0,
      maxY: 100,
    });
    expect(zoomBounds(frame, content, 1, 'center')).toEqual({
      minX: 50,
      maxX: 50,
      minY: 50,
      maxY: 50,
    });
  });
});

describe('zoomAround', () => {
  const bounds = { minX: -1000, maxX: 0, minY: -1000, maxY: 0 };

  test('keeps the point under the focus still', () => {
    const next = zoomAround({ scale: 1, x: -100, y: -50 }, 2, { x: 150, y: 100 }, bounds);
    // The content point under (150, 100) was (250, 150); at 2x it must still land there.
    expect(next).toEqual({ scale: 2, x: 150 - 250 * 2, y: 100 - 150 * 2 });
  });

  test('keeps the content within bounds', () => {
    const next = zoomAround({ scale: 2, x: -10, y: -10 }, 1, { x: 0, y: 0 }, bounds);
    expect(next).toEqual({ scale: 1, x: -5, y: -5 });
    expect(zoomAround({ scale: 1, x: 0, y: 0 }, 2, { x: -50, y: 0 }, bounds).x).toBe(0);
  });
});

describe('zoomLimits', () => {
  test('fit is the smallest by default', () => {
    expect(zoomLimits(0.4, 'fit', 2)).toEqual({ min: 0.4, max: 2 });
  });

  test('a number replaces fit, and the largest never drops below the smallest', () => {
    expect(zoomLimits(0.4, 0.25, 3)).toEqual({ min: 0.25, max: 3 });
    expect(zoomLimits(0.4, 1.5, 1)).toEqual({ min: 1.5, max: 1.5 });
  });
});

describe('initialTransform', () => {
  const content = { width: 750, height: 500 };
  const limits = { min: 0.4, max: 2 };

  test('fit starts at the top left', () => {
    expect(initialTransform('fit', 0.4, limits, frame, content, 'start')).toEqual({
      scale: 0.4,
      x: 0,
      y: 0,
    });
  });

  test('a scale starts there, within the limits', () => {
    expect(initialTransform(1, 0.4, limits, frame, content, 'start').scale).toBe(1);
    expect(initialTransform(5, 0.4, limits, frame, content, 'start').scale).toBe(2);
  });

  test('a position is kept within bounds', () => {
    expect(
      initialTransform({ scale: 1, x: -200, y: 50 }, 0.4, limits, frame, content, 'start'),
    ).toEqual({ scale: 1, x: -200, y: 0 });
  });

  test('centred when smaller than the frame', () => {
    const small = { width: 200, height: 100 };
    expect(initialTransform('fit', 1, { min: 1, max: 2 }, frame, small, 'center')).toEqual({
      scale: 1,
      x: 50,
      y: 50,
    });
  });
});

describe('doubleTapScale', () => {
  const limits = { min: 0.5, max: 2 };

  test('toggle zooms in twice over, and back out to fit once zoomed in', () => {
    expect(doubleTapScale(0.5, 0.5, limits, 'toggle')).toBe(1);
    expect(doubleTapScale(1, 0.5, limits, 'toggle')).toBe(0.5);
  });

  test('a factor zooms in by it, and back out to fit from the largest zoom', () => {
    expect(doubleTapScale(0.5, 0.5, limits, 3)).toBe(1.5);
    expect(doubleTapScale(2, 0.5, limits, 3)).toBe(0.5);
  });
});

describe('options', () => {
  test("zoom defaults keep today's behaviour", () => {
    expect(resolveZoom(undefined, 320)).toEqual({
      minScale: 'fit',
      maxScale: 2,
      step: 1.5,
      initial: 'fit',
      align: 'start',
      pinch: true,
      pan: true,
      doubleTap: 'toggle',
      deceleration: 0.998,
      elasticity: 0.6,
      overshoot: 0.15,
      duration: 320,
      easing: undefined,
    });
  });

  test('momentum off, its deceleration, and reduced motion', () => {
    expect(resolveZoom({ momentum: false }, 320).deceleration).toBeNull();
    expect(resolveZoom({ momentum: { deceleration: 0.99 } }, 320).deceleration).toBe(0.99);
    expect(resolveZoom({ animation: { duration: 500 } }, 320).duration).toBe(500);
    expect(resolveZoom({ animation: { duration: 500 } }, null).duration).toBe(0);
  });

  test("swipe defaults keep today's behaviour, and a partial spring keeps the rest", () => {
    expect(resolveSwipe(undefined)).toEqual({
      focus: 0.76,
      commit: 0.2,
      projection: 0.18,
      elasticity: 0.55,
      spring: { mass: 1, stiffness: 260, damping: 30 },
    });
    expect(resolveSwipe({ spring: { stiffness: 400 } }).spring).toEqual({
      mass: 1,
      stiffness: 400,
      damping: 30,
    });
  });
});
