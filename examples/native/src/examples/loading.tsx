import { Bracket, reportResult, type Stage, singleElimination } from '@react-brackets/native';
import { type ReactNode, useEffect, useState } from 'react';
import { Pressable, Text, useColorScheme, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

const teams = ['Falcons', 'Wolves', 'Herons', 'Lynx', 'Orcas', 'Ravens', 'Bison', 'Cobras'];

/** While the draw loads, a bracket of the same size stands in, so nothing jumps when it arrives. */
const placeholder = singleElimination(teams.map((_, index) => ({ id: `${index}`, name: '' })));

/** Stands in for a request to your server. */
const fetchDraw = () =>
  new Promise<Stage>((resolve) =>
    setTimeout(
      () =>
        resolve(
          reportResult(singleElimination(teams.map((name) => ({ id: name, name }))), 'main.r1.m1', {
            scores: [2, 1],
          }),
        ),
      1800,
    ),
  );

export default function Loading(): ReactNode {
  const [request, setRequest] = useState(0);
  return (
    <View style={{ gap: 16 }}>
      <Pressable
        onPress={() => setRequest(request + 1)}
        style={{
          alignSelf: 'flex-start',
          paddingHorizontal: 16,
          paddingVertical: 9,
          borderRadius: 999,
          backgroundColor: 'rgba(127, 127, 127, 0.16)',
        }}
      >
        <Text style={{ fontWeight: '600', color: '#2563eb' }}>Load again</Text>
      </Pressable>
      {/* A new key starts the request over. */}
      <Draw key={request} />
    </View>
  );
}

function Draw(): ReactNode {
  const [stage, setStage] = useState<Stage | null>(null);

  useEffect(() => {
    let current = true;
    fetchDraw().then((draw) => current && setStage(draw));
    return () => {
      current = false;
    };
  }, []);

  return stage ? (
    <Bracket stage={stage} />
  ) : (
    <Bracket stage={placeholder} renderMatch={() => <Skeleton />} />
  );
}

/** A card-sized block that breathes, on the UI thread. */
function Skeleton(): ReactNode {
  const dark = useColorScheme() === 'dark';
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 800, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [pulse]);
  const breathing = useAnimatedStyle(() => ({ opacity: 0.55 + pulse.value * 0.45 }));
  const bar = { height: 10, borderRadius: 5, backgroundColor: dark ? '#3f3f46' : '#e4e4e7' };
  return (
    <Animated.View
      style={[
        {
          height: 84,
          padding: 14,
          gap: 12,
          justifyContent: 'center',
          borderRadius: 10,
          borderWidth: 1,
          borderColor: dark ? '#27272a' : '#e4e4e7',
          backgroundColor: dark ? '#111113' : '#ffffff',
        },
        breathing,
      ]}
    >
      <View style={[bar, { width: '62%' }]} />
      <View style={[bar, { width: '48%' }]} />
    </Animated.View>
  );
}
