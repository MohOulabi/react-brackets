import type { GroupLayout, Match } from '@react-brackets/core';
import {
  type ComponentRef,
  type ReactNode,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react';
import { View } from 'react-native';
import {
  GestureDetector,
  ScrollView,
  usePanGesture,
  usePinchGesture,
  useSimultaneousGestures,
  useTapGesture,
} from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDecay,
  withTiming,
} from 'react-native-reanimated';
import { Card } from './card';
import { LineLayer, type LineLook, lineState, StaticConnector, StaticLine } from './connectors';
import { useBracket, useRoot, ZoomContext, type ZoomStore } from './context';
import { type Metrics, mirrorTree, type TreeGeometry, treeGeometry } from './geometry';
import { clamp, doubleTapScale } from './motion';
import { edgeKey } from './paged';
import { RoundTitle } from './parts';
import type { BracketTheme } from './theme';
import { ZoomControls } from './zoom-controls';

/** How the full tree fits its width. */
export type TreeMode = 'scroll' | 'fit' | 'pan-zoom';

export interface TreeProps {
  layout: GroupLayout;
  metrics: Metrics;
  width: number;
  mode: TreeMode;
  theme: BracketTheme;
  highlightedEdges: Set<string>;
  renderMatch: (match: Match) => ReactNode;
  rtl: boolean;
  /** The zoom controls in the pan-zoom frame: the default ones, your own, or none. */
  controls: boolean | ReactNode;
}

/** The whole bracket at once: scrolled sideways, scaled to fit, or panned and zoomed. */
export function TreeBracket({
  layout,
  metrics,
  width,
  mode,
  theme,
  highlightedEdges,
  renderMatch,
  rtl,
  controls,
}: TreeProps): ReactNode {
  const { matchWidth, matchHeight, heights, matchGap, columnGap, titleHeight } = metrics;
  // biome-ignore lint/correctness/useExhaustiveDependencies: the metrics are listed value by value
  const geometry = useMemo(() => {
    const tree = treeGeometry(layout, metrics);
    return rtl ? mirrorTree(tree) : tree;
  }, [layout, rtl, matchWidth, matchHeight, heights, matchGap, columnGap, titleHeight]);
  const scroller = useRef<ComponentRef<typeof ScrollView>>(null);
  const store = useContext(ZoomContext);
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
  if (mode === 'pan-zoom' && store) {
    // The tree starts clear of the frame, and keeps that margin when fitted.
    const size = { width: geometry.width + 2 * INSET, height: geometry.height + 2 * INSET };
    return (
      <Zoomable
        size={size}
        width={width - 2 * FRAME}
        fit={Math.min(1, (width - 2 * FRAME) / size.width)}
        store={store}
        theme={theme}
        controls={
          controls === true ? (
            <ZoomControls style={{ position: 'absolute', right: 10, bottom: 10 }} />
          ) : (
            controls || null
          )
        }
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
  const { renderConnector } = useBracket();
  const { duration } = useRoot('Viewport');
  const look = useMemo<LineLook>(
    () => ({ radius: theme.connectorRadius, width: theme.lineWidth, color: theme.colors.line }),
    [theme.connectorRadius, theme.lineWidth, theme.colors.line],
  );
  const lit = useMemo(() => ({ ...look, color: theme.colors.accent }), [look, theme.colors.accent]);

  const lines = edges.map((edge) => {
    const from = geometry.matches.get(edge.from);
    const to = geometry.matches.get(edge.to);
    if (!from || !to) return null;
    const highlighted = highlightedEdges.has(edgeKey(edge));
    if (renderConnector) {
      const state = lineState(edge, matches, highlighted);
      return (
        state && (
          <StaticLine
            key={edgeKey(edge)}
            from={from}
            to={to}
            info={{
              ...state,
              look: highlighted ? lit : look,
              fit: asIs,
              animate: duration !== null,
              render: renderConnector,
            }}
          />
        )
      );
    }
    return (
      <StaticConnector key={edgeKey(edge)} from={from} to={to} look={highlighted ? lit : look} />
    );
  });

  return (
    // Places are worked out left to right and mirrored for RTL, so this layer never flips them again.
    <View style={{ width: geometry.width, height: geometry.height, direction: 'ltr' }}>
      {renderConnector ? (
        <LineLayer width={geometry.width} height={geometry.height}>
          {lines}
        </LineLayer>
      ) : (
        lines
      )}
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
              <Card match={match} draw={renderMatch} />
            </View>
          )
        );
      })}
    </View>
  );
}

