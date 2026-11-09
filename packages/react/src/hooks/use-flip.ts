import { type RefObject, useEffect, useRef } from 'react';
import type { Motion } from '../context';
import { useIsomorphicLayoutEffect } from './use-isomorphic-layout-effect';

interface Position {
  x: number;
  y: number;
}

/** Everything that moves when the paged bracket changes round, keyed so it can be followed. */
const MOVING = '[data-part="cell"][data-match], [data-part="round-title"][data-round]';

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

interface Move {
  element: HTMLElement;
  dx: number;
  dy: number;
  /** Opacity it starts from: 0 for a newcomer, or wherever an interrupted fade had got to. */
  from: number;
}

const keyOf = (element: HTMLElement) => element.dataset.match ?? `round:${element.dataset.round}`;

/**
 * Animates matches and round titles from where they were drawn on the previous
 * render to where they are now (the FLIP technique) and fades in newcomers.
 * `carry` is how far the content was dragged, so a released swipe continues from
 * the finger. Cards and connectors are moved by one clock in the same frame:
 * animating the cards on the compositor lets iOS draw them ahead of the lines.
 */
export function useFlip(
  container: RefObject<HTMLElement | null>,
  motion: Motion | null,
  carry?: RefObject<number>,
): void {
  const previous = useRef(new Map<string, Position>());
  const running = useRef<(() => void) | null>(null);

  useIsomorphicLayoutEffect(() => {
    const root = container.current;
    if (!root) return;

    const offset = carry?.current ?? 0;
    if (carry) carry.current = 0;
    const current = new Map<string, Position>();
    const moves: Move[] = [];

    for (const element of root.querySelectorAll<HTMLElement>(MOVING)) {
      const key = keyOf(element);
      const position = layoutPosition(element, root);
      current.set(key, position);
      if (!motion) continue;

      const before = previous.current.get(key);
      if (!before) {
        if (previous.current.size > 0) moves.push({ element, dx: 0, dy: 0, from: 0 });
        continue;
      }
      // A move cut short by a new one continues from where the element is drawn, not from its old layout.
      const drawn = flights.get(element) ?? still;
      const dx = before.x + offset + drawn.x - position.x;
      const dy = before.y + drawn.y - position.y;
      if (Math.abs(dx) >= 1 || Math.abs(dy) >= 1 || drawn.opacity < 1) {
        moves.push({ element, dx, dy, from: drawn.opacity });
      }
    }
    previous.current = current;

    // Whatever was still moving is cleared first: anything the new moves don't cover rests in its place.
    const interrupted = running.current;
    running.current = null;
    interrupted?.();
    const connectors = root.querySelector('[data-part="connectors"]');
    if (motion && moves.length > 0) running.current = play(moves, motion, connectors);
    else if (interrupted)
      connectors?.dispatchEvent(new CustomEvent(FRAME_EVENT, { detail: { done: true } }));
  });

  useEffect(() => () => running.current?.(), []);
}

const still: Flight = { x: 0, y: 0, opacity: 1 };

/** Runs the moves on one clock; returns a function that stops them and puts every element back at rest. */
function play(moves: Move[], motion: Motion, connectors: Element | null): () => void {
  const progressAt = easing(motion);
  const start = performance.now();
  let frame = 0;

  const place = (progress: number) => {
    const left = 1 - progress;
    for (const { element, dx, dy, from } of moves) {
      const flight = { x: dx * left, y: dy * left, opacity: from + (1 - from) * progress };
      flights.set(element, flight);
      element.style.transform =
        flight.x || flight.y ? `translate(${flight.x}px, ${flight.y}px)` : '';
      element.style.opacity = flight.opacity < 1 ? String(flight.opacity) : '';
    }
  };
  const settle = () => {
    for (const { element } of moves) {
      flights.delete(element);
      element.style.transform = '';
      element.style.opacity = '';
    }
  };
  const emit = (detail: { done?: boolean; sync?: boolean }) =>
    connectors?.dispatchEvent(new CustomEvent(FRAME_EVENT, { detail }));

  place(0);
  emit({ sync: true });

  const finish = () => {
    cancelAnimationFrame(frame);
    clearTimeout(timer);
    settle();
    emit({ done: true });
  };
  const tick = (now: number) => {
    const progress = progressAt(now - start);
    if (progress >= 1) return finish();
    place(progress);
    emit({});
    frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
  // Hidden tabs pause frames; a timer still lands everything where it belongs.
  const timer = setTimeout(finish, motion.duration + 50);

  return () => {
    cancelAnimationFrame(frame);
    clearTimeout(timer);
    settle();
  };
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

/** Where the element sits inside `root`, from layout offsets: transforms, drags and running moves don't count. */
function layoutPosition(element: HTMLElement, root: HTMLElement): Position {
  let x = 0;
  let y = 0;
  let node: HTMLElement | null = element;
  while (node && node !== root && root.contains(node)) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  if (node !== root) {
    x -= root.offsetLeft;
    y -= root.offsetTop;
  }
  return { x, y };
}
