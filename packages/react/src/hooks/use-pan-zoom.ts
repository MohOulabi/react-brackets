import { type PointerEvent, type RefObject, useEffect, useRef } from 'react';
import { capture } from './use-swipe';

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

/** Keeps the content inside the frame: no empty space can be dragged into view. */
export function clampTransform(transform: Transform, frame: Frame): Transform {
  const width = frame.contentWidth * transform.scale;
  const height = frame.contentHeight * transform.scale;
  const x =
    width <= frame.width
      ? frame.rtl
        ? frame.width - width
        : 0
      : Math.min(0, Math.max(frame.width - width, transform.x));
  const y = height <= frame.height ? 0 : Math.min(0, Math.max(frame.height - height, transform.y));
  return { x, y, scale: transform.scale };
}

/** Scales around `point` so whatever is under it stays put. */
export function zoomAt(
  transform: Transform,
  frame: Frame,
  point: { x: number; y: number },
  scale: number,
): Transform {
  const ratio = scale / transform.scale;
  return clampTransform(
    {
      scale,
      x: point.x - (point.x - transform.x) * ratio,
      y: point.y - (point.y - transform.y) * ratio,
    },
    frame,
  );
}

interface PanZoomOptions {
  viewport: RefObject<HTMLElement | null>;
  frame: Frame;
  transform: Transform;
  onChange: (transform: Transform) => void;
  minScale: number;
  maxScale: number;
}

export interface PanZoomHandlers {
  onPointerDown: (event: PointerEvent<HTMLElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLElement>) => void;
  onPointerCancel: (event: PointerEvent<HTMLElement>) => void;
  onLostPointerCapture: (event: PointerEvent<HTMLElement>) => void;
  onClickCapture: (event: { preventDefault: () => void; stopPropagation: () => void }) => void;
}

/**
 * Drag to pan, pinch or ctrl/⌘ + wheel to zoom. Plain wheel pans while there is
 * room to, then lets the page scroll as usual.
 */
export function usePanZoom({
  viewport,
  frame,
  transform,
  onChange,
  minScale,
  maxScale,
}: PanZoomOptions): PanZoomHandlers {
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const dragged = useRef(false);
  const latest = useRef({ frame, transform, onChange, minScale, maxScale });
  latest.current = { frame, transform, onChange, minScale, maxScale };

  const clampScale = (scale: number) =>
    Math.min(latest.current.maxScale, Math.max(latest.current.minScale, scale));

  const local = (clientX: number, clientY: number) => {
    const rect = viewport.current?.getBoundingClientRect();
    return { x: clientX - (rect?.left ?? 0), y: clientY - (rect?.top ?? 0) };
  };

  useEffect(() => {
    const element = viewport.current;
    if (!element) return;

    const onWheel = (event: WheelEvent) => {
      const { transform: current, frame: bounds, onChange: emit } = latest.current;
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        const scale = clampScale(current.scale * Math.exp(-event.deltaY * 0.01));
        emit(zoomAt(current, bounds, local(event.clientX, event.clientY), scale));
        return;
      }
      const next = clampTransform(
        { ...current, x: current.x - event.deltaX, y: current.y - event.deltaY },
        bounds,
      );
      if (next.x === current.x && next.y === current.y) return;
      event.preventDefault();
      emit(next);
    };

    element.addEventListener('wheel', onWheel, { passive: false });
    return () => element.removeEventListener('wheel', onWheel);
  });

  const update = (event: PointerEvent<HTMLElement>) => {
    const previous = [...pointers.current.values()];
    pointers.current.set(event.pointerId, local(event.clientX, event.clientY));
    const next = [...pointers.current.values()];
    const { transform: current, frame: bounds, onChange: emit } = latest.current;

    if (next.length === 1 && previous.length === 1 && previous[0] && next[0]) {
      const dx = next[0].x - previous[0].x;
      const dy = next[0].y - previous[0].y;
      if (!dragged.current && Math.hypot(dx, dy) < 4) {
        pointers.current.set(event.pointerId, previous[0]);
        return;
      }
      if (!dragged.current) capture(event);
      dragged.current = true;
      emit(clampTransform({ ...current, x: current.x + dx, y: current.y + dy }, bounds));
    } else if (next.length === 2 && previous.length === 2) {
      const [a, b] = next as [{ x: number; y: number }, { x: number; y: number }];
      const [c, d] = previous as [{ x: number; y: number }, { x: number; y: number }];
      const spread = Math.hypot(a.x - b.x, a.y - b.y) / (Math.hypot(c.x - d.x, c.y - d.y) || 1);
      const center = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      dragged.current = true;
      emit(zoomAt(current, bounds, center, clampScale(current.scale * spread)));
    }
  };

  const release = (event: PointerEvent<HTMLElement>) => {
    pointers.current.delete(event.pointerId);
  };

  return {
    onPointerDown(event) {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      dragged.current = false;
      pointers.current.set(event.pointerId, local(event.clientX, event.clientY));
    },
    onPointerMove(event) {
      if (!pointers.current.has(event.pointerId)) return;
      if (event.pointerType === 'mouse' && event.buttons === 0) release(event);
      else update(event);
    },
    onPointerUp: release,
    onPointerCancel: release,
    onLostPointerCapture(event) {
      if (event.target === event.currentTarget) release(event);
    },
    onClickCapture(event) {
      if (!dragged.current) return;
      dragged.current = false;
      event.preventDefault();
      event.stopPropagation();
    },
  };
}