/** The full tree draws lines at the sizes they are given. */
const asIs = (look: LineLook): LineLook => look;

const INSET = 12;
/** The border around a zoomable tree. */
const FRAME = 1;

/**
 * Pinch and drag the tree, with a double tap to zoom in or back out to fit. The transform
 * lives in the root's zoom store, so controls and `useZoom` anywhere in the root can drive it.
 */
function Zoomable({
  size,
  width,
  fit,
  store,
  theme,
  controls,
  children,
}: {
  size: { width: number; height: number };
  width: number;
  fit: number;
  store: ZoomStore;
  theme: BracketTheme;
  controls: ReactNode;
  children: ReactNode;
}): ReactNode {
  const height = size.height * fit;
  const { scale, x, y, options, limits, register, bounds, zoomTo } = store;
  const { overshoot, elasticity, deceleration, doubleTap: tap } = options;
  const saved = useSharedValue({ scale: fit, x: 0, y: 0 });

  const { width: contentWidth, height: contentHeight } = size;
  useLayoutEffect(() => {
    register({ width, height, content: { width: contentWidth, height: contentHeight }, fit });
  }, [register, width, height, contentWidth, contentHeight, fit]);
  useLayoutEffect(() => () => register(null), [register]);

  const pinch = usePinchGesture({
    enabled: options.pinch,
    onActivate: () => {
      'worklet';
      saved.value = { scale: scale.value, x: x.value, y: y.value };
    },
    onUpdate: (event) => {
      'worklet';
      const zoom = clamp(
        saved.value.scale * event.scale,
        limits.min * (1 - overshoot),
        limits.max * (1 + overshoot),
      );
      const ratio = zoom / saved.value.scale;
      scale.value = zoom;
      x.value = event.focalX - (event.focalX - saved.value.x) * ratio;
      y.value = event.focalY - (event.focalY - saved.value.y) * ratio;
    },
    onDeactivate: (event) => {
      'worklet';
      zoomTo(scale.value, { x: event.focalX, y: event.focalY });
    },
  });
  const pan = usePanGesture({
    enabled: options.pan,
    onActivate: () => {
      'worklet';
      cancelAnimation(x);
      cancelAnimation(y);
      saved.value = { scale: scale.value, x: x.value, y: y.value };
    },
    onUpdate: (event) => {
      'worklet';
      const b = bounds(scale.value);
      const toX = saved.value.x + event.translationX;
      const toY = saved.value.y + event.translationY;
      // With no give at the edges, the tree stops at them under the finger too.
      x.value = elasticity > 0 ? toX : clamp(toX, b.minX, b.maxX);
      y.value = elasticity > 0 ? toY : clamp(toY, b.minY, b.maxY);
    },
    onDeactivate: (event) => {
      'worklet';
      const b = bounds(scale.value);
      if (deceleration === null) {
        x.value = withTiming(clamp(x.value, b.minX, b.maxX), { duration: options.duration });
        y.value = withTiming(clamp(y.value, b.minY, b.maxY), { duration: options.duration });
        return;
      }
      const decay = {
        deceleration,
        rubberBandEffect: elasticity > 0,
        rubberBandFactor: elasticity,
      };
      x.value = withDecay({ ...decay, velocity: event.velocityX, clamp: [b.minX, b.maxX] });
      y.value = withDecay({ ...decay, velocity: event.velocityY, clamp: [b.minY, b.maxY] });
    },
  });
  const doubleTap = useTapGesture({
    enabled: tap !== false,
    numberOfTaps: 2,
    onDeactivate: (event) => {
      'worklet';
      if (tap === false) return;
      zoomTo(doubleTapScale(scale.value, fit, limits, tap), { x: event.x, y: event.y });
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
      {controls}
    </View>
  );
}
