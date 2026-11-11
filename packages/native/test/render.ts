import { type Participant, type Stage, singleElimination } from '../src';

export const teams = (count: number): Participant[] =>
  Array.from({ length: count }, (_, index) => ({ id: `t${index + 1}`, name: `Team ${index + 1}` }));

export const eight: Stage = singleElimination(teams(8));

/** Every element drawn with a style, and that style. */
export function drawn(
  container: HTMLElement,
): { element: Element; style: Record<string, unknown> }[] {
  return [...container.querySelectorAll('[data-style]')].map((element) => ({
    element,
    style: JSON.parse(element.getAttribute('data-style') ?? '{}'),
  }));
}

/** How many elements are filled with `color`. */
export const filled = (container: HTMLElement, color: string): number =>
  drawn(container).filter(({ style }) => style.backgroundColor === color).length;
