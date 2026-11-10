import {
  allMatches,
  Bracket,
  nextSwissRound,
  participantMap,
  reportResult,
  type Stage,
  standings,
  swiss,
  swissRoundsLeft,
} from '@react-brackets/native';
import { type ReactNode, useState } from 'react';
import { Pressable, Text, useColorScheme, View } from 'react-native';

const players = ['Ana', 'Ben', 'Chloe', 'Dev', 'Eli', 'Farah', 'Gus', 'Hana', 'Ivo'];

const start = swiss(players.map((name) => ({ id: name, name })));

/** Every open board gets a result, a coin toss each. */
const play = (stage: Stage): Stage =>
  allMatches(stage)
    .filter((match) => match.status === 'ready')
    .reduce(
      (current, match) =>
        reportResult(current, match.id, { scores: Math.random() < 0.5 ? [1, 0] : [0, 1] }),
      stage,
    );

export default function Swiss(): ReactNode {
  const dark = useColorScheme() === 'dark';
  const [stage, setStage] = useState(start);
  const [page, setPage] = useState(0);
  const rounds = stage.groups[0]?.rounds.length ?? 0;
  const open = allMatches(stage).some((match) => match.status === 'ready');
  const left = swissRoundsLeft(stage);
  const finished = !open && left === 0;
  const names = participantMap(stage);
  const text = dark ? '#fafafa' : '#18181b';
  const muted = dark ? '#a1a1aa' : '#71717a';

  const next = () => {
    if (open) return setStage(play(stage));
    setStage(nextSwissRound(stage));
    setPage(rounds);
  };

  return (
    <View style={{ gap: 16 }}>
      <Text style={{ color: muted }}>
        {finished
          ? 'All rounds played.'
          : `Round ${rounds} of ${rounds + left}. Players on the same score meet next.`}
      </Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable
          disabled={finished}
          onPress={next}
          style={{
            paddingHorizontal: 16,
            paddingVertical: 9,
            borderRadius: 999,
            backgroundColor: '#2563eb',
            opacity: finished ? 0.45 : 1,
          }}
        >
          <Text style={{ fontWeight: '600', color: '#ffffff' }}>
            {finished ? 'Finished' : open ? `Play round ${rounds}` : `Pair round ${rounds + 1}`}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            setStage(start);
            setPage(0);
          }}
          style={{
            paddingHorizontal: 16,
            paddingVertical: 9,
            borderRadius: 999,
            backgroundColor: 'rgba(127, 127, 127, 0.16)',
          }}
        >
          <Text style={{ fontWeight: '600', color: '#2563eb' }}>Reset</Text>
        </Pressable>
      </View>
      <View style={{ gap: 2 }}>
        {standings(stage).map((row, index) => (
          <View
            key={row.participantId}
            style={{ flexDirection: 'row', gap: 12, paddingVertical: 5, alignItems: 'center' }}
          >
            <Text style={{ width: 18, color: muted, fontVariant: ['tabular-nums'] }}>
              {index + 1}
            </Text>
            <Text style={{ flex: 1, color: text, fontWeight: index === 0 ? '700' : '400' }}>
              {names.get(row.participantId)?.name}
            </Text>
            <Text style={{ color: muted, fontVariant: ['tabular-nums'] }}>
              {row.wins}–{row.losses}
            </Text>
          </View>
        ))}
      </View>
      <Bracket stage={stage} compact="list" page={page} onPageChange={setPage} />
    </View>
  );
}
