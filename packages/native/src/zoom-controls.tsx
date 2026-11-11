import { type ReactNode, useState } from 'react';
import {
  StyleSheet,
  Text,
  type TextStyle,
  View,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { useAnimatedReaction } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { resolveStyle, type StyleOf, useBracket, useZoom } from './context';

/** What `Bracket.ZoomControls` passes to a `style` function. */
export interface ZoomControlsState {
  canZoomIn: boolean;
  canZoomOut: boolean;
  /** `false` while already where reset goes. */
  canReset: boolean;
}

export interface ZoomControlsProps extends Omit<ViewProps, 'style'> {
  /** A style, or a function of what the buttons can do. */
  style?: StyleOf<ZoomControlsState, ViewStyle>;
  /** Your own buttons in place of zoom out, the zoom level, zoom in and fit. */
  children?: ReactNode;
}

const SIZE = 36;

/**
 * The zoom buttons. Inside `Bracket.Root` they work anywhere, in the frame or outside it,
 * and draw nothing while the tree isn't panned and zoomed.
 */
export function ZoomControls({ style: styleOf, children, ...props }: ZoomControlsProps): ReactNode {
  const zoom = useZoom();
  const { theme } = useBracket();
  if (!zoom) return null;
  const { canZoomIn, canZoomOut, canReset } = zoom;
  const style = resolveStyle(styleOf, { canZoomIn, canZoomOut, canReset });
  if (children !== undefined) {
    return (
      <View accessibilityRole="toolbar" {...props} style={[{ flexDirection: 'row' }, style]}>
        {children}
      </View>
    );
  }
  const divider = (
    <View
      style={{
        width: StyleSheet.hairlineWidth,
        alignSelf: 'stretch',
        backgroundColor: theme.colors.border,
      }}
    />
  );
  return (
    <View
      accessibilityRole="toolbar"
      {...props}
      style={[{ flexDirection: 'row', alignItems: 'center', gap: 8 }, style]}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: SIZE / 2,
          backgroundColor: theme.colors.surface,
        }}
      >
        <ZoomOut />
        {divider}
        <ZoomLevel style={{ minWidth: 52, paddingHorizontal: 6, textAlign: 'center' }} />
        {divider}
        <ZoomIn />
      </View>
      <ZoomReset
        style={{
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: SIZE / 2,
        }}
      />
    </View>
  );
}

export interface ZoomLevelState {
  scale: number;
  /** The zoom as a whole percentage. */
  percent: number;
}

export interface ZoomLevelProps {
  /** A style for the default text, or a function of the zoom level. */
  style?: StyleOf<ZoomLevelState, TextStyle>;
  /** Renders your own from the zoom level, in place of the percentage. */
  children?: (state: ZoomLevelState) => ReactNode;
}

/** The current zoom as a percentage. It updates as a pinch passes each whole percent. */
export function ZoomLevel({ style, children }: ZoomLevelProps): ReactNode {
  const zoom = useZoom();
  const { theme } = useBracket();
  const [level, setLevel] = useState<ZoomLevelState>({ scale: 1, percent: 100 });
  const scale = zoom?.scale;
  useAnimatedReaction(
    () => (scale ? Math.round(scale.value * 100) : 100),
    (percent, previous) => {
      if (scale && percent !== previous) scheduleOnRN(setLevel, { scale: scale.value, percent });
    },
    [scale],
  );
  if (!zoom) return null;
  if (children) return children(level);
  return (
    <Text
      style={[
        {
          color: theme.colors.text,
          fontFamily: theme.fontFamily,
          fontSize: theme.titleFontSize + 1,
          fontWeight: '500',
          fontVariant: ['tabular-nums'],
        },
        resolveStyle(style, level),
      ]}
    >
      {level.percent}%
    </Text>
  );
}

export interface ZoomButtonState {
  /** `true` where the button would do nothing: at a limit, or already fitted. */
  disabled: boolean;
  pressed: boolean;
}

export interface ZoomButtonProps {
  /** A style, or a function of the button's state. */
  style?: StyleOf<ZoomButtonState, ViewStyle>;
  /** Replaces the icon, or renders from the button's state. */
  children?: ReactNode | ((state: ZoomButtonState) => ReactNode);
}

