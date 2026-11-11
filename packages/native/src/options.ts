import type { EasingFunction } from 'react-native-reanimated';
import type { Transform } from './motion';

/** How pan-zoom behaves, in the full tree's `pan-zoom` mode. */
export interface ZoomOptions {
  /**
   * The smallest zoom: `fit` shows the whole width, and is never more than 1.
   * @defaultValue 'fit'
   */
  minScale?: 'fit' | number;
  /** @defaultValue 2 */
  maxScale?: number;
  /**
   * How much the zoom buttons and `zoomIn()`/`zoomOut()` zoom at a time.
   * @defaultValue 1.5
   */
  step?: number;
  /**
   * Where it starts, and where reset returns to: fitted, a scale, or a scale and position.
   * @defaultValue 'fit'
   */
  initial?: 'fit' | number | Transform;
  /**
   * Where a tree smaller than the frame sits: free to move from the start, or held in the middle.
   * @defaultValue 'start'
   */
  align?: 'start' | 'center';
  /** @defaultValue true */
  pinch?: boolean;
  /** @defaultValue true */
  pan?: boolean;
  /**
   * `toggle` zooms in twice over and back out to fit; a number zooms in by that much; `false` turns it off.
   * @defaultValue 'toggle'
   */
  doubleTap?: 'toggle' | number | false;
  /**
   * Whether a drag carries on with its speed once released, and how fast it slows, from 0 to 1.
   * @defaultValue true
   */
  momentum?: boolean | { deceleration?: number };
  /**
   * How far a fling runs past an edge before springing back. `0` stops hard at the edges.
   * @defaultValue 0.6
   */
  elasticity?: number;
  /**
   * How far a pinch may go past the smallest and largest zoom, as a share, before settling back.
   * @defaultValue 0.15
   */
  overshoot?: number;
  /** Zoom animations. The length follows `motion` unless set here. */
  animation?: { duration?: number; easing?: EasingFunction };
  /** Called with the scale once a zoom lands. */
  onZoomChange?: (scale: number) => void;
}

/** How a swipe pages in the paged view. */
export interface SwipeOptions {
  /**
   * Share of the width given to the round in focus; the rest shows the next round coming.
   * @defaultValue 0.76
   */
  focus?: number;
  /**
   * How far, as a share of a round, a slow drag must go to page.
   * @defaultValue 0.2
   */
  commit?: number;
  /**
   * How far ahead a flick is projected, in seconds of its speed, to judge where it was heading.
   * @defaultValue 0.18
   */
  projection?: number;
  /**
   * How much a drag past the first or last round gives. `0` stops hard.
   * @defaultValue 0.55
   */
  elasticity?: number;
  /** The spring a released swipe settles with. */
  spring?: { mass?: number; stiffness?: number; damping?: number };
}

export type ResolvedZoom = Required<
  Omit<ZoomOptions, 'momentum' | 'animation' | 'onZoomChange'>
> & {
  /** `null` turns momentum off. */
  deceleration: number | null;
  duration: number;
  easing: EasingFunction | undefined;
};

export type ResolvedSwipe = Required<Omit<SwipeOptions, 'spring'>> & {
  spring: { mass: number; stiffness: number; damping: number };
};

export function resolveZoom(zoom: ZoomOptions | undefined, duration: number | null): ResolvedZoom {
  const momentum = zoom?.momentum ?? true;
  return {
    minScale: zoom?.minScale ?? 'fit',
    maxScale: zoom?.maxScale ?? 2,
    step: zoom?.step ?? 1.5,
    initial: zoom?.initial ?? 'fit',
    align: zoom?.align ?? 'start',
    pinch: zoom?.pinch ?? true,
    pan: zoom?.pan ?? true,
    doubleTap: zoom?.doubleTap ?? 'toggle',
    deceleration:
      momentum === false
        ? null
        : ((momentum === true ? undefined : momentum.deceleration) ?? 0.998),
    elasticity: zoom?.elasticity ?? 0.6,
    overshoot: zoom?.overshoot ?? 0.15,
    // Reduced motion wins over a length set here.
    duration: duration === null ? 0 : (zoom?.animation?.duration ?? duration),
    easing: zoom?.animation?.easing,
  };
}

export function resolveSwipe(swipe: SwipeOptions | undefined): ResolvedSwipe {
  return {
    focus: swipe?.focus ?? 0.76,
    commit: swipe?.commit ?? 0.2,
    projection: swipe?.projection ?? 0.18,
    elasticity: swipe?.elasticity ?? 0.55,
    spring: { mass: 1, stiffness: 260, damping: 30, ...swipe?.spring },
  };
}
