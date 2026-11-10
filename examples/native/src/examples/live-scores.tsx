import {
  allMatches,
  Bracket,
  reportResult,
  type Stage,
  singleElimination,
} from '@react-brackets/native';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

const teams = ['Falcons', 'Wolves', 'Herons', 'Lynx', 'Orcas', 'Ravens', 'Bison', 'Cobras'];
const target = 3;

const start = singleElimination(teams.map((name) => ({ id: name, name })));

/** One event per tick: the live match scores, or the next match kicks off. */
function tick(stage: Stage): Stage {
  const live = allMatches(stage).find((match) => match.status === 'live');
  if (!live) {
    const next = allMatches(stage).find((match) => match.status === 'ready');
    return next ? reportResult(stage, next.id, { scores: [0, 0], live: true }) : start;
  }
  const scores: [number, number] = [live.slots[0].score ?? 0, live.slots[1].score ?? 0];
  scores[Math.random() < 0.5 ? 0 : 1] += 1;
  return reportResult(stage, live.id, { scores, live: Math.max(...scores) < target });
}

/** The round the bracket shows: the one being played, so the view follows the action. */
function liveRound(stage: Stage): number {
  const rounds = stage.groups[0]?.rounds ?? [];
  const index = rounds.findIndex((round) =>
    round.matches.some((match) => match.status === 'live' || match.status === 'ready'),
  );
  return index === -1 ? rounds.length - 1 : index;
}

export default function LiveScores() {
  const [stage, setStage] = useState(start);

  useEffect(() => {
    const timer = setInterval(() => setStage(tick), 700);
    return () => clearInterval(timer);
  }, []);

  return (
    <View style={{ gap: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Pulse />
        <Text style={{ fontWeight: '700', color: '#ef4444' }}>Live</Text>
        <Text style={{ color: '#71717a' }}>First to {target} goes through</Text>
      </View>
      <Bracket stage={stage} page={liveRound(stage)} />
    </View>
  );
}

function Pulse() {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withRepeat(withTiming(1.8, { duration: 800 }), -1);
  }, [scale]);
  const ring = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: 2 - scale.value,
  }));
  return (
    <View style={{ width: 10, height: 10 }}>
      <Animated.View
        style={[
          { position: 'absolute', inset: 0, borderRadius: 5, backgroundColor: '#ef4444' },
          ring,
        ]}
      />
      <View style={{ flex: 1, borderRadius: 5, backgroundColor: '#ef4444' }} />
    </View>
  );
}