/** Zooms in on the middle by `zoom.step`. */
export function ZoomIn(props: ZoomButtonProps): ReactNode {
  const zoom = useZoom();
  const { labels } = useBracket();
  return (
    zoom && (
      <ZoomButton
        {...props}
        icon="in"
        label={labels.zoomIn}
        disabled={!zoom.canZoomIn}
        onPress={() => zoom.zoomIn()}
      />
    )
  );
}

/** Zooms out from the middle by `zoom.step`. */
export function ZoomOut(props: ZoomButtonProps): ReactNode {
  const zoom = useZoom();
  const { labels } = useBracket();
  return (
    zoom && (
      <ZoomButton
        {...props}
        icon="out"
        label={labels.zoomOut}
        disabled={!zoom.canZoomOut}
        onPress={() => zoom.zoomOut()}
      />
    )
  );
}

/** Back to where pan-zoom started: fitted, unless `zoom.initial` says otherwise. */
export function ZoomReset(props: ZoomButtonProps): ReactNode {
  const zoom = useZoom();
  const { labels } = useBracket();
  return (
    zoom && (
      <ZoomButton
        {...props}
        icon="fit"
        label={labels.zoomReset}
        disabled={!zoom.canReset}
        onPress={zoom.reset}
      />
    )
  );
}

function ZoomButton({
  icon,
  label,
  disabled,
  onPress,
  style,
  children,
}: ZoomButtonProps & {
  icon: Icon;
  label: string;
  disabled: boolean;
  onPress: () => void;
}): ReactNode {
  const { theme } = useBracket();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        {
          width: SIZE,
          height: SIZE,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: pressed ? theme.colors.surfacePressed : theme.colors.surface,
        },
        resolveStyle(style, { disabled, pressed }),
      ]}
    >
      {({ pressed }) =>
        typeof children === 'function'
          ? children({ disabled, pressed })
          : (children ?? (
              <ZoomIcon
                icon={icon}
                color={disabled ? theme.colors.textMuted : theme.colors.text}
                faded={disabled}
              />
            ))
      }
    </Pressable>
  );
}

type Icon = 'in' | 'out' | 'fit';

const ICON = 14;
const STROKE = 1.75;

/** Drawn rather than typed, so every icon is the same size and sits in the middle on every platform. */
function ZoomIcon({
  icon,
  color,
  faded,
}: {
  icon: Icon;
  color: string;
  faded: boolean;
}): ReactNode {
  const bar: ViewStyle = { position: 'absolute', backgroundColor: color, borderRadius: STROKE / 2 };
  const middle = (ICON - STROKE) / 2;
  const corner = (edges: ViewStyle): ReactNode => (
    <View
      style={{
        position: 'absolute',
        width: 5,
        height: 5,
        borderColor: color,
        ...edges,
      }}
    />
  );
  return (
    <View style={{ width: ICON, height: ICON, opacity: faded ? 0.5 : 1 }}>
      {icon !== 'fit' && <View style={[bar, { left: 0, right: 0, top: middle, height: STROKE }]} />}
      {icon === 'in' && <View style={[bar, { top: 0, bottom: 0, left: middle, width: STROKE }]} />}
      {icon === 'fit' && (
        <>
          {corner({
            left: 0,
            top: 0,
            borderLeftWidth: STROKE,
            borderTopWidth: STROKE,
            borderTopLeftRadius: 1.5,
          })}
          {corner({
            right: 0,
            top: 0,
            borderRightWidth: STROKE,
            borderTopWidth: STROKE,
            borderTopRightRadius: 1.5,
          })}
          {corner({
            left: 0,
            bottom: 0,
            borderLeftWidth: STROKE,
            borderBottomWidth: STROKE,
            borderBottomLeftRadius: 1.5,
          })}
          {corner({
            right: 0,
            bottom: 0,
            borderRightWidth: STROKE,
            borderBottomWidth: STROKE,
            borderBottomRightRadius: 1.5,
          })}
        </>
      )}
    </View>
  );
}
