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
  /** The height of a card that has not been measured, and of an empty row. */
  matchHeight: number;
  /** Each card's own height, measured, by match. Cards may differ, and change as they open or close. */
  heights?: ReadonlyMap<Id, number>;
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

/** A match's card height: measured, or the default until it is. */
export const heightOf = (metrics: Metrics, id: Id): number =>
  metrics.heights?.get(id) ?? metrics.matchHeight;

interface Placement {
  /** Top of each match. */
  tops: Map<Id, number>;
  /** The height the layout needs, titles included. */
  height: number;
}

/**
 * Places a layout's matches top to bottom, each at its own height. A match fed by
 * others sits centred between them; the rest keep their rows. A taller card pushes
 * the ones below it in its round down, so nothing overlaps. With every card the same
 * height, this is the core's grid exactly.
 */
function place(layout: GroupLayout, rounds: Round[], metrics: Metrics): Placement {
  const unit = (metrics.matchHeight + metrics.matchGap) / ROWS_PER_LEAF;
  const order = new Map(rounds.map((round, index) => [round.id, index]));
  const feeders = new Map<Id, Id[]>();
  for (const edge of layout.edges)
    feeders.set(edge.to, [...(feeders.get(edge.to) ?? []), edge.from]);
  const tops = new Map<Id, number>();
  let bottom = metrics.titleHeight;
  // Rounds in play order, so every match is placed after the ones that feed it, mirrored halves included.
  const columns = [...layout.columns].sort(
    (a, b) => (order.get(a.round.id) ?? 0) - (order.get(b.round.id) ?? 0),
  );
  for (const column of columns) {
    let free = metrics.titleHeight + metrics.matchGap / 2;
    for (const cell of [...column.cells].sort((a, b) => a.row - b.row)) {
      const id = cell.match.id;
      const height = heightOf(metrics, id);
      const centres = (feeders.get(id) ?? []).flatMap((from) => {
        const top = tops.get(from);
        return top === undefined ? [] : [top + heightOf(metrics, from) / 2];
      });
      const centre =
        centres.length > 0
          ? centres.reduce((sum, value) => sum + value, 0) / centres.length
          : metrics.titleHeight + (cell.row + cell.span / 2) * unit;
      const top = Math.max(free, centre - height / 2);
      tops.set(id, top);
      free = top + height + metrics.matchGap;
      bottom = Math.max(bottom, top + height);
    }
  }
  return { tops, height: bottom + metrics.matchGap / 2 };
}

