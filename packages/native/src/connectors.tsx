import type { Match, MatchStatus, SlotIndex } from '@react-brackets/core';
import {
  type Context,
  createContext,
  memo,
  type NamedExoticComponent,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { PixelRatio, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { resolveStyle, type StyleOf } from './context';
import {
  type ArcDash,
  arcDashes,
  type Box,
  type ConnectorDash,
  type ConnectorPieces,
  connectorAnchors,
  connectorPieces,
  type DashPattern,
  dashPattern,
  dashStarts,
  frameAt,
  type Point,
  piecesBetween,
  stripShift,
  wrap,
} from './geometry';
import { useGlide } from './glide';

/** Which corner of a square a turn rounds: top or bottom, then left or right. */
type Corner = 'tl' | 'tr' | 'bl' | 'br';

/** The turn from the line out of a match into the line across. */
const turnOut = (sx: number, sy: number): Corner =>
  sx > 0 ? (sy > 0 ? 'tr' : 'br') : sy > 0 ? 'tl' : 'bl';
/** The turn from the line across into the line into the next match. */
const turnIn = (sx: number, sy: number): Corner =>
  sx > 0 ? (sy > 0 ? 'bl' : 'tl') : sy > 0 ? 'br' : 'tr';

export interface LineLook {
  radius: number;
  width: number;
  color: string;
}

/** Lines run the way their first page has them: left to right, or right to left. */
const runsForward = (from: number[], to: number[]) => (from[0] ?? 0) < (to[0] ?? 0);

const origin = { position: 'absolute', left: 0, top: 0, transformOrigin: 'left top' } as const;

/**
 * The length a moving line is drawn at before it is stretched. It is a whole number of pixels, so
 * layout never rounds it: a line stretched from one point would be snapped to two or three pixels,
 * and come out a quarter short or long on screens with fractional pixel ratios.
 */
const SPAN = PixelRatio.roundToNearestPixel(100);

/** The square a rounded corner is drawn in; it clips the ring inside it to one quarter. */
const cornerBox = (size: number): ViewStyle => ({
  ...origin,
  width: size,
  height: size,
  overflow: 'hidden',
});

/**
 * A rounded corner: a quarter of a ring, cut from a whole circle with one even stroke. A square with
 * two of its four borders drawn would do the same, but Android draws hairlines along the other two.
 */
function Ring({ corner, size, look }: { corner: Corner; size: number; look: LineLook }): ReactNode {
  return (
    <View
      style={{
        position: 'absolute',
        left: corner[1] === 'r' ? -size : 0,
        top: corner[0] === 't' ? 0 : -size,
        width: size * 2,
        height: size * 2,
        borderRadius: size,
        borderWidth: look.width,
        borderColor: look.color,
      }}
    />
  );
}

/** A connector that stays put: placed once, with real sizes, so it is sharp at any zoom. */
interface StaticConnectorProps {
  from: Box;
  to: Box;
  look: LineLook;
}

export const StaticConnector: NamedExoticComponent<StaticConnectorProps> = memo(
  function StaticConnector({ from, to, look }: StaticConnectorProps): ReactNode {
    const pieces = connectorPieces(from, to, look.radius, look.width);
    const { out, across, into, sx, sy } = pieces;
    const turn = look.radius * pieces.turnOut[2];
    const line = { ...origin, backgroundColor: look.color };
    return (
      <>
        <View
          pointerEvents="none"
          style={[line, { left: out[0], top: out[1], width: out[2], height: look.width }]}
        />
        <View
          pointerEvents="none"
          style={[line, { left: across[0], top: across[1], width: look.width, height: across[2] }]}
        />
        <View
          pointerEvents="none"
          style={[line, { left: into[0], top: into[1], width: into[2], height: look.width }]}
        />
        {turn > 0 && (
          <>
            <View
              pointerEvents="none"
              style={[cornerBox(turn), { left: pieces.turnOut[0], top: pieces.turnOut[1] }]}
            >
              <Ring corner={turnOut(sx, sy)} size={turn} look={look} />
            </View>
            <View
              pointerEvents="none"
              style={[cornerBox(turn), { left: pieces.turnIn[0], top: pieces.turnIn[1] }]}
            >
              <Ring corner={turnIn(sx, sy)} size={turn} look={look} />
            </View>
          </>
        )}
      </>
    );
  },
);

/**
 * A connector between two moving matches. Every piece is moved and stretched
 * with transforms worked out from the same position as the cards, in the same
 * frame, so the lines can never trail them.
 */
interface MovingConnectorProps {
  from: number[];
  to: number[];
  fromHeight: number;
  toHeight: number;
  width: number;
  position: SharedValue<number>;
  duration: number | null;
  look: LineLook;
}

interface Ends {
  from: number[];
  to: number[];
  fromHeight: number;
  toHeight: number;
}

export const MovingConnector: NamedExoticComponent<MovingConnectorProps> = memo(
  function MovingConnector({
    from,
    to,
    fromHeight,
    toHeight,
    width,
    position,
    duration,
    look,
  }: MovingConnectorProps): ReactNode {
    // Which way the line runs never changes as it moves, only whether it bends up or down.
    const sx = runsForward(from, to) ? 1 : -1;
    // Its ends glide with their cards when a card nearby opens or closes.
    const ends = useMemo<Ends>(
      () => ({ from, to, fromHeight, toHeight }),
      [from, to, fromHeight, toHeight],
    );
    const moved = useGlide(
      ends,
      (shown) => [
        frameAt(shown.from, position.value)[1] ?? 0,
        shown.fromHeight,
        frameAt(shown.to, position.value)[1] ?? 0,
        shown.toHeight,
      ],
      duration,
    );
    const state = useDerivedValue(() => {
      const [x1, y1, o1] = frameAt(from, position.value);
      const [x2, y2, o2] = frameAt(to, position.value);
      const [dy1 = 0, dh1 = 0, dy2 = 0, dh2 = 0] = moved.value;
      return {
        pieces: connectorPieces(
          { x: x1, y: y1 + dy1, width, height: fromHeight + dh1 },
          { x: x2, y: y2 + dy2, width, height: toHeight + dh2 },
          look.radius,
          look.width,
        ),
        opacity: Math.min(o1, o2),
      };
    });
    return <MovingPieces state={state} look={look} sx={sx} />;
  },
);

/** A solid line's pieces, placed from `state` on the UI thread. */
function MovingPieces({
  state,
  look,
  sx,
}: {
  state: SharedValue<PiecesState>;
  look: LineLook;
  sx: 1 | -1;
}): ReactNode {
  const line = { ...origin, backgroundColor: look.color };
  return (
    <>
      <Stretched
        state={state}
        piece="out"
        axis="x"
        style={[line, { width: SPAN, height: look.width }]}
      />
      <Stretched
        state={state}
        piece="across"
        axis="y"
        style={[line, { width: look.width, height: SPAN }]}
      />
      <Stretched
        state={state}
        piece="into"
        axis="x"
        style={[line, { width: SPAN, height: look.width }]}
      />
      {look.radius > 0 && (
        <>
          <Turn state={state} piece="turnOut" down look={look} corner={turnOut(sx, 1)} />
          <Turn state={state} piece="turnOut" down={false} look={look} corner={turnOut(sx, -1)} />
          <Turn state={state} piece="turnIn" down look={look} corner={turnIn(sx, 1)} />
          <Turn state={state} piece="turnIn" down={false} look={look} corner={turnIn(sx, -1)} />
        </>
      )}
    </>
  );
}

interface PiecesState {
  pieces: ConnectorPieces;
  opacity: number;
}

function Stretched({
  state,
  piece,
  axis,
  style,
}: {
  state: SharedValue<PiecesState>;
  piece: 'out' | 'across' | 'into';
  axis: 'x' | 'y';
  style: ViewStyle[];
}): ReactNode {
  const animated = useAnimatedStyle(() => {
    const [x, y, length] = state.value.pieces[piece];
    return {
      opacity: length > 0 ? state.value.opacity : 0,
      transform: [
        { translateX: x },
        { translateY: y },
        axis === 'x' ? { scaleX: length / SPAN } : { scaleY: length / SPAN },
      ],
    };
  });
  return <Animated.View pointerEvents="none" style={[style, animated]} />;
}

/** One way a turn can bend; the bracket shows the one matching where the line is heading. */
function Turn({
  state,
  piece,
  down,
  look,
  corner,
}: {
  state: SharedValue<PiecesState>;
  piece: 'turnOut' | 'turnIn';
  down: boolean;
  look: LineLook;
  corner: Corner;
}): ReactNode {
  const animated = useAnimatedStyle(() => {
    const [x, y, scale] = state.value.pieces[piece];
    const shown = state.value.pieces.sy > 0 === down && scale > 0;
    return {
      opacity: shown ? state.value.opacity : 0,
      transform: [{ translateX: x }, { translateY: y }, { scale }],
    };
  });
  return (
    <Animated.View pointerEvents="none" style={[cornerBox(look.radius), animated]}>
      <Ring corner={corner} size={look.radius} look={look} />
    </Animated.View>
  );
}

/** Where a line runs, in the bracket's own points, on the UI thread. */
export interface ConnectorPoints {
  /** Where the line leaves the feeding match: the middle of its side facing the next round. */
  start: Point;
  /** Where the line enters the next match. */
  end: Point;
  /** Below 1 while a match at either end is fading out, as its round slides away. */
  opacity: number;
}

/** One line between two matches. Passed to `renderConnector` and to `Bracket.Connector`'s `style`. */
export interface ConnectorState {
  /** The match the line comes from. */
  from: Match;
  /** The match the line leads to. */
  to: Match;
  /** Which participant slot of `to` the line feeds. */
  slot: SlotIndex;
  /** The status of `from`. */
  status: MatchStatus;
  /** `true` when `from` has a bye. */
  bye: boolean;
  /** `true` while the line is part of the highlighted participant's path. */
  highlighted: boolean;
  /**
   * Where the line starts and ends, on the UI thread. In the paged view it moves with the cards as
   * you swipe, so read it in `useAnimatedStyle` or `useAnimatedProps` to draw a line of your own.
   */
  points: SharedValue<ConnectorPoints>;
}

/** The look of one line. Anything left out comes from the theme. */
export interface ConnectorStyle {
  /** @defaultValue `colors.line`, or `colors.accent` on the highlighted path */
  color?: string;
  /** @defaultValue `lineWidth` */
  width?: number;
  /** Rounds the turns. @defaultValue `connectorRadius` */
  radius?: number;
}

/** What the bracket knows about the line being drawn. */
interface ConnectorSlot {
  state: ConnectorState;
  /** The theme's look for this line: its line colour, or the accent when highlighted. */
  look: LineLook;
  /** A look made fit to draw: in the paged view, whole pixels and turns that fit the gap. */
  fit: (look: LineLook) => LineLook;
  sx: 1 | -1;
  /** The matches' boxes in the full tree, where the line stays put; `null` where it moves. */
  boxes: { from: Box; to: Box } | null;
  /** The longest the line runs from a match to its turn, and from one turn to the other. */
  reach: { along: number; across: number };
  /** `false` while motion is off or reduced. */
  animate: boolean;
}

const ConnectorContext: Context<ConnectorSlot | null> = createContext<ConnectorSlot | null>(null);

function useSlot(): ConnectorSlot {
  const slot = useContext(ConnectorContext);
  if (!slot) throw new Error('Bracket.Connector must be rendered from renderConnector.');
  return slot;
}

/** The line being drawn, inside `renderConnector`. Use it to draw a line from scratch in its own component. */
export function useConnector(): ConnectorState {
  return useSlot().state;
}

/** What a line needs besides where it runs: the matches it joins and how the bracket draws it. */
export interface LineInfo extends Omit<ConnectorState, 'points'> {
  look: LineLook;
  fit: (look: LineLook) => LineLook;
  animate: boolean;
  render: (connector: ConnectorState) => ReactNode;
}

/** A line in the full tree, drawn your way: it stays where it is, so its points never change. */
export function StaticLine({ from, to, info }: { from: Box; to: Box; info: LineInfo }): ReactNode {
  const { look, fit, animate, render } = info;
  const [start, end] = connectorAnchors(from, to);
  const points = useDerivedValue<ConnectorPoints>(
    () => ({ start, end, opacity: 1 }),
    [start.x, start.y, end.x, end.y],
  );
  const state = useLineState(info, points);
  const sx = from.x + from.width / 2 < to.x + to.width / 2 ? 1 : -1;
  const along = Math.abs(end.x - start.x) / 2;
  const across = Math.abs(end.y - start.y);
  const slot = useMemo<ConnectorSlot>(
    () => ({
      state,
      look,
      fit,
      sx,
      boxes: { from, to },
      reach: { along, across },
      animate,
    }),
    [state, look, fit, sx, from, to, along, across, animate],
  );
  return <ConnectorContext.Provider value={slot}>{render(slot.state)}</ConnectorContext.Provider>;
}

/** A line in the paged view, drawn your way: its points follow the cards as you swipe. */
export function MovingLine({
  from,
  to,
  fromHeight,
  toHeight,
  width,
  position,
  duration,
  info,
}: Omit<MovingConnectorProps, 'look'> & { info: LineInfo }): ReactNode {
  const { look, fit, animate, render } = info;
  const sx = runsForward(from, to) ? 1 : -1;
  const ends = useMemo<Ends>(
    () => ({ from, to, fromHeight, toHeight }),
    [from, to, fromHeight, toHeight],
  );
  const moved = useGlide(
    ends,
    (shown) => [
      frameAt(shown.from, position.value)[1] ?? 0,
      shown.fromHeight,
      frameAt(shown.to, position.value)[1] ?? 0,
      shown.toHeight,
    ],
    duration,
  );
  const points = useDerivedValue<ConnectorPoints>(() => {
    const [x1, y1, o1] = frameAt(from, position.value);
    const [x2, y2, o2] = frameAt(to, position.value);
    const [dy1 = 0, dh1 = 0, dy2 = 0, dh2 = 0] = moved.value;
    const [start, end] = connectorAnchors(
      { x: x1, y: y1 + dy1, width, height: fromHeight + dh1 },
      { x: x2, y: y2 + dy2, width, height: toHeight + dh2 },
    );
    return { start, end, opacity: Math.min(o1, o2) };
  });
  // Pages are placed on straight lines between them, so a line is longest on one of the pages.
  const longest = { along: 0, across: 0 };
  for (let page = 0; page < from.length / 3; page++) {
    const dx = (to[page * 3] ?? 0) - (from[page * 3] ?? 0);
    const dy = (to[page * 3 + 1] ?? 0) + toHeight / 2 - (from[page * 3 + 1] ?? 0) - fromHeight / 2;
    longest.along = Math.max(longest.along, Math.abs(Math.abs(dx) - width) / 2);
    longest.across = Math.max(longest.across, Math.abs(dy));
  }
  // A card opening or closing glides its line from where it was, which may be further.
  const reach = useLongest(longest);
  const state = useLineState(info, points);
  const slot = useMemo<ConnectorSlot>(
    () => ({ state, look, fit, sx, boxes: null, reach, animate }),
    [state, look, fit, sx, reach, animate],
  );
  return <ConnectorContext.Provider value={slot}>{render(slot.state)}</ConnectorContext.Provider>;
}

/** The state `renderConnector` gets, the same object while nothing in it changed. */
function useLineState(info: LineInfo, points: SharedValue<ConnectorPoints>): ConnectorState {
  const { from, to, slot, status, bye, highlighted } = info;
  return useMemo(
    () => ({ from, to, slot, status, bye, highlighted, points }),
    [from, to, slot, status, bye, highlighted, points],
  );
}

/** The longest seen so far, kept the same object until it grows. */
function useLongest(next: { along: number; across: number }) {
  const kept = useRef(next);
  if (next.along > kept.current.along || next.across > kept.current.across) {
    kept.current = {
      along: Math.max(next.along, kept.current.along),
      across: Math.max(next.across, kept.current.across),
    };
  }
  return kept.current;
}

/** Props of `Bracket.Connector`. */
export interface ConnectorProps {
  /** The line's colour, width and turns, or a function of its state that returns them. */
  style?: StyleOf<ConnectorState, ConnectorStyle>;
  /**
   * Breaks the line into dashes or dots: `dashed`, `dotted`, or `[dash, gap]` in points, where
   * a dash of `0` draws round dots. The pattern runs on unbroken through the turns.
   */
  dash?: ConnectorDash;
  /** Draws an arrowhead where the line enters the next match. A number sets its length in points. */
  arrow?: boolean | number;
  /**
   * Moves a dashed or dotted line's pattern along it, from one match to the next. A number sets
   * the speed in points per second, negative to run backwards. Still when motion is off or reduced.
   */
  flow?: boolean | number;
}

/** The speed `flow: true` moves at, in points per second. */
const FLOW = 24;

/**
 * One line between two matches, in the bracket's look. Return it from `renderConnector` to
 * colour, dash or point a line, and decide each line's look from its state.
 */
export function ConnectorPart({ style, dash, arrow, flow }: ConnectorProps): ReactNode {
  const slot = useSlot();
  const own = (StyleSheet.flatten(resolveStyle(style, slot.state)) ?? {}) as ConnectorStyle;
  const look = slot.fit({
    color: own.color ?? slot.look.color,
    width: own.width ?? slot.look.width,
    radius: own.radius ?? slot.look.radius,
  });
  const pattern = dashPattern(dash, look.width);
  const head =
    arrow === true ? Math.round(Math.max(7, 4 * look.width)) : arrow ? Math.max(0, arrow) : 0;
  const speed = pattern && slot.animate ? (flow === true ? FLOW : flow || 0) : 0;
  if (!pattern && !head && slot.boxes) {
    return <StaticConnector from={slot.boxes.from} to={slot.boxes.to} look={look} />;
  }
  return <DrawnConnector slot={slot} look={look} pattern={pattern} head={head} speed={speed} />;
}

/** A line with dashes, an arrowhead or both, or a solid line that moves. */
function DrawnConnector({
  slot,
  look,
  pattern,
  head,
  speed,
}: {
  slot: ConnectorSlot;
  look: LineLook;
  pattern: DashPattern | null;
  head: number;
  speed: number;
}): ReactNode {
  const { points } = slot.state;
  const { sx } = slot;
  const { radius, width } = look;
  // The line stops short of an arrowhead's tip, which is narrower than the line.
  const cut = head * 0.6;
  const state = useDerivedValue<PiecesState>(() => {
    const { start, end, opacity } = points.value;
    const pieces = piecesBetween(start, end, sx, radius, width);
    if (cut > 0) {
      const [x, y, length] = pieces.into;
      const kept = Math.max(0, length - cut);
      pieces.into = [sx > 0 ? x : x + length - kept, y, kept];
    }
    return { pieces, opacity };
  }, [points, sx, radius, width, cut]);

  // How far the pattern has moved along the line.
  const clock = useSharedValue(0);
  const period = pattern?.period ?? 0;
  useEffect(() => {
    cancelAnimation(clock);
    clock.value = 0;
    if (!speed || !period) return;
    clock.value = withRepeat(
      withTiming(Math.sign(speed) * period, {
        duration: (period / Math.abs(speed)) * 1000,
        easing: Easing.linear,
      }),
      -1,
    );
    return () => cancelAnimation(clock);
  }, [clock, speed, period]);

  const lines = pattern ? (
    <DashedPieces
      state={state}
      look={look}
      pattern={pattern}
      sx={sx}
      reach={slot.reach}
      clock={clock}
    />
  ) : slot.boxes ? (
    <StaticConnector from={slot.boxes.from} to={slot.boxes.to} look={look} />
  ) : (
    <MovingPieces state={state} look={look} sx={sx} />
  );
  return (
    <>
      {lines}
      {head > 0 && <Arrow points={points} size={head} look={look} sx={sx} />}
    </>
  );
}

function DashedPieces({
  state,
  look,
  pattern,
  sx,
  reach,
  clock,
}: {
  state: SharedValue<PiecesState>;
  look: LineLook;
  pattern: DashPattern;
  sx: 1 | -1;
  reach: { along: number; across: number };
  clock: SharedValue<number>;
}): ReactNode {
  const common = { state, look, pattern, clock };
  // Room for the line's own width at each end, and a pixel to spare.
  const along = Math.ceil(reach.along + look.width + 1);
  const across = Math.ceil(reach.across + look.width + 1);
  return (
    <>
      <DashStrip {...common} piece="out" axis="x" reach={along} />
      <DashStrip {...common} piece="across" axis="y" reach={across} />
      <DashStrip {...common} piece="into" axis="x" reach={along} />
      {look.radius > 0 && (
        <>
          <DashedTurn {...common} piece="turnOut" down corner={turnOut(sx, 1)} />
          <DashedTurn {...common} piece="turnOut" down={false} corner={turnOut(sx, -1)} />
          <DashedTurn {...common} piece="turnIn" down corner={turnIn(sx, 1)} />
          <DashedTurn {...common} piece="turnIn" down={false} corner={turnIn(sx, -1)} />
        </>
      )}
    </>
  );
}

/**
 * A straight piece of a dashed line. A strip of dashes, laid once, slides behind two windows: one
 * starts where the piece starts, the other ends where it ends, so only the piece shows. Every
 * part moves by transforms alone, like the solid line, so it keeps up with the cards.
 */
function DashStrip({
  state,
  piece,
  axis,
  reach,
  look,
  pattern,
  clock,
}: {
  state: SharedValue<PiecesState>;
  piece: 'out' | 'across' | 'into';
  axis: 'x' | 'y';
  reach: number;
  look: LineLook;
  pattern: DashPattern;
  clock: SharedValue<number>;
}): ReactNode {
  const { radius, width } = look;
  const shift = (value: number) => {
    'worklet';
    return axis === 'x' ? { translateX: value } : { translateY: value };
  };
  const placed = useAnimatedStyle(() => {
    const [x, y, length] = state.value.pieces[piece];
    return {
      opacity: length > 0 ? state.value.opacity : 0,
      transform: [{ translateX: x }, { translateY: y }],
    };
  });
  const end = useAnimatedStyle(() => {
    const length = Math.min(state.value.pieces[piece][2], reach);
    return { transform: [shift(length - reach)] };
  });
  const strip = useAnimatedStyle(() => {
    const { pieces } = state.value;
    const length = Math.min(pieces[piece][2], reach);
    const travel = piece === 'across' ? pieces.sy : pieces.sx;
    const phase = dashStarts(pieces, radius, width)[piece] - clock.value;
    // The strip's start, from the end window's own start.
    return { transform: [shift(reach - length - stripShift(phase, length, travel, pattern))] };
  });
  const size = (length: number) =>
    axis === 'x' ? { width: length, height: width } : { width, height: length };
  const count = Math.ceil(reach / pattern.period) + 2;
  return (
    <Animated.View
      pointerEvents="none"
      style={[origin, size(reach), { overflow: 'hidden' }, placed]}
    >
      <Animated.View style={[origin, size(reach), { overflow: 'hidden' }, end]}>
        <Animated.View style={[origin, size(reach + 2 * pattern.period), strip]}>
          {Array.from({ length: count }, (_, index) => {
            const at = index * pattern.period - (pattern.dots ? width / 2 : 0);
            const length = pattern.dots ? width : pattern.dash;
            return (
              <View
                // biome-ignore lint/suspicious/noArrayIndexKey: dashes are the same and never move in the strip
                key={index}
                style={[
                  origin,
                  axis === 'x' ? { left: at } : { top: at },
                  size(length),
                  { backgroundColor: look.color },
                  pattern.dots && { borderRadius: width / 2 },
                ]}
              />
            );
          })}
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

/** Where a turn's line enters its circle, and which way round it goes: the angles of its two ends. */
function turnPath(corner: Corner, piece: 'turnOut' | 'turnIn'): { entry: number; way: 1 | -1 } {
  // The line runs level where it meets the top or bottom of the circle, and upright at its sides.
  const level = corner[0] === 't' ? -Math.PI / 2 : Math.PI / 2;
  const upright = corner[1] === 'r' ? 0 : Math.PI;
  const [entry, exit] = piece === 'turnOut' ? [level, upright] : [upright, level];
  const sweep = Math.atan2(Math.sin(exit - entry), Math.cos(exit - entry));
  return { entry, way: sweep > 0 ? 1 : -1 };
}

/**
 * A dashed turn: dashes laid round a quarter of a circle, rotated to carry on the line's pattern,
 * and clipped to the quarter like a solid turn.
 */
function DashedTurn({
  state,
  piece,
  down,
  look,
  corner,
  pattern,
  clock,
}: {
  state: SharedValue<PiecesState>;
  piece: 'turnOut' | 'turnIn';
  down: boolean;
  look: LineLook;
  corner: Corner;
  pattern: DashPattern;
  clock: SharedValue<number>;
}): ReactNode {
  const { radius, width } = look;
  const arc = Math.max(0, radius - width / 2);
  const { entry, way } = turnPath(corner, piece);
  const dashes = useMemo(
    () => arcDashes(radius, radius, arc, entry, way, pattern),
    [radius, arc, entry, way, pattern],
  );
  const placed = useAnimatedStyle(() => {
    const [x, y, scale] = state.value.pieces[piece];
    const shown = state.value.pieces.sy > 0 === down && scale > 0;
    return {
      opacity: shown ? state.value.opacity : 0,
      transform: [{ translateX: x }, { translateY: y }, { scale }],
    };
  });
  const turned = useAnimatedStyle(() => {
    const { pieces } = state.value;
    const scale = pieces[piece][2];
    if (scale <= 0 || arc <= 0) return { transform: [{ rotate: '0rad' }] };
    // Back by how far into a period the line is where it enters, in the turn's own unscaled size.
    const back = wrap(dashStarts(pieces, radius, width)[piece] - clock.value, pattern.period);
    return { transform: [{ rotate: `${(-way * back) / scale / arc}rad` }] };
  });
  return (
    <Animated.View pointerEvents="none" style={[cornerBox(radius), placed]}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: corner[1] === 'r' ? -radius : 0,
            top: corner[0] === 't' ? 0 : -radius,
            width: radius * 2,
            height: radius * 2,
          },
          turned,
        ]}
      >
        {dashes.map((dash, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: dashes are the same and never move in the turn
          <View key={index} style={arcDashStyle(dash, look, pattern)} />
        ))}
      </Animated.View>
    </Animated.View>
  );
}

function arcDashStyle(dash: ArcDash, look: LineLook, pattern: DashPattern): ViewStyle {
  const length = pattern.dots ? look.width : dash.length;
  return {
    position: 'absolute',
    left: dash.x - length / 2,
    top: dash.y - look.width / 2,
    width: length,
    height: look.width,
    backgroundColor: look.color,
    borderRadius: pattern.dots ? look.width / 2 : 0,
    transform: [{ rotate: `${dash.angle}rad` }],
  };
}

/** An arrowhead whose tip sits where the line enters the next match. */
function Arrow({
  points,
  size,
  look,
  sx,
}: {
  points: SharedValue<ConnectorPoints>;
  size: number;
  look: LineLook;
  sx: 1 | -1;
}): ReactNode {
  const placed = useAnimatedStyle(() => {
    const { end, opacity } = points.value;
    return {
      opacity,
      transform: [{ translateX: sx > 0 ? end.x - size : end.x }, { translateY: end.y - size / 2 }],
    };
  });
  // A triangle from borders: the side it points away from is coloured, the two beside it clear.
  const head: ViewStyle = {
    width: 0,
    height: 0,
    borderTopWidth: size / 2,
    borderBottomWidth: size / 2,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    ...(sx > 0
      ? { borderLeftWidth: size, borderLeftColor: look.color }
      : { borderRightWidth: size, borderRightColor: look.color }),
  };
  return <Animated.View pointerEvents="none" style={[origin, head, placed]} />;
}

/** What `renderConnector` is told about a line, besides where it runs. */
export function lineState(
  edge: { from: string; to: string; slot: SlotIndex },
  matches: ReadonlyMap<string, Match>,
  highlighted: boolean,
): Omit<ConnectorState, 'points'> | null {
  const from = matches.get(edge.from);
  const to = matches.get(edge.to);
  if (!from || !to) return null;
  return {
    from,
    to,
    slot: edge.slot,
    status: from.status,
    bye: from.slots.some((slot) => slot.bye === true),
    highlighted,
  };
}

/** Lines drawn your way share a layer as big as the bracket, so an `Svg` can fill it. */
export function LineLayer({
  width,
  height,
  children,
}: {
  width: number;
  height: number;
  children: ReactNode;
}): ReactNode {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width, height }}>
      {children}
    </View>
  );
}
