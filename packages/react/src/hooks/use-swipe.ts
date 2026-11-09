import { type PointerEvent, useEffect, useRef, useState } from 'react';

export interface SwipeHandlers {
  onPointerDown: (event: PointerEvent<HTMLElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLElement>) => void;
  onPointerCancel: (event: PointerEvent<HTMLElement>) => void;
  onLostPointerCapture: (event: PointerEvent<HTMLElement>) => void;
}

interface SwipeOptions {
  onSwipe: (direction: -1 | 1) => void;
  /** Fraction of the element width a drag must cover to count as a swipe. */
  threshold?: number;
}

/**
 * Horizontal swipe on pointer events. Vertical drags are left to the browser
 * so the page keeps scrolling normally on touch screens.
 */
export function useSwipe({ onSwipe, threshold = 0.2 }: SwipeOptions): {
  offset: number;
  dragging: boolean;
  handlers: SwipeHandlers;
} {
  const start = useRef<{ x: number; y: number; width: number; id: number } | null>(null);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);

  const finish = (clientX: number, cancelled: boolean) => {
    const origin = start.current;
    if (!origin) return;
    start.current = null;
    setDragging(false);
    setOffset(0);
    if (cancelled) return;
    const distance = clientX - origin.x;
    if (Math.abs(distance) >= origin.width * threshold) onSwipe(distance < 0 ? 1 : -1);
  };
  const latest = useRef(finish);
  latest.current = finish;

  // A release outside the page, or a capture the browser took back, still ends the drag.
  useEffect(() => {
    if (!dragging) return;
    const release = (event: globalThis.PointerEvent) => latest.current(event.clientX, false);
    const cancel = () => latest.current(0, true);
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', cancel);
    window.addEventListener('blur', cancel);
    return () => {
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', cancel);
      window.removeEventListener('blur', cancel);
    };
  }, [dragging]);

  const handlers: SwipeHandlers = {
    onPointerDown(event) {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      const width = event.currentTarget.getBoundingClientRect().width;
      start.current = { x: event.clientX, y: event.clientY, width, id: event.pointerId };
    },
    onPointerMove(event) {
      const origin = start.current;
      if (!origin || origin.id !== event.pointerId) return;
      if (event.pointerType === 'mouse' && event.buttons === 0) return finish(event.clientX, false);
      const dx = event.clientX - origin.x;
      const dy = event.clientY - origin.y;
      if (!dragging) {
        if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy)) {
          if (Math.abs(dy) > 8) start.current = null;
          return;
        }
        capture(event);
        setDragging(true);
      }
      setOffset(dx);
    },
    onPointerUp: (event) => finish(event.clientX, false),
    onPointerCancel: () => finish(0, true),
    onLostPointerCapture: (event) => finish(event.clientX, false),
  };

  return { offset, dragging, handlers };
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