/** Places every match of a layout in points, column by column. */
export function treeGeometry(layout: GroupLayout, metrics: Metrics): TreeGeometry {
  const step = metrics.matchWidth + metrics.columnGap;
  const { tops, height } = place(
    layout,
    layout.columns.map((column) => column.round),
    metrics,
  );
  const matches = new Map<Id, Box>();
  const titles: TreeTitle[] = [];
  layout.columns.forEach((column, index) => {
    titles.push({ key: `${column.round.id}.${index}`, round: column.round, x: index * step });
    for (const cell of column.cells) {
      matches.set(cell.match.id, {
        x: index * step,
        y: tops.get(cell.match.id) ?? metrics.titleHeight,
        width: metrics.matchWidth,
        height: heightOf(metrics, cell.match.id),
      });
    }
  });
  return {
    width: Math.max(0, layout.columns.length * step - metrics.columnGap),
    height,
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
  const placements = layouts.map((layout, page) =>
    place(layout, group.rounds.slice(page), metrics),
  );
  const matches = new Map<Id, number[]>();
  const titles = new Map<Id, number[]>();

  group.rounds.forEach((round, index) => {
    // A round already passed keeps the place it had in focus and slides away to the side.
    const focused = placements[index]?.tops ?? new Map<Id, number>();
    const frames = new Map<Id, number[]>(round.matches.map((match) => [match.id, []]));
    const title: number[] = [];

    for (let page = 0; page < pages; page++) {
      const offset = index - page;
      const tops = offset >= 0 ? placements[page]?.tops : focused;
      const opacity = offset >= 0 ? 1 : 0;
      title.push(offset * step, 0, opacity);
      for (const match of round.matches) {
        const y = tops?.get(match.id) ?? metrics.titleHeight;
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
    heights: placements.map((placement) => placement.height),
    edges: layoutGroup(group).edges,
  };
}

/**
 * Plain lists of matches, one round per page, in the same tables as
 * `pagedGeometry`: each round fills the width, its matches stacked, and the
 * rounds sit side by side like a carousel. There are no lines between them.
 */
export function listGeometry(group: Group, metrics: Metrics, step: number): PagedGeometry {
  const pages = group.rounds.length;
  const matches = new Map<Id, number[]>();
  const titles = new Map<Id, number[]>();
  const heights: number[] = [];
  group.rounds.forEach((round, index) => {
    const placeAt = (y: number) => {
      const frames: number[] = [];
      for (let page = 0; page < pages; page++) frames.push((index - page) * step, y, 1);
      return frames;
    };
    titles.set(round.id, placeAt(0));
    let top = metrics.titleHeight;
    for (const match of round.matches) {
      matches.set(match.id, placeAt(top));
      top += heightOf(metrics, match.id) + metrics.matchGap;
    }
    heights.push(round.matches.length > 0 ? top - metrics.matchGap : top);
  });
  return {
    pages,
    step,
    matchWidth: metrics.matchWidth,
    matches,
    titles,
    heights,
    edges: [],
  };
}

/** The same tables read from right to left: every x is measured from the other side of `span`. */
export function mirrorPaged(geometry: PagedGeometry, span: number): PagedGeometry {
  const flip = (table: Map<Id, number[]>) =>
    new Map(
      [...table].map(([id, frames]) => [
        id,
        frames.map((value, index) =>
          index % 3 === 0 ? span - value - geometry.matchWidth : value,
        ),
      ]),
    );
  return { ...geometry, matches: flip(geometry.matches), titles: flip(geometry.titles) };
}

/** The whole tree read from right to left. */
export function mirrorTree(geometry: TreeGeometry): TreeGeometry {
  const { width, matchWidth } = geometry;
  return {
    ...geometry,
    matches: new Map(
      [...geometry.matches].map(([id, box]) => [id, { ...box, x: width - box.x - box.width }]),
    ),
    titles: geometry.titles.map((title) => ({ ...title, x: width - title.x - matchWidth })),
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

/** How the paged view's height moves between rounds of different heights. */
export type PageHeight = 'contain' | 'follow';

/** Share of a move spent growing to hold both rounds, and again settling to the new one. */
const SETTLE = 0.25;

/** Worklets capture what they use when they are defined, so this comes first. */
function ease(t: number): number {
  'worklet';
  return t * t * (3 - 2 * t);
}

/**
 * The paged view's height at a fractional page. `follow` blends the two rounds'
 * heights, so the taller one is cut while it moves. `contain` is as tall as both
 * while they move, growing early and settling late, so neither is cut while on screen.
 */
export function heightAt(heights: number[], position: number, fit: PageHeight): number {
  'worklet';
  if (fit === 'follow') return valueAt(heights, position);
  const last = heights.length - 1;
  if (last <= 0) return heights[0] ?? 0;
  const at = Math.min(Math.max(position, 0), last);
  const page = Math.min(Math.floor(at), last - 1);
  const t = at - page;
  const from = heights[page] ?? 0;
  const to = heights[page + 1] ?? from;
  const both = Math.max(from, to);
  return t < 0.5
    ? from + (both - from) * ease(Math.min(1, t / SETTLE))
    : to + (both - to) * ease(Math.min(1, (1 - t) / SETTLE));
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

/** A point in the bracket's own coordinates, in points. */
export interface Point {
  x: number;
  y: number;
}

/** Where a line leaves `from` and enters `to`: the middle of the sides that face each other. */
export function connectorAnchors(from: Box, to: Box): [Point, Point] {
  'worklet';
  const forward = from.x + from.width / 2 < to.x + to.width / 2;
  return [
    { x: forward ? from.x + from.width : from.x, y: from.y + from.height / 2 },
    { x: forward ? to.x : to.x + to.width, y: to.y + to.height / 2 },
  ];
}

/**
 * The pieces of a line from `start` to `end`, turning halfway. `sx` is the way it runs: the two
 * points alone can't say, when there is no gap between the rounds.
 */
export function piecesBetween(
  start: Point,
  end: Point,
  sx: 1 | -1,
  radius: number,
  lineWidth: number,
): ConnectorPieces {
  'worklet';
  const { x: x1, y: y1 } = start;
  const { x: x2, y: y2 } = end;
  const midX = (x1 + x2) / 2;
  const dy = y2 - y1;
  const sy = dy < 0 ? -1 : 1;
  const half = lineWidth / 2;
  const turn =
    radius > 0 ? Math.max(0, Math.min(radius, Math.abs(dy) / 2, Math.abs(midX - x1))) : 0;
  const scale = radius > 0 ? turn / radius : 0;
  // The lines run right up to the outer edge of each corner, so they meet edge to edge, never leaving a gap.
  const outEnd = midX - sx * (turn - half);
  const inStart = midX + sx * (turn - half);
  return {
    out: [Math.min(x1, outEnd), y1 - half, Math.abs(outEnd - x1)],
    across: [
      midX - half,
      Math.min(y1, y2) - half + turn,
      Math.max(0, Math.abs(dy) + lineWidth - 2 * turn),
    ],
    into: [Math.min(inStart, x2), y2 - half, Math.abs(x2 - inStart)],
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

/**
 * The pieces of a line between two boxes. Worklets capture what they call when they are defined,
 * so this comes after the two it calls.
 */
export function connectorPieces(
  from: Box,
  to: Box,
  radius: number,
  lineWidth: number,
): ConnectorPieces {
  'worklet';
  const [start, end] = connectorAnchors(from, to);
  const sx = from.x + from.width / 2 < to.x + to.width / 2 ? 1 : -1;
  return piecesBetween(start, end, sx, radius, lineWidth);
}

/**
 * SVG path data for the default line from `start` to `end`: an elbow that turns halfway, its
 * corners rounded by `radius`. The same shape the web package draws. It runs on the UI thread too,
 * so an animated path can follow a swipe.
 */
export function connectorPath(start: Point, end: Point, radius = 0): string {
  'worklet';
  const round = (value: number) => Math.round(value * 100) / 100;
  const midX = round((start.x + end.x) / 2);
  const dy = end.y - start.y;
  const from = `M${round(start.x)},${round(start.y)}`;
  if (Math.abs(dy) < 1) return `${from}H${round(end.x)}`;
  const corner = Math.min(radius, Math.abs(dy) / 2, Math.abs(midX - start.x));
  if (corner <= 0) return `${from}H${midX}V${round(end.y)}H${round(end.x)}`;
  const sx = Math.sign(end.x - start.x);
  const sy = Math.sign(dy);
  return [
    from,
    `H${round(midX - sx * corner)}`,
    `Q${midX},${round(start.y)} ${midX},${round(start.y + sy * corner)}`,
    `V${round(end.y - sy * corner)}`,
    `Q${midX},${round(end.y)} ${round(midX + sx * corner)},${round(end.y)}`,
    `H${round(end.x)}`,
  ].join('');
}

/** How a line is broken up: `dashed`, `dotted`, or `[dash, gap]` in points, where a dash of `0` is a dot. */
export type ConnectorDash = 'dashed' | 'dotted' | readonly [dash: number, gap: number];

/** A dash pattern worked out for a line width: each dash's length, and how far apart they start. */
export interface DashPattern {
  dash: number;
  period: number;
  /** Round dots as wide as the line, in place of dashes. */
  dots: boolean;
}

/** The pattern a `dash` option draws at a line width, or `null` for a solid line. */
export function dashPattern(
  dash: ConnectorDash | undefined,
  lineWidth: number,
): DashPattern | null {
  if (dash === undefined) return null;
  const [length, gap] =
    dash === 'dashed'
      ? [Math.max(3, 3 * lineWidth), Math.max(3, 2 * lineWidth)]
      : dash === 'dotted'
        ? [0, Math.max(3, 3 * lineWidth)]
        : dash;
  const dots = length <= 0;
  // A dot is as wide as the line, so dots closer than that would run together.
  const period = Math.max(dots ? lineWidth + 1 : 1, length + gap);
  if (!dots && length >= period) return null;
  return { dash: dots ? 0 : length, period, dots };
}

/**
 * How far along the line each piece starts, measured down its middle from where it leaves `from`.
 * A pattern laid from these runs on unbroken through the turns. Lines start where their view
 * starts, the end that comes first along the line; turns start where the line enters them.
 */
export interface DashStarts {
  out: number;
  turnOut: number;
  across: number;
  turnIn: number;
  into: number;
  /** The radius the turns are drawn at, down the middle of the line, before scaling. */
  arc: number;
}

export function dashStarts(pieces: ConnectorPieces, radius: number, lineWidth: number): DashStarts {
  'worklet';
  const half = lineWidth / 2;
  const arc = Math.max(0, radius - half);
  const scale = pieces.turnOut[2];
  if (radius > 0 && scale > 0) {
    // The lines meet each turn where it runs level or upright, so each piece starts where the last ends.
    // A turn is drawn at the full radius and scaled down to fit, so its middle is scaled too.
    const quarter = (Math.PI / 2) * arc * scale;
    const across = pieces.out[2] + quarter;
    const turnIn = across + pieces.across[2];
    return { out: 0, turnOut: pieces.out[2], across, turnIn, into: turnIn + quarter, arc };
  }
  // Square corners: each line runs half a line width past the corner, under the next one.
  const corner = pieces.out[2] - half;
  const next = corner + pieces.across[2] - lineWidth;
  return { out: 0, turnOut: corner, across: corner - half, turnIn: next, into: next - half, arc };
}

/** `value` wrapped into `[0, period)`. */
export function wrap(value: number, period: number): number {
  'worklet';
  return ((value % period) + period) % period;
}

/**
 * Where a strip of dashes starts, behind the low end (left or top) of the piece it fills, so the
 * piece shows the pattern from `phase`, the distance along the line where the piece starts.
 * The strip's dashes start every `period` from its own start. `travel` is the way the line runs
 * along the piece: `1` from the low end, `-1` from the high end.
 */
export function stripShift(
  phase: number,
  length: number,
  travel: number,
  pattern: DashPattern,
): number {
  'worklet';
  return travel > 0
    ? wrap(phase, pattern.period)
    : wrap(-(length + phase - pattern.dash), pattern.period);
}

/** One dash of a turn, before the turn is rotated into step: its middle and angle, on a circle. */
export interface ArcDash {
  x: number;
  y: number;
  length: number;
  angle: number;
}

/**
 * The dashes of a turn, laid round a circle of radius `arc` centred at `(cx, cy)` from the angle
 * where the line enters it, `entry`, the way it turns, `turn`. They cover a quarter and one period
 * more, so the turn can be rotated back by up to a period to bring them in step with the line.
 * Long dashes are cut into short ones, so they bend with the turn.
 */
export function arcDashes(
  cx: number,
  cy: number,
  arc: number,
  entry: number,
  turn: 1 | -1,
  pattern: DashPattern,
): ArcDash[] {
  if (arc <= 0) return [];
  const dashes: ArcDash[] = [];
  const reach = (Math.PI / 2) * arc + pattern.period;
  const at = (distance: number, length: number) => {
    const angle = entry + (turn * distance) / arc;
    dashes.push({
      x: cx + arc * Math.cos(angle),
      y: cy + arc * Math.sin(angle),
      length,
      angle: angle + Math.PI / 2,
    });
  };
  const cuts = pattern.dots ? 1 : Math.max(1, Math.ceil(pattern.dash / (arc * 0.35)));
  const piece = pattern.dash / cuts;
  for (let start = 0; start <= reach; start += pattern.period) {
    if (pattern.dots) at(start, 0);
    // Cut pieces overlap a little, so their outer corners leave no notch where they meet.
    else
      for (let cut = 0; cut < cuts; cut++)
        at(start + (cut + 0.5) * piece, cuts > 1 ? piece + 0.5 : piece);
  }
  return dashes;
}
