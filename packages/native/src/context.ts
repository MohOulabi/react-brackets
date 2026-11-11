import type { Group, Id, Match, Participant, Round, Stage } from '@react-brackets/core';
import { type Context, createContext, type ReactNode, useContext } from 'react';
import type { StyleProp } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import type { ConnectorState } from './connectors';
import type { Bounds, Size, Transform } from './motion';
import type { ResolvedSwipe, ResolvedZoom } from './options';
import type { BracketTheme } from './theme';

/** Built-in strings, replaceable for translation. */
export interface Labels {
  /** Shown in place of a participant when there is no opponent. */
  bye: string;
  /** Shown while a slot is still to be decided. */
  tbd: string;
  /** Names the row of round tabs. */
  rounds: string;
  /** The button to the round before. */
  previous: string;
  /** The button to the round after. */
  next: string;
  zoomIn: string;
  zoomOut: string;
  /** The button that zooms back out to where pan-zoom started. */
  zoomReset: string;
}

export const defaultLabels: Labels = {
  bye: 'Bye',
  tbd: 'TBD',
  rounds: 'Rounds',
  previous: 'Previous round',
  next: 'Next round',
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  zoomReset: 'Fit to view',
};

/** A style, or a function of the part's state that returns one. */
export type StyleOf<State, Style> = StyleProp<Style> | ((state: State) => StyleProp<Style>);

export function resolveStyle<State, Style>(
  style: StyleOf<State, Style> | undefined,
  state: State,
): StyleProp<Style> {
  return typeof style === 'function'
    ? (style as (state: State) => StyleProp<Style>)(state)
    : (style as StyleProp<Style>);
}

export interface BracketContextValue {
  stage: Stage;
  group: Group;
  participants: Map<Id, Participant>;
  theme: BracketTheme;
  labels: Labels;
  /** The participant whose path is highlighted. */
  highlighted: Id | null;
  /** Highlights a participant's path, or clears it with `null`. */
  highlight: (participantId: Id | null) => void;
  /** Set when matches can be pressed; participants then leave presses to the match. */
  onMatchPress?: (match: Match) => void;
  renderRoundTitle?: (round: Round) => ReactNode;
  renderConnector?: (connector: ConnectorState) => ReactNode;
}

export const BracketContext: Context<BracketContextValue | null> =
  createContext<BracketContextValue | null>(null);

/** Everything a part needs from the bracket around it. */
export function useBracket(): BracketContextValue {
  const value = useContext(BracketContext);
  if (!value) throw new Error('Bracket parts must be rendered inside a <Bracket>.');
  return value;
}

/** A pressable match: whether it is pressed, and how its card says it shows that itself. */
export interface PressState {
  pressed: boolean;
  claim: () => () => void;
}

export const PressContext: Context<PressState | null> = createContext<PressState | null>(null);

export const MatchContext: Context<Match | null> = createContext<Match | null>(null);

/** The match being rendered, inside `renderMatch`. */
export function useMatch(): Match {
  const match = useContext(MatchContext);
  if (!match)
    throw new Error('Bracket.Match and Bracket.Participant must be rendered for a match.');
  return match;
}

/** What the parts inside `Bracket.Root` share: its size, paging and cards. */
export interface RootContextValue {
  group: Group;
  /** The group's name, when the stage has several. */
  title: string | null;
  /** The root's width, `0` until it lays out. */
  width: number;
  /** `true` while the bracket pages through one round at a time. */
  paged: boolean;
  dir: 'ltr' | 'rtl';
  page: number;
  setPage: (page: number) => void;
  position: SharedValue<number>;
  /** Animation length in milliseconds, or `null` to move at once. */
  duration: number | null;
  swipe: ResolvedSwipe;
  /** The height of a card not measured yet, and each card's measured height. */
  cards: { base: number; heights: ReadonlyMap<Id, number> };
  drawMatch: (match: Match) => ReactNode;
}

export const RootContext: Context<RootContextValue | null> = createContext<RootContextValue | null>(
  null,
);

export function useRoot(part: string): RootContextValue {
  const value = useContext(RootContext);
  if (!value) throw new Error(`Bracket.${part} must be rendered inside a <Bracket.Root>.`);
  return value;
}

/** Paging, for your own round tabs or buttons. */
export interface PaginationState {
  /** `true` while the bracket pages through one round at a time, `false` while it shows the whole tree. */
  paged: boolean;
  rounds: Round[];
  /** The round in focus, counting from 0. */
  page: number;
  setPage: (page: number) => void;
  previous: () => void;
  next: () => void;
  canPrevious: boolean;
  canNext: boolean;
  /** Where the swipe is, as a fractional page, on the UI thread: it moves under the finger. */
  position: SharedValue<number>;
}

/** Paging state for anything inside `Bracket.Root`. */
export function usePagination(): PaginationState {
  const { group, paged, page, setPage, position } = useRoot('usePagination');
  const last = group.rounds.length - 1;
  return {
    paged,
    rounds: group.rounds,
    page,
    setPage,
    previous: () => setPage(Math.max(0, page - 1)),
    next: () => setPage(Math.min(last, page + 1)),
    canPrevious: page > 0,
    canNext: page < last,
    position,
  };
}

/** Pan-zoom, for your own zoom buttons. */
export interface ZoomState {
  /** The current zoom, on the UI thread. */
  scale: SharedValue<number>;
  /** The zoom that shows the whole width, never more than 1. */
  fitScale: number;
  minScale: number;
  maxScale: number;
  canZoomIn: boolean;
  canZoomOut: boolean;
  /** `false` while already where `reset()` goes. */
  canReset: boolean;
  /** Zooms in on the middle by `step`, or the `zoom.step` option. */
  zoomIn: (step?: number) => void;
  zoomOut: (step?: number) => void;
  /** Zooms to `scale`, keeping the point at `focus` in the frame still, or the middle. */
  zoomTo: (scale: number, focus?: { x: number; y: number }) => void;
  panBy: (dx: number, dy: number) => void;
  panTo: (x: number, y: number) => void;
  /** Back to where pan-zoom started. */
  reset: () => void;
}

/** The pan-zoom frame a viewport registers: its size, the content's, and the zoom that fits it. */
export interface ZoomFrame extends Size {
  content: Size;
  fit: number;
}

export interface ZoomStore {
  scale: SharedValue<number>;
  x: SharedValue<number>;
  y: SharedValue<number>;
  options: ResolvedZoom;
  limits: { min: number; max: number };
  register: (frame: ZoomFrame | null) => void;
  /** Where the content may sit at a zoom. */
  bounds: (scale: number) => Bounds;
  /** Animates to a transform, and reports the zoom once it lands. */
  animate: (to: Transform) => void;
  zoomTo: (scale: number, focus?: { x: number; y: number }) => void;
  /** `null` until a pan-zoom viewport registers. */
  state: ZoomState | null;
}

export const ZoomContext: Context<ZoomStore | null> = createContext<ZoomStore | null>(null);

/** Pan-zoom state for anything inside `Bracket.Root`, or `null` when the tree isn't panned and zoomed. */
export function useZoom(): ZoomState | null {
  return useContext(ZoomContext)?.state ?? null;
}
