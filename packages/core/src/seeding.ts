/** How entrants are placed in the first round. See `SingleEliminationOptions.seeding`. */
export type Seeding = 'standard' | 'sequential';

/** The number of first-round slots a field needs: the next power of two, at least 2. */
export function bracketSize(entrants: number): number {
  return 2 ** Math.ceil(Math.log2(Math.max(entrants, 2)));
}

/**
 * Seed numbers in bracket position order, so the top two seeds can only meet
 * in the final: 8 → [1, 8, 4, 5, 2, 7, 3, 6].
 */
export function standardOrder(size: number): number[] {
  let order = [1];
  while (order.length < size) {
    const span = order.length * 2 + 1;
    order = order.flatMap((seed) => [seed, span - seed]);
  }
  return order;
}

export function seedPositions(size: number, seeding: Seeding): number[] {
  return seeding === 'standard'
    ? standardOrder(size)
    : Array.from({ length: size }, (_, index) => index + 1);
}

/** The default round names: `Round 1`, `Round 2`… then `Quarterfinals`, `Semifinals` and `Final`. */
export function eliminationRoundName(index: number, total: number): string {
  const remaining = total - index;
  if (remaining === 1) return 'Final';
  if (remaining === 2) return 'Semifinals';
  if (remaining === 3) return 'Quarterfinals';
  return `Round ${index + 1}`;
}
