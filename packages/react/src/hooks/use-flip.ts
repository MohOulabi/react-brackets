import { type RefObject, useRef } from 'react';
import type { Motion } from '../context';
import { useIsomorphicLayoutEffect } from './use-isomorphic-layout-effect';

interface Position {
  x: number;
  y: number;
}

/** Everything that moves when the paged bracket changes round, keyed so it can be followed. */
const MOVING = '[data-part="cell"][data-match], [data-part="round-title"][data-round]';

const keyOf = (element: HTMLElement) => element.dataset.match ?? `round:${element.dataset.round}`;

/**
 * Animates matches and round titles from where they were on the previous render
 * to where they are now (the FLIP technique), fades in newcomers, and lets the
 * connectors appear once everything has settled.
 */
export function useFlip(container: RefObject<HTMLElement | null>, motion: Motion | null): void {
  const previous = useRef(new Map<string, Position>());

  useIsomorphicLayoutEffect(() => {
    const root = container.current;
    if (!root) return;

    const origin = root.getBoundingClientRect();
    const current = new Map<string, Position>();
    let moved = false;

    for (const element of root.querySelectorAll<HTMLElement>(MOVING)) {
      const key = keyOf(element);
      const position = layoutPosition(element, origin);
      current.set(key, position);

      if (!motion || typeof element.animate !== 'function') continue;
      const timing = { duration: motion.duration, easing: motion.easing };
      const before = previous.current.get(key);

      if (!before) {
        if (previous.current.size > 0) element.animate([{ opacity: 0 }, { opacity: 1 }], timing);
        continue;
      }

      const dx = before.x - position.x;
      const dy = before.y - position.y;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;
      moved = true;
      element.animate(
        [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }],
        timing,
      );
    }

    const connectors = root.querySelector<SVGElement>('[data-part="connectors"]');
    if (motion && moved && connectors && typeof connectors.animate === 'function') {
      connectors.animate([{ opacity: 0 }, { opacity: 0, offset: 0.6 }, { opacity: 1 }], {
        duration: motion.duration * 1.4,
        easing: motion.easing,
      });
    }

    previous.current = current;
  });
}

/**
 * Where the element sits in the layout, ignoring any animation running on it, so a
 * re-render mid-animation does not start a second one.
 */
function layoutPosition(element: HTMLElement, origin: DOMRect): Position {
  const parent = element.offsetParent?.getBoundingClientRect() ?? origin;
  return {
    x: parent.x - origin.x + element.offsetLeft,
    y: parent.y - origin.y + element.offsetTop,
  };
}
