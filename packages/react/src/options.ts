/** How the pan and zoom viewport behaves. Every option is optional; the defaults are what you get without it. */
export interface ZoomOptions {
  /**
   * The smallest zoom. `'fit'` is the zoom that fits the whole tree's width, never above 1.
   * @defaultValue 'fit'
   */
  minScale?: number | 'fit';
  /**
   * The largest zoom.
   * @defaultValue 2
   */
  maxScale?: number;
  /**
   * How much one press of the zoom buttons, or of `+` and `-`, zooms by.
   * @defaultValue 1.25
   */
  step?: number;
  /**
   * Where the tree starts: fitted, at a zoom, or at a zoom and position of your own.
   * @defaultValue 'fit'
   */
  initial?: 'fit' | number | { scale: number; x: number; y: number };
  /**
   * Where the tree sits while it is smaller than the viewport: against the start edge, or centred.
   * @defaultValue 'start'
   */
  align?: 'start' | 'center';
  /**
   * Drag to pan.
   * @defaultValue true
   */
  pan?: boolean;
  /**
   * Pinch with two fingers to zoom.
   * @defaultValue true
   */
  pinch?: boolean;
  /**
   * Ctrl or ⌘ + wheel zooms, and a plain wheel pans while there is room to. `sensitivity` is how much one
   * pixel of wheel movement zooms by.
   * @defaultValue true, with a sensitivity of 0.01
   */
  wheel?: boolean | { sensitivity?: number };
  /**
   * What a double click or double tap does: `'toggle'` zooms in two times and back out to fit, a number
   * zooms in by that much each time, `false` does nothing.
   * @defaultValue 'toggle'
   */
  doubleTap?: 'toggle' | number | false;
  /**
   * A drag released at speed keeps gliding and slows down. `deceleration` is how much speed is kept per
   * millisecond, between 0 and 1: higher glides further.
   * @defaultValue true, with a deceleration of 0.998
   */
  momentum?: boolean | { deceleration?: number };
  /**
   * How far the tree can be pulled past its edges before springing back, from `0` (a hard stop) to `1`.
   * @defaultValue 0.55
   */
  elasticity?: number;
  /**
   * How far a pinch can go past the smallest and largest zoom before settling back, as a share of them.
   * @defaultValue 0.15
   */
  overshoot?: number;
  /**
   * `+`, `-` and `0` zoom, and the arrow keys pan, while the viewport has focus.
   * @defaultValue true
   */
  keyboard?: boolean;
  /** Called with the new zoom whenever it changes. */
  onZoomChange?: (scale: number) => void;
}

/** How a swipe between rounds feels in the paged view. */
export interface SwipeOptions {
  /**
   * The share of the width the round in focus takes; the rest shows the next round coming.
   * @defaultValue 0.76
   */
  focus?: number;
  /**
   * How far, as a share of a round, a slow drag has to go to change round.
   * @defaultValue 0.2
   */
  commit?: number;
  /**
   * How far ahead a flick is projected when judging where it was heading, in seconds of its speed.
   * @defaultValue 0.18
   */
  projection?: number;
  /**
   * How far the first and last round can be pulled past the edge, from `0` (a hard stop) to `1`.
   * @defaultValue 0.55
   */
  elasticity?: number;
}

export interface ResolvedZoom {
  minScale: number | 'fit';
  maxScale: number;
  step: number;
  initial: 'fit' | number | { scale: number; x: number; y: number };
  align: 'start' | 'center';
  pan: boolean;
  pinch: boolean;
  /** `0` when the wheel is off. */
  wheel: number;
  doubleTap: 'toggle' | number | false;
  /** `0` when momentum is off. */
  deceleration: number;
  elasticity: number;
  overshoot: number;
  keyboard: boolean;
  onZoomChange: ((scale: number) => void) | undefined;
}

export type ResolvedSwipe = Required<SwipeOptions>;

export function resolveZoom(options: ZoomOptions = {}): ResolvedZoom {
  const { wheel = true, momentum = true } = options;
  return {
    minScale: options.minScale ?? 'fit',
    maxScale: options.maxScale ?? 2,
    step: options.step ?? 1.25,
    initial: options.initial ?? 'fit',
    align: options.align ?? 'start',
    pan: options.pan ?? true,
    pinch: options.pinch ?? true,
    wheel: wheel === false ? 0 : wheel === true ? 0.01 : (wheel.sensitivity ?? 0.01),
    doubleTap: options.doubleTap ?? 'toggle',
    deceleration:
      momentum === false ? 0 : momentum === true ? 0.998 : (momentum.deceleration ?? 0.998),
    elasticity: options.elasticity ?? 0.55,
    overshoot: options.overshoot ?? 0.15,
    keyboard: options.keyboard ?? true,
    onZoomChange: options.onZoomChange,
  };
}

export function resolveSwipe(options: SwipeOptions = {}): ResolvedSwipe {
  return {
    focus: options.focus ?? 0.76,
    commit: options.commit ?? 0.2,
    projection: options.projection ?? 0.18,
    elasticity: options.elasticity ?? 0.55,
  };
}
