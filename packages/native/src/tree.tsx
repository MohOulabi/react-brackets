import type { GroupLayout, Match } from '@react-brackets/core';
import { type ComponentRef, type ReactNode, useMemo, useRef } from 'react';
import { Text, View } from 'react-native';
import {
  GestureDetector,
  Pressable,
  ScrollView,
  usePanGesture,
  usePinchGesture,
  useSimultaneousGestures,
  useTapGesture,
} from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDecay,
  withTiming,
} from 'react-native-reanimated';
import { StaticConnector } from './connectors';
import { type Metrics, mirrorTree, type TreeGeometry, treeGeometry } from './geometry';
import { edgeKey } from './paged';
import { RoundTitle } from './parts';
import type { BracketTheme } from './theme';

/** How the full tree fits its width. */
export type TreeMode = 'scroll' | 'fit' | 'pan-zoom';

export interface TreeProps {
  layout: GroupLayout;
  metrics: Metrics;
  width: number;
  mode: TreeMode;
  theme: BracketTheme;
  maxScale: number;
  duration: number | null;
  highlightedEdges: Set<string>;
  renderMatch: (match: Match) => ReactNode;
  rtl: boolean;
}

/** The whole bracket at once: scrolled sideways, scaled to fit, or panned and zoomed. */
export function TreeBracket({
  layout,
  metrics,
  width,
  mode,
  theme,
  maxScale,
  duration,
  highlightedEdges,
  renderMatch,
  rtl,
}: TreeProps): ReactNode {
  const { matchWidth, matchHeight, heights, matchGap, columnGap, titleHeight } = metrics;
  // biome-ignore lint/correctness/useExhaustiveDependencies: the metrics are listed value by value
  const geometry = useMemo(() => {
    const tree = treeGeometry(layout, metrics);
    return rtl ? mirrorTree(tree) : tree;
  }, [layout, rtl, matchWidth, matchHeight, heights, matchGap, columnGap, titleHeight]);
  const scroller = useRef<ComponentRef<typeof ScrollView>>(null);
  const content = (
    <Drawing
      geometry={geometry}
      theme={theme}
      highlightedEdges={highlightedEdges}
      renderMatch={renderMatch}
      rtl={rtl}
    />
  );
  const fit = Math.min(1, width / Math.max(1, geometry.width));

  if (mode === 'fit') {
    return (
      <View style={{ height: geometry.height * fit, overflow: 'hidden' }}>
        <View style={{ transform: [{ scale: fit }], transformOrigin: 'left top' }}>{content}</View>
      </View>
    );
  }
  if (mode === 'pan-zoom') {
    // The tree starts clear of the frame, and keeps that margin when fitted.
    const size = { width: geometry.width + 2 * INSET, height: geometry.height + 2 * INSET };
    return (
      <Zoomable
        size={size}
        width={width - 2 * FRAME}
        fit={Math.min(1, (width - 2 * FRAME) / size.width)}
        maxScale={maxScale}
        duration={duration}
        theme={theme}
      >
        <View style={{ padding: INSET }}>{content}</View>
      </Zoomable>
    );
  }
  return (
    <ScrollView
      ref={scroller}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ direction: 'ltr' }}
      // Read from right to left, the tree starts at its first round, on the right.
      onContentSizeChange={() => rtl && scroller.current?.scrollToEnd({ animated: false })}
    >
      {content}
    </ScrollView>
  );
}

function Drawing({
  geometry,
  theme,
  highlightedEdges,
  renderMatch,
  rtl,
}: {
  geometry: TreeGeometry;
  theme: BracketTheme;
  highlightedEdges: Set<string>;
  renderMatch: (match: Match) => ReactNode;
  rtl: boolean;
}): ReactNode {
  const flow = rtl ? 'rtl' : 'ltr';
  const matches = useMemo(() => {
    const byId = new Map<string, Match>();
    for (const title of geometry.titles) {
      for (const match of title.round.matches) byId.set(match.id, match);
    }
    return byId;
  }, [geometry]);
  // Highlighted lines are drawn last, so they run over the others where they cross.
  const edges = [...geometry.edges].sort(
    (a, b) => Number(highlightedEdges.has(edgeKey(a))) - Number(highlightedEdges.has(edgeKey(b))),
  );

  return (
    // Places are worked out left to right and mirrored for RTL, so this layer never flips them again.
    <View style={{ width: geometry.width, height: geometry.height, direction: 'ltr' }}>
      {edges.map((edge) => {
        const from = geometry.matches.get(edge.from);
        const to = geometry.matches.get(edge.to);
        if (!from || !to) return null;
        const lit = highlightedEdges.has(edgeKey(edge));
        return (
          <StaticConnector
            key={edgeKey(edge)}
            from={from}
            to={to}
            look={{
              radius: theme.connectorRadius,
              width: theme.lineWidth,
              color: lit ? theme.colors.accent : theme.colors.line,
            }}
          />
        );
      })}
      {geometry.titles.map((title) => (
        <View
          key={title.key}
          style={{
            position: 'absolute',
            left: title.x,
            top: 0,
            width: geometry.matchWidth,
            height: theme.titleHeight,
            justifyContent: 'center',
            direction: flow,
          }}
        >
          <RoundTitle round={title.round} />
        </View>
      ))}
      {[...geometry.matches].map(([id, box]) => {
        const match = matches.get(id);
        return (
          match && (
            <View
              key={id}
              style={{
                position: 'absolute',
                left: box.x,
                top: box.y,
                width: box.width,
                direction: flow,
              }}
            >
              {renderMatch(match)}
            </View>
          )
        );
      })}
    </View>
  );
}

