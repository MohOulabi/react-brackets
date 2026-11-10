import {
  type Group,
  type GroupLayout,
  type Id,
  type LayoutEdge,
  layoutGroup,
  type Round,
} from '@react-brackets/core';

/** The sizes a bracket is drawn with, in points. */
export interface Metrics {
  matchWidth: number;
  matchHeight: number;
  /** Space between two matches stacked in the same round. */
  matchGap: number;
  /** Space between two rounds. */
  columnGap: number;
  /** Height of the row of round titles above the matches. */
  titleHeight: number;
}

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TreeTitle {
  key: string;
  round: Round;
  x: number;
}

/** The whole bracket, placed once. */
export interface TreeGeometry {
  width: number;
  height: number;
  matchWidth: number;
  matches: Map<Id, Box>;
  titles: TreeTitle[];
  edges: LayoutEdge[];
}

/** The core lays a first-round match over two grid rows. */
const ROWS_PER_LEAF = 2;

/** Height of one grid row: two of them hold a match and the gap below it. */
const rowUnit = ({ matchHeight, matchGap }: Metrics) => (matchHeight + matchGap) / ROWS_PER_LEAF;

/** Top of a match covering `span` rows from `row`, centred between the matches that feed it. */
function cellTop(row: number, span: number, metrics: Metrics): number {
  const unit = rowUnit(metrics);
  return metrics.titleHeight + row * unit + (span * unit - metrics.matchHeight) / 2;
}

/** Places every match of a layout in points, column by column. */
export function treeGeometry(layout: GroupLayout, metrics: Metrics): TreeGeometry {
  const step = metrics.matchWidth + metrics.columnGap;
  const matches = new Map<Id, Box>();
  const titles: TreeTitle[] = [];
  layout.columns.forEach((column, index) => {
    titles.push({ key: `${column.round.id}.${index}`, round: column.round, x: index * step });
    for (const cell of column.cells) {
      matches.set(cell.match.id, {
        x: index * step,
        y: cellTop(cell.row, cell.span, metrics),
        width: metrics.matchWidth,
        height: metrics.matchHeight,
      });
    }
  });
  return {
    width: Math.max(0, layout.columns.length * step - metrics.columnGap),
    height: metrics.titleHeight + layout.rows * rowUnit(metrics),
    matchWidth: metrics.matchWidth,
    matches,
    titles,
    edges: layout.edges,
  };
}

/**
 * The paged view, worked out for every page at once. Each match and title has
 * `[x, y, opacity]` for page 0, then page 1, and so on, flattened so a worklet
 * can read it: a swipe only moves a number between pages, and everything is
 * placed from these tables on the UI thread.
 */
export interface PagedGeometry {
  pages: number;
  /** How far apart two rounds are: the width of the round in focus. */
  step: number;
  matchWidth: number;
  matches: Map<Id, number[]>;
  titles: Map<Id, number[]>;
  /** The height the view needs on each page. */
  heights: number[];
  edges: LayoutEdge[];
}

export function pagedGeometry(group: Group, metrics: Metrics, step: number): PagedGeometry {
  const pages = group.rounds.length;
  // From page `p`, the rounds still in play are laid out again, so the round in focus stacks tightly.
  const layouts = group.rounds.map((_, page) =>
    layoutGroup({ ...group, rounds: group.rounds.slice(page) }),
  );
  const unit = rowUnit(metrics);
  const matches = new Map<Id, number[]>();
  const titles = new Map<Id, number[]>();

  group.rounds.forEach((round, index) => {
    // A round already passed keeps the place it had in focus and slides away to the side.
    const focused = layouts[index]?.columns[0]?.cells ?? [];
    const rows = new Map(focused.map((cell) => [cell.match.id, cell]));
    const frames = new Map<Id, number[]>(round.matches.map((match) => [match.id, []]));
    const title: number[] = [];

    for (let page = 0; page < pages; page++) {
      const offset = index - page;
      const column = offset >= 0 ? layouts[page]?.columns[offset] : undefined;
      const cells = column ? new Map(column.cells.map((cell) => [cell.match.id, cell])) : rows;
      const opacity = offset >= 0 ? 1 : 0;
      title.push(offset * step, 0, opacity);
      for (const match of round.matches) {
        const cell = cells.get(match.id);
        const y = cell ? cellTop(cell.row, cell.span, metrics) : metrics.titleHeight;
        frames.get(match.id)?.push(offset * step, y, opacity);
      }
    }
    titles.set(round.id, title);
    for (const [id, frame] of frames) matches.set(id, frame);
  });

  return {
    pages,
    step,
    matchWidth: metrics.matchWidth,
    matches,
    titles,
    heights: layouts.map((layout) => metrics.titleHeight + layout.rows * unit),
    edges: layoutGroup(group).edges,
  };
}

