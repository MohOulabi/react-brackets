import type { Group, Id, LayoutEdge, Match } from '@react-brackets/core';
import { memo, type ReactNode, useMemo } from 'react';
import { PixelRatio, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { MovingConnector } from './connectors';
import {
  frameAt,
  heightAt,
  heightOf,
  listGeometry,
  type Metrics,
  mirrorPaged,
  type PageHeight,
  pagedGeometry,
} from './geometry';
import { useGlide } from './glide';
import { rubberBand, swipeTarget } from './motion';
import type { ResolvedSwipe } from './options';
import { RoundTitle } from './parts';
import type { BracketTheme } from './theme';

export interface PagedProps {
  group: Group;
  width: number;
  /** The height of a card not measured yet. */
  matchHeight: number;
  /** Each card's measured height. */
  heights: ReadonlyMap<Id, number>;
  theme: BracketTheme;
  onPage: (page: number) => void;
  /** The page shown, fractional mid-swipe. It belongs to the root, so pagination can follow it. */
  position: SharedValue<number>;
  swipe: ResolvedSwipe;
  maxSwipeRounds: number;
  /** Animation length in milliseconds, or `null` to move at once. */
  duration: number | null;
  highlightedEdges: Set<string>;
  renderMatch: (match: Match) => ReactNode;
  /** `bracket` keeps the lines with the next round peeking in; `list` shows each round as a plain list. */
  variant: 'bracket' | 'list';
  rtl: boolean;
  fit: PageHeight;
}

/**
 * One round at a time, drawn as a bracket or as plain lists. Every card's place on every
 * page is worked out up front; a swipe only moves `position`, a page number,
 * on the UI thread, and cards, titles, lines and height all follow it there.
 * React only hears about the page once a swipe lands.
 */
export function PagedBracket({
  group,
  width,
  matchHeight,
  heights,
  theme,
  onPage,
  position,
  swipe,
  maxSwipeRounds,
  duration,
  highlightedEdges,
  renderMatch,
  variant,
  rtl,
  fit,
}: PagedProps): ReactNode {
  const list = variant === 'list';
  const step = list ? width + theme.pagedColumnGap : Math.round(width * swipe.focus);
  // Swipes and stretches run the other way when the rounds read from right to left.
  const dir = rtl ? -1 : 1;
  const metrics: Metrics = {
    matchWidth: list ? width : step - theme.pagedColumnGap,
    matchHeight,
    heights,
    matchGap: theme.matchGap,
    columnGap: theme.pagedColumnGap,
    titleHeight: theme.titleHeight,
  };
  const { matchWidth, matchGap, columnGap, titleHeight } = metrics;
  // biome-ignore lint/correctness/useExhaustiveDependencies: the metrics are listed value by value
  const geometry = useMemo(() => {
    const tables = (list ? listGeometry : pagedGeometry)(group, metrics, step);
    return rtl ? mirrorPaged(tables, width) : tables;
  }, [
    group,
    list,
    rtl,
    width,
    step,
    matchWidth,
    matchHeight,
    heights,
    matchGap,
    columnGap,
    titleHeight,
  ]);
  const last = geometry.pages - 1;
  const start = useSharedValue(0);
  const stretch = useSharedValue(0);
  const { commit, projection, elasticity, spring } = swipe;

  const pan = usePanGesture({
    activeOffsetX: [-10, 10],
    failOffsetY: [-14, 14],
    onActivate: () => {
      'worklet';
      cancelAnimation(position);
      start.value = position.value;
    },
    onUpdate: (event) => {
      'worklet';
      const from = Math.round(start.value);
      const low = Math.max(0, from - maxSwipeRounds);
      const high = Math.min(last, from + maxSwipeRounds);
      const raw = start.value - (dir * event.translationX) / step;
      const held = Math.min(Math.max(raw, low), high);
      position.value = held;
      stretch.value = dir * rubberBand((held - raw) * step, width, elasticity);
    },
    onDeactivate: (event) => {
      'worklet';
      const velocity = (-dir * event.velocityX) / step;
      const target = swipeTarget({
        position: position.value,
        start: start.value,
        velocity,
        last,
        maxRounds: maxSwipeRounds,
        commit,
        projection,
      });
      const land = (finished?: boolean) => {
        'worklet';
        if (finished) scheduleOnRN(onPage, target);
      };
      position.value =
        duration === null
          ? withTiming(target, { duration: 0 }, land)
          : withSpring(target, { ...spring, velocity }, land);
      stretch.value = duration === null ? 0 : withSpring(0, spring);
    },
  });

  const frame = useAnimatedStyle(() => ({
    height: heightAt(geometry.heights, position.value, fit),
  }));
  const pulled = useAnimatedStyle(() => ({ transform: [{ translateX: stretch.value }] }));
  const lines = geometry.edges.map((edge) => ({
    edge,
    from: geometry.matches.get(edge.from),
    to: geometry.matches.get(edge.to),
  }));
  // A corner can be no rounder than half the gap between rounds. Drawn at that size from the start, it
  // keeps the line's full width, where shrinking a larger one to fit would thin its stroke too.
  // Both are whole pixels, so the lines and corners laid out match the places worked out for them.
  const radius = PixelRatio.roundToNearestPixel(Math.min(theme.connectorRadius, columnGap / 2));
  const lineWidth = PixelRatio.roundToNearestPixel(theme.lineWidth);
  const look = useMemo(
    () => ({ radius, width: lineWidth, color: theme.colors.line }),
    [radius, lineWidth, theme.colors.line],
  );
  const lit = useMemo(() => ({ ...look, color: theme.colors.accent }), [look, theme.colors.accent]);

  return (
    <GestureDetector gesture={pan}>
      {/* Places are worked out left to right and mirrored for RTL, so this layer never flips them again. */}
      <Animated.View style={[{ overflow: 'hidden', direction: 'ltr' }, frame]}>
        <Animated.View style={pulled}>
          {lines.map(
            ({ edge, from, to }) =>
              from &&
              to && (
                <MovingConnector
                  key={edgeKey(edge)}
                  from={from}
                  to={to}
                  fromHeight={heightOf(metrics, edge.from)}
                  toHeight={heightOf(metrics, edge.to)}
                  width={matchWidth}
                  position={position}
                  duration={duration}
                  look={highlightedEdges.has(edgeKey(edge)) ? lit : look}
                />
              ),
          )}
          {group.rounds.map((round) => (
            <Placed
              key={round.id}
              frames={geometry.titles.get(round.id) ?? []}
              position={position}
              width={matchWidth}
              rtl={rtl}
              duration={duration}
            >
              <View style={{ height: titleHeight, justifyContent: 'center' }}>
                <RoundTitle round={round} />
              </View>
            </Placed>
          ))}
          {group.rounds.flatMap((round) =>
            round.matches.map((match) => (
              <Placed
                key={match.id}
                frames={geometry.matches.get(match.id) ?? []}
                position={position}
                width={matchWidth}
                rtl={rtl}
                duration={duration}
              >
                {renderMatch(match)}
              </Placed>
            )),
          )}
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

export const edgeKey = (edge: LayoutEdge): string => `${edge.from}>${edge.to}`;

/** Anything drawn at its frame for the current position. */
const Placed = memo(function Placed({
  frames,
  position,
  width,
  rtl,
  duration,
  children,
}: {
  frames: number[];
  position: SharedValue<number>;
  width: number;
  rtl: boolean;
  duration: number | null;
  children: ReactNode;
}) {
  // Moved by a card opening or closing nearby: glide there rather than jump.
  const moved = useGlide(frames, (shown) => [frameAt(shown, position.value)[1] ?? 0], duration);
  const style = useAnimatedStyle(() => {
    const [x, y, opacity] = frameAt(frames, position.value);
    return { opacity, transform: [{ translateX: x }, { translateY: y + (moved.value[0] ?? 0) }] };
  });
  return (
    <Animated.View
      style={[
        { position: 'absolute', left: 0, top: 0, width, direction: rtl ? 'rtl' : 'ltr' },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
});
