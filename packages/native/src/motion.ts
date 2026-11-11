/** Where a dragged or zoomed view may sit: its translation on each axis. */
export interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/** A pan-zoom transform: the scale, and the content's top left corner in the frame. */
export interface Transform {
  scale: number;
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export function clamp(value: number, low: number, high: number): number {
  'worklet';
  return Math.min(Math.max(value, low), high);
}

/** iOS-style resistance: the further you pull past an edge, the less it follows. `0` doesn't give at all. */
export function rubberBand(distance: number, dimension: number, elasticity: number): number {
  'worklet';
  if (dimension <= 0 || distance === 0 || elasticity <= 0) return 0;
  const stretch = 1 - 1 / ((Math.abs(distance) * elasticity) / dimension + 1);
  return Math.sign(distance) * stretch * dimension;
}

/**
 * The round a released swipe lands on. Like native paging, where the finger was heading
 * decides: `projection` seconds of its speed, and `commit` of a round is enough.
 */
export function swipeTarget({
  position,
  start,
  velocity,
  last,
  maxRounds,
  commit,
  projection,
}: {
  /** Where the swipe is, as a fractional page. */
  position: number;
  /** Where it started. */
  start: number;
  /** In pages a second, towards later rounds. */
  velocity: number;
  last: number;
  maxRounds: number;
  commit: number;
  projection: number;
}): number {
  'worklet';
  const from = Math.round(start);
  const heading = position + velocity * projection - from;
  let target = from + Math.round(heading);
  if (target === from && Math.abs(heading) >= commit) target = from + Math.sign(heading);
  return Math.min(Math.max(target, 0, from - maxRounds), last, from + maxRounds);
}

/**
 * Where content of `content` size, scaled, may sit in the frame. It can't be dragged out of
 * view: larger than the frame, it stays against the edges; smaller, it moves freely inside it,
 * or sits in the middle when `align` is `center`.
 */
export function zoomBounds(
  frame: Size,
  content: Size,
  scale: number,
  align: 'start' | 'center',
): Bounds {
  'worklet';
  const extraX = frame.width - content.width * scale;
  const extraY = frame.height - content.height * scale;
  if (align === 'center') {
    return {
      minX: extraX > 0 ? extraX / 2 : extraX,
      maxX: extraX > 0 ? extraX / 2 : 0,
      minY: extraY > 0 ? extraY / 2 : extraY,
      maxY: extraY > 0 ? extraY / 2 : 0,
    };
  }
  return {
    minX: Math.min(0, extraX),
    maxX: Math.max(0, extraX),
    minY: Math.min(0, extraY),
    maxY: Math.max(0, extraY),
  };
}

/** Scales to `scale` keeping the point under `focus` still, then keeps the content in `bounds`. */
export function zoomAround(
  current: Transform,
  scale: number,
  focus: { x: number; y: number },
  bounds: Bounds,
): Transform {
  'worklet';
  const ratio = scale / current.scale;
  return {
    scale,
    x: clamp(focus.x - (focus.x - current.x) * ratio, bounds.minX, bounds.maxX),
    y: clamp(focus.y - (focus.y - current.y) * ratio, bounds.minY, bounds.maxY),
  };
}

/** The smallest and largest zoom. `fit` shows the whole width, and is never more than 1. */
export function zoomLimits(
  fit: number,
  minScale: 'fit' | number,
  maxScale: number,
): { min: number; max: number } {
  const min = minScale === 'fit' ? fit : minScale;
  return { min, max: Math.max(min, maxScale) };
}

/** Where pan-zoom starts, and where reset returns to. */
export function initialTransform(
  initial: 'fit' | number | Transform,
  fit: number,
  limits: { min: number; max: number },
  frame: Size,
  content: Size,
  align: 'start' | 'center',
): Transform {
  const wanted =
    typeof initial === 'object'
      ? initial
      : { scale: initial === 'fit' ? fit : initial, x: 0, y: 0 };
  const scale = clamp(wanted.scale, limits.min, limits.max);
  const bounds = zoomBounds(frame, content, scale, align);
  return {
    scale,
    x: clamp(wanted.x, bounds.minX, bounds.maxX),
    y: clamp(wanted.y, bounds.minY, bounds.maxY),
  };
}

/**
 * The zoom a double tap goes to. `toggle` zooms in twice over, or back out to fit once zoomed
 * in; a number zooms in by that much, and back out to fit from the largest zoom.
 */
export function doubleTapScale(
  scale: number,
  fit: number,
  limits: { min: number; max: number },
  doubleTap: 'toggle' | number,
): number {
  'worklet';
  const home = clamp(fit, limits.min, limits.max);
  if (doubleTap === 'toggle') return scale > home * 1.05 ? home : scale * 2;
  return scale >= limits.max * 0.995 ? home : scale * doubleTap;
}
