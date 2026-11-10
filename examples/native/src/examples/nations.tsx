import {
  Bracket,
  type Match,
  participantMap,
  reportResult,
  type Stage,
  singleElimination,
} from '@react-brackets/native';
import { type ReactNode, useEffect, useState } from 'react';
import { Text, useColorScheme, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

const nations = [
  { id: 'bra', name: 'Brazil', flag: '🇧🇷', seed: 1 },
  { id: 'arg', name: 'Argentina', flag: '🇦🇷', seed: 2 },
  { id: 'esp', name: 'Spain', flag: '🇪🇸', seed: 3 },
  { id: 'fra', name: 'France', flag: '🇫🇷', seed: 4 },
  { id: 'jpn', name: 'Japan', flag: '🇯🇵', seed: 5 },
  { id: 'por', name: 'Portugal', flag: '🇵🇹', seed: 6 },
  { id: 'ned', name: 'Netherlands', flag: '🇳🇱', seed: 7 },
  { id: 'mar', name: 'Morocco', flag: '🇲🇦', seed: 8 },
];

const stage: Stage = [
  { match: 'main.r1.m1', scores: [2, 1] as [number, number] },
  { match: 'main.r1.m2', scores: [1, 2] as [number, number] },
  { match: 'main.r1.m3', scores: [3, 1] as [number, number] },
  { match: 'main.r1.m4', scores: [1, 0] as [number, number] },
  { match: 'main.r2.m1', scores: [1, 1] as [number, number], live: true },
].reduce<Stage>(
  (current, { match, scores, live }) => reportResult(current, match, { scores, live }),
  singleElimination(
    nations.map(({ id, name, flag, seed }) => ({ id, name, meta: { flag, seed } })),
  ),
);

const kickoff: Record<string, string> = {
  'main.r1.m1': 'Fri 18:00',
  'main.r1.m2': 'Fri 21:00',
  'main.r1.m3': 'Sat 18:00',
  'main.r1.m4': 'Sat 21:00',
  'main.r2.m1': 'Tue 20:00',
  'main.r2.m2': 'Wed 20:00',
  'main.r3.m1': 'Sun 19:00',
};

export default function Nations(): ReactNode {
  const dark = useColorScheme() === 'dark';
  const [selected, setSelected] = useState<Match | null>(null);
  const names = participantMap(stage);
  const muted = dark ? '#a1a1aa' : '#71717a';

  return (
    <View style={{ gap: 16 }}>
      <Bracket
        stage={stage}
        theme={{ colors: { accent: '#16a34a', accentSoft: 'rgba(22, 163, 74, 0.14)' } }}
        onMatchPress={setSelected}
        renderMatch={(match) => (
          <Card match={match} selected={match.id === selected?.id} dark={dark} />
        )}
      />
      <Text style={{ color: muted, fontSize: 14 }}>
        {selected
          ? `${selected.slots.map((slot) => names.get(slot.participantId ?? '')?.name ?? 'TBD').join(' v ')}, ${kickoff[selected.id]}`
          : 'Tap a match to see when it kicks off.'}
      </Text>
    </View>
  );
}

function Card({ match, selected, dark }: { match: Match; selected: boolean; dark: boolean }) {
  return (
    <Bracket.Match
      style={({ live }) => ({
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: selected ? '#16a34a' : live ? '#ef4444' : dark ? '#27272a' : '#e4e4e7',
        backgroundColor: live ? (dark ? '#2a1214' : '#fff5f5') : dark ? '#111113' : '#ffffff',
      })}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 12,
          paddingTop: 8,
        }}
      >
        <Text style={{ fontSize: 11, color: dark ? '#a1a1aa' : '#71717a' }}>
          {kickoff[match.id]}
        </Text>
        {match.status === 'live' ? (
          <LiveDot />
        ) : (
          <Text style={{ fontSize: 11, color: dark ? '#a1a1aa' : '#71717a' }}>
            {match.status === 'completed' ? 'Full time' : 'Upcoming'}
          </Text>
        )}
      </View>
      {([0, 1] as const).map((slot) => (
        <Bracket.Participant key={slot} slot={slot} style={{ paddingVertical: 7 }}>
          {({ participant, slot: { score }, winner, loser }) => (
            <>
              <Text style={{ width: 12, fontSize: 11, color: '#a1a1aa' }}>
                {String(participant?.meta?.seed ?? '')}
              </Text>
              <Text style={{ fontSize: 17 }}>{String(participant?.meta?.flag ?? '🏳️')}</Text>
              <Text
                numberOfLines={1}
                style={{
                  flex: 1,
                  fontSize: 15,
                  fontWeight: winner ? '700' : '400',
                  color: loser || !participant ? '#a1a1aa' : dark ? '#fafafa' : '#18181b',
                }}
              >
                {participant?.name ?? 'To be decided'}
              </Text>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '700',
                  fontVariant: ['tabular-nums'],
                  color: winner ? '#16a34a' : dark ? '#d4d4d8' : '#3f3f46',
                }}
              >
                {score ?? ''}
              </Text>
            </>
          )}
        </Bracket.Participant>
      ))}
    </Bracket.Match>
  );
}

/** A dot that breathes while the match is on, on the UI thread. */
function LiveDot(): ReactNode {
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.out(Easing.quad) }), -1);
  }, [pulse]);
  const ring = useAnimatedStyle(() => ({
    opacity: 1 - pulse.value,
    transform: [{ scale: 1 + pulse.value * 1.6 }],
  }));
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 8, height: 8 }}>
        <Animated.View
          style={[
            { position: 'absolute', inset: 0, borderRadius: 4, backgroundColor: '#ef4444' },
            ring,
          ]}
        />
        <View style={{ flex: 1, borderRadius: 4, backgroundColor: '#ef4444' }} />
      </View>
      <Text style={{ fontSize: 11, fontWeight: '700', color: '#ef4444' }}>Live 67'</Text>
    </View>
  );
}
