/**
 * Renders the native parts in happy-dom. React Native, Reanimated, Gesture Handler and Worklets are
 * stood in for by plain elements: a style is written to `data-style`, layouts report a fixed size,
 * animations land at once, and animated styles are worked out on every render.
 */
import { mock } from 'bun:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';
import { createElement, type ReactNode, useLayoutEffect, useRef, useState } from 'react';

GlobalRegistrator.register();

type Props = Record<string, unknown> & { children?: ReactNode };

/** The size every view reports from `onLayout`. Tests change `width` to get the paged view or not. */
export const layout = { width: 360, height: 40 };

/** The last gestures the bracket made, so tests can drive a swipe. */
export const gestures: { pan?: Record<string, (event?: unknown) => void> } = {};

const flatten = (style: unknown): Record<string, unknown> =>
  Array.isArray(style)
    ? Object.assign({}, ...style.map(flatten))
    : style && typeof style === 'object'
      ? (style as Record<string, unknown>)
      : {};

/** Reports the layout size once, when it mounts, like a first layout pass. */
function useLayout(onLayout: unknown) {
  // biome-ignore lint/correctness/useExhaustiveDependencies: a layout is reported once
  useLayoutEffect(() => {
    (onLayout as ((event: unknown) => void) | undefined)?.({
      nativeEvent: { layout: { x: 0, y: 0, ...layout } },
    });
  }, []);
}

function Host({
  tag,
  name,
  style,
  children,
  onLayout,
  accessibilityRole,
  accessibilityLabel,
}: Props & { tag: string; name: string }) {
  useLayout(onLayout);
  return createElement(
    tag,
    {
      'data-name': name,
      'data-style': JSON.stringify(flatten(style)),
      role: accessibilityRole as string | undefined,
      'aria-label': accessibilityLabel as string | undefined,
    },
    children,
  );
}

const View = (props: Props) => <Host {...props} tag="div" name="View" />;
const Text = (props: Props) => <Host {...props} tag="span" name="Text" />;
const ScrollView = (props: Props) => <Host {...props} tag="div" name="ScrollView" />;
const GestureDetector = ({ children }: Props) => children;

function Pressable({ style, children, onPress, onLayout, disabled, ...props }: Props) {
  const [pressed, setPressed] = useState(false);
  useLayout(onLayout);
  const state = { pressed };
  return createElement(
    'button',
    {
      type: 'button',
      'data-name': 'Pressable',
      'data-style': JSON.stringify(
        flatten(typeof style === 'function' ? (style as (s: unknown) => unknown)(state) : style),
      ),
      role: props.accessibilityRole as string | undefined,
      'aria-label': props.accessibilityLabel as string | undefined,
      disabled: disabled === true,
      onClick: () => (onPress as (() => void) | undefined)?.(),
      onMouseDown: () => setPressed(true),
      onMouseUp: () => setPressed(false),
    },
    typeof children === 'function' ? (children as (s: unknown) => ReactNode)(state) : children,
  );
}

const StyleSheet = {
  hairlineWidth: 1,
  absoluteFill: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  absoluteFillObject: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  flatten,
};

mock.module('react-native', () => ({
  View,
  Text,
  ScrollView,
  StyleSheet,
  PixelRatio: { roundToNearestPixel: (value: number) => Math.round(value * 3) / 3, get: () => 3 },
  I18nManager: { isRTL: false },
  useColorScheme: () => 'light',
}));

const land = (to: unknown, _config?: unknown, done?: (finished: boolean) => void) => {
  done?.(true);
  return to;
};

const Animated = { View, createAnimatedComponent: (component: unknown) => component };

mock.module('react-native-reanimated', () => ({
  default: Animated,
  ...Animated,
  Easing: { bezier: () => (t: number) => t, linear: (t: number) => t },
  useSharedValue: <T,>(value: T) => useRef({ value }).current,
  useDerivedValue: <T,>(compute: () => T) => ({ value: compute() }),
  useAnimatedStyle: (compute: () => unknown) => compute(),
  useAnimatedProps: (compute: () => unknown) => compute(),
  useAnimatedReaction: () => {},
  useReducedMotion: () => false,
  cancelAnimation: () => {},
  withTiming: land,
  withSpring: land,
  withDecay: () => 0,
  withRepeat: (animation: unknown) => animation,
}));

mock.module('react-native-gesture-handler', () => ({
  GestureDetector,
  ScrollView,
  Pressable,
  usePanGesture: (config: Record<string, (event?: unknown) => void>) => {
    gestures.pan = config;
    return config;
  },
  usePinchGesture: () => ({}),
  useTapGesture: () => ({}),
  useSimultaneousGestures: () => ({}),
}));

mock.module('react-native-worklets', () => ({
  scheduleOnRN: (run: (...args: unknown[]) => void, ...args: unknown[]) => run(...args),
}));
