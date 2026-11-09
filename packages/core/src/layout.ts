import type { Group, Id, Match, Round, SlotIndex } from './types';

/** Which half a column belongs to in a mirrored layout. Standard layouts only use `start`. */
export type ColumnSide = 'start' | 'center' | 'end';

/** Where a match sits on the grid. */
export interface LayoutCell {
  /** The match drawn here. */
  match: Match;
  /** Zero-based grid row. */
  row: number;
  /** How many grid rows the cell covers. */
  span: number;
}

/** A column of the grid, holding all or half of one round. */
export interface LayoutColumn {
  /** The round this column shows. */
  round: Round;
  /** Which half of a mirrored layout the column is on. */
  side: ColumnSide;
  /** The matches in this column, top to bottom. */
  cells: LayoutCell[];
}

/** A connector line: the winner of `from` moves into `slot` of `to`. */
export interface LayoutEdge {
  from: Id;
  to: Id;
  slot: SlotIndex;
}

/** A group placed on a grid, ready to draw. */
export interface GroupLayout {
  /** Left to right. */
  columns: LayoutColumn[];
  /** Number of grid rows. */
  rows: number;
  /** Every connector line between matches of the group. */
  edges: LayoutEdge[];
}

export interface LayoutOptions {
  /**
   * Splits the bracket in two halves that meet at the final.
   * @defaultValue false
   */
  mirror?: boolean;
}

const ROWS_PER_LEAF = 2;
const SLOTS: readonly SlotIndex[] = [0, 1];

/**
 * Places a group's matches on a grid, each one centred between the matches that
 * feed it. Matches with no feeder in the group stack from the top of their
 * column. This is the layout `<Bracket>` uses; call it yourself to draw brackets
 * elsewhere, like a canvas, a PDF or a native app.
 */
export function layoutGroup(group: Group, options: LayoutOptions = {}): GroupLayout {
  const mirror = options.mirror === true && group.rounds.length > 1;
  const lastRound = group.rounds.length - 1;
  const centers = new Map<Id, number>();
  const nextFree: number[] = [];
  const columns: LayoutColumn[] = [];
  const edges: LayoutEdge[] = [];

  const placement = (roundIndex: number, position: number, size: number): [number, ColumnSide] => {
    if (!mirror) return [roundIndex, 'start'];
    if (roundIndex === lastRound) return [lastRound, 'center'];
    return position < Math.ceil(size / 2)
      ? [roundIndex, 'start']
      : [lastRound * 2 - roundIndex, 'end'];
  };

  group.rounds.forEach((round, roundIndex) => {
    round.matches.forEach((match, position) => {
      const [index, side] = placement(roundIndex, position, round.matches.length);
      const feeders: number[] = [];

      for (const slot of SLOTS) {
        const origin = match.slots[slot].origin;
        const center = origin && centers.get(origin.matchId);
        if (!origin || center === undefined || origin.outcome !== 'winner') continue;
        feeders.push(center);
        edges.push({ from: origin.matchId, to: match.id, slot });
      }

      const free = nextFree[index] ?? 0;
      const center = feeders.length > 0 ? average(feeders) : free + 0.5;
      centers.set(match.id, center);
      nextFree[index] = Math.max(free, Math.ceil(center + 0.5));

      columns[index] ??= { round, side, cells: [] };
      const row = Math.max(0, Math.round(center * ROWS_PER_LEAF) - ROWS_PER_LEAF / 2);
      columns[index].cells.push({ match, row, span: ROWS_PER_LEAF });
    });
  });

  const rows = Math.max(1, ...nextFree.filter(Number.isFinite)) * ROWS_PER_LEAF;
  return { columns: columns.filter(Boolean), rows, edges };
}

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
