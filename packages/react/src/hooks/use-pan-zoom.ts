import { type KeyboardEvent, type PointerEvent, type RefObject, useEffect, useRef } from 'react';
import type { ResolvedZoom } from '../options';
import type { Point } from '../paths';
import { capture, rubberBand } from './use-swipe';

export interface Transform {
  x: number;
  y: number;
  scale: number;
}

export interface Frame {
  width: number;
  height: number;
  contentWidth: number;
  contentHeight: number;
  rtl: boolean;
}

/** Where the tree may sit at a zoom: anywhere that leaves no empty space, or its resting place when smaller. */
export function bounds(
  scale: number,
  frame: Frame,
  align: 'start' | 'center' = 'start',
): { minX: number; maxX: number; minY: number; maxY: number } {
  const extraX = frame.width - frame.contentWidth * scale;
  const extraY = frame.height - frame.contentHeight * scale;
  const restX = align === 'center' ? extraX / 2 : frame.rtl ? extraX : 0;
  const restY = align === 'center' ? extraY / 2 : 0;
  return {
    minX: extraX >= 0 ? restX : extraX,
    maxX: extraX >= 0 ? restX : 0,
    minY: extraY >= 0 ? restY : extraY,
    maxY: extraY >= 0 ? restY : 0,
  };
}

/** Keeps the content inside the frame: no empty space can be dragged into view. */
export function clampTransform(
  transform: Transform,
  frame: Frame,
  align: 'start' | 'center' = 'start',
): Transform {
  const { minX, maxX, minY, maxY } = bounds(transform.scale, frame, align);
  return {
    x: Math.min(maxX, Math.max(minX, transform.x)),
    y: Math.min(maxY, Math.max(minY, transform.y)),
    scale: transform.scale,
  };
}

/** Lets the content be pulled past its edges with growing resistance, `elasticity` from 0 (none) upwards. */
export function stretchTransform(
  transform: Transform,
  frame: Frame,
  align: 'start' | 'center',
  elasticity: number,
): Transform {
  const held = clampTransform(transform, frame, align);
  return {
    x: held.x + rubberBand(transform.x - held.x, frame.width, elasticity),
    y: held.y + rubberBand(transform.y - held.y, frame.height, elasticity),
    scale: transform.scale,
  };
}

/** Scales around `point` so whatever is under it stays put. */
export function zoomAt(
  transform: Transform,
  frame: Frame,
  point: Point,
  scale: number,
  align: 'start' | 'center' = 'start',
): Transform {
  const ratio = scale / transform.scale;
  return clampTransform(
    {
      scale,
      x: point.x - (point.x - transform.x) * ratio,
      y: point.y - (point.y - transform.y) * ratio,
    },
    frame,
    align,
  );
}

/**
 * One frame of a glide: the speed left after `elapsed` milliseconds at `deceleration` (the share of speed kept
 * each millisecond), and how far it carried. Speeds are in pixels per millisecond.
 */
export function glide(
  speed: number,
  deceleration: number,
  elapsed: number,
): { speed: number; distance: number } {
  const next = speed * deceleration ** elapsed;
  // The distance covered while slowing from `speed` to `next`, integrated rather than stepped.
  const distance =
    deceleration >= 1 ? speed * elapsed : (next - speed) / Math.log(deceleration || Number.EPSILON);
  return { speed: next, distance };
}

interface PanZoomOptions {
  viewport: RefObject<HTMLElement | null>;
  frame: Frame;
  transform: Transform;
  /** Shows a new transform; `animate` eases into it, for a settle or a jump. */
  onChange: (transform: Transform, animate: boolean) => void;
  /** Fits the tree back into view. */
  onReset: () => void;
  minScale: number;
  maxScale: number;
  fitScale: number;
  options: ResolvedZoom;
  /** Set while a finger or a glide is moving the tree, so it is drawn where it is, even past an edge. */
  live: RefObject<boolean>;
}

export interface PanZoomHandlers {
  onPointerDown: (event: PointerEvent<HTMLElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLElement>) => void;
  onPointerCancel: (event: PointerEvent<HTMLElement>) => void;
  onLostPointerCapture: (event: PointerEvent<HTMLElement>) => void;
  onClickCapture: (event: { preventDefault: () => void; stopPropagation: () => void }) => void;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
}

/** A tap that slipped further than this is a drag. */
const SLOP = 4;
/** Two taps this close in time and place make a double tap. */
const DOUBLE_TAP = { time: 300, distance: 24 };
/** A glide slower than this has stopped, in pixels per millisecond. */
const REST = 0.02;
/** How far one arrow key press pans, in pixels. */
const KEY_PAN = 48;

/**
 * Drag to pan, with momentum and a soft edge; pinch, ctrl/⌘ + wheel or the keyboard to zoom; double tap to zoom
 * in and back out. A plain wheel pans while there is room to, then lets the page scroll as usual. Every
 * behaviour follows the resolved `zoom` options.
 */
