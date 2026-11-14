import { type RefObject, useEffect, useRef } from 'react';
import type { Motion, Placed } from '../context';
import { useIsomorphicLayoutEffect } from './use-isomorphic-layout-effect';

/** Everything that moves when the paged bracket changes round, keyed so it can be followed. */
const MOVING = '[data-part="cell"][data-match], [data-part="round-title"][data-round]';
const LEAVING = '[data-leaving]';

/**
 * Fired on `Bracket.Connectors` on every frame of a move, right after the cards are placed, so the lines are
 * drawn from the same numbers in the same frame. `detail.done` marks the last one; `detail.sync` the first,
 * which runs inside React's own commit.
 */
export const FRAME_EVENT = 'bracket:frame';

/** Where each moving element is drawn right now, relative to its layout position. */
export interface Flight {
  x: number;
  y: number;
  opacity: number;
}

export const flights: WeakMap<Element, Flight> = new WeakMap();

/** A flight that has landed: where the layout puts it, fully visible. */
export const still: Flight = { x: 0, y: 0, opacity: 1 };

/** An element animated from one offset and opacity to another. */
interface Move {
  element: HTMLElement;
  x: [number, number];
  y: [number, number];
  opacity: [number, number];
  /** How far into the move it reaches its final height, so a part caught mid-move keeps its pace. */
  landsAt: number;
  /** Part of a round sliding away: it keeps its last place until React lets it go. */
  leaving: boolean;
}

/** A move in progress, run by a clock or by a finger. */
export interface Run {
  /** How far the rounds travel sideways over the whole move, in pixels. */
  distance: number;
  /** Places everything `progress` of the way there (0 to 1), for a swipe in progress. */
  seek(progress: number): void;
  /** Plays the rest of the move on the clock, then calls `done`. */
  finish(done?: () => void): void;
}

interface FlipOptions {
  /** How far the content was dragged, so a released drag continues from the finger. */
  carry?: RefObject<number>;
  /** When true the next move waits at its start for `run.seek`, instead of playing on the clock. */
  scrub?: RefObject<boolean>;
  /** Called when a move played on the clock has finished. */
  onSettle?: () => void;
  /** Called as a move starts, before its first frame is placed. */
  onBegin?: () => void;
  /** Called on every placed frame with the move's progress, to resize what holds the cards. */
  onFrame?: (progress: number) => void;
}

const keyOf = (element: HTMLElement) => element.dataset.match ?? `round:${element.dataset.round}`;

/**
 * Animates matches and round titles from where they were drawn on the previous
 * render to where they are now (the FLIP technique). Newcomers slide in from
 * the side everything is moving towards, and a round that was moved past slides
 * away the same way instead of vanishing. Cards and connectors move on one clock
 * in the same frame: animating the cards on the compositor lets iOS draw them
 * ahead of the lines. Returns where each element was last drawn, and the move in
 * progress, so a swipe can drive it.
 */