const ZOOM_STEP = 1.5;
const INSET = 12;
/** The border around a zoomable tree. */
const FRAME = 1;

/** Pinch and drag the tree, with a double tap to zoom in or back out to fit. */
function Zoomable({
  size,
  width,
  fit,
  maxScale,
  duration,
  theme,
  children,
}: {
  size: { width: number; height: number };
  width: number;
  fit: number;
  maxScale: number;
  duration: number | null;
  theme: BracketTheme;
  children: ReactNode;
}): ReactNode {
  const height = size.height * fit;
  const scale = useSharedValue(fit);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const saved = useSharedValue({ scale: fit, x: 0, y: 0 });

  // The tree can't be dragged out of view: it stays against the edges, or centred when smaller.
  const bounds = (zoom: number) => {
    'worklet';
    const extraX = width - size.width * zoom;
    const extraY = height - size.height * zoom;
    return {
      minX: Math.min(0, extraX),
      maxX: Math.max(0, extraX),
      minY: Math.min(0, extraY),
      maxY: Math.max(0, extraY),
    };
  };
  const zoomTo = (zoom: number, focusX: number, focusY: number) => {
    'worklet';
    const next = Math.min(Math.max(zoom, fit), maxScale);
    const ratio = next / scale.value;
    const b = bounds(next);
    const nextX = Math.min(Math.max(focusX - (focusX - x.value) * ratio, b.minX), b.maxX);
    const nextY = Math.min(Math.max(focusY - (focusY - y.value) * ratio, b.minY), b.maxY);
    const timing = { duration: duration ?? 0 };
    scale.value = withTiming(next, timing);
    x.value = withTiming(nextX, timing);
    y.value = withTiming(nextY, timing);
  };

  const pinch = usePinchGesture({
    onActivate: () => {
      'worklet';
      saved.value = { scale: scale.value, x: x.value, y: y.value };
    },
    onUpdate: (event) => {
      'worklet';
      const zoom = Math.min(Math.max(saved.value.scale * event.scale, fit * 0.85), maxScale * 1.15);
      const ratio = zoom / saved.value.scale;
      scale.value = zoom;
      x.value = event.focalX - (event.focalX - saved.value.x) * ratio;
      y.value = event.focalY - (event.focalY - saved.value.y) * ratio;
    },
    onDeactivate: (event) => {
      'worklet';
      zoomTo(scale.value, event.focalX, event.focalY);
    },
  });
  const pan = usePanGesture({
    onActivate: () => {
      'worklet';
      cancelAnimation(x);
      cancelAnimation(y);
      saved.value = { scale: scale.value, x: x.value, y: y.value };
    },
    onUpdate: (event) => {
      'worklet';
      x.value = saved.value.x + event.translationX;
      y.value = saved.value.y + event.translationY;
    },
    onDeactivate: (event) => {
      'worklet';
      const b = bounds(scale.value);
      x.value = withDecay({
        velocity: event.velocityX,
        clamp: [b.minX, b.maxX],
        rubberBandEffect: true,
      });
      y.value = withDecay({
        velocity: event.velocityY,
        clamp: [b.minY, b.maxY],
        rubberBandEffect: true,
      });
    },
  });
  const doubleTap = useTapGesture({
    numberOfTaps: 2,
    onDeactivate: (event) => {
      'worklet';
      zoomTo(scale.value > fit * 1.05 ? fit : scale.value * 2, event.x, event.y);
    },
  });
  // Side by side rather than one waiting on another: a drag starts the moment the finger moves, instead
  // of after the double tap gives up, and before the page around it can take the touch to scroll.
  const gesture = useSimultaneousGestures(doubleTap, pinch, pan);

  const transform = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }, { scale: scale.value }],
  }));

  return (
    <View
      style={{
        height,
        overflow: 'hidden',
        borderWidth: FRAME,
        borderColor: theme.colors.border,
        borderRadius: theme.radius,
      }}
    >
      <GestureDetector gesture={gesture}>
        <Animated.View style={{ flex: 1 }}>
          <Animated.View style={[{ transformOrigin: 'left top' }, transform]}>
            {children}
          </Animated.View>
        </Animated.View>
      </GestureDetector>
      <ZoomControls
        theme={theme}
        onZoom={(by) => zoomTo(scale.value * by, width / 2, height / 2)}
        onReset={() => zoomTo(fit, 0, 0)}
        scale={scale}
      />
    </View>
  );
}

function ZoomControls({
  theme,
  onZoom,
  onReset,
}: {
  theme: BracketTheme;
  onZoom: (by: number) => void;
  onReset: () => void;
  scale: SharedValue<number>;
}): ReactNode {
  const button = (label: string, name: string, onPress: () => void) => (
    <Pressable
      key={name}
      accessibilityRole="button"
      accessibilityLabel={name}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => ({
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: pressed ? theme.colors.surfacePressed : theme.colors.surface,
      })}
    >
      <Text style={{ color: theme.colors.text, fontSize: 18 }}>{label}</Text>
    </Pressable>
  );
  return (
    <View
      style={{
        position: 'absolute',
        right: 10,
        bottom: 10,
        flexDirection: 'row',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radius - 2,
      }}
    >
      {button('−', 'Zoom out', () => onZoom(1 / ZOOM_STEP))}
      {button('⤢', 'Fit to view', onReset)}
      {button('+', 'Zoom in', () => onZoom(ZOOM_STEP))}
    </View>
  );
}
