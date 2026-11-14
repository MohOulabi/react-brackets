import type {
  ColumnSide,
  Group,
  GroupLayout,
  Id,
  LayoutCell,
  Match,
  Participant,
  Round,
  Stage,
} from '@react-brackets/core';
import { type Context, createContext, useContext } from 'react';
import type { ResolvedSwipe, ResolvedZoom } from './options';
import type { PageHeight } from './page-height';

/** The name of every element the bracket renders, set as its `data-part` attribute. */
export type Part =
  | 'root'
  | 'group-title'
  | 'viewport'
  | 'content'
  | 'round'
  | 'round-title'
  | 'matches'
  | 'cell'
  | 'match'
  | 'participant'
  | 'participant-name'
  | 'participant-score'
  | 'connectors'
  | 'connector'
  | 'pagination'
  | 'page'
  | 'page-previous'
  | 'page-next'
  | 'page-indicator'
  | 'zoom-controls'
  | 'zoom-steps'
  | 'zoom-in'
  | 'zoom-out'
  | 'zoom-reset'
  | 'zoom-level';

/** A class for any part, by part name: `{ match: 'rounded-xl', connector: 'stroke-zinc-300' }`. */
export type ClassNames = Partial<Record<Part, string>>;

/** A class, or a function that picks one from the part's current state. */
export type ClassNameProp<State> = string | ((state: State) => string | undefined);

/** `tree` shows the whole bracket; `paged` shows one round at a time on narrow containers. */
export type View = 'tree' | 'paged';

/** How the paged view draws a round: as a slice of the bracket, or as a plain list of matches. */
export type Compact = 'bracket' | 'list';

/** Animation timing for paging, swiping, zooming and the change flags. */
export interface Motion {
  /**
   * In milliseconds.
   * @defaultValue 320
   */
  duration: number;
  /**
   * Any CSS easing function.
   * @defaultValue 'cubic-bezier(0.2, 0, 0, 1)'
   */
  easing: string;
}

/** Every string the bracket shows or announces. Override any of them through the `labels` prop. */
export interface Labels {
  /**
   * Shown in place of a participant when there is no opponent.
   * @defaultValue 'Bye'
   */
  bye: string;
  /**
   * Shown while a slot is still to be decided.
   * @defaultValue 'TBD'
   */
  tbd: string;
  /**
   * Accessible name of the previous-round button.
   * @defaultValue 'Previous round'
   */
  previous: string;
  /**
   * Accessible name of the next-round button.
   * @defaultValue 'Next round'
   */
  next: string;
  /**
   * Accessible name of the round navigation and the paged view.
   * @defaultValue 'Rounds'
   */
  rounds: string;
  /**
   * Accessible name of the zoom-in button.
   * @defaultValue 'Zoom in'
   */
  zoomIn: string;
  /**
   * Accessible name of the zoom-out button.
   * @defaultValue 'Zoom out'
   */
  zoomOut: string;
  /**
   * Accessible name of the button that fits the bracket back into view.
   * @defaultValue 'Fit to view'
   */
  zoomReset: string;
}

/** One column as it is drawn: a round, or half of one in a mirrored layout. */
export interface Column {
  /** Stable React key. */
  key: string;
  /** The round shown in this column. */
  round: Round;
  /** Which half of a mirrored layout the column is on. */
  side: ColumnSide;
  /** The matches in this column and where they sit. */
  cells: LayoutCell[];
  /** The round in focus in the paged view. */
  current: boolean;
  /** Off screen in the paged view, so kept out of the accessibility tree. */
  hidden: boolean;
  /** A round the paged view moved past, still drawn where it was while it slides away. */
  leaving: boolean;
}