export function useFlip(
  container: RefObject<HTMLElement | null>,
  motion: Motion | null,
  { carry, scrub, onSettle, onBegin, onFrame }: FlipOptions = {},
): { placed: RefObject<Map<string, Placed>>; run: RefObject<Run | null> } {
  const placed = useRef(new Map<string, Placed>());
  const run = useRef<Run | null>(null);
  const stop = useRef<(() => void) | null>(null);
  const width = useRef<number | null>(null);
  const hooks = useRef({ onSettle, onBegin, onFrame });
  hooks.current = { onSettle, onBegin, onFrame };

  useIsomorphicLayoutEffect(() => {
    const root = container.current;
    if (!root) return;
    // Boxes are kept relative to the content, which is what a leaving round is pinned inside.
    const origin = root.querySelector<HTMLElement>(':scope > [data-part="content"]') ?? root;

    // A resize moves every card, but nothing about the tournament changed: cards go straight to their place.
    const resized = width.current !== null && width.current !== root.clientWidth;
    width.current = root.clientWidth;
    const animate = resized ? null : motion;

    const offset = carry?.current ?? 0;
    if (carry) carry.current = 0;
    const before = placed.current;
    const now = new Map<string, Placed>();
    const moves: Move[] = [];
    const newcomers: HTMLElement[] = [];
    const leaving: HTMLElement[] = [];

    for (const element of root.querySelectorAll<HTMLElement>(MOVING)) {
      const key = keyOf(element);
      if (element.closest(LEAVING)) {
        leaving.push(element);
        const was = before.get(key);
        if (was) now.set(key, was);
        continue;
      }
      const box = layoutBox(element, origin);
      now.set(key, box);
      if (!animate) continue;

      const was = before.get(key);
      if (!was) {
        if (before.size > 0) newcomers.push(element);
        continue;
      }
      // A move cut short by a new one continues from where the element is drawn, not from its old layout.
      const drawn = flights.get(element) ?? still;
      const dx = was.x + offset + drawn.x - box.x;
      const dy = was.y + drawn.y - box.y;
      if (Math.abs(dx) >= 1 || Math.abs(dy) >= 1 || drawn.opacity < 1) {
        moves.push({
          element,
          x: [dx, 0],
          y: [dy, 0],
          opacity: [drawn.opacity, 1],
          landsAt: 1,
          leaving: false,
        });
      }
    }
    placed.current = now;

    // Everything travels the same way sideways; the middle of the moves says how far.
    const shift = median(moves.map((move) => move.x[0]));
    if (animate) {
      for (const element of newcomers) {
        moves.push({
          element,
          x: [shift, 0],
          y: [0, 0],
          opacity: [0, 1],
          landsAt: 1,
          leaving: false,
        });
      }
      for (const element of leaving) {
        const drawn = flights.get(element) ?? still;
        const to = drawn.x - shift;
        // Caught on its way into place, it settles to its height as it passes that place, as it was going to.
        moves.push({
          element,
          x: [drawn.x, to],
          y: [drawn.y, 0],
          opacity: [drawn.opacity, 0],
          landsAt: shift ? Math.min(1, Math.max(0.05, drawn.x / shift)) : 1,
          leaving: true,
        });
      }
    }

    // Whatever was still moving is cleared first: anything the new moves don't cover rests in its place.
    const interrupted = stop.current;
    stop.current = null;
    run.current = null;
    interrupted?.();
    const connectors = root.querySelector('[data-part="connectors"]');
    if (animate && moves.length > 0) {
      hooks.current.onBegin?.();
      const next = start(moves, Math.abs(shift), animate, connectors, (progress) =>
        hooks.current.onFrame?.(progress),
      );
      stop.current = next.stop;
      run.current = next;
      if (!scrub?.current) next.finish(() => hooks.current.onSettle?.());
    } else {
      if (interrupted) {
        connectors?.dispatchEvent(new CustomEvent(FRAME_EVENT, { detail: { done: true } }));
      }
      hooks.current.onFrame?.(1);
      if (leaving.length > 0) hooks.current.onSettle?.();
    }
  });

  // A card can move without a render, like when its own CSS transition grows it. Keeping every place current
  // means the next render, whatever causes it, only animates what that render moved.
  useIsomorphicLayoutEffect(() => {
    const root = container.current;
    if (!root || typeof ResizeObserver === 'undefined') return;
    const origin = root.querySelector<HTMLElement>(':scope > [data-part="content"]') ?? root;
    const elements = [...root.querySelectorAll<HTMLElement>(MOVING)].filter(
      (element) => !element.closest(LEAVING),
    );
    const observer = new ResizeObserver(() => {
      const fresh = new Map(placed.current);
      for (const element of elements) fresh.set(keyOf(element), layoutBox(element, origin));
      placed.current = fresh;
    });
    observer.observe(origin);
    for (const element of elements) observer.observe(element);
    return () => observer.disconnect();
  });

  useEffect(() => () => stop.current?.(), []);

  return { placed, run };
}

