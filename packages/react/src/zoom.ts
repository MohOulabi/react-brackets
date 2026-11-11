import { type Context, createContext, useContext, useSyncExternalStore } from 'react';
import type { Point } from './paths';

/** What `useZoom()` returns inside a pan and zoom viewport: where it is, and how to move it. */
export interface ZoomState {
  /** The zoom now: `1` is the tree's natural size. */
  scale: number;
  /** The zoom that fits the whole tree's width, never above 1. */
  fitScale: number;
  /** The smallest zoom allowed. */
  minScale: number;
  /** The largest zoom allowed. */
  maxScale: number;
  /** `false` at the largest zoom. */
  canZoomIn: boolean;
  /** `false` at the smallest zoom. */
  canZoomOut: boolean;
  /** `true` while the tree is fitted to the viewport, as it starts. */
  fitted: boolean;
  /** Zooms in around the centre by `step`, or by the `zoom.step` option. */
  zoomIn: (step?: number) => void;
  /** Zooms out around the centre by `step`, or by the `zoom.step` option. */
  zoomOut: (step?: number) => void;
  /** Zooms to a scale around a point in the viewport, the centre by default. Kept between the limits. */
  zoomTo: (scale: number, focus?: Point) => void;
  /** Moves the tree by a distance in pixels, stopping at its edges. */
  panBy: (dx: number, dy: number) => void;
  /** Moves the tree to a position, as the offset of its top-left corner, stopping at its edges. */
  panTo: (x: number, y: number) => void;
  /** Fits the whole tree back into view. */
  reset: () => void;
}

/** Holds the zoom of the viewport inside a `Bracket.Root`, so controls anywhere in it can read and move it. */
export interface ZoomStore {
  get: () => ZoomState | null;
  set: (state: ZoomState | null) => void;
  subscribe: (listener: () => void) => () => void;
}

export function createZoomStore(): ZoomStore {
  let state: ZoomState | null = null;
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    set(next) {
      state = next;
      for (const listener of listeners) listener();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export const ZoomContext: Context<ZoomStore | null> = createContext<ZoomStore | null>(null);

const none = () => null;
const ignore = () => () => {};

/**
 * The zoom of the pan and zoom viewport in this bracket, and actions to change it: build your own controls with
 * it, anywhere inside `Bracket.Root`. `null` while the bracket isn't showing a pan and zoom viewport.
 */
export function useZoom(): ZoomState | null {
  const store = useContext(ZoomContext);
  return useSyncExternalStore(store?.subscribe ?? ignore, store?.get ?? none, none);
}