/**
 * Where an entry of a paged table is at `position`, a page number that may sit
 * between two pages mid-swipe.
 */
export function frameAt(frames: number[], position: number): [number, number, number] {
  'worklet';
  const last = frames.length / 3 - 1;
  if (last <= 0) return [frames[0] ?? 0, frames[1] ?? 0, frames[2] ?? 1];
  const at = Math.min(Math.max(position, 0), last);
  const page = Math.min(Math.floor(at), last - 1);
  const t = at - page;
  const from = page * 3;
  const to = from + 3;
  const mix = (offset: number) =>
    (frames[from + offset] ?? 0) + ((frames[to + offset] ?? 0) - (frames[from + offset] ?? 0)) * t;
  return [mix(0), mix(1), mix(2)];
}

/** The value of a per-page table, such as the view's height, at `position`. */
export function valueAt(values: number[], position: number): number {
  'worklet';
  const last = values.length - 1;
  if (last <= 0) return values[0] ?? 0;
  const at = Math.min(Math.max(position, 0), last);
  const page = Math.min(Math.floor(at), last - 1);
  const from = values[page] ?? 0;
  return from + ((values[page + 1] ?? from) - from) * (at - page);
}

/**
 * A connector drawn from plain views: a line out of `from`, a line across, a
 * line into `to`, and a rounded turn between each. Every piece is placed and
 * stretched with a transform, so it moves in the same frame as the cards.
 * Lines are `[x, y, length]`; turns are `[x, y, scale]` of a square the size of
 * the full radius. `sx` and `sy` say which way the line runs, to pick the turns.
 */
export interface ConnectorPieces {
  out: [number, number, number];
  across: [number, number, number];
  into: [number, number, number];
  turnOut: [number, number, number];
  turnIn: [number, number, number];
  sx: 1 | -1;
  sy: 1 | -1;
}

export function connectorPieces(
  from: Box,
  to: Box,
  radius: number,
  lineWidth: number,
): ConnectorPieces {
  'worklet';
  const forward = from.x + from.width / 2 < to.x + to.width / 2;
  const sx = forward ? 1 : -1;
  const x1 = forward ? from.x + from.width : from.x;
  const y1 = from.y + from.height / 2;
  const x2 = forward ? to.x : to.x + to.width;
  const y2 = to.y + to.height / 2;
  const midX = (x1 + x2) / 2;
  const dy = y2 - y1;
  const sy = dy < 0 ? -1 : 1;
  const half = lineWidth / 2;
  const turn =
    radius > 0 ? Math.max(0, Math.min(radius, Math.abs(dy) / 2, Math.abs(midX - x1))) : 0;
  const bend = midX - sx * turn;
  const scale = radius > 0 ? turn / radius : 0;
  return {
    out: [Math.min(x1, bend), y1 - half, Math.abs(bend - x1)],
    across: [midX - half, Math.min(y1, y2) + turn, Math.max(0, Math.abs(dy) - 2 * turn)],
    into: [Math.min(midX + sx * turn, x2), y2 - half, Math.abs(x2 - (midX + sx * turn))],
    turnOut: [
      sx > 0 ? midX + half - turn : midX - half,
      sy > 0 ? y1 - half : y1 + half - turn,
      scale,
    ],
    turnIn: [
      sx > 0 ? midX - half : midX + half - turn,
      sy > 0 ? y2 + half - turn : y2 - half,
      scale,
    ],
    sx,
    sy,
  };
}