/** Sets up a move at its start; a finger seeks it, or the clock finishes it. */
function start(
  moves: Move[],
  distance: number,
  motion: Motion,
  connectors: Element | null,
  onFrame: (progress: number) => void,
): Run & { stop: () => void } {
  const progressAt = easing(motion);
  let progress = 0;
  let frame = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const between = ([from, to]: [number, number], at: number) => from + (to - from) * at;
  const place = (at: number) => {
    progress = at;
    for (const move of moves) {
      const flight = {
        x: between(move.x, at),
        y: between(move.y, Math.min(1, at / move.landsAt)),
        opacity: between(move.opacity, at),
      };
      flights.set(move.element, flight);
      const { style } = move.element;
      // translate3d keeps each card on its own GPU layer while the clock moves it from the main thread.
      style.transform = flight.x || flight.y ? `translate3d(${flight.x}px, ${flight.y}px, 0)` : '';
      style.opacity = flight.opacity < 1 ? String(flight.opacity) : '';
    }
    onFrame(at);
  };
  const emit = (detail: { done?: boolean; sync?: boolean }) =>
    connectors?.dispatchEvent(new CustomEvent(FRAME_EVENT, { detail }));
  // Leaving parts keep their last place and fade until React removes them, so they never flash back; if one
  // comes back instead, its flight says where it is drawn, and the next move picks it up from there.
  const settle = () => {
    for (const { element, leaving } of moves) {
      if (leaving) continue;
      flights.delete(element);
      element.style.transform = '';
      element.style.opacity = '';
    }
  };
  const halt = () => {
    cancelAnimationFrame(frame);
    clearTimeout(timer);
  };

  place(0);
  emit({ sync: true });

  return {
    distance,
    seek(at) {
      halt();
      place(Math.min(1, Math.max(0, at)));
      emit({});
    },
    finish(done) {
      halt();
      const from = progress;
      const duration = motion.duration * (1 - from);
      const begin = performance.now();
      const land = () => {
        halt();
        place(1);
        settle();
        emit({ done: true });
        done?.();
      };
      const tick = (now: number) => {
        const elapsed = now - begin;
        if (elapsed >= duration) return land();
        place(from + (1 - from) * progressAt((elapsed / duration) * motion.duration));
        emit({});
        frame = requestAnimationFrame(tick);
      };
      if (duration <= 0) return land();
      frame = requestAnimationFrame(tick);
      // Hidden tabs pause frames; a timer still lands everything where it belongs.
      timer = setTimeout(land, duration + 50);
    },
    stop() {
      halt();
      settle();
    },
  };
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[sorted.length >> 1] ?? 0;
}

/**
 * Eased progress for `motion.easing` after `elapsed` ms. The browser does the easing on an animation that is
 * never shown, so any CSS easing works, exactly as it would in CSS.
 */
function easing({ duration, easing }: Motion): (elapsed: number) => number {
  if (typeof KeyframeEffect === 'undefined' || typeof Animation === 'undefined') {
    return (elapsed) => Math.min(1, elapsed / duration);
  }
  const clock = new Animation(new KeyframeEffect(null, null, { duration, easing, fill: 'both' }));
  return (elapsed) => {
    if (elapsed >= duration) return 1;
    clock.currentTime = Math.max(0, elapsed);
    return clock.effect?.getComputedTiming().progress ?? 1;
  };
}

/** The element's box inside `origin`, from layout offsets: transforms, drags and running moves don't count. */
function layoutBox(element: HTMLElement, origin: HTMLElement): Placed {
  let x = 0;
  let y = 0;
  let node: HTMLElement | null = element;
  while (node && node !== origin && origin.contains(node)) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  if (node !== origin) {
    x -= origin.offsetLeft;
    y -= origin.offsetTop;
  }
  return { x, y, width: element.offsetWidth, height: element.offsetHeight };
}
