import { memo, type NamedExoticComponent, type ReactNode, useMemo } from 'react';
import { View, type ViewStyle } from 'react-native';
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useDerivedValue,
} from 'react-native-reanimated';
import { type Box, type ConnectorPieces, connectorPieces, frameAt } from './geometry';
import { useGlide } from './glide';

/** Which corner of a square a turn rounds: top or bottom, then left or right. */
type Corner = 'tl' | 'tr' | 'bl' | 'br';

/** The turn from the line out of a match into the line across. */
const turnOut = (sx: number, sy: number): Corner =>
  sx > 0 ? (sy > 0 ? 'tr' : 'br') : sy > 0 ? 'tl' : 'bl';
/** The turn from the line across into the line into the next match. */
const turnIn = (sx: number, sy: number): Corner =>
  sx > 0 ? (sy > 0 ? 'bl' : 'tl') : sy > 0 ? 'br' : 'tr';

interface LineLook {
  radius: number;
  width: number;
  color: string;
}

const origin = { position: 'absolute', left: 0, top: 0, transformOrigin: 'left top' } as const;

/** A square with two borders meeting in one rounded corner. */
function cornerStyle(corner: Corner, size: number, { width, color }: LineLook): ViewStyle {
  const top = corner[0] === 't';
  const right = corner[1] === 'r';
  return {
    ...origin,
    width: size,
    height: size,
    borderColor: color,
    borderTopWidth: top ? width : 0,
    borderBottomWidth: top ? 0 : width,
    borderLeftWidth: right ? 0 : width,
    borderRightWidth: right ? width : 0,
    borderTopLeftRadius: corner === 'tl' ? size : 0,
    borderTopRightRadius: corner === 'tr' ? size : 0,
    borderBottomLeftRadius: corner === 'bl' ? size : 0,
    borderBottomRightRadius: corner === 'br' ? size : 0,
  };
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
              style={[
                cornerStyle(turnOut(sx, sy), turn, look),
                { left: pieces.turnOut[0], top: pieces.turnOut[1] },
              ]}
            />
            <View
              pointerEvents="none"
              style={[
                cornerStyle(turnIn(sx, sy), turn, look),
                { left: pieces.turnIn[0], top: pieces.turnIn[1] },
              ]}
            />
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
    const sx = (from[0] ?? 0) < (to[0] ?? 0) ? 1 : -1;
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
    const line = { ...origin, backgroundColor: look.color };
    return (
      <>
        <Stretched
          state={state}
          piece="out"
          axis="x"
          style={[line, { width: 1, height: look.width }]}
        />
        <Stretched
          state={state}
          piece="across"
          axis="y"
          style={[line, { width: look.width, height: 1 }]}
        />
        <Stretched
          state={state}
          piece="into"
          axis="x"
          style={[line, { width: 1, height: look.width }]}
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
  },
);

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
        axis === 'x' ? { scaleX: length } : { scaleY: length },
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
    <Animated.View
      pointerEvents="none"
      style={[cornerStyle(corner, look.radius, look), animated]}
    />
  );
}
