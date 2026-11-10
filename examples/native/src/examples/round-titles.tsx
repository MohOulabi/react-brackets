import {
  Bracket,
  type Round,
  reportResult,
  type Stage,
  singleElimination,
} from '@react-brackets/native';
import type { ReactNode } from 'react';
import { Text, useColorScheme, View } from 'react-native';

const teams = ['Falcons', 'Wolves', 'Herons', 'Lynx', 'Orcas', 'Ravens', 'Bison', 'Cobras'];

const stage = (
  [
    ['main.r1.m1', [3, 1]],
    ['main.r1.m2', [0, 2]],
    ['main.r1.m3', [2, 1]],
    ['main.r1.m4', [1, 3]],
  ] as [string, [number, number]][]
).reduce<Stage>(
  (current, [match, scores]) => reportResult(current, match, { scores }),
  singleElimination(teams.map((name) => ({ id: name, name }))),
);

const dates: Record<string, string> = {
  'main.r1': 'Sat 14 March',
  'main.r2': 'Sat 21 March',
  'main.r3': 'Sun 29 March',
};

export default function RoundTitles(): ReactNode {
  const dark = useColorScheme() === 'dark';
  return (
    <Bracket
      stage={stage}
      // Taller titles need the room: titleHeight sets it for every round.
      theme={{ titleHeight: 52 }}
      renderRoundTitle={(round) => <Title round={round} dark={dark} />}
    />
  );
}

function Title({ round, dark }: { round: Round; dark: boolean }): ReactNode {
  const played = round.matches.filter((match) => match.status === 'completed').length;
  const done = played === round.matches.length;
  return (
    <View style={{ alignItems: 'center', gap: 3 }}>
      <Text style={{ fontSize: 15, fontWeight: '700', color: dark ? '#fafafa' : '#18181b' }}>
        {round.name}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={{ fontSize: 12, color: dark ? '#a1a1aa' : '#71717a' }}>{dates[round.id]}</Text>
        <Text
          style={{
            fontSize: 11,
            fontWeight: '600',
            paddingHorizontal: 7,
            paddingVertical: 1,
            borderRadius: 999,
            overflow: 'hidden',
            color: done ? '#16a34a' : '#2563eb',
            backgroundColor: done ? 'rgba(22, 163, 74, 0.12)' : 'rgba(37, 99, 235, 0.12)',
          }}
        >
          {done ? 'Played' : `${played} of ${round.matches.length}`}
        </Text>
      </View>
    </View>
  );
}
