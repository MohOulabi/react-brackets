import {
  Bracket,
  reportResult,
  type Stage,
  singleElimination,
  type ThemeOverrides,
} from '@react-brackets/native';
import { type ReactNode, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

const teams = ['Falcons', 'Wolves', 'Herons', 'Lynx', 'Orcas', 'Ravens', 'Bison', 'Cobras'];

const stage = (
  [
    ['main.r1.m1', [3, 1]],
    ['main.r1.m2', [0, 2]],
    ['main.r1.m3', [2, 1]],
    ['main.r1.m4', [1, 3]],
    ['main.r2.m1', [2, 0]],
  ] as [string, [number, number]][]
).reduce<Stage>(
  (current, [match, scores]) => reportResult(current, match, { scores }),
  singleElimination(teams.map((name) => ({ id: name, name }))),
);

/** Lines take their colour, width and corners from the theme; the accent draws a highlighted path. */
const looks: Record<string, ThemeOverrides> = {
  Rounded: {
    lineWidth: 2,
    connectorRadius: 14,
    colors: { line: '#c4b5fd', accent: '#7c3aed', accentSoft: 'rgba(124, 58, 237, 0.12)' },
  },
  Square: {
    lineWidth: 1,
    connectorRadius: 0,
    radius: 2,
    colors: { line: '#a1a1aa', accent: '#0f766e', accentSoft: 'rgba(15, 118, 110, 0.12)' },
  },
  Bold: {
    lineWidth: 3.5,
    connectorRadius: 6,
    colors: { line: '#fed7aa', accent: '#ea580c', accentSoft: 'rgba(234, 88, 12, 0.12)' },
  },
};

export default function ConnectorLines(): ReactNode {
  const [look, setLook] = useState('Rounded');
  const [team, setTeam] = useState<string | null>('Falcons');
  return (
    <View style={{ gap: 16 }}>
      <View
        style={{
          flexDirection: 'row',
          alignSelf: 'flex-start',
          padding: 3,
          borderRadius: 999,
          backgroundColor: 'rgba(127, 127, 127, 0.14)',
        }}
      >
        {Object.keys(looks).map((name) => (
          <Pressable
            key={name}
            onPress={() => setLook(name)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 7,
              borderRadius: 999,
              backgroundColor: name === look ? '#ffffff' : 'transparent',
            }}
          >
            <Text style={{ fontWeight: '600', color: name === look ? '#18181b' : '#71717a' }}>
              {name}
            </Text>
          </Pressable>
        ))}
      </View>
      {/* Falcons' path starts highlighted; tap any team to follow theirs. */}
      <Bracket stage={stage} theme={looks[look]} highlighted={team} onHighlightChange={setTeam} />
    </View>
  );
}
