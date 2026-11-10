import { type PointerEvent, type RefObject, useEffect, useRef, useState } from 'react';

export interface SwipeHandlers {
  onPointerDown: (event: PointerEvent<HTMLElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLElement>) => void;
  onPointerCancel: (event: PointerEvent<HTMLElement>) => void;
  onLostPointerCapture: (event: PointerEvent<HTMLElement>) => void;
}

interface SwipeOptions {
  /** The element being swiped, so page scrolling can be held while a swipe is under way. */
  target: RefObject<HTMLElement | null>;
  /** Called on every move with the distance dragged, outside React, so it can move the content directly. */
  onDrag: (offset: number) => void;
  /**
   * Called once when the finger lifts, before `onSwipe`, with the distance it was dragged, the way it pages
   * (`1` on, `-1` back, `0` when it stays: a cancel, or a drag that was too short or too slow), and how far it
   * was heading: the distance plus a short glide on its speed, for paging more than once.
   */
  onRelease?: (offset: number, direction: -1 | 0 | 1, heading: number) => void;
  onSwipe?: (direction: -1 | 1) => void;
  /** Fraction of the element width a release must be heading past to count as a swipe. */
  threshold?: number;
}

interface Gesture {
  id: number;
  x: number;
  y: number;
  width: number;
  /** Recent positions, to tell a flick from a slow drag. */
  samples: { x: number; t: number }[];
  locked: boolean;
}

/** How far a release glides on its speed when judging where the finger was heading, in milliseconds. */
const GLIDE = 180;
/** Shorter drags never page, however fast: they are taps that slipped. */
const MIN_DISTANCE = 16;
const SLOP = 8;

/**
 * Horizontal swipe on pointer events. The content follows the finger without a
 * re-render, flicks page on speed as well as distance, and vertical drags are
 * left to the browser so the page keeps scrolling normally.
 */
export function useSwipe({ target, onDrag, onRelease, onSwipe, threshold = 0.2 }: SwipeOptions): {
  dragging: boolean;
  handlers: SwipeHandlers;
} {
  const gesture = useRef<Gesture | null>(null);
  const [dragging, setDragging] = useState(false);
  const callbacks = useRef({ onDrag, onRelease, onSwipe });
  callbacks.current = { onDrag, onRelease, onSwipe };

  const finish = (pointerId: number, clientX: number, time: number, cancelled: boolean) => {
    const current = gesture.current;
    if (!current || current.id !== pointerId) return;
    gesture.current = null;
    if (!current.locked) return;

    const distance = cancelled ? 0 : clientX - current.x;
    // Judge where the finger was heading as it lifted, like native paging: a flick carries a short drag over,
    // and a pause before lifting leaves only the distance.
    current.samples.push({ x: clientX, t: time });
    const heading = distance + velocity(current.samples) * GLIDE;
    const pages =
      !cancelled &&
      Math.abs(distance) >= MIN_DISTANCE &&
      Math.sign(heading) === Math.sign(distance) &&
      Math.abs(heading) >= current.width * threshold;
    const direction = pages ? (distance < 0 ? 1 : -1) : 0;

    callbacks.current.onRelease?.(distance, direction, cancelled ? 0 : heading);
    setDragging(false);
    if (direction !== 0) callbacks.current.onSwipe?.(direction);
  };
  const latest = useRef(finish);
  latest.current = finish;

  // Once a swipe is under way, hold the page still: iOS otherwise scrolls it on any diagonal movement.
  useEffect(() => {
    const element = target.current;
    if (!element) return;
    const hold = (event: TouchEvent) => {
      if (gesture.current?.locked && event.cancelable) event.preventDefault();
    };
    element.addEventListener('touchmove', hold, { passive: false });
    return () => element.removeEventListener('touchmove', hold);
  }, [target]);

  // A release outside the page, or the window losing focus, still ends the drag.
  useEffect(() => {
    if (!dragging) return;
    const release = (event: globalThis.PointerEvent) =>
      latest.current(event.pointerId, event.clientX, event.timeStamp, false);
    const cancel = (event: globalThis.PointerEvent) => latest.current(event.pointerId, 0, 0, true);
    const blur = () => gesture.current && latest.current(gesture.current.id, 0, 0, true);
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', cancel);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', cancel);
      window.removeEventListener('blur', blur);
    };
  }, [dragging]);

  const handlers: SwipeHandlers = {
    onPointerDown(event) {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      if (gesture.current) return;
      gesture.current = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        width: event.currentTarget.getBoundingClientRect().width,
        samples: [{ x: event.clientX, t: event.timeStamp }],
        locked: false,
      };
    },
    onPointerMove(event) {
      const current = gesture.current;
      if (!current || current.id !== event.pointerId) return;
      if (event.pointerType === 'mouse' && event.buttons === 0) {
        return finish(event.pointerId, event.clientX, event.timeStamp, false);
      }
      const dx = event.clientX - current.x;
      const dy = event.clientY - current.y;
      if (!current.locked) {
        if (Math.abs(dx) < SLOP || Math.abs(dx) < Math.abs(dy)) {
          if (Math.abs(dy) > SLOP) gesture.current = null;
          return;
        }
        current.locked = true;
        capture(event);
        setDragging(true);
      }
      current.samples.push({ x: event.clientX, t: event.timeStamp });
      if (current.samples.length > 6) current.samples.shift();
      callbacks.current.onDrag(dx);
    },
    onPointerUp: (event) => finish(event.pointerId, event.clientX, event.timeStamp, false),
    onPointerCancel: (event) => finish(event.pointerId, 0, 0, true),
    // Touch starts captured by the card under the finger. Taking it over makes that card fire this event, which
    // bubbles here; only the viewport itself losing the pointer ends the drag, and then without a swipe.
    onLostPointerCapture(event) {
      if (event.target === event.currentTarget) finish(event.pointerId, 0, 0, true);
    },
  };

  return { dragging, handlers };
}

/** Speed over the last ~100 ms before the finger lifted, in pixels per millisecond. */
function velocity(samples: { x: number; t: number }[]): number {
  const last = samples.at(-1);
  if (!last) return 0;
  const first = samples.find((sample) => last.t - sample.t <= 100) ?? last;
  const time = last.t - first.t;
  return time > 0 ? (last.x - first.x) / time : 0;
}

/** iOS-style resistance: the further you pull past an edge, the less it follows. */
export function rubberBand(distance: number, dimension: number): number {
  if (dimension <= 0) return 0;
  const stretch = 1 - 1 / ((Math.abs(distance) * 0.55) / dimension + 1);
  return Math.sign(distance) * stretch * dimension;
}

/** Keeps receiving moves outside the element. A pointer that already ended cannot be captured. */
export function capture(event: PointerEvent<HTMLElement>): void {
  try {
    event.currentTarget.setPointerCapture(event.pointerId);
  } catch {
    // The drag still works while the pointer stays over the element.
  }
}
