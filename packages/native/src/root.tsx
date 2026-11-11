import {
  type Group,
  type GroupKind,
  type Id,
  type Match,
  participantMap,
  type Round,
  type Stage,
} from '@react-brackets/core';
import {
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  I18nManager,
  type LayoutChangeEvent,
  type StyleProp,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import {
  Easing,
  useAnimatedReaction,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import {
  BracketContext,
  type BracketContextValue,
  defaultLabels,
  type Labels,
  MatchContext,
  RootContext,
  type RootContextValue,
  resolveStyle,
  type StyleOf,
  useBracket,
  useRoot,
  ZoomContext,
  type ZoomFrame,
  type ZoomState,
  type ZoomStore,
} from './context';
import {
  clamp,
  initialTransform,
  type Transform,
  zoomAround,
  zoomBounds,
  zoomLimits,
} from './motion';
import {
  type ResolvedZoom,
  resolveSwipe,
  resolveZoom,
  type SwipeOptions,
  type ZoomOptions,
} from './options';
import { Pagination } from './pagination';
import { MatchPart } from './parts';
import { type BracketTheme, type ThemeOverrides, useBracketTheme } from './theme';
import { Viewport } from './viewport';

export interface RootProps {
  /** The stage to draw. Build one with a format function, `fromRounds`, or load a saved one. */
  stage: Stage;
  /**
   * The group to draw, by id. The grand final is drawn with the winners bracket.
   * @defaultValue the first group
   */
  group?: Id;
  /**
   * Below this width, in points, the bracket pages through one round at a time.
   * It is the bracket's own width, not the screen's. `0` always shows the whole tree.
   * @defaultValue 600
   */
  compactBelow?: number;
  /**
   * Which way the rounds read. Right to left puts the first round on the right and swipes the other way.
   * @defaultValue the app's own direction
   */
  dir?: 'ltr' | 'rtl';
  /** The round in focus in the paged view, counting from 0. Set it to control paging yourself. */
  page?: number;
  /** Called with the new round once a swipe lands, or a round is chosen. */
  onPageChange?: (page: number) => void;
  /** The participant whose path is highlighted. Set it to control highlighting yourself; `null` clears it. */
  highlighted?: Id | null;
  /** Called when a participant is pressed to highlight their path, or pressed again to clear it. */
  onHighlightChange?: (participantId: Id | null) => void;
  /** Makes every match pressable. Participants then no longer highlight on press. */
  onMatchPress?: (match: Match) => void;
  /** Draws one match. Build it from `Bracket.Match` and `Bracket.Participant`, or anything else. */
  renderMatch?: (match: Match) => ReactNode;
  /** Draws a round's title. */
  renderRoundTitle?: (round: Round) => ReactNode;
  /** Replaces any of the theme's values, over the light or dark theme or the nearest provider. */
  theme?: ThemeOverrides;
  /**
   * Animation length in milliseconds, or `false` to turn animation off. Off anyway
   * for people who prefer reduced motion.
   * @defaultValue 320
   */
  motion?: number | false;
  /** How pan-zoom behaves: limits, steps, momentum, double tap, where it starts. */
  zoom?: ZoomOptions;
  /** How a swipe pages: the round in focus, what it takes to page, and the spring. */
  swipe?: SwipeOptions;
  /** Replaces any of the built-in strings, for translation. */
  labels?: Partial<Labels>;
  style?: StyleProp<ViewStyle>;
  /**
   * The parts, arranged your way: `Bracket.Viewport`, `Bracket.Pagination`,
   * `Bracket.ZoomControls`, `Bracket.GroupTitle`, or your own with `usePagination` and `useZoom`.
   * @defaultValue the group title, the viewport and the round tabs
   */
  children?: ReactNode;
}

/** Groups that get a title when a stage has several. */
const titled: GroupKind[] = ['winners', 'losers', 'pool'];

export interface Section {
  group: Group;
  title: string | null;
}

/** The grand final continues the winners bracket on the same grid. */
export function groupSections(stage: Stage): Section[] {
  const final = stage.groups.find((group) => group.kind === 'grand-final');
  const winners = stage.groups.find((group) => group.kind === 'winners');
  return stage.groups
    .filter((group) => !(final && winners && group === final))
    .map((group) => ({
      group:
        final && winners && group === winners
          ? { ...group, rounds: [...group.rounds, ...final.rounds] }
          : group,
      title: stage.groups.length > 1 && titled.includes(group.kind) ? group.name : null,
    }));
}

/**
 * One group of a stage, and the state its parts share: the page, the swipe as it
 * happens, pan-zoom, highlighting and the theme. Without children it draws the default parts.
 */
export function Root({
  stage,
  group: groupId,
  compactBelow = 600,
  dir = I18nManager.isRTL ? 'rtl' : 'ltr',
  page: controlledPage,
  onPageChange,
  highlighted: controlledHighlight,
  onHighlightChange,
  onMatchPress,
  renderMatch,
  renderRoundTitle,
  theme: overrides,
  motion = 320,
  zoom,
  swipe,
  labels,
  style,
  children,
}: RootProps): ReactNode {
  const sections = useMemo(() => groupSections(stage), [stage]);
  const section = sections.find((item) => item.group.id === groupId) ?? sections[0];
  if (!section) throw new Error('Bracket.Root needs a stage with at least one group.');
  const { group, title } = section;
  const theme = useBracketTheme(overrides);
  const reducedMotion = useReducedMotion();
  const duration = motion === false || reducedMotion ? null : motion;
  const [width, setWidth] = useState(0);
  const [ownPage, setOwnPage] = useState(0);
  const [ownHighlight, setOwnHighlight] = useState<Id | null>(null);
  const page = Math.min(controlledPage ?? ownPage, group.rounds.length - 1);
  const highlighted = controlledHighlight === undefined ? ownHighlight : controlledHighlight;
  const participants = useMemo(() => participantMap(stage), [stage]);
  const cards = useCardHeights(theme);
  const position = useSharedValue(page);
  const zoomStore = useZoomStore(useSettled(resolveZoom(zoom, duration)), zoom?.onZoomChange);

  // A page set from outside, or by the pagination, is animated to; one a swipe landed on is already there.
  useEffect(() => {
    if (Math.round(position.value) === page) return;
    position.value =
      duration === null
        ? page
        : withTiming(page, { duration, easing: Easing.bezier(0.2, 0, 0, 1) });
  }, [page, duration, position]);

  const setPage = useCallback(
    (next: number) => {
      setOwnPage(next);
      onPageChange?.(next);
    },
    [onPageChange],
  );
  const highlight = useCallback(
    (participantId: Id | null) => {
      setOwnHighlight(participantId);
      onHighlightChange?.(participantId);
    },
    [onHighlightChange],
  );

  const context = useMemo<BracketContextValue>(
    () => ({
      stage,
      group,
      participants,
      theme,
      labels: { ...defaultLabels, ...labels },
      highlighted,
      highlight,
      onMatchPress,
      renderRoundTitle,
    }),
    [
      stage,
      group,
      participants,
      theme,
      labels,
      highlighted,
      highlight,
      onMatchPress,
      renderRoundTitle,
    ],
  );

  const { measure } = cards;
  const drawMatch = useCallback(
    (match: Match) => (
      <MatchContext.Provider value={match}>
        <View onLayout={(event) => measure(match.id, event)}>
          {onMatchPress ? (
            <PressableMatch match={match} onPress={onMatchPress}>
              {renderMatch ? renderMatch(match) : <MatchPart />}
            </PressableMatch>
          ) : renderMatch ? (
            renderMatch(match)
          ) : (
            <MatchPart />
          )}
        </View>
      </MatchContext.Provider>
    ),
    [measure, onMatchPress, renderMatch],
  );

  const swipeOptions = useSettled(resolveSwipe(swipe));
  const root = useMemo<RootContextValue>(
    () => ({
      group,
      title,
      width,
      paged: width > 0 && width < compactBelow,
      dir,
      page,
      setPage,
      position,
      duration,
      swipe: swipeOptions,
      cards: { base: cards.base, heights: cards.heights },
      drawMatch,
    }),
    [
      group,
      title,
      width,
      compactBelow,
      dir,
      page,
      setPage,
      position,
      duration,
      swipeOptions,
      cards.base,
      cards.heights,
      drawMatch,
    ],
  );

  return (
    <BracketContext.Provider value={context}>
      <RootContext.Provider value={root}>
        <ZoomContext.Provider value={zoomStore}>
          <View
            style={[{ opacity: cards.measured ? 1 : 0, direction: dir }, style]}
            onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
          >
            {children ?? (
              <>
                <GroupTitle />
                <Viewport />
                <Pagination />
              </>
            )}
          </View>
        </ZoomContext.Provider>
      </RootContext.Provider>
    </BracketContext.Provider>
  );
}

export interface GroupTitleState {
  /** The group's name. */
  title: string;
}

export interface GroupTitleProps {
  /** A style for the default title, or a function of its state. */
  style?: StyleOf<GroupTitleState, TextStyle>;
  /** Replaces the title, or renders from its state. */
  children?: ReactNode | ((state: GroupTitleState) => ReactNode);
}

/** The group's name above it, when the stage has several groups. */
export function GroupTitle({ style, children }: GroupTitleProps): ReactNode {
  const { title } = useRoot('GroupTitle');
  const { theme } = useBracket();
  if (!title) return null;
  const state = { title };
  if (typeof children === 'function') return children(state);
  if (children !== undefined) return children;
  return (
    <Text
      accessibilityRole="header"
      style={[
        {
          marginBottom: 12,
          color: theme.colors.text,
          fontFamily: theme.fontFamily,
          fontSize: theme.fontSize + 1,
          fontWeight: '600',
        },
        resolveStyle(style, state),
      ]}
    >
      {title}
    </Text>
  );
}

/**
 * Every card's height, measured as it lays out, so each keeps its own and a card
 * that opens or closes moves the ones around it. Reports arriving together are
 * applied together, straight away, so the cards around one that grew start moving
 * in the next frame. Until the first ones arrive, the bracket stays hidden at a sensible guess.
 */
function useCardHeights(theme: BracketTheme) {
  const guess = Math.round(2 * (theme.fontSize * 1.3 + 18) + 3);
  const [heights, setHeights] = useState<ReadonlyMap<Id, number>>(() => new Map());

  const measure = useCallback((id: Id, event: LayoutChangeEvent) => {
    const height = Math.ceil(event.nativeEvent.layout.height);
    // Layout snaps a card's edges to whole pixels from where it sits, so moving it can change its
    // height by a pixel, which would move it again. A point or less is that rounding, not a change.
    setHeights((current) => {
      const known = current.get(id);
      return known !== undefined && Math.abs(known - height) <= 1
        ? current
        : new Map(current).set(id, height);
    });
  }, []);

  // Rows with no card yet, and cards not measured yet, take the shortest card's height.
  const base = heights.size > 0 ? Math.min(...heights.values()) : guess;
  return { heights, base, measured: heights.size > 0, measure };
}

function PressableMatch({
  match,
  onPress,
  children,
}: {
  match: Match;
  onPress: (match: Match) => void;
  children: ReactNode;
}): ReactNode {
  return (
    <Pressable accessibilityRole="button" onPress={() => onPress(match)}>
      {({ pressed }) => <View style={{ opacity: pressed ? 0.7 : 1 }}>{children}</View>}
    </Pressable>
  );
}

/** Options written inline are new objects every render; this keeps the last while nothing in them changed. */
function useSettled<T extends object>(value: T): T {
  const last = useRef(value);
  if (!sameShallow(last.current, value, 2)) last.current = value;
  return last.current;
}

function sameShallow(a: unknown, b: unknown, depth: number): boolean {
  if (Object.is(a, b)) return true;
  if (depth === 0 || typeof a !== 'object' || typeof b !== 'object' || !a || !b) return false;
  const keys = Object.keys(a);
  return (
    keys.length === Object.keys(b).length &&
    keys.every((key) =>
      sameShallow(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key],
        depth - 1,
      ),
    )
  );
}

const sameFrame = (a: ZoomFrame | null, b: ZoomFrame | null) =>
  a === b ||
  (a !== null &&
    b !== null &&
    a.width === b.width &&
    a.height === b.height &&
    a.fit === b.fit &&
    a.content.width === b.content.width &&
    a.content.height === b.content.height);

/**
 * The pan-zoom transform, kept on the root so zoom controls and `useZoom` work anywhere
 * inside it. A pan-zoom viewport registers its frame, which starts the transform where
 * `initial` says; until then, and once it goes, there is nothing to zoom.
 */
function useZoomStore(
  options: ResolvedZoom,
  onZoomChange: ((scale: number) => void) | undefined,
): ZoomStore {
  const scale = useSharedValue(1);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const [frame, setFrame] = useState<ZoomFrame | null>(null);
  const placed = useRef(false);
  const fit = frame?.fit ?? 1;
  const { min, max } = zoomLimits(fit, options.minScale, options.maxScale);
  const { align, duration, easing, step, initial } = options;
  const report = useRef(onZoomChange);
  report.current = onZoomChange;
  const announce = useCallback((zoom: number) => report.current?.(zoom), []);

  const register = useCallback((next: ZoomFrame | null) => {
    setFrame((current) => (sameFrame(current, next) ? current : next));
  }, []);

  const start = useMemo(
    () => frame && initialTransform(initial, frame.fit, { min, max }, frame, frame.content, align),
    [frame, initial, min, max, align],
  );
  // A viewport that just registered starts where `initial` says.
  useLayoutEffect(() => {
    if (!start) {
      placed.current = false;
      return;
    }
    if (placed.current) return;
    placed.current = true;
    scale.value = start.scale;
    x.value = start.x;
    y.value = start.y;
  }, [start, scale, x, y]);

  const [reach, setReach] = useState({ in: true, out: false, reset: false });
  useAnimatedReaction(
    () => ({
      in: scale.value < max * 0.995,
      out: scale.value > min * 1.005,
      reset:
        start !== null &&
        (Math.abs(scale.value - start.scale) > start.scale * 0.005 ||
          Math.abs(x.value - start.x) > 0.5 ||
          Math.abs(y.value - start.y) > 0.5),
    }),
    (next, previous) => {
      if (next.in !== previous?.in || next.out !== previous?.out || next.reset !== previous?.reset)
        scheduleOnRN(setReach, next);
    },
    [min, max, start],
  );

  return useMemo<ZoomStore>(() => {
    const bounds = (zoom: number) => {
      'worklet';
      return zoomBounds(
        frame ?? { width: 0, height: 0 },
        frame?.content ?? { width: 0, height: 0 },
        zoom,
        align,
      );
    };
    const animate = (to: Transform) => {
      'worklet';
      const timing = easing ? { duration, easing } : { duration };
      scale.value = withTiming(to.scale, timing, (finished) => {
        if (finished) scheduleOnRN(announce, to.scale);
      });
      x.value = withTiming(to.x, timing);
      y.value = withTiming(to.y, timing);
    };
    const zoomTo = (zoom: number, focus?: { x: number; y: number }) => {
      'worklet';
      if (!frame) return;
      const next = clamp(zoom, min, max);
      animate(
        zoomAround(
          { scale: scale.value, x: x.value, y: y.value },
          next,
          focus ?? { x: frame.width / 2, y: frame.height / 2 },
          bounds(next),
        ),
      );
    };
    const panTo = (toX: number, toY: number) => {
      const b = bounds(scale.value);
      animate({ scale: scale.value, x: clamp(toX, b.minX, b.maxX), y: clamp(toY, b.minY, b.maxY) });
    };
    const state: ZoomState | null = frame && {
      scale,
      fitScale: frame.fit,
      minScale: min,
      maxScale: max,
      canZoomIn: reach.in,
      canZoomOut: reach.out,
      canReset: reach.reset,
      zoomIn: (by = step) => zoomTo(scale.value * by),
      zoomOut: (by = step) => zoomTo(scale.value / by),
      zoomTo,
      panBy: (dx, dy) => panTo(x.value + dx, y.value + dy),
      panTo,
      reset: () => start && animate(start),
    };
    return { scale, x, y, options, limits: { min, max }, register, bounds, animate, zoomTo, state };
  }, [
    frame,
    align,
    duration,
    easing,
    step,
    announce,
    min,
    max,
    reach,
    start,
    options,
    register,
    scale,
    x,
    y,
  ]);
}