/** What `useBracket()` returns inside `Bracket.Root`. */
export interface BracketContextValue {
  /** The stage being drawn. */
  stage: Stage;
  /** The group being drawn. Several groups drawn together appear as one. */
  group: Group;
  /** Grid placement and connector edges for what is currently shown. */
  layout: GroupLayout;
  /** The columns currently rendered. */
  columns: Column[];
  /** Every round of the group, including ones paged past. */
  rounds: Round[];
  /** Participants by id. */
  participants: Map<Id, Participant>;
  /** Whether the whole tree or one round at a time is shown. */
  view: View;
  /** How the paged view draws a round. */
  compact: Compact;
  /** How the paged view's height moves between rounds. */
  pageHeight: PageHeight;
  /** The most rounds one swipe can move, at least 1. */
  maxSwipeRounds: number;
  /** The `zoom` options, with defaults filled in. */
  zoom: ResolvedZoom;
  /** The `swipe` options, with defaults filled in. */
  swipe: ResolvedSwipe;
  /** `true` when columns share one grid with connector lines: the tree, and the bracket-style paged view. */
  grid: boolean;
  /** The container width in pixels, or `null` before it is measured, as on the server. */
  width: number | null;
  /** `null` when animation is off, by choice or because the user prefers reduced motion. */
  motion: Motion | null;
  /** The round in focus in the paged view. */
  page: number;
  /** Moves the paged view to a round. Out-of-range values are clamped. */
  setPage: (page: number) => void;
  /** The `classNames` prop. */
  classNames: ClassNames;
  /** Every label, with defaults filled in. */
  labels: Labels;
  /** The participant whose path is highlighted. */
  highlighted: Id | null;
  /** Highlights a participant's path, or clears it with `null`. */
  highlight: (participantId: Id | null) => void;
  /** The `onMatchClick` prop. */
  onMatchClick: ((match: Match) => void) | undefined;
  /** The `hideByes` prop. */
  hideByes: boolean;
  /** Rendered match cells by match id, used to measure connectors. */
  cells: Map<Id, HTMLElement>;
}

/** How the paged view talks to `Bracket.Root` while it moves between rounds. Internal. */
export interface Paging {
  /** The round drawn in focus: the page, or the one a swipe in progress is heading to. */
  shown: number;
  /** Draws a round in focus while a swipe heads to it, without changing the page; `null` goes back. */
  preview: (page: number | null) => void;
  /** Lets the rounds that slid away go, once the move has finished. */
  settle: () => void;
}

export const PagingContext: Context<Paging | null> = createContext<Paging | null>(null);

/** A card or title's box where the paged view last drew it, in the content's own pixels. */
export interface Placed {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Where the paged view last drew each card (by match id) and title (`round:` + id): a leaving round stays put. */
export const PlacedContext: Context<((key: string) => Placed | undefined) | null> = createContext<
  ((key: string) => Placed | undefined) | null
>(null);

interface ColumnContextValue {
  column: Column;
  index: number;
}

/**
 * What match and participant parts read, kept apart from `BracketContext` and kept the same object while
 * none of it changes. A new result then re-renders only the cards whose match changed. Internal.
 */
export interface PartsContextValue {
  participants: Map<Id, Participant>;
  classNames: ClassNames;
  labels: Labels;
  motion: Motion | null;
  highlighted: Id | null;
  highlight: (participantId: Id | null) => void;
  onMatchClick: ((match: Match) => void) | undefined;
}

export const PartsContext: Context<PartsContextValue | null> =
  createContext<PartsContextValue | null>(null);

export const BracketContext: Context<BracketContextValue | null> =
  createContext<BracketContextValue | null>(null);
export const ColumnContext: Context<ColumnContextValue | null> =
  createContext<ColumnContextValue | null>(null);
export const CellContext: Context<LayoutCell | null> = createContext<LayoutCell | null>(null);

function required<T>(value: T | null, name: string): T {
  if (value === null) throw new Error(`<Bracket.${name}> must be rendered inside its parent part.`);
  return value;
}

/** Everything about the bracket being drawn. Use it in custom parts inside `Bracket.Root`. */
export const useBracketContext = (): BracketContextValue =>
  required(useContext(BracketContext), 'Root');

export const useParts = (): PartsContextValue => required(useContext(PartsContext), 'Root');

export const useColumn = (): ColumnContextValue => required(useContext(ColumnContext), 'Round');

/** The match being rendered, and where it sits. Use it in custom parts inside `Bracket.Matches`. */
export const useCell = (): LayoutCell => required(useContext(CellContext), 'Match');

export function cx(...values: (string | false | null | undefined)[]): string | undefined {
  return values.filter(Boolean).join(' ') || undefined;
}

export const flag = (value: boolean | undefined): '' | undefined => (value ? '' : undefined);

export function usePart<State>(
  part: Part,
  className: ClassNameProp<State> | undefined,
  state: State,
): { 'data-scope': 'bracket'; 'data-part': Part; className: string | undefined } {
  const { classNames } = useParts();
  const own = typeof className === 'function' ? className(state) : className;
  return { 'data-scope': 'bracket', 'data-part': part, className: cx(classNames[part], own) };
}
