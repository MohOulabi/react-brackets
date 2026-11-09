import { expect, test } from 'bun:test';
import { clampTransform, type Frame, zoomAt } from '../src/hooks/use-pan-zoom';

const frame: Frame = {
  width: 400,
  height: 300,
  contentWidth: 1000,
  contentHeight: 600,
  rtl: false,
};

test('keeps oversized content covering the frame', () => {
  expect(clampTransform({ x: 50, y: 40, scale: 1 }, frame)).toEqual({ x: 0, y: 0, scale: 1 });
  expect(clampTransform({ x: -900, y: -500, scale: 1 }, frame)).toEqual({
    x: -600,
    y: -300,
    scale: 1,
  });
});

test('pins content that fits to the start edge', () => {
  expect(clampTransform({ x: 120, y: 80, scale: 0.3 }, frame)).toEqual({ x: 0, y: 0, scale: 0.3 });
  expect(clampTransform({ x: 0, y: 0, scale: 0.3 }, { ...frame, rtl: true })).toEqual({
    x: 100,
    y: 0,
    scale: 0.3,
  });
});

test('zooms around the given point', () => {
  const zoomed = zoomAt({ x: -100, y: -100, scale: 1 }, frame, { x: 200, y: 150 }, 2);
  expect(zoomed).toEqual({ x: -400, y: -350, scale: 2 });
});
