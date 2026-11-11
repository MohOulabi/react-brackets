import {
  type Group,
  type GroupLayout,
  type Id,
  layoutGroup,
  type Match,
  participantMap,
  type Stage,
} from '@react-brackets/core';
import { type ComponentPropsWithoutRef, type ReactNode, useMemo, useRef, useState } from 'react';
import {
  BracketContext,
  type BracketContextValue,
  type ClassNameProp,
  type ClassNames,
  type Column,
  type Compact,
  cx,
  type Labels,
  type Motion,
  type Paging,
  PagingContext,
  type View,
} from './context';
import { useElementWidth } from './hooks/use-element-width';
import { useReducedMotion } from './hooks/use-reduced-motion';
import { resolveSwipe, resolveZoom, type SwipeOptions, type ZoomOptions } from './options';
import type { PageHeight } from './page-height';
import { createZoomStore, ZoomContext } from './zoom';

/** `standard` flows in one direction; `mirrored` splits the bracket into halves that meet at the final. */
export type BracketLayout = 'standard' | 'mirrored';

/** Passed to `className` when it is a function. */
export interface RootState {
  /** `tree` shows the whole bracket; `paged` shows one round at a time on narrow containers. */
  view: View;
  /** The `layout` prop. */
  layout: BracketLayout;
}

/** The props `Bracket.Root` adds on top of a regular `div`. */
export interface RootOwnProps {
  /** The stage to draw. Build one with a format function, `fromRounds`, or load a saved one. */
  stage: Stage;
  /**
   * Which group to draw, or several to draw on one shared grid, like a winners
   * bracket followed by its grand final.
   * @defaultValue the first group
   */
  group?: Id | Id[];
  /**
   * `mirrored` splits the bracket into two halves that meet at the final.
   * @defaultValue 'standard'
   */
  layout?: BracketLayout;
  /**
   * Below this container width, in pixels, the bracket pages through one round
   * at a time. It is the container's width, not the window's. `0` always shows
   * the whole tree.
   * @defaultValue 640
   */
  compactBelow?: number;
  /**
   * How the paged view draws a round: `bracket` keeps the connector lines with
   * the next round peeking in; `list` shows plain lists of matches.
   * @defaultValue 'bracket'
   */
  compact?: Compact;
  /**
   * How the paged view's height moves between rounds of different heights.
   * `contain` holds both rounds while they move and settles once the move lands, so nothing is cut;
   * `follow` blends the heights under the finger, cutting the taller round as it moves.
   * @defaultValue 'contain'
   */
  pageHeight?: PageHeight;
  /**
   * The most rounds one swipe can move in the paged view. A long or fast swipe crosses several rounds; `1` pages
   * one round at a time.
   * @defaultValue Infinity
   */
  maxSwipeRounds?: number;
  /** How the pan and zoom viewport behaves: its limits, step, edges, momentum, double tap and where it starts. */
  zoom?: ZoomOptions;
  /** How a swipe between rounds feels in the paged view. */
  swipe?: SwipeOptions;
  /**
   * Timing for paging, swiping, zooming and the `data-updated` / `data-entered`
   * flags, or `false` to turn all of it off. Off anyway for people who prefer
   * reduced motion.
   * @defaultValue { duration: 320, easing: 'cubic-bezier(0.2, 0, 0, 1)' }
   */
  motion?: Partial<Motion> | false;
  /** The round in focus in the paged view, counting from 0. Set it to control paging yourself. */
  page?: number;
  /** Called with the new round when the reader pages, swipes or uses the arrow keys. */
  onPageChange?: (page: number) => void;
  /** The participant whose path is highlighted. Set it to control highlighting yourself; `null` clears it. */
  highlighted?: Id | null;
  /** Called with the participant under the mouse, or `null` when it leaves. */
  onHighlightChange?: (participantId: Id | null) => void;
  /**
   * Highlights a participant's path while the mouse is over them. Touch never triggers it.
   * @defaultValue true
   */
  highlightOnHover?: boolean;
  /**
   * Makes every match a button that works with clicks, Enter and Space, and
   * calls this with the match.
   */
  onMatchClick?: (match: Match) => void;
  /**
   * Hides matches against a bye, and their lines, while keeping everything else in place.
   * @defaultValue false
   */
  hideByes?: boolean;
  /**
   * Opts this bracket out of the default theme, even when its stylesheet is loaded.
   * @defaultValue false
   */
  unstyled?: boolean;
  /** A class for any part of the bracket, by part name. Handy with Tailwind. */
  classNames?: ClassNames;
  /** Replaces any of the built-in strings, for translation. */
  labels?: Partial<Labels>;
  /** A class for the root element, or a function of its state. */
  className?: ClassNameProp<RootState>;
  /** The bracket's parts. `<Bracket>` fills these in for you. */
  children: ReactNode;
}