export function usePanZoom(config: PanZoomOptions): PanZoomHandlers {
  const pointers = useRef(new Map<number, Point>());
  const dragged = useRef(false);
  /** Where the finger has put the tree, before the edges resist it. */
  const raw = useRef<Transform | null>(null);
  const samples = useRef<{ x: number; y: number; t: number }[]>([]);
  const lastTap = useRef<{ x: number; y: number; t: number } | null>(null);
  const frameRequest = useRef(0);
  const latest = useRef(config);
  latest.current = config;

  const clampScale = (scale: number, give = 0) => {
    const { minScale, maxScale } = latest.current;
    return Math.min(maxScale * (1 + give), Math.max(minScale * (1 - give), scale));
  };

  const local = (clientX: number, clientY: number) => {
    const rect = latest.current.viewport.current?.getBoundingClientRect();
    return { x: clientX - (rect?.left ?? 0), y: clientY - (rect?.top ?? 0) };
  };

  const stop = () => {
    cancelAnimationFrame(frameRequest.current);
    frameRequest.current = 0;
  };

  /** Eases back inside the limits: the edges after a pull, the zoom after a pinch past them. */
  const settle = (around?: Point) => {
    const { transform, frame, onChange, options, live } = latest.current;
    live.current = false;
    raw.current = null;
    const scale = clampScale(transform.scale);
    const point = around ?? { x: frame.width / 2, y: frame.height / 2 };
    const target =
      scale === transform.scale
        ? clampTransform(transform, frame, options.align)
        : zoomAt(transform, frame, point, scale, options.align);
    if (target.x !== transform.x || target.y !== transform.y || target.scale !== transform.scale) {
      onChange(target, true);
    }
  };

  /** Carries a released drag on at its speed, slowing down, and soft against the edges. */
  const coast = (speedX: number, speedY: number) => {
    let vx = speedX;
    let vy = speedY;
    let previous = performance.now();
    const step = (now: number) => {
      const { frame, onChange, options } = latest.current;
      const elapsed = Math.min(64, now - previous);
      previous = now;
      const start = raw.current;
      if (!start) return;
      const x = glide(vx, options.deceleration, elapsed);
      const y = glide(vy, options.deceleration, elapsed);
      vx = x.speed;
      vy = y.speed;
      const next = { ...start, x: start.x + x.distance, y: start.y + y.distance };
      // Past an edge, the speed drains quickly, so the glide stops a little way out and springs back.
      const held = clampTransform(next, frame, options.align);
      if (held.x !== next.x) vx *= 0.8;
      if (held.y !== next.y) vy *= 0.8;
      raw.current = next;
      onChange(stretchTransform(next, frame, options.align, options.elasticity), false);
      if (Math.hypot(vx, vy) < REST) {
        frameRequest.current = 0;
        settle();
        return;
      }
      frameRequest.current = requestAnimationFrame(step);
    };
    frameRequest.current = requestAnimationFrame(step);
  };

  // The wheel needs a listener that may cancel the page's scroll, which React's onWheel cannot. It is attached
  // once and reads the latest state through the ref.
  // biome-ignore lint/correctness/useExhaustiveDependencies: everything it calls reads `latest`, so it never goes stale
  useEffect(() => {
    const element = latest.current.viewport.current;
    if (!element) return;
    const onWheel = (event: WheelEvent) => {
      const { transform, frame, onChange, options } = latest.current;
      if (options.wheel <= 0) return;
      stop();
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        const scale = clampScale(transform.scale * Math.exp(-event.deltaY * options.wheel));
        onChange(
          zoomAt(transform, frame, local(event.clientX, event.clientY), scale, options.align),
          false,
        );
        return;
      }
      const next = clampTransform(
        { ...transform, x: transform.x - event.deltaX, y: transform.y - event.deltaY },
        frame,
        options.align,
      );
      if (next.x === transform.x && next.y === transform.y) return;
      event.preventDefault();
      onChange(next, false);
    };
    element.addEventListener('wheel', onWheel, { passive: false });
    return () => element.removeEventListener('wheel', onWheel);
  }, []);

  useEffect(() => () => cancelAnimationFrame(frameRequest.current), []);

  const update = (event: PointerEvent<HTMLElement>) => {
    const previous = [...pointers.current.values()];
    const point = local(event.clientX, event.clientY);
    pointers.current.set(event.pointerId, point);
    const next = [...pointers.current.values()];
    const { transform, frame, onChange, options, live } = latest.current;

    if (next.length === 1 && previous.length === 1 && previous[0] && next[0]) {
      if (!options.pan) return;
      const dx = next[0].x - previous[0].x;
      const dy = next[0].y - previous[0].y;
      if (!dragged.current && Math.hypot(dx, dy) < SLOP) {
        pointers.current.set(event.pointerId, previous[0]);
        return;
      }
      if (!dragged.current) capture(event);
      dragged.current = true;
      live.current = true;
      const start = raw.current ?? transform;
      raw.current = { ...start, x: start.x + dx, y: start.y + dy };
      samples.current.push({ x: point.x, y: point.y, t: event.timeStamp });
      if (samples.current.length > 6) samples.current.shift();
      onChange(stretchTransform(raw.current, frame, options.align, options.elasticity), false);
    } else if (next.length === 2 && previous.length === 2) {
      if (!options.pinch) return;
      const [a, b] = next as [Point, Point];
      const [c, d] = previous as [Point, Point];
      const spread = Math.hypot(a.x - b.x, a.y - b.y) / (Math.hypot(c.x - d.x, c.y - d.y) || 1);
      const center = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      dragged.current = true;
      live.current = true;
      raw.current = null;
      const scale = clampScale(transform.scale * spread, options.overshoot);
      onChange(zoomAt(transform, frame, center, scale, options.align), false);
    }
  };

  const doubleTap = (point: Point) => {
    const { transform, frame, onChange, onReset, options, fitScale } = latest.current;
    if (options.doubleTap === false) return;
    if (options.doubleTap === 'toggle' && transform.scale > fitScale * 1.05) {
      onReset();
      return;
    }
    const factor = options.doubleTap === 'toggle' ? 2 : options.doubleTap;
    onChange(
      zoomAt(transform, frame, point, clampScale(transform.scale * factor), options.align),
      true,
    );
  };

  const release = (event: PointerEvent<HTMLElement>, cancelled = false) => {
    if (!pointers.current.has(event.pointerId)) return;
    const point = pointers.current.get(event.pointerId) ?? local(event.clientX, event.clientY);
    const pinching = pointers.current.size === 2;
    pointers.current.delete(event.pointerId);
    if (pointers.current.size > 0) {
      // Lifting one finger of a pinch carries on as a drag from the other, without a jump.
      if (pinching) raw.current = null;
      return;
    }
    const { options } = latest.current;

    if (!dragged.current && !cancelled) {
      const tap = { ...point, t: event.timeStamp };
      const last = lastTap.current;
      if (
        last &&
        tap.t - last.t < DOUBLE_TAP.time &&
        Math.hypot(tap.x - last.x, tap.y - last.y) < DOUBLE_TAP.distance
      ) {
        lastTap.current = null;
        doubleTap(point);
      } else {
        lastTap.current = tap;
      }
      return;
    }

    const recent = samples.current.filter((sample) => event.timeStamp - sample.t <= 100);
    samples.current = [];
    const first = recent[0];
    const last = recent.at(-1);
    const time = first && last ? last.t - first.t : 0;
    if (!cancelled && options.deceleration > 0 && raw.current && first && last && time > 0) {
      const vx = (last.x - first.x) / time;
      const vy = (last.y - first.y) / time;
      if (Math.hypot(vx, vy) > REST) return coast(vx, vy);
    }
    settle(point);
  };

  return {
    onPointerDown(event) {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      stop();
      if (pointers.current.size === 0) {
        dragged.current = false;
        raw.current = null;
        samples.current = [];
      }
      pointers.current.set(event.pointerId, local(event.clientX, event.clientY));
    },
    onPointerMove(event) {
      if (!pointers.current.has(event.pointerId)) return;
      if (event.pointerType === 'mouse' && event.buttons === 0) release(event);
      else update(event);
    },
    onPointerUp: (event) => release(event),
    onPointerCancel: (event) => release(event, true),
    onLostPointerCapture(event) {
      if (event.target === event.currentTarget) release(event, true);
    },
    onClickCapture(event) {
      if (!dragged.current) return;
      dragged.current = false;
      event.preventDefault();
      event.stopPropagation();
    },
    onKeyDown(event) {
      const { transform, frame, onChange, onReset, options } = latest.current;
      if (!options.keyboard || event.target !== event.currentTarget) return;
      const center = { x: frame.width / 2, y: frame.height / 2 };
      const pan = (dx: number, dy: number) =>
        onChange(
          clampTransform(
            { ...transform, x: transform.x + dx, y: transform.y + dy },
            frame,
            options.align,
          ),
          true,
        );
      const zoom = (factor: number) =>
        onChange(
          zoomAt(transform, frame, center, clampScale(transform.scale * factor), options.align),
          true,
        );
      const keys = new Map<string, () => void>([
        ['+', () => zoom(options.step)],
        ['=', () => zoom(options.step)],
        ['-', () => zoom(1 / options.step)],
        ['_', () => zoom(1 / options.step)],
        ['0', onReset],
        ['ArrowLeft', () => pan(KEY_PAN, 0)],
        ['ArrowRight', () => pan(-KEY_PAN, 0)],
        ['ArrowUp', () => pan(0, KEY_PAN)],
        ['ArrowDown', () => pan(0, -KEY_PAN)],
      ]);
      const action = keys.get(event.key);
      if (!action || event.metaKey || event.ctrlKey || event.altKey) return;
      event.preventDefault();
      stop();
      action();
    },
  };
}
