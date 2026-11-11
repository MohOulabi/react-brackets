import {
  Bracket,
  reportResult,
  type Stage,
  singleElimination,
  usePagination,
  useZoom,
} from '@react-brackets/native';
import type { ReactNode } from 'react';
import { Pressable, Text, useColorScheme, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

const teams = ['Falcons', 'Wolves', 'Herons', 'Lynx', 'Orcas', 'Ravens', 'Bison', 'Cobras'];

const stage = Array.from({ length: 4 }, (_, index) => `main.r1.m${index + 1}`).reduce<Stage>(
  (current, match, index) => reportResult(current, match, { scores: index % 3 ? [2, 1] : [0, 2] }),
  singleElimination(teams.map((name) => ({ id: name, name }))),
);

const blue = '#2563eb';

export default function CustomControls(): ReactNode {
  return (
    <View style={{ gap: 28 }}>
      {/* Round by round, with pills that stretch under the finger as you swipe. */}
      <Bracket.Root stage={stage}>
        <Bracket.Viewport />
        <Pills />
      </Bracket.Root>

      {/* The whole tree, with zoom buttons of your own above it instead of in the frame. */}
      <Bracket.Root stage={stage} compactBelow={0} zoom={{ maxScale: 3 }}>
        <ZoomBar />
        <Bracket.Viewport mode="pan-zoom" controls={false} />
      </Bracket.Root>
    </View>
  );
}

function Pills(): ReactNode {
  const { rounds, page } = usePagination();
  const dark = useColorScheme() === 'dark';
  const ink = dark ? '#fafafa' : '#18181b';
  return (
    <View style={{ alignItems: 'center', gap: 10, paddingTop: 16 }}>
      <Text style={{ fontSize: 15, fontWeight: '600', color: ink }}>{rounds[page]?.name}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Bracket.PreviousPage>
          {({ disabled }) => <Arrow label="‹" disabled={disabled} dark={dark} />}
        </Bracket.PreviousPage>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {rounds.map((round, index) => (
            <Pill key={round.id} index={index} dark={dark} />
          ))}
        </View>
        <Bracket.NextPage>
          {({ disabled }) => <Arrow label="›" disabled={disabled} dark={dark} />}
        </Bracket.NextPage>
      </View>
    </View>
  );
}

/** Wide and blue on the round in focus, narrowing as a swipe moves away from it, on the UI thread. */
function Pill({ index, dark }: { index: number; dark: boolean }): ReactNode {
  const { position, setPage } = usePagination();
  const style = useAnimatedStyle(() => {
    const near = Math.max(0, 1 - Math.abs(position.value - index));
    return { width: 8 + 20 * near, opacity: 0.35 + 0.65 * near };
  });
  return (
    <Pressable accessibilityRole="button" onPress={() => setPage(index)} hitSlop={8}>
      <Animated.View
        style={[{ height: 8, borderRadius: 4, backgroundColor: dark ? '#60a5fa' : blue }, style]}
      />
    </Pressable>
  );
}

function Arrow({
  label,
  disabled,
  dark,
}: {
  label: string;
  disabled: boolean;
  dark: boolean;
}): ReactNode {
  // Faded through colours rather than the view's opacity: iOS can drop the glyph when that opacity comes back.
  const ink = dark ? '#fafafa' : '#18181b';
  return (
    <View
      style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: dark ? '#27272a' : '#e4e4e7',
      }}
    >
      <Text style={{ fontSize: 20, lineHeight: 22, color: disabled ? `${ink}55` : ink }}>
        {label}
      </Text>
    </View>
  );
}

function ZoomBar(): ReactNode {
  const zoom = useZoom();
  if (!zoom) return null;
  const buttons = [
    { label: 'Zoom out', onPress: () => zoom.zoomOut(), disabled: !zoom.canZoomOut },
    { label: 'Zoom in', onPress: () => zoom.zoomIn(), disabled: !zoom.canZoomIn },
    { label: 'Fit', onPress: zoom.reset, disabled: !zoom.canReset },
  ];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <Bracket.ZoomLevel>
        {({ percent }) => (
          <Text
            style={{ width: 52, fontWeight: '700', fontVariant: ['tabular-nums'], color: blue }}
          >
            {percent}%
          </Text>
        )}
      </Bracket.ZoomLevel>
      {buttons.map(({ label, onPress, disabled }) => (
        <Pressable
          key={label}
          accessibilityRole="button"
          accessibilityState={{ disabled }}
          disabled={disabled}
          onPress={onPress}
          style={({ pressed }) => ({
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 999,
            backgroundColor: blue,
            opacity: disabled ? 0.35 : pressed ? 0.8 : 1,
          })}
        >
          <Text style={{ fontWeight: '600', color: '#ffffff' }}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}