/** Every `RootOwnProps` prop, plus any prop of a `div`, like `dir`, `style` or `id`. */
export interface RootProps
  extends RootOwnProps,
    Omit<ComponentPropsWithoutRef<'div'>, keyof RootOwnProps> {}

const defaultMotion: Motion = { duration: 320, easing: 'cubic-bezier(0.2, 0, 0, 1)' };

const defaultLabels: Labels = {
  bye: 'Bye',
  tbd: 'TBD',
  previous: 'Previous round',
  next: 'Next round',
  rounds: 'Rounds',
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  zoomReset: 'Fit to view',
};

/**
 * Draws one group of a stage and provides everything its parts need. Measures
 * its own width to switch between the full tree and the paged view.
 */
export function Root({
  stage,
  group: groupIds,
  layout = 'standard',
  compactBelow = 640,
  compact = 'bracket',
  pageHeight = 'contain',
  maxSwipeRounds = Number.POSITIVE_INFINITY,
  zoom,
  swipe,
  motion,
  page: controlledPage,
  onPageChange,
  highlighted: controlledHighlight,
  onHighlightChange,
  hideByes = false,
  unstyled = false,
  classNames = {},
  labels,
  highlightOnHover = true,
  onMatchClick,
  className,
  children,
  ...props
}: RootProps): ReactNode {
  const ref = useRef<HTMLDivElement>(null);
  const width = useElementWidth(ref);
  const [ownPage, setOwnPage] = useState(0);
  const [ownHighlight, setOwnHighlight] = useState<Id | null>(null);
  const requestedPage = controlledPage ?? ownPage;
  const highlighted = controlledHighlight === undefined ? ownHighlight : controlledHighlight;
  const cells = useRef(new Map<Id, HTMLElement>()).current;
  const [zoomStore] = useState(createZoomStore);
  const reducedMotion = useReducedMotion();

  const groupKey = groupIds === undefined ? '' : [groupIds].flat().join('\n');
  const group = useMemo(() => selectGroup(stage, groupKey), [stage, groupKey]);

  const view: View = width !== null && width < compactBelow ? 'paged' : 'tree';
  const grid = view === 'tree' || compact === 'bracket';
  const page = Math.min(requestedPage, group.rounds.length - 1);
  const animated = motion !== false && !reducedMotion;
  const sliding = view === 'paged' && compact === 'bracket';

  // While a swipe heads to a round it is drawn in focus without changing the page, so letting go can still cancel.
  const [preview, setPreview] = useState<number | null>(null);
  const shown = sliding && preview !== null ? preview : page;

  // Rounds moved past keep their place on screen and slide away, instead of vanishing the moment focus moves.
  const [leaving, setLeaving] = useState<number[]>([]);
  const [lastShown, setLastShown] = useState(shown);
  if (shown !== lastShown) {
    setLastShown(shown);
    const passed = sliding && animated ? range(lastShown, shown) : [];
    setLeaving((rounds) => [...new Set([...rounds, ...passed])].filter((round) => round < shown));
  }

  const treeLayout = useMemo(
    () => layoutGroup(group, { mirror: layout === 'mirrored' }),
    [group, layout],
  );
  const pagedLayout = useMemo(
    () => layoutGroup({ ...group, rounds: group.rounds.slice(shown) }),
    [group, shown],
  );
  const firstLeaving = leaving.length > 0 ? Math.min(...leaving) : shown;
  const leavingLayout = useMemo(
    () => layoutGroup({ ...group, rounds: group.rounds.slice(firstLeaving) }),
    [group, firstLeaving],
  );
  const activeLayout = useMemo<GroupLayout>(() => {
    if (view === 'tree') return treeLayout;
    if (leaving.length === 0) return pagedLayout;
    const gone = new Set(
      leaving.flatMap((round) => group.rounds[round]?.matches.map((match) => match.id) ?? []),
    );
    const edges = leavingLayout.edges.filter((edge) => gone.has(edge.from));
    return { ...pagedLayout, edges: [...edges, ...pagedLayout.edges] };
  }, [view, treeLayout, pagedLayout, leavingLayout, leaving, group]);
  const participants = useMemo(() => participantMap(stage), [stage]);

  const columns = useMemo<Column[]>(() => {
    if (view === 'tree') {
      return treeLayout.columns.map((column, index) => ({
        ...column,
        key: `${column.round.id}.${index}`,
        current: false,
        hidden: false,
        leaving: false,
      }));
    }
    if (compact === 'bracket') {
      const gone = leaving.flatMap((round) => {
        const column = leavingLayout.columns[round - firstLeaving];
        return column
          ? [{ ...column, key: column.round.id, current: false, hidden: true, leaving: true }]
          : [];
      });
      return [
        ...gone,
        ...pagedLayout.columns.map((column, index) => ({
          ...column,
          key: column.round.id,
          current: index === 0,
          hidden: false,
          leaving: false,
        })),
      ];
    }
    return group.rounds.map((round, index) => ({
      key: round.id,
      round,
      side: 'start',
      cells: round.matches.map((match, row) => ({ match, row, span: 1 })),
      current: index === page,
      hidden: index !== page,
      leaving: false,
    }));
  }, [view, compact, treeLayout, pagedLayout, leavingLayout, leaving, firstLeaving, group, page]);

  const paging = useMemo<Paging>(
    () => ({
      shown,
      preview: setPreview,
      settle: () => setLeaving([]),
    }),
    [shown],
  );

  const value: BracketContextValue = {
    stage,
    group,
    layout: activeLayout,
    columns,
    rounds: group.rounds,
    participants,
    view,
    compact,
    pageHeight,
    maxSwipeRounds: Math.max(1, maxSwipeRounds),
    zoom: resolveZoom(zoom),
    swipe: resolveSwipe(swipe),
    grid,
    width,
    motion: animated ? { ...defaultMotion, ...motion } : null,
    page,
    setPage(next) {
      const clamped = Math.max(0, Math.min(next, group.rounds.length - 1));
      if (clamped === page) return;
      setOwnPage(clamped);
      onPageChange?.(clamped);
    },
    classNames,
    labels: { ...defaultLabels, ...labels },
    highlighted: highlightOnHover || controlledHighlight !== undefined ? highlighted : null,
    highlight(participantId) {
      if (!highlightOnHover || participantId === highlighted) return;
      setOwnHighlight(participantId);
      onHighlightChange?.(participantId);
    },
    hideByes,
    onMatchClick,
    cells,
  };

  const state: RootState = { view, layout };
  const ownClassName = typeof className === 'function' ? className(state) : className;

  return (
    <BracketContext.Provider value={value}>
      <PagingContext.Provider value={paging}>
        <ZoomContext.Provider value={zoomStore}>
          <div
            {...props}
            ref={ref}
            data-scope="bracket"
            data-part="root"
            data-view={view}
            data-compact={view === 'paged' ? compact : undefined}
            data-layout={layout}
            data-unstyled={unstyled ? '' : undefined}
            className={cx(classNames.root, ownClassName)}
          >
            {children}
          </div>
        </ZoomContext.Provider>
      </PagingContext.Provider>
    </BracketContext.Provider>
  );
}

/** Whole numbers from `from` up to, not including, `to`. */
function range(from: number, to: number): number[] {
  return Array.from({ length: Math.max(0, to - from) }, (_, index) => from + index);
}

function selectGroup(stage: Stage, key: string): Group {
  const wanted = key ? key.split('\n') : [stage.groups[0]?.id];
  const groups = wanted.map((id) => {
    const group = stage.groups.find((item) => item.id === id);
    if (!group) throw new Error(`Stage "${stage.id}" has no group "${id ?? ''}".`);
    return group;
  });
  const [first, ...rest] = groups;
  if (!first) throw new Error(`Stage "${stage.id}" has no groups.`);
  return rest.length === 0 ? first : { ...first, rounds: groups.flatMap((group) => group.rounds) };
}
